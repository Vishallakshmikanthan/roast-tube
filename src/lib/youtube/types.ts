export type VideoItem = {
  id: string;
  title: string;
  channelId: string;
  channelTitle: string;
  categoryId: string;
  durationSec: number;
  tags: string[];
  likedAt: string; // ISO date string
};

export type SubscriptionItem = {
  channelId: string;
  title: string;
};

export type PlaylistItem = {
  title: string;
  itemCount: number;
};

export type Normalized = {
  likes: VideoItem[];
  subs: SubscriptionItem[];
  playlists: PlaylistItem[];
  fetchedAt: string; // ISO date string
};

export type InsufficientDataResult = {
  insufficient: true;
  reason: "empty" | "private_likes";
  message: {
    en: string;
    tanglish: string;
    hinglish: string;
  };
  stats: {
    likesCount: number;
    subsCount: number;
  };
};
