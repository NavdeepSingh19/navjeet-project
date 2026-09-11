# COPY-PASTE THIS ENTIRE TEXT INTO CLAUDE CODE

---

You are building a professional React web application for displaying urban accessibility metrics on an interactive map. This is a production-ready frontend that will integrate with a Python backend API.

## PROJECT BRIEF

**Application:** Accessibility Metrics Interactive Map
**Purpose:** Display H3 hexagonal grid cells on a Leaflet map, each cell colored by 15-minute city accessibility metrics (population, proximity to destinations, variety of amenities)
**Initial Data:** Amritsar city (provided GeoJSON with 500+ hexagonal cells)
**Theme:** Dark mode inspired by hiking guides - clean, professional, accessible
**Users:** Urban planners, policy makers, city residents exploring accessibility

## CORE FEATURES (MVP)

1. **Interactive Map**
   - Leaflet-based map centered on Amritsar (31.6340°N, 74.8711°E)
   - Display GeoJSON hexagonal cells as colored polygons
   - Click cell → show detailed popup with metrics
   - Hover effects for interactivity
   - Zoom/pan enabled

2. **Metric Visualization**
   - Three view modes: Accessibility, Population, Variety
   - Dynamic color coding based on selected metric
   - Legend showing color scale interpretation
   - Smooth transitions when switching modes

3. **Search & Navigation**
   - Search bar with autocomplete for cities
   - Support for "Amritsar" as primary MVP city
   - Search results show city, state, population
   - Select city → map recenters and loads new data

4. **Data Display**
   - Popup shows: H3 index, population, destinations, variety, accessibility level
   - Bottom control panel with toggles and details
   - Loading states during API calls
   - Error messages for failures

