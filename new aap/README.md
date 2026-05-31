# Comment Giveaway Picker

Pick random winners from social media post comments (Instagram, X, YouTube, TikTok, Facebook).

## Features

- **Minimum @ mentions filter** — require users to tag N friends
- **Winner count** — pick 1 to 100 random winners
- **Profile pictures & usernames** — displayed in a ranked winner list
- **Import formats** — plain text, JSON, CSV (drag & drop supported)
- **Advanced filters** — unique users, keyword requirements, exclude list, min comment length
- **Fair randomization** — Fisher-Yates shuffle with crypto RNG
- **Export** — download winners as CSV
- **History** — last 20 giveaways saved locally
- **Dark / light mode**

## Getting Started

```bash
npm install
cp .env.example .env.local   # optional: add YOUTUBE_API_KEY for YouTube
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Paste a Post URL

1. Copy the post link from Instagram, X, or YouTube
2. Paste it in the **Paste Post URL** field
3. Click **Fetch Comments**
4. Set minimum @ mentions and winner count
5. Click **Pick Winners**

### Supported URLs

| Platform  | Example URL |
|-----------|-------------|
| Instagram | `https://www.instagram.com/p/ABC123/` |
| Instagram Reel | `https://www.instagram.com/reel/ABC123/` |
| X (Twitter) | `https://x.com/user/status/1234567890` |
| YouTube | `https://www.youtube.com/watch?v=VIDEO_ID` |

YouTube requires `YOUTUBE_API_KEY` in `.env.local`. Instagram and X work without any API key.

## Import Formats

### Plain text
```
@username: Tagged @friend1 @friend2 for the giveaway!
another_user — @buddy @pal let's win
```

### JSON
```json
[
  {
    "username": "user1",
    "text": "@friend1 @friend2 count me in!",
    "profilePicture": "https://example.com/avatar.jpg"
  }
]
```

### CSV
```
username,comment
user1,"@friend1 @friend2 tagged!"
```

## Note on Live Post Fetching

Instagram, X, and other platforms restrict direct API access. Import comments by copying from the post or using export tools, then paste into the app.
