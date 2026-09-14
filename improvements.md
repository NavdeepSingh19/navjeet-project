# COPY-PASTE THIS INTO CLAUDE CODE

---

You are upgrading an existing React accessibility metrics map from **Amritsar-only to 7-city support** with enhanced legend text.

## CRITICAL CHANGES

### Change 1: Multi-City Support (7 Cities)
Create `src/data/citiesMetadata.js`:
```javascript
export const CITIES = {
  "Mumbai": {
    name: "Mumbai",
    state: "Maharashtra",
    coordinates: [19.0760, 72.8777],
    bounds: [[18.9, 72.7], [19.3, 72.9]],
    population: 20410000,
  },
  "NewDelhi": {
    name: "New Delhi",
    state: "Delhi",
    coordinates: [28.6139, 77.2090],
    bounds: [[28.4, 76.8], [28.9, 77.4]],
    population: 16753235,
  },
  "Bengaluru": {
    name: "Bengaluru",
    state: "Karnataka",
    coordinates: [12.9716, 77.5946],
    bounds: [[12.8, 77.4], [13.1, 77.8]],
    population: 8436675,
  },
  "Delhi": {
    name: "Delhi",
    state: "Delhi",
    coordinates: [28.7041, 77.1025],
    bounds: [[28.4, 76.7], [28.9, 77.3]],
    population: 16753235,
  },
  "Kolkata": {
    name: "Kolkata",
    state: "West Bengal",
    coordinates: [22.5726, 88.3639],
    bounds: [[22.4, 88.2], [22.7, 88.5]],
    population: 14681900,
  },
  "Chennai": {
    name: "Chennai",
    state: "Tamil Nadu",
    coordinates: [13.0827, 80.2707],
    bounds: [[12.9, 80.1], [13.3, 80.4]],
    population: 7088589,
  },
  "Hyderabad": {
    name: "Hyderabad",
    state: "Telangana",
    coordinates: [17.3850, 78.4867],
    bounds: [[17.2, 78.3], [17.6, 78.7]],
    population: 9740038,
  }
};

export const DEFAULT_CITY = "Mumbai";
export const ALL_CITIES = Object.keys(CITIES).sort();
```

### Change 2: GeoJSON Loader Service
Create `src/services/dataLoader.js`:
```javascript
export const loadCityGeoJSON = async (cityName) => {
  try {
    const response = await fetch(`/data/${cityName}.geojson`);
    
    if (!response.ok) {
      throw new Error(`File not found: ${cityName}.geojson`);
    }
    
    const data = await response.json();
    
    if (!data.features || !Array.isArray(data.features)) {
      throw new Error(`Invalid GeoJSON: Missing features in ${cityName}.geojson`);
    }
    
    // Validate each feature
    const validFeatures = data.features.filter(f => 
      f.properties &&
      f.properties.h3_index &&
      f.properties.total_destinations !== undefined &&
      f.properties.variety !== undefined &&
      f.properties.population !== undefined
    );
    
    if (validFeatures.length < data.features.length) {
      console.warn(`${data.features.length - validFeatures.length} features skipped (missing properties)`);
    }
    
    data.features = validFeatures;
    
    if (validFeatures.length === 0) {
      throw new Error(`No valid hexagons in ${cityName}`);
    }
    
    console.log(`✓ Loaded ${validFeatures.length} hexagons for ${cityName}`);
    return data;
  } catch (error) {
    console.error(`Failed to load ${cityName}:`, error.message);
    throw new Error(`Unable to load ${cityName}: ${error.message}`);
  }
};
```

### Change 3: Update useMapData Hook
Update `src/hooks/useMapData.js`:
```javascript
import { useState, useEffect } from 'react';
import { loadCityGeoJSON } from '../services/dataLoader';
import { CITIES, DEFAULT_CITY, ALL_CITIES } from '../data/citiesMetadata';

export const useMapData = () => {
  const [currentCity, setCurrentCity] = useState(DEFAULT_CITY);
  const [mapData, setMapData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCityData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const cityConfig = CITIES[currentCity];
        if (!cityConfig) {
          throw new Error(`City "${currentCity}" not found`);
        }
        
        const geoData = await loadCityGeoJSON(currentCity);
        
        setMapData({
          city: currentCity,
          geojson: geoData,
          center: cityConfig.coordinates,
          bounds: cityConfig.bounds,
          population: cityConfig.population,
          state: cityConfig.state,
          total_features: geoData.features.length,
        });
      } catch (err) {
        setError(err.message);
        setMapData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchCityData();
  }, [currentCity]);

  const switchCity = (cityName) => {
    if (CITIES[cityName]) {
      setCurrentCity(cityName);
    } else {
      setError(`City not found: ${cityName}`);
    }
  };

  return {
    mapData,
    loading,
    error,
    currentCity,
    switchCity,
    availableCities: ALL_CITIES
  };
};
```

