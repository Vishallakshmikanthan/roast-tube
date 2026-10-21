import { yt } from "./client";
import { isoToSec } from "./normalize";
import { Normalized, VideoItem } from "./types";

export interface FetchOptions {
  maxLikedPages?: number; // default: 6 (up to 300)
  maxSubPages?: number; // default: 6 (up to 300)
  ytClient?: typeof yt; // allows injecting custom client for testing
}

export interface FetchResult {
  data: Normalized;
  partial: boolean;
}

export async function fetchAll(
  token: string,
  options?: FetchOptions
): Promise<FetchResult> {
  const fetcher = options?.ytClient ?? yt;
  const maxLikedPages = options?.maxLikedPages ?? 6;
  const maxSubPages = options?.maxSubPages ?? 6;
  let partial = false;

  // 1) Find the Likes playlist ID from channel contentDetails
  let likesId = "LL";
  try {
    const ch = await fetcher<any>(
      "channels",
      { part: "contentDetails", mine: "true" },
      token
    );
    likesId = ch?.items?.[0]?.contentDetails?.relatedPlaylists?.likes ?? "LL";
  } catch (err: any) {
    if (err.code === "YT_AUTH" || err.code === "YT_QUOTA") throw err;
    // Fall back to default likes playlist ID "LL"
    likesId = "LL";
  }

  // 2) Fetch liked video IDs from the likes playlist (up to maxLikedPages x 50)
  const liked: { id: string; likedAt: string }[] = [];
  let pageToken = "";
  for (let i = 0; i < maxLikedPages; i++) {
    try {
      const r = await fetcher<any>(
        "playlistItems",
        {
          part: "snippet,contentDetails",
          playlistId: likesId,
          maxResults: "50",
          ...(pageToken ? { pageToken } : {}),
        },
        token
      );

      for (const it of r?.items ?? []) {
        const videoId = it.contentDetails?.videoId ?? it.snippet?.resourceId?.videoId;
        if (videoId) {
          liked.push({
            id: videoId,
            likedAt: it.snippet?.publishedAt ?? new Date().toISOString(),
          });
        }
      }

      pageToken = r?.nextPageToken ?? "";
      if (!pageToken) break;
    } catch (err: any) {
      console.error("[YouTube API] Failed to fetch playlist items (likes):", err?.message || err, "status:", err?.status);
      if (err.code === "YT_AUTH" || err.code === "YT_QUOTA") throw err;
      partial = true;
      break;
    }
  }

  // 3) Fetch video details (categories, tags, durations) in chunks of 50
  const details = new Map<string, any>();
  for (let i = 0; i < liked.length; i += 50) {
    const chunk = liked.slice(i, i + 50);
    const ids = chunk.map((x) => x.id).join(",");

    try {
      const r = await fetcher<any>(
        "videos",
        {
          part: "snippet,contentDetails",
          id: ids,
          maxResults: "50",
        },
        token
      );

      for (const v of r?.items ?? []) {
        details.set(v.id, v);
      }
    } catch (err: any) {
      if (err.code === "YT_AUTH" || err.code === "YT_QUOTA") throw err;
      partial = true;
      // partial failure: skip chunk details
    }
  }

  // 4) Subscriptions (up to maxSubPages x 50)
  const subs: Normalized["subs"] = [];
  pageToken = "";
  for (let i = 0; i < maxSubPages; i++) {
    try {
      const r = await fetcher<any>(
        "subscriptions",
        {
          part: "snippet",
          mine: "true",
          maxResults: "50",
          ...(pageToken ? { pageToken } : {}),
        },
        token
      );

      for (const s of r?.items ?? []) {
        const channelId = s.snippet?.resourceId?.channelId;
        const title = s.snippet?.title;
        if (channelId && title) {
          subs.push({ channelId, title });
        }
      }

      pageToken = r?.nextPageToken ?? "";
      if (!pageToken) break;
    } catch (err: any) {
      console.error("[YouTube API] Failed to fetch subscriptions:", err?.message || err, "status:", err?.status);
      if (err.code === "YT_AUTH" || err.code === "YT_QUOTA") throw err;
      partial = true;
      break;
    }
  }

  // 5) Playlists (titles + counts only)
  const playlists: Normalized["playlists"] = [];
  try {
    const pl = await fetcher<any>(
      "playlists",
      {
        part: "snippet,contentDetails",
        mine: "true",
        maxResults: "50",
      },
      token
    );

    for (const p of pl?.items ?? []) {
      playlists.push({
        title: p.snippet?.title ?? "Untitled",
        itemCount: p.contentDetails?.itemCount ?? 0,
      });
    }
  } catch (err: any) {
    console.error("[YouTube API] Failed to fetch playlists:", err?.message || err, "status:", err?.status);
    if (err.code === "YT_AUTH" || err.code === "YT_QUOTA") throw err;
    partial = true;
  }

  // Build the normalized list of likes (deleted or private videos in liked list are skipped)
  const likes: VideoItem[] = liked.flatMap((l) => {
    const v = details.get(l.id);
    if (!v) return []; // video was deleted or set to private

    return [
      {
        id: v.id,
        title: v.snippet?.title ?? "",
        channelId: v.snippet?.channelId ?? "",
        channelTitle: v.snippet?.channelTitle ?? "Unknown Channel",
        categoryId: v.snippet?.categoryId ?? "0",
        durationSec: isoToSec(v.contentDetails?.duration ?? ""),
        tags: Array.isArray(v.snippet?.tags) ? v.snippet.tags : [],
        likedAt: l.likedAt,
      },
    ];
  });

  console.log(`[YouTube API Normalized] Fetched: ${likes.length} likes, ${subs.length} subs, ${playlists.length} playlists.`);

  return {
    data: {
      likes,
      subs,
      playlists,
      fetchedAt: new Date().toISOString(),
    },
    partial,
  };
}