5. **Design & Responsiveness**
   - Dark theme: #1a1a1a background, #e0e0e0 text
   - Accessibility metrics color scheme:
     * Green (#2ecc71): 0-3 minutes - Excellent
     * Orange (#f39c12): 3-9 minutes - Good
     * Dark orange (#e67e22): 9-15 minutes - Moderate
     * Red (#e74c3c): 15+ minutes - Poor
   - Responsive: desktop (map 70% + sidebar 30%), mobile (full-screen map + bottom sheet)

## DATA FORMAT

The application receives GeoJSON from backend:

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "h3_index": "8a3d32c93567fff",
        "total_destinations": 9.0,
        "variety": 6,
        "population": 136.65619659423828
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[
          [74.840378952761455, 31.632519987953923],
          [74.840462465190726, 31.631819717096015],
          ...
        ]]
      }
    }
  ]
}
```

**Metrics Explanation:**
- `total_destinations`: Average proximity score (0-30, lower = better)
- `variety`: Number of unique amenity types in cell (0-10)
- `population`: Estimated population in cell

## API ENDPOINTS (Your Python backend will provide)

Mock these if backend not ready:

1. **GET /api/cities/search?query=amritsar**
   Response: Array of city objects
   ```json
   [
     {
       "name": "Amritsar",
       "state": "Punjab",
       "country": "India",
       "coordinates": [31.6340, 74.8711],
       "population": 1200000
     }
   ]
   ```

2. **GET /api/cities/{cityName}/accessibility-metrics**
   Response: GeoJSON + metadata
   ```json
   {
     "city": "Amritsar",
     "center": [31.6340, 74.8711],
     "bounds": [[minLat, minLon], [maxLat, maxLon]],
     "features": [...GeoJSON features...],
     "metadata": {
       "total_population": 1200000,
       "avg_accessibility": 8.5,
       "last_updated": "2026-09-11"
     }
   }
   ```

3. **GET /api/cities/{cityName}/cell/{h3Index}**
   Response: Detailed cell data (optional)

Error responses: `{ "error": "message", "code": "ERROR_CODE" }`

## TECHNICAL STACK

**Must use:**
- React 18+ (functional components, hooks)
- react-leaflet (Leaflet wrapper for React)
- Leaflet.js (mapping library)
- Axios (HTTP client)
- Lucide React (icons)
- Tailwind CSS or CSS Modules (dark theme)

**Project structure:**
```
src/
├── components/
│   ├── MapContainer.jsx
│   ├── SearchBar.jsx
│   ├── ControlPanel.jsx
│   ├── Legend.jsx
│   ├── CellPopup.jsx
│   └── LoadingSpinner.jsx
├── hooks/
│   └── useMapData.js
├── services/
│   └── apiClient.js
├── styles/
│   └── theme.css
├── App.jsx
└── index.js
```

## KEY IMPLEMENTATION REQUIREMENTS

### MapContainer.jsx
- Initialize map with Leaflet + react-leaflet
- Load and render GeoJSON features as hexagons
- Color hexagons based on selected metric (accessibility/population/variety)
- Handle cell click → show popup
- Update colors when viewMode changes
- Show loading spinner while fetching data
- Center map on Amritsar by default

### SearchBar.jsx
- Text input with autocomplete dropdown
- Debounced search (300ms) to backend /api/cities/search
- Display suggestions with MapPin icon
- On selection, call parent callback to update map
- Clear input after selection

### ControlPanel.jsx (Right sidebar)
- Radio buttons to toggle: Accessibility, Population, Variety
- Show selected cell details: h3_index, population, destinations, variety
- Each metric shows in a card format
- Styled for dark theme

### Legend.jsx
- Fixed position bottom-right corner
- Show color scale for current viewMode
- Update when viewMode changes
- Include text interpretation (e.g., "Green: 0-3 min walk")

### CellPopup.jsx
- Modal/bottom-sheet showing clicked cell data
- Display accessibility interpretation (Excellent/Good/Moderate/Poor)
- Show all metrics in readable format
- Close button
- Smooth enter/exit animation

### useMapData.js Hook
- fetchCityData(cityName): Call /api/cities/{city}/accessibility-metrics
- searchCities(query): Call /api/cities/search?query={query}
- Return: mapData, loading, error, and both functions
- Handle errors gracefully

### apiClient.js
- Axios instance with base URL
- Error interceptor for 404, 500, network errors
- Export methods: getCityMetrics, searchCities, getCellDetails

## COLOR CALCULATION LOGIC

**Accessibility Mode:**
```
avgTime = total_destinations / variety (if variety > 0 else 30)
< 3 min: Green (#2ecc71)
3-9 min: Orange (#f39c12)
9-15 min: Dark Orange (#e67e22)
>= 15 min: Red (#e74c3c)
```

**Population Mode:**
```
intensity = population / max_population_in_city
Scale from light gray to dark green
hsl(120, 70%, 50-70%)
```

**Variety Mode:**
```
intensity = variety / max_variety_in_city
< 0.3: Light gray (#ecf0f1)
0.3-0.6: Medium gray (#95a5a6)
> 0.6: Blue (#3498db)
```

## STYLING REQUIREMENTS

**Color Palette:**
- Background: #1a1a1a (dark gray)
- Text primary: #e0e0e0 (light gray)
- Text secondary: #999999 (medium gray)
- Border: #404040 (dark border)
- Hover: #2a2a2a (slightly lighter)

**Typography:**
- Headings: Serif (Georgia, serif) or system serif
- Body: Sans-serif (Inter, Roboto, system sans)
- Sizes: H1=32px, H2=24px, Body=16px, Small=12px

**Components:**
- Rounded corners: 8px (subtle)
- Shadows: Dark shadows with opacity (not bright)
- Transitions: 300ms ease-in-out for smooth interactions
- Hover states: Increase opacity, highlight borders

**Responsive Breakpoints:**
- Desktop (1024px+): Map 70% width, sidebar 30%
- Tablet (768-1023px): Stacked layout
- Mobile (<768px): Full-screen map, bottom sheet for details

## HANDLING INITIAL LOAD

1. App mounts → useMapData hook fetches Amritsar data
2. Show loading spinner until data arrives
3. Render map with Amritsar center + hexagons
4. Default viewMode: 'accessibility'
5. Display legend and control panel

## ERROR HANDLING

- **Network error:** Show "Failed to load data. Please try again." with retry button
- **City not found:** Show "No city found. Try searching Amritsar, Punjab"
- **Invalid search:** Show "Search requires at least 2 characters"
- **Map load failure:** Show "Map unavailable" (fallback to list view if time permits)
- All errors logged to console with context

## ACCESSIBILITY REQUIREMENTS

- WCAG AA compliant
- Keyboard navigation (Tab through controls)
- Color contrast ratio ≥ 4.5:1 for text
- Screen reader support (semantic HTML, aria labels)
- Focus visible on all interactive elements

## TESTING SCENARIOS (Must work)

1. ✅ Map loads centered on Amritsar with hexagons visible
2. ✅ Click any hexagon → popup appears with cell data
3. ✅ Toggle accessibility/population/variety → colors update smoothly
4. ✅ Search "Amritsar" → suggestions appear
5. ✅ Select city from search → map recenters
6. ✅ Zoom in/out → hexagons render at all levels
7. ✅ Responsive: Mobile, tablet, desktop layouts work
8. ✅ No console errors (warnings OK for deps)
9. ✅ Loading spinner shows during data fetch
10. ✅ Legend updates when viewMode changes

## FILE: Amritsar GeoJSON

The user will provide `Amritsar_accessibility_metrics_with_pop.geojson` containing ~500 hexagonal features for Amritsar city. Load this file during development using:

```javascript
import amritarData from './data/Amritsar_accessibility_metrics_with_pop.geojson';
// Or fetch via import('...')
// Or as mock data in useMapData hook
```

## BUILD & RUN INSTRUCTIONS

```bash
# Create app
npx create-react-app accessibility-map
cd accessibility-map

# Install dependencies
npm install leaflet react-leaflet axios lucide-react

# Start dev server
npm start

# Build for production
npm run build
```

## SUCCESS CRITERIA

- Application runs without errors
- Map displays Amritsar hexagons immediately
- All interactions work (click, zoom, search)
- Dark theme consistent across all UI
- Responsive on mobile/tablet/desktop
- Loading states visible
- Accessibility metrics correctly displayed
- Color scheme matches specification
- Performance: <2s initial load, <500ms interactions

## NOTES

- Use `react-leaflet` not raw Leaflet for React integration
- For dark map tiles, use OpenStreetMap with CSS filter or Mapbox dark style
- H3 hexagons render as Polygons in Leaflet GeoJSON layer
- Debounce search to avoid API spam
- Store mapData in state, update when city changes
- Use hooks (useState, useEffect) not class components
- Comment complex functions
- No external UI libraries (Bootstrap, Material) - keep it minimal

## DEPLOYMENT

Once built:
- Deploy to Vercel, Netlify, or similar
- Set REACT_APP_API_URL to your Python backend URL
- Enable CORS on Python backend for your domain
- Monitor errors with Sentry or similar

---

**THAT'S IT!** Build this and you'll have a production-ready accessibility metrics map. Iterate from MVP and add Phase 2 features (multiple cities, advanced filters) later.

Start with MapContainer → SearchBar → ControlPanel → Legend → CellPopup. Wire them together. Test. Deploy. 🚀