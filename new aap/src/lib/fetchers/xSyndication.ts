import { toComment } from "./types";

export interface SyndicationTweet {
  id_str?: string;
  text?: string;
  created_at?: string;
  favorite_count?: number;
  user?: {
    name?: string;
    screen_name?: string;
    profile_image_url_https?: string;
  };
}

export interface SyndicationResponse extends SyndicationTweet {
  conversation?: SyndicationTweet[];
}

export function syndicationToComment(tweet: SyndicationTweet, index: number) {
  const username = tweet.user?.screen_name ?? "unknown";
  return toComment(
    {
      id: tweet.id_str,
      username,
      displayName: tweet.user?.name,
      profilePicture: tweet.user?.profile_image_url_https,
      text: tweet.text ?? "",
      likes: tweet.favorite_count,
      timestamp: tweet.created_at,
    },
    index
  );
}
