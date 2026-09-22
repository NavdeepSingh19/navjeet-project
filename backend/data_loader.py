"""Loads city GeoJSON datasets once at startup and builds in-memory
indexes so viewport/bbox queries over 150k+ features stay fast without
a database.
"""
import json
import os
import numpy as np

DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")

CITY_FILES = {
    "mumbai": "Mumbai_accessibility_metrics_with_pop.geojson",
    "new delhi": "NewDelhi_accessibility_metrics_with_pop.geojson",
    "bengaluru": "Bengaluru_accessibility_metrics_with_pop.geojson",
    "delhi": "Delhi_unified_accessibility_metrics_with_pop.geojson",
    "kolkata": "Kolkata_India-h3_accessibility_metrics_with_pop.geojson",
    "chennai": "Chennai_accessibility_metrics_with_pop.geojson",
    "hyderabad": "Hyderabad_accessibility_metrics_with_pop.geojson",
}

CITY_INFO = {
    "mumbai": {
        "name": "Mumbai",
        "state": "Maharashtra",
        "country": "India",
        "coordinates": [19.0760, 72.8777],
        "population": 20410000,
    },
    "new delhi": {
        "name": "New Delhi",
        "state": "Delhi",
        "country": "India",
        "coordinates": [28.6139, 77.2090],
        "population": 16753235,
    },
    "bengaluru": {
        "name": "Bengaluru",
        "state": "Karnataka",
        "country": "India",
        "coordinates": [12.9716, 77.5946],
        "population": 8436675,
    },
    "delhi": {
        "name": "Delhi",
        "state": "Delhi",
        "country": "India",
        "coordinates": [28.7041, 77.1025],
        "population": 16753235,
    },
    "kolkata": {
        "name": "Kolkata",
        "state": "West Bengal",
        "country": "India",
        "coordinates": [22.5726, 88.3639],
        "population": 14681900,
    },
    "chennai": {
        "name": "Chennai",
        "state": "Tamil Nadu",
        "country": "India",
        "coordinates": [13.0827, 80.2707],
        "population": 7088589,
    },
    "hyderabad": {
        "name": "Hyderabad",
        "state": "Telangana",
        "country": "India",
        "coordinates": [17.3850, 78.4867],
        "population": 9740038,
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
            ring_arr = np.asarray(ring, dtype=np.float64)
            centroids[i] = ring_arr.mean(axis=0)

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
        self.avg_variety = float(varieties.mean())

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
