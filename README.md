# WatchStats — YouTube Watch History Analytics

> Track every second you spend on YouTube. Visualize your habits. Own your data.

WatchStats is a three-part system: a **Chrome extension** that silently records your YouTube watch sessions, a **FastAPI backend** that stores and aggregates the data, and a **React dashboard** where you explore your stats in real time.

<img width="1286" height="636" alt="Screenshot 2026-03-19 at 12 44 12 AM" src="https://github.com/user-attachments/assets/ad1eb202-ed3b-4d92-90de-463e6d0d9112" />

<img width="1438" height="766" alt="Screenshot 2026-03-19 at 12 45 33 AM" src="https://github.com/user-attachments/assets/7f1b7ec3-1d11-40d8-849c-af970bb9792b" />


## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER'S BROWSER                           │
│                                                                 │
│  ┌──────────────────────────────────┐                           │
│  │       Chrome Extension           │                           │
│  │                                  │                           │
│  │  content.js          popup.html  │                           │
│  │  ┌────────────┐   ┌───────────┐  │                           │
│  │  │ Runs on    │   │ Sign in / │  │                           │
│  │  │ YouTube.com│   │ Dashboard │  │                           │
│  │  │            │   │ button    │  │                           │
│  │  │ Tracks:    │   └─────┬─────┘  │                           │
│  │  │ - video ID │         │GOOGLE  │                           │
│  │  │ - title    │         │_LOGIN  │                           │
│  │  │ - channel  │         │msg     │                           │
│  │  │ - seconds  │         ▼        │                           │
│  │  │   watched  │  background.js   │                           │
│  │  └─────┬──────┘  (service worker)│                           │
│  │        │ VIDEO_WATCHED msg       │                           │
│  │        └──────────┬─────────────┘                           │
│  └───────────────────┼──────────────┘                           │
│                      │                                          │
│  ┌───────────────────┼──────────────┐                           │
│  │   React Dashboard  │             │                           │
│  │   (localhost:5173) │             │                           │
│  │                   │             │                           │
│  │  Login ──► Google OAuth          │                           │
│  │  Dashboard ──► Stats / Charts    │                           │
│  │  Polls every 2s for updates      │                           │
│  └───────────────────┼──────────────┘                           │
└──────────────────────┼──────────────────────────────────────────┘
                       │ HTTP (localhost:8000)
                       ▼
