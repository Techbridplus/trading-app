import { NextRequest, NextResponse } from "next/server";
import { fetchCommentsFromUrl } from "@/lib/fetchers";
import { withTimeout } from "@/lib/withTimeout";

export const maxDuration = 60;

const FETCH_DEADLINE_MS = 55_000;

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { url?: string };
    const url = body.url?.trim();

    if (!url) {
      return NextResponse.json({ error: "Post URL is required." }, { status: 400 });
    }

    const result = await withTimeout(
      fetchCommentsFromUrl(url),
      FETCH_DEADLINE_MS,
      "Fetch timed out after 55 seconds. Try again or paste comments manually."
    );

    return NextResponse.json({
      success: true,
      comments: result.comments,
      postTitle: result.postTitle,
      platform: result.platform,
      totalFetched: result.totalFetched,
      warning: result.warning,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch comments.";
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
