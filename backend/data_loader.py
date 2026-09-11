"""Loads city GeoJSON datasets once at startup and builds in-memory
indexes so viewport/bbox queries over 150k+ features stay fast without
a database.
"""
import json
import os
import numpy as np

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data")

CITY_FILES = {
    "amritsar": "Amritsar_accessibility_metrics_with_pop.geojson",
}

CITY_INFO = {
    "amritsar": {
        "name": "Amritsar",
        "state": "Punjab",
        "country": "India",
        "coordinates": [31.6340, 74.8711],
        "population": 1200000,
    },
}


class CityDataset:
    def __init__(self, city_key):
        path = os.path.join(DATA_DIR, CITY_FILES[city_key])
        with open(path, encoding="utf-8") as f:
            raw = json.load(f)

        self.features = raw["features"]
        n = len(self.features)

        centroids = np.empty((n, 2), dtype=np.float64)  # lon, lat
        populations = np.empty(n, dtype=np.float64)
        varieties = np.empty(n, dtype=np.float64)
        destinations = np.empty(n, dtype=np.float64)

        self.by_h3 = {}
        for i, feat in enumerate(self.features):
            ring = feat["geometry"]["coordinates"][0]
            lons = [c[0] for c in ring]
            lats = [c[1] for c in ring]
            centroids[i, 0] = sum(lons) / len(lons)
            centroids[i, 1] = sum(lats) / len(lats)

            props = feat["properties"]
            populations[i] = props.get("population") or 0
            varieties[i] = props.get("variety") or 0
            destinations[i] = props.get("total_destinations") or 0

            self.by_h3[props["h3_index"]] = feat

        self.centroids = centroids
        self.populations = populations
        self.varieties = varieties
        self.destinations = destinations

        self.min_lon = float(centroids[:, 0].min())
        self.max_lon = float(centroids[:, 0].max())
        self.min_lat = float(centroids[:, 1].min())
        self.max_lat = float(centroids[:, 1].max())

        self.max_population = float(populations.max())
        self.max_variety = float(varieties.max())
        self.avg_accessibility = self._compute_avg_accessibility()

    def _compute_avg_accessibility(self):
        safe_variety = np.where(self.varieties > 0, self.varieties, 1)
        avg_time = np.where(self.varieties > 0, self.destinations / safe_variety, 30)
        return float(avg_time.mean())

    def bounds(self):
        return [[self.min_lat, self.min_lon], [self.max_lat, self.max_lon]]

    def query(self, bbox=None, max_features=4000):
        """Return feature indices inside bbox (min_lon, min_lat, max_lon, max_lat),
        decimated with an even stride if there are more than max_features matches.
        """
        if bbox is not None:
            min_lon, min_lat, max_lon, max_lat = bbox
            mask = (
                (self.centroids[:, 0] >= min_lon)
                & (self.centroids[:, 0] <= max_lon)
                & (self.centroids[:, 1] >= min_lat)
                & (self.centroids[:, 1] <= max_lat)
            )
            idx = np.nonzero(mask)[0]
        else:
            idx = np.arange(len(self.features))

        if len(idx) > max_features:
            stride = max(1, len(idx) // max_features)
            idx = idx[::stride]

        return idx

    def get_by_h3(self, h3_index):
        return self.by_h3.get(h3_index)


_CACHE = {}


def get_dataset(city_key):
    city_key = city_key.lower()
    if city_key not in CITY_FILES:
        return None
    if city_key not in _CACHE:
        _CACHE[city_key] = CityDataset(city_key)
    return _CACHE[city_key]
