import { AppError } from "../errors";

export const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3";

export interface YtFetchOptions {
  baseUrl?: string;
  timeoutMs?: number;
}

export async function yt<T>(
  path: string,
  params: Record<string, string>,
  token: string,
  options?: YtFetchOptions
): Promise<T> {
  const baseUrl = options?.baseUrl ?? YOUTUBE_API_BASE;
  const timeoutMs = options?.timeoutMs ?? 8000;

  const url = `${baseUrl}/${path}?${new URLSearchParams(params).toString()}`;

  let res: Response;
  try {
    res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(timeoutMs),
      cache: "no-store",
    });
  } catch (err: any) {
    if (err?.name === "TimeoutError" || err?.name === "AbortError") {
      throw new AppError("YT_TIMEOUT", "YouTube API timed out after 8 seconds.", 504);
    }
    throw new AppError("YT_NETWORK", "Failed to connect to YouTube API.", 502);
  }

  if (res.ok) {
    return (await res.json()) as T;
  }

  if (res.status === 401) {
    throw new AppError("YT_AUTH", "Please sign in again.", 401);
  }

  const body = await res.json().catch(() => ({}));
  const reason = body?.error?.errors?.[0]?.reason ?? body?.error?.status;

  if (reason === "quotaExceeded" || reason === "rateLimitExceeded") {
    throw new AppError(
      "YT_QUOTA",
      "The roaster is overloaded today. Try tomorrow.",
      503
    );
  }

  const message = body?.error?.message ?? "Couldn't read your YouTube data.";
  throw new AppError("YT_FAILED", message, res.status >= 500 ? 502 : res.status);
}
