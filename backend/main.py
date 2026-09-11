import datetime

from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from data_loader import CITY_INFO, get_dataset

app = FastAPI(title="Accessibility Metrics API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(HTTPException)
async def flat_error_handler(request: Request, exc: HTTPException):
    detail = exc.detail
    if isinstance(detail, dict) and "error" in detail:
        return JSONResponse(status_code=exc.status_code, content=detail)
    return JSONResponse(status_code=exc.status_code, content={"error": str(detail), "code": "ERROR"})

MAX_FEATURES_PER_REQUEST = 4000


def error(message, code, status_code=400):
    raise HTTPException(status_code=status_code, detail={"error": message, "code": code})


@app.get("/api/cities/search")
def search_cities(query: str = Query(default="")):
    if len(query.strip()) < 2:
        error("Search requires at least 2 characters", "QUERY_TOO_SHORT")

    q = query.strip().lower()
    results = [
        info
        for info in CITY_INFO.values()
        if q in info["name"].lower() or q in info["state"].lower()
    ]
    return results


@app.get("/api/cities/{city_name}/accessibility-metrics")
def get_city_metrics(
    city_name: str,
    min_lon: float | None = Query(default=None),
    min_lat: float | None = Query(default=None),
    max_lon: float | None = Query(default=None),
    max_lat: float | None = Query(default=None),
    limit: int = Query(default=MAX_FEATURES_PER_REQUEST, le=MAX_FEATURES_PER_REQUEST, ge=100),
):
    city_key = city_name.lower()
    dataset = get_dataset(city_key)
    if dataset is None:
        error("No city found. Try searching Amritsar, Punjab", "CITY_NOT_FOUND", status_code=404)

    bbox = None
    if None not in (min_lon, min_lat, max_lon, max_lat):
        bbox = (min_lon, min_lat, max_lon, max_lat)

    idx = dataset.query(bbox=bbox, max_features=limit)
    features = [dataset.features[i] for i in idx]

    info = CITY_INFO[city_key]
    return {
        "city": info["name"],
        "center": info["coordinates"],
        "bounds": dataset.bounds(),
        "features": features,
        "metadata": {
            "total_population": info["population"],
            "avg_accessibility": round(dataset.avg_accessibility, 2),
            "max_population": dataset.max_population,
            "max_variety": dataset.max_variety,
            "total_cells": len(dataset.features),
            "returned_cells": len(features),
            "last_updated": datetime.date.today().isoformat(),
        },
    }


@app.get("/api/cities/{city_name}/cell/{h3_index}")
def get_cell(city_name: str, h3_index: str):
    dataset = get_dataset(city_name.lower())
    if dataset is None:
        error("No city found. Try searching Amritsar, Punjab", "CITY_NOT_FOUND", status_code=404)

    feature = dataset.get_by_h3(h3_index)
    if feature is None:
        error("Cell not found", "CELL_NOT_FOUND", status_code=404)

    return feature


@app.get("/api/health")
def health():
    return {"status": "ok"}