### Change 4: Update MapContainer
Update `src/components/MapContainer.jsx` useEffect to handle city changes:
```javascript
useEffect(() => {
  if (!mapData?.geojson || !mapRef.current) return;

  // Remove existing GeoJSON layers
  mapRef.current.eachLayer((layer) => {
    if (layer instanceof L.GeoJSON) {
      mapRef.current.removeLayer(layer);
    }
  });

  // Add new GeoJSON
  L.geoJSON(mapData.geojson, {
    style: (feature) => getFeatureStyle(feature, viewMode),
    onEachFeature: (feature, layer) => {
      layer.on('click', () => showCellPopup(feature.properties));
      layer.on('mouseover', () => layer.setStyle({ weight: 2 }));
      layer.on('mouseout', () => layer.setStyle({ weight: 1 }));
    }
  }).addTo(mapRef.current);

  // Fit map to city bounds
  if (mapData.bounds) {
    mapRef.current.fitBounds(mapData.bounds);
  }
}, [mapData, viewMode]);

// Update color logic to use city-specific scaling
const getFeatureStyle = (feature, mode) => {
  const props = feature.properties;
  const color = getColorForMetric(props, mode);
  
  return {
    fillColor: color,
    weight: 1,
    opacity: 0.8,
    color: '#1a1a1a',
    fillOpacity: 0.8
  };
};

const getColorForMetric = (properties, viewMode) => {
  if (viewMode === 'accessibility') {
    const avgTime = properties.variety > 0 
      ? properties.total_destinations / properties.variety 
      : 30;
    
    if (avgTime < 3) return "#2ecc71"; // Green
    if (avgTime < 9) return "#f39c12"; // Orange
    if (avgTime < 15) return "#e67e22"; // Dark Orange
    return "#e74c3c"; // Red
  }
  // ... handle population and variety modes
};
```

### Change 5: Create CitySelector Component
Create `src/components/CitySelector.jsx`:
```javascript
import React from 'react';
import { MapPin } from 'lucide-react';
import './CitySelector.css';

const CitySelector = ({ cities, currentCity, onSelectCity, loading }) => {
  return (
    <div className="city-selector-container">
      <div className="city-selector-label">
        <MapPin size={16} /> Select City
      </div>
      <div className="city-buttons-grid">
        {cities.map((city) => (
          <button
            key={city}
            className={`city-button ${currentCity === city ? 'active' : ''}`}
            onClick={() => onSelectCity(city)}
            disabled={loading}
          >
            {city}
          </button>
        ))}
      </div>
    </div>
  );
};

export default CitySelector;
```

Create `src/components/CitySelector.css`:
```css
.city-selector-container {
  padding: 16px;
  background: #242424;
  border-bottom: 1px solid #404040;
}

.city-selector-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #999999;
  margin-bottom: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.city-buttons-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(90px, 1fr));
  gap: 8px;
}

.city-button {
  padding: 8px 12px;
  background: #1a1a1a;
  border: 1px solid #404040;
  color: #e0e0e0;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  transition: all 300ms ease;
  font-weight: 500;
}

.city-button:hover:not(:disabled) {
  border-color: #2ecc71;
  background: #2a2a2a;
}

.city-button.active {
  background: #2ecc71;
  color: #1a1a1a;
  border-color: #2ecc71;
  font-weight: 600;
}

.city-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
```

### Change 6: Update SearchBar for Multi-City
Update `src/components/SearchBar.jsx`:
```javascript
import React, { useState, useEffect } from 'react';
import { CITIES } from '../data/citiesMetadata';
import './SearchBar.css';

const SearchBar = ({ currentCity, onCitySelect, disabled }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    if (query.length < 1) {
      setSuggestions([]);
      return;
    }

    const filtered = Object.entries(CITIES)
      .filter(([key, city]) =>
        city.name.toLowerCase().includes(query.toLowerCase())
      )
      .map(([key, city]) => ({
        key,
        name: city.name,
        state: city.state,
        population: city.population
      }));

    setSuggestions(filtered);
    setShowDropdown(filtered.length > 0);
  }, [query]);

  const handleSelectCity = (cityKey) => {
    onCitySelect(cityKey);
    setQuery('');
    setShowDropdown(false);
  };

  return (
    <div className="search-container">
      <input
        type="text"
        placeholder="Search city..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => query.length > 0 && setShowDropdown(true)}
        onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
        disabled={disabled}
      />
      {showDropdown && suggestions.length > 0 && (
        <ul className="suggestions-list">
          {suggestions.map((city) => (
            <li
              key={city.key}
              onClick={() => handleSelectCity(city.key)}
              className={currentCity === city.key ? 'selected' : ''}
            >
              <div className="suggestion-name">{city.name}</div>
              <div className="suggestion-meta">{city.state}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SearchBar;
```

