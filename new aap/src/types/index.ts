export type Platform = "instagram" | "x" | "youtube" | "tiktok" | "facebook" | "custom";

export interface Comment {
  id: string;
  username: string;
  displayName?: string;
  profilePicture?: string;
  text: string;
  mentionCount: number;
  likes?: number;
  timestamp?: string;
}

export interface FilterSettings {
  minMentions: number;
  winnerCount: number;
  uniqueUsersOnly: boolean;
  excludeSelfMention: boolean;
  selfUsername: string;
  requiredKeywords: string;
  minCommentLength: number;
  excludeUsernames: string;
}

export interface GiveawayResult {
  id: string;
  timestamp: string;
  platform: Platform;
  postTitle: string;
  winners: Comment[];
  totalEligible: number;
  totalComments: number;
  settings: FilterSettings;
}

export const DEFAULT_FILTERS: FilterSettings = {
  minMentions: 1,
  winnerCount: 1,
  uniqueUsersOnly: true,
  excludeSelfMention: true,
  selfUsername: "",
  requiredKeywords: "",
  minCommentLength: 0,
  excludeUsernames: "",
};
