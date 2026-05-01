# NetPulse: Network Monitoring & API Performance Analyzer

NetPulse is a full-stack monitoring system that tracks external APIs/websites in near real time.
It measures uptime, latency, status codes, and request failures, then visualizes trends through a modern dashboard.

## Features

- Monitor multiple URLs with periodic health checks (every ~6 seconds)
- Track key request lifecycle metrics:
  - URL
  - Status code
  - Response time (ms)
  - Timestamp
  - Success/failure flag
  - Error reason for failures/timeouts
- REST APIs for adding targets, triggering checks, reading logs, and aggregate metrics
- Real-time dashboard with auto-refresh (every 4 seconds)
- Charts:
  - Line chart for latency over time
  - Bar chart for status code distribution
- KPI cards:
  - Total monitored URLs
  - Uptime %
  - Average latency
  - Error rate
- Colored log table (green for success, red for failures)
- CORS enabled for frontend-backend integration
- Retry and timeout handling

## Tech Stack

### Backend
- Python
- FastAPI
- Requests
- Uvicorn

### Frontend
- Next.js (App Router)
- React
- Tailwind CSS
- Recharts

## Project Structure

```txt
project-root/
├── backend/
│   ├── main.py
│   └── requirements.txt
├── frontend/
│   ├── package.json
│   ├── next.config.ts
│   ├── tsconfig.json
│   ├── postcss.config.js
│   ├── tailwind.config.ts
│   ├── next-env.d.ts
│   └── src/
│       ├── app/
│       │   ├── globals.css
│       │   ├── layout.tsx
│       │   └── page.tsx
│       ├── components/
│       │   └── Dashboard.tsx
│       └── lib/
│           ├── api.ts
│           └── types.ts
└── README.md
```

## Backend API Endpoints

- `POST /add-url` - Add a URL to monitor
- `GET /urls` - Get all monitored URLs
- `GET /check` - Trigger manual check for all URLs
- `GET /logs` - Get all request logs
- `GET /metrics` - Get uptime %, average latency, total requests, error rate, status code distribution

## Local Setup

## 1) Backend Setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

Backend will run at: `http://127.0.0.1:8000`

## 2) Frontend Setup

Open a new terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend will run at: `http://localhost:3000`

Optional: set backend base URL in frontend:

```bash
# frontend/.env.local
NEXT_PUBLIC_API_BASE=http://127.0.0.1:8000
```

## Dashboard Usage

1. Enter a URL such as `https://example.com`
2. Click **Add URL**
3. Scheduler automatically checks all URLs every ~6 seconds
4. Watch KPIs, charts, and logs update in real time

## Deployment

## Backend (Render / Railway)

- Create a new Web Service from the `backend/` directory
- Install command:
  - `pip install -r requirements.txt`
- Start command:
  - `uvicorn main:app --host 0.0.0.0 --port $PORT`
- Ensure Python version is supported (3.10+ recommended)

## Frontend (Vercel)

- Import repository into Vercel
- Set root directory to `frontend/`
- Add environment variable:
  - `NEXT_PUBLIC_API_BASE=<your-backend-url>`
- Deploy

## Screenshots

Add screenshots here after running locally:

- `docs/dashboard-overview.png`
- `docs/charts-and-metrics.png`
- `docs/logs-table.png`

You can embed them like:

```md
![Dashboard Overview](docs/dashboard-overview.png)
```

## Optional Enhancements

- SQLite persistence for long-term history
- Alerting (email/Slack/webhook) on downtime
- URL-specific filtering and drill-down
- WebSocket push updates for lower latency than polling
- Authentication and multi-user workspaces

## Notes

- Current implementation uses in-memory storage for simplicity and speed.
- Logs are memory-bounded (latest 10,000 entries).
- Failed requests include timeout/network error details in logs.