┌──────────────────────────────────────────────────────────────────┐
│                    FastAPI Backend                                │
│                                                                  │
│  ┌────────────┐  ┌───────────────┐  ┌────────────────────────┐  │
│  │ /auth/*    │  │ /ingest/*     │  │ /stats/*               │  │
│  │            │  │               │  │                        │  │
│  │ Google     │  │ Receives video│  │ overview, channels,    │  │
│  │ OAuth      │  │ data from ext.│  │ videos                 │  │
│  │ JWT issue  │  │ Session track │  │                        │  │
│  └──────┬─────┘  └───────┬───────┘  └──────────┬─────────────┘  │
│         │                │                     │                 │
│         └────────────────┴─────────────────────┘                 │
│                          │                                       │
│                    SQLAlchemy ORM                                 │
│                          │                                       │
│               ┌──────────┴──────────┐                            │
│               │    SQLite Database   │                            │
│               │  youtube_stats.db   │                            │
│               │                     │                            │
│               │  users              │                            │
│               │  videos             │                            │
│               │  watch_history      │                            │
│               └─────────────────────┘                            │
└──────────────────────────────────────────────────────────────────┘
                          │
                          │ OAuth verification
                          ▼
                 ┌─────────────────┐
                 │  Google APIs    │
                 │                 │
                 │  OAuth 2.0      │
                 │  userinfo       │
                 └─────────────────┘
```

**Data flow for a watch event:**
1. `content.js` fires every 1 second while a video plays, accumulating `secondsSinceLastSync`
2. On sync, it sends a `VIDEO_WATCHED` message to `background.js`
3. `background.js` POSTs to `/ingest/extension` with the accumulated seconds + metadata
4. Backend upserts the `Video` record and creates/updates a `WatchHistory` row
5. The React dashboard, polling every 2 seconds, fetches updated stats

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, Material-UI, Recharts |
| Backend | Python 3, FastAPI, SQLAlchemy, Uvicorn |
| Database | SQLite |
| Auth | Google OAuth 2.0 + JWT (HS256, 7-day expiry) |
| Extension | Chrome MV3, Chrome Identity API |

---

## Project Structure

```
web-stats/
├── frontend/                   # React + Vite web dashboard
│   └── src/
│       ├── api/client.js       # Axios instance + interceptors
│       ├── auth/               # AuthContext, GoogleLogin button
│       ├── components/         # StatCard, VideoTable, ChannelChart
│       ├── hooks/useStats.js   # Polling hook (2s interval)
│       └── pages/              # Login, Dashboard
├── backend/                    # FastAPI application
│   ├── app/
│   │   ├── api/                # auth.py, ingest.py, stats.py
│   │   ├── models/             # user.py, video.py, watch.py
│   │   ├── schemas/            # Pydantic request/response schemas
│   │   ├── services/           # youtube_client.py
│   │   ├── utils/auth.py       # JWT helpers
│   │   ├── database.py         # SQLAlchemy engine + session
│   │   └── main.py             # App factory, CORS, router mounts
│   └── requirements.txt
└── extension/                  # Chrome Extension (MV3)
    ├── manifest.json
    ├── background.js           # Service worker, OAuth, sync
    ├── content.js              # YouTube DOM scraper + timer
    └── popup/                  # popup.html / .js / .css
```

---

## Setup

### Prerequisites

- Python 3.10+
- Node.js 18+
- Google Cloud project with OAuth 2.0 credentials (Web + Chrome Extension)
- Chrome browser

---

### 1. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials
2. Create two OAuth 2.0 Client IDs:
   - **Web application** — for the backend and React dashboard
     - Authorized JavaScript origins: `http://localhost:5173`
     - Authorized redirect URIs: `http://localhost:3000`
   - **Chrome Extension** — for the browser extension
     - Application type: Chrome App
     - Enter your extension ID (from `chrome://extensions` after loading unpacked)
3. Enable the **YouTube Data API v3** if you plan to enrich video metadata

---

### 2. Backend

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate       # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
```

Edit `.env`:

```env
GOOGLE_CLIENT_ID=your-web-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000
SECRET_KEY=generate-a-long-random-string-here
DATABASE_URL=sqlite:///./youtube_stats.db
FRONTEND_URL=http://localhost:5173
```

```bash
# Start the server (auto-creates DB tables on first run)
uvicorn app.main:app --reload --port 8000
```

API docs are available at `http://localhost:8000/docs`.

---

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` and sign in with Google.

---

### 4. Chrome Extension

1. Open Chrome → `chrome://extensions`
2. Enable **Developer mode** (top-right toggle)
3. Click **Load unpacked** → select the `extension/` directory
4. Copy the **Extension ID** shown on the card
5. In `extension/background.js`, update `GOOGLE_CLIENT_ID` with your Chrome Extension client ID
6. In Google Cloud Console, add the extension ID to the allowed list for your Chrome App credential

Click the extension icon on YouTube, sign in with Google, and start watching videos. Stats appear on the dashboard within seconds.

---

## API Reference

All protected routes require:
```
Authorization: Bearer <session_token>
```

### Authentication

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/auth/login` | None | Exchange Google access token for a session JWT |
| `GET` | `/auth/me` | Required | Return the current authenticated user |
| `POST` | `/auth/logout` | Required | Invalidate session (client-side token removal) |

**POST `/auth/login`** request body:
```json
{
  "id_token": "google-access-token",
  "access_token": "google-access-token"
}
```

**POST `/auth/login`** response:
```json
{
  "session_token": "eyJ...",
  "user": {
    "id": 1,
    "email": "user@gmail.com",
    "name": "Jane Doe",
    "picture": "https://..."
  }
}
```

---

### Ingestion

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/ingest/extension` | Required | Receive video watch data from the Chrome extension |

**POST `/ingest/extension`** request body:
```json
{
  "videos": [
    {
      "videoId": "dQw4w9WgXcQ",
      "sessionInstanceId": "abc123",
      "title": "Never Gonna Give You Up",
      "channelTitle": "Rick Astley",
      "duration": 45,
      "videoDuration": 212,
      "thumbnail": "https://i.ytimg.com/...",
      "watchedAt": "2026-03-19T14:30:00Z"
    }
  ]
}
```

- `duration` — seconds watched in this sync window
- `sessionInstanceId` — unique ID per watch session; resets when a new video starts
- Sessions with the same `sessionInstanceId` are merged if the gap is under 300 seconds

---

### Statistics

| Method | Path | Auth | Query Params | Description |
|--------|------|------|-------------|-------------|
| `GET` | `/stats/overview` | Required | — | Aggregate totals for the current user |
| `GET` | `/stats/channels` | Required | `limit` (default 10) | Top channels by video count |
| `GET` | `/stats/videos` | Required | `limit` (default 50) | Recent watch history |

**GET `/stats/overview`** response:
```json
{
  "total_videos": 142,
  "total_watch_time_seconds": 86400,
  "total_channels": 38,
  "avg_watch_time": 608,
  "total_sessions": 142
}
```

**GET `/stats/channels?limit=5`** response:
```json
[
  { "channel": "Fireship", "count": 23 },
  { "channel": "Theo - t3.gg", "count": 17 }
]
```

**GET `/stats/videos?limit=10`** response:
```json
[
  {
    "video_id": "dQw4w9WgXcQ",
    "title": "Never Gonna Give You Up",
    "channel": "Rick Astley",
    "watch_time_seconds": 45,
    "thumbnail": "https://i.ytimg.com/...",
    "watched_at": "2026-03-19T14:30:00Z"
  }
]
```

---

## Database Schema

```sql
-- Stores authenticated users (one row per Google account)
CREATE TABLE users (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    google_id    TEXT    NOT NULL UNIQUE,
    email        TEXT    NOT NULL UNIQUE,
    name         TEXT,
    picture      TEXT,
    access_token TEXT    NOT NULL,
    refresh_token TEXT   NOT NULL,
    created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login   DATETIME
);

-- Stores video metadata (one row per YouTube video ID, shared across users)
CREATE TABLE videos (
    id               TEXT PRIMARY KEY,   -- YouTube video ID (e.g. "dQw4w9WgXcQ")
    title            TEXT NOT NULL,
    channel_id       TEXT,
    channel_title    TEXT,
    duration_seconds INTEGER,
    category_id      TEXT,
    published_at     DATETIME,
    thumbnail_url    TEXT
);

-- Stores per-user watch history (one row per watch session)
CREATE TABLE watch_history (
    id                 INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id            INTEGER  NOT NULL REFERENCES users(id),
    video_id           TEXT     NOT NULL REFERENCES videos(id),
    watched_at         DATETIME NOT NULL,
    watch_time_seconds INTEGER  NOT NULL DEFAULT 0,
    last_updated       DATETIME,
    created_at         DATETIME DEFAULT CURRENT_TIMESTAMP,

    -- Indexes for common query patterns
    INDEX idx_user_watched_at (user_id, watched_at),
    INDEX idx_user_video      (user_id, video_id)
);
```

**Key relationships:**
- `watch_history.user_id` → `users.id`
- `watch_history.video_id` → `videos.id`
- A single video can have multiple `watch_history` rows per user (separate sessions)
- Average watch time = `SUM(watch_time_seconds) / COUNT(DISTINCT session)` across all sessions

---

## Challenges & Tradeoffs

### 1. Session Boundary Detection Without a Pause Event
**Challenge:** YouTube's player doesn't expose a clean "session ended" event to extension content scripts. The player fires `play`/`pause` events, but these are unreliable when a user switches tabs, enters miniplayer mode, or navigates between videos.

**Solution:** A `sessionInstanceId` is generated (UUID) each time the tracked video ID changes. Each sync increments that session's `watch_time_seconds` on the backend. A 300-second inactivity gap also creates a new session so that re-watching a video later isn't counted as the same session.

**Tradeoff:** This means a user who pauses for >5 minutes and resumes generates two session rows. The dashboard shows "sessions" not "views" — which is arguably more accurate but can feel inflated.

---

### 2. Polling vs. WebSockets for Real-Time Dashboard
**Challenge:** The dashboard should feel live without complex infrastructure.

**Solution:** The `useStats` hook polls three endpoints every 2 seconds. This is simple, stateless, and requires no persistent connection management.

**Tradeoff:** 2-second polling creates 180 requests/minute per open dashboard tab. For a single user this is trivial, but it would not scale to many concurrent users without moving to WebSockets or SSE. The tradeoff was simplicity over efficiency, which is appropriate for a personal analytics tool.

---

### 3. SQLite for the Database
**Challenge:** Choosing a database that's easy to set up locally without sacrificing query expressiveness.

**Solution:** SQLite with SQLAlchemy ORM. Zero-configuration, single-file database, trivially backed up (`cp youtube_stats.db backup.db`), and fast for a single-user workload.

**Tradeoff:** SQLite has limited concurrency (only one writer at a time). The extension sends a write every second while watching, and the dashboard sends reads every 2 seconds — these rarely conflict for one user, but concurrent users on a shared deployment would hit write contention immediately. Migrating to PostgreSQL would require only a `DATABASE_URL` change in SQLAlchemy.

---

### 4. Watch Time Accuracy
**Challenge:** Tracking exactly how many seconds of a video a user actually watched (not just "had open") is hard. The tab could be in the background, the video might be buffering, or the user might have muted and walked away.

**Solution:** `content.js` reads `video.paused` every second. It only increments the counter when the video element reports it is actively playing. It also handles miniplayer mode by detecting the separate miniplayer DOM element.

**Tradeoff:** The extension uses polling (1-second interval via `setInterval`) rather than native video events. This adds a small constant CPU cost on any YouTube tab and introduces up to ±1 second of timing error per session.

---

### 5. Google OAuth — Two Client IDs Required
**Challenge:** Chrome extensions and web applications have different OAuth flows. The Chrome Identity API requires a `chrome.identity`-type OAuth client; the React dashboard uses the standard web flow. One client ID cannot serve both.

**Solution:** Two separate OAuth 2.0 client IDs are created in Google Cloud Console — one for the web app/backend, one for the extension.

**Tradeoff:** More setup steps for self-hosting. The README covers this explicitly to prevent the most common confusion during setup.

---

### 6. Data Ownership & Privacy
**Challenge:** Watch history is personal. The tool is designed for individual use, not a hosted SaaS.

**Solution:** All data stays local — SQLite on the user's machine, backend on `localhost`. Nothing is sent to third-party services beyond Google for OAuth verification.

**Tradeoff:** There is no cloud sync, so watch history doesn't follow the user across machines. This was an intentional choice to keep the architecture simple and private.

---

## Environment Variables Reference

| Variable | Required | Description |
|---|---|---|
| `GOOGLE_CLIENT_ID` | Yes | Web application OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Yes | Web application OAuth client secret |
| `GOOGLE_REDIRECT_URI` | Yes | OAuth redirect URI (e.g. `http://localhost:3000`) |
| `SECRET_KEY` | Yes | Random secret for JWT signing (generate with `openssl rand -hex 32`) |
| `DATABASE_URL` | Yes | SQLAlchemy database URL (e.g. `sqlite:///./youtube_stats.db`) |
| `FRONTEND_URL` | Yes | Frontend origin for CORS (e.g. `http://localhost:5173`) |

---

## License

MIT