### Change 7: Update Legend Component
Update `src/components/Legend.jsx` to change text from minutes to metric calculation:
```javascript
import React from 'react';

const Legend = ({ viewMode }) => {
  const getLegendConfig = () => {
    const configs = {
      accessibility: {
        title: "Accessibility (by total_destinations and variety)",
        items: [
          { color: "#2ecc71", label: "Excellent — 0–3" },
          { color: "#f39c12", label: "Good — 3–9" },
          { color: "#e67e22", label: "Moderate — 9–15" },
          { color: "#e74c3c", label: "Poor — 15+" }
        ]
      },
      population: {
        title: "Population Density",
        items: [
          { color: "#ecf0f1", label: "Low" },
          { color: "#95a5a6", label: "Medium" },
          { color: "#27ae60", label: "High" }
        ]
      },
      variety: {
        title: "Amenity Variety",
        items: [
          { color: "#ecf0f1", label: "Low (< 30%)" },
          { color: "#95a5a6", label: "Medium (30–60%)" },
          { color: "#3498db", label: "High (> 60%)" }
        ]
      }
    };
    return configs[viewMode];
  };

  const config = getLegendConfig();

  return (
    <div className="legend-container">
      <h3 className="legend-title">{config.title}</h3>
      <div className="legend-items">
        {config.items.map((item, idx) => (
          <div key={idx} className="legend-item">
            <div className="legend-color" style={{ backgroundColor: item.color }}></div>
            <span className="legend-label">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Legend;
```

### Change 8: Update App.jsx
Replace the entire App.jsx:
```javascript
import React, { useState } from 'react';
import { useMapData } from './hooks/useMapData';
import MapContainer from './components/MapContainer';
import SearchBar from './components/SearchBar';
import CitySelector from './components/CitySelector';
import ControlPanel from './components/ControlPanel';
import Legend from './components/Legend';
import LoadingSpinner from './components/LoadingSpinner';
import './App.css';

function App() {
  const [viewMode, setViewMode] = useState('accessibility');
  const { mapData, loading, error, currentCity, switchCity, availableCities } = useMapData();

  const handleRetry = () => {
    switchCity(currentCity);
  };

  return (
    <div className="app-container">
      {/* Sidebar */}
      <div className="sidebar">
        <SearchBar currentCity={currentCity} onCitySelect={switchCity} disabled={loading} />
        <CitySelector 
          cities={availableCities} 
          currentCity={currentCity} 
          onSelectCity={switchCity}
          loading={loading}
        />
        <ControlPanel viewMode={viewMode} onViewModeChange={setViewMode} />
      </div>

      {/* Map Area */}
      <div className="map-area">
        {error && (
          <div className="error-container">
            <h3>Failed to Load {currentCity}</h3>
            <p>{error}</p>
            <button onClick={handleRetry}>Retry</button>
          </div>
        )}
        {loading && <LoadingSpinner cityName={currentCity} />}
        {mapData && !error && (
          <>
            <MapContainer mapData={mapData} viewMode={viewMode} />
            <Legend viewMode={viewMode} />
          </>
        )}
      </div>
    </div>
  );
}

export default App;
```

### Change 9: File Structure
```
public/data/
├── Mumbai.geojson
├── NewDelhi.geojson
├── Bengaluru.geojson
├── Delhi.geojson
├── Kolkata.geojson
├── Chennai.geojson
└── Hyderabad.geojson
```

## KEY REQUIREMENTS

1. **Default City:** Mumbai loads on app startup
2. **Legend Text:** Change from "Accessibility (walk time) — 0–3 min" to "Accessibility (by total_destinations and variety) — 0–3"
3. **No "min" text:** Remove all minute indicators
4. **City Switching:** Reload map when city changes, recenter to new coordinates
5. **Error Handling:** Show friendly error if GeoJSON file not found, with Retry button
6. **Validation:** Filter out features missing required properties, log count
7. **Performance:** Load <2 seconds, interactions <500ms
8. **Responsive:** Mobile, tablet, desktop layouts
9. **No Console Errors:** Only warnings for skipped features

## TESTING CHECKLIST

✅ App loads → Mumbai visible with hexagons  
✅ Click any city button → data loads, map recenters  
✅ Toggle Accessibility/Population/Variety → colors update, legend changes  
✅ Search "delhi" → shows both Delhi and New Delhi  
✅ Select city → map switches  
✅ Legend shows new text: "Accessibility (by total_destinations and variety)"  
✅ No "min" or "walk time" text anywhere  
✅ Delete one city file → error displays with Retry  
✅ Mobile view: responsive layout  
✅ Zoom/pan works on all cities  
✅ No console errors  

---

**That's it! All 7 cities, enhanced legend, production-ready. 🚀**