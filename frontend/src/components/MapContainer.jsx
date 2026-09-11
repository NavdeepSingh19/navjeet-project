import { useCallback, useEffect, useMemo, useRef } from 'react'
import { GeoJSON, MapContainer as LeafletMap, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { getColorForMode } from '../utils/colors'
import LoadingSpinner from './LoadingSpinner'

const AMRITSAR_CENTER = [31.634, 74.8711]
const DEFAULT_ZOOM = 13
const VIEWPORT_DEBOUNCE_MS = 400

// Handles both camera framing and viewport-driven data loading:
// - On city change, recenters on the city's coordinates (the dataset's own
//   bounding box spans a whole district, not just the urban core, so it is
//   not useful for framing the initial view) and immediately reports the
//   resulting viewport so hexagons are visible without waiting for a pan.
// - On every subsequent pan/zoom, reports the new viewport after a short
//   debounce so finer-grained data streams in for the visible area.
function CameraController({ city, center, onViewportChange }) {
  const map = useMap()
  const timeoutRef = useRef(null)
  const lastCityRef = useRef(null)

  const reportBounds = useCallback(() => {
    const bounds = map.getBounds()
    onViewportChange([bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()])
  }, [map, onViewportChange])

  useMapEvents({
    moveend() {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(reportBounds, VIEWPORT_DEBOUNCE_MS)
    },
  })

  useEffect(() => {
    if (!city || city === lastCityRef.current) return
    lastCityRef.current = city
    if (center) map.setView(center, DEFAULT_ZOOM)
    reportBounds()
  }, [city, center, map, reportBounds])

  return null
}

function HexagonLayer({ mapData, viewMode, selectedH3, onCellClick, version }) {
  const geoJsonRef = useRef(null)
  const onCellClickRef = useRef(onCellClick)
  onCellClickRef.current = onCellClick

  const context = useMemo(
    () => ({
      maxPopulation: mapData?.metadata?.max_population || 1,
      maxVariety: mapData?.metadata?.max_variety || 1,
    }),
    [mapData?.metadata?.max_population, mapData?.metadata?.max_variety],
  )

  const styleFeature = useCallback(
    (feature) => {
      const color = getColorForMode(viewMode, feature.properties, context)
      const isSelected = feature.properties.h3_index === selectedH3
      return {
        fillColor: color,
        fillOpacity: isSelected ? 0.9 : 0.65,
        color: isSelected ? '#ffffff' : '#000000',
        weight: isSelected ? 2 : 0.4,
        opacity: isSelected ? 1 : 0.35,
      }
    },
    [viewMode, context, selectedH3],
  )

  // Recolor in place on viewMode/selection change (no remount) so the
  // .leaflet-interactive CSS transition can animate the fill smoothly.
  const styleFeatureRef = useRef(styleFeature)
  useEffect(() => {
    styleFeatureRef.current = styleFeature
    const layer = geoJsonRef.current
    if (!layer) return
    layer.eachLayer((l) => l.setStyle(styleFeature(l.feature)))
  }, [styleFeature])

  const onEachFeature = useCallback((feature, layer) => {
    layer.on({
      click: () => onCellClickRef.current(feature),
      keypress: (event) => {
        if (event.originalEvent.key === 'Enter') onCellClickRef.current(feature)
      },
      mouseover: (event) => event.target.setStyle({ weight: 2, fillOpacity: 0.9, opacity: 1 }),
      mouseout: (event) => event.target.setStyle(styleFeatureRef.current(feature)),
    })
  }, [])

  if (!mapData?.features?.length) return null

  return (
    <GeoJSON
      key={version}
      ref={geoJsonRef}
      data={{ type: 'FeatureCollection', features: mapData.features }}
      style={styleFeature}
      onEachFeature={onEachFeature}
    />
  )
}

export default function MapContainer({
  mapData,
  loading,
  error,
  viewMode,
  selectedCell,
  onCellClick,
  onViewportChange,
  version,
  onRetry,
}) {
  const center = mapData?.center ?? AMRITSAR_CENTER

  return (
    <div className="map-shell">
      <LeafletMap center={center} zoom={DEFAULT_ZOOM} className="leaflet-map" zoomControl>
        <TileLayer
          className="dark-tiles"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <CameraController city={mapData?.city} center={mapData?.center} onViewportChange={onViewportChange} />
        <HexagonLayer
          mapData={mapData}
          viewMode={viewMode}
          selectedH3={selectedCell?.properties?.h3_index}
          onCellClick={onCellClick}
          version={version}
        />
      </LeafletMap>

      {loading && (
        <div className="map-loading-overlay">
          <LoadingSpinner label="Loading accessibility data..." />
        </div>
      )}

      {error && (
        <div className="map-error-banner" role="alert">
          <p>{error.message || 'Failed to load data. Please try again.'}</p>
          <button type="button" onClick={onRetry}>Retry</button>
        </div>
      )}
    </div>
  )
}
