# Accessibility Metrics Map

Interactive H3 hexagon map of 15-minute city accessibility for Amritsar, Punjab.

The bundled dataset (`data/Amritsar_accessibility_metrics_with_pop.geojson`) has
162,868 hexagon features (82MB) — far more than a browser can render or a
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

- `GET /api/cities/search?query=` — city search (Amritsar only, for now)
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

The root `vercel.json` deploys this as a single Vercel project:

- `frontend/` is built with `@vercel/static-build` (`npm run build` →
  `frontend/dist`) and served as static assets.
- `backend/main.py` is deployed as a Python serverless function
  (`@vercel/python`), with `data/**` bundled in via `includeFiles` so the
  function can read the GeoJSON at runtime.
- `/api/*` requests are routed to the function; everything else is served
  from `frontend/dist`. Because both live on the same domain, the
  frontend's default relative `/api` base URL (`frontend/src/services/apiClient.js`)
  works as-is — no `VITE_API_URL` or CORS changes needed for this setup.

Just import the repo into Vercel (or run `vercel`) with the project root
as-is — no dashboard build-command overrides needed.

**Things to know before deploying:**

- The bundled dataset is 79MB. Serverless functions have a 250MB
  unzipped size limit (data + FastAPI + numpy fit comfortably), but the
  function reads and parses the whole file from scratch on every cold
  start — expect a few seconds of added latency on the first request
  after an idle period, and keep an eye on your plan's function
  duration limit (Hobby defaults to 10s; raise `maxDuration` or upgrade
  if cold starts get close to it).
- If you outgrow this (bigger cities, more traffic, slow cold starts),
  consider hosting `backend/` on a long-running host instead (Render,
  Railway, Fly.io) and deploying only `frontend/` on Vercel with
  `VITE_API_URL` pointed at it.
