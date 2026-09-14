# Accessibility Metrics Map

Interactive H3 hexagon map of accessibility (by total destinations and amenity
variety) across 8 Indian cities: Amritsar, Mumbai, New Delhi, Bengaluru,
Delhi, Kolkata, Chennai and Hyderabad.

The bundled datasets (`backend/data/*.geojson`, one per city) total roughly
420,000 hexagon features (~198MB) — far more than a browser can render or a
bundler can ship directly. So this is a real two-part app:

- **backend/** — a small FastAPI service that loads the GeoJSON once and
  serves it filtered by map viewport (bounding box), so the client only
  ever gets the few thousand cells actually on screen.
- **frontend/** — the React + Vite + react-leaflet map client.

## Run it

**Backend** (Python 3.10+):

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate        # Windows
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

**Frontend** (Node 18+), in a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the URL Vite prints (default http://localhost:5173). The dev server
proxies `/api/*` to the backend at `http://127.0.0.1:8000`, so no extra
config is needed locally.

## API

- `GET /api/cities` — list all registered cities with their metadata
- `GET /api/cities/search?query=` — city search by name/state (2+ characters)
- `GET /api/cities/{city}/accessibility-metrics?min_lon=&min_lat=&max_lon=&max_lat=&limit=`
  — GeoJSON + metadata, filtered to the given bounding box and capped at
  `limit` features (evenly decimated if more match, default/max 4000)
- `GET /api/cities/{city}/cell/{h3Index}` — single cell lookup

## Production build

```bash
cd frontend
npm run build     # outputs frontend/dist
```

Set `VITE_API_URL` (see `frontend/.env.example`) to the deployed backend's
URL before building if the frontend and backend live on different origins,
and enable CORS on the backend for the frontend's domain (currently open
to `*` for development — tighten `allow_origins` in `backend/main.py`
before deploying).

## Deploying to Vercel

The root `vercel.json` deploys this as a single Vercel project using
[Vercel Services](https://vercel.com/docs/services), which builds each part
of the repo as its own independently-built service sharing one domain:

- `frontend` service (`root: frontend`) — built as a Vite app, served as
  static assets.
- `backend` service (`root: backend`, `entrypoint: main:app`) — the FastAPI
  app deployed as a Python function. Because a service is built as a
  standalone unit rooted at its own directory, the dataset lives at
  `backend/data/` (inside the service root) rather than a shared top-level
  `data/` folder, so it's included automatically.
- Top-level `rewrites` expose both services publicly: `/api/*` routes to
  `backend`, everything else to `frontend`. Because both share one domain,
  the frontend's default relative `/api` base URL
  (`frontend/src/services/apiClient.js`) works as-is — no `VITE_API_URL` or
  CORS changes needed for this setup.

Just import the repo into Vercel (or run `vercel`) with the project root
as-is — no dashboard build-command overrides needed.

**Things to know before deploying:**

- The bundled datasets now total ~198MB across all 8 cities. Serverless
  functions have a 250MB unzipped size limit — with FastAPI, numpy and the
  Python runtime added on top, this is close enough to the ceiling that it
  may not fit depending on the exact plan/runtime overhead. Check your
  deployment's actual function size before relying on this; if it's too
  large, drop cities you don't need from `backend/data/` and
  `backend/data_loader.py`, or move to the long-running host option below.
- A city's dataset is only loaded into memory the first time it's
  requested (and cached per warm instance after that), so cold-start
  latency scales with whichever single city is requested, not the total
  198MB — but the whole 198MB still counts against the function's deployed
  size limit regardless of what's loaded at runtime.
- If you outgrow this (bigger cities, more traffic, slow cold starts),
  consider hosting `backend/` on a long-running host instead (Render,
  Railway, Fly.io) and deploying only `frontend/` on Vercel with
  `VITE_API_URL` pointed at it.
