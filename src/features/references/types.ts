/** ready = we have the real link; ask = creator DMs it if you comment; video = only shown inside the video. */
export type ReferenceStatus = "ready" | "ask" | "video";

/** One saved link/tool in the References library (mirrors the Rust `ReferenceLink`). */
export interface ReferenceLink {
  id: string;
  title: string;
  url?: string | null;
  description: string;
  category: string;
  status: ReferenceStatus;
  /** Comment keyword for `ask` items ("UI", "REPO"…). */
  keyword?: string | null;
  /** e.g. "@rananjay.ai" */
  sourceLabel?: string | null;
  sourceUrl?: string | null;
  /** Where the link came from, e.g. "Hyun's Reels". */
  collection?: string | null;
  /** Remote image URL or a data: URI. */
  thumbnail?: string | null;
  isStarred: boolean;
  isVisited: boolean;
  createdAt: string;
  updatedAt: string;
}
