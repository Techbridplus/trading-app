import { toComment, fetchWithTimeout, type FetchResult } from "./types";

interface YouTubeCommentThread {
  snippet?: {
    topLevelComment?: {
      snippet?: {
        authorDisplayName?: string;
        authorProfileImageUrl?: string;
        textDisplay?: string;
        textOriginal?: string;
        likeCount?: number;
        publishedAt?: string;
      };
    };
  };
}

export async function fetchYouTubeComments(videoId: string): Promise<FetchResult> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    throw new Error(
      "YouTube requires a YOUTUBE_API_KEY in .env.local. Get one free at Google Cloud Console → YouTube Data API v3."
    );
  }

  const allComments = [];
  let pageToken: string | undefined;
  let videoTitle = `YouTube video ${videoId}`;
  let pages = 0;

  const videoRes = await fetchWithTimeout(
    `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${apiKey}`
  );
  if (videoRes.ok) {
    const videoData = (await videoRes.json()) as {
      items?: { snippet?: { title?: string } }[];
    };
    videoTitle = videoData.items?.[0]?.snippet?.title ?? videoTitle;
  }

  do {
    const params = new URLSearchParams({
      part: "snippet",
      videoId,
      maxResults: "100",
      order: "relevance",
      key: apiKey,
    });
    if (pageToken) params.set("pageToken", pageToken);

    const res = await fetchWithTimeout(
      `https://www.googleapis.com/youtube/v3/commentThreads?${params}`
    );

    if (!res.ok) {
      const err = (await res.json()) as { error?: { message?: string } };
      throw new Error(err.error?.message ?? `YouTube API returned ${res.status}`);
    }

    const data = (await res.json()) as {
      items?: YouTubeCommentThread[];
      nextPageToken?: string;
    };

    for (const item of data.items ?? []) {
      const snippet = item.snippet?.topLevelComment?.snippet;
      if (!snippet) continue;

      const displayName = snippet.authorDisplayName ?? "Unknown";
      const username = displayName.replace(/\s+/g, "_").toLowerCase();

      allComments.push(
        toComment(
          {
            username,
            displayName,
            profilePicture: snippet.authorProfileImageUrl,
            text: snippet.textOriginal ?? snippet.textDisplay ?? "",
            likes: snippet.likeCount,
            timestamp: snippet.publishedAt,
          },
          allComments.length
        )
      );
    }

    pageToken = data.nextPageToken;
    pages++;
  } while (pageToken && pages < 10);

  if (allComments.length === 0) {
    throw new Error("No comments found on this YouTube video. Comments may be disabled.");
  }

  return {
    comments: allComments,
    postTitle: videoTitle,
    platform: "youtube",
    totalFetched: allComments.length,
  };
}
