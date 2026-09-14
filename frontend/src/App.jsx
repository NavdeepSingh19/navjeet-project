import { useCallback, useEffect, useState } from 'react'
import MapContainerView from './components/MapContainer'
import SearchBar from './components/SearchBar'
import CitySelector from './components/CitySelector'
import ControlPanel from './components/ControlPanel'
import Legend from './components/Legend'
import CellPopup from './components/CellPopup'
import useMapData from './hooks/useMapData'

const DEFAULT_CITY = 'Amritsar'

export default function App() {
  const { mapData, loading, error, version, fetchCityData, fetchViewport, searchCities, retry } = useMapData()
  const [viewMode, setViewMode] = useState('accessibility')
  const [selectedCell, setSelectedCell] = useState(null)
  const [popupFeature, setPopupFeature] = useState(null)

  useEffect(() => {
    fetchCityData(DEFAULT_CITY).catch(() => {})
  }, [fetchCityData])

  const handleSelectCity = useCallback(
    (city) => {
      setSelectedCell(null)
      setPopupFeature(null)
      fetchCityData(city.name).catch(() => {})
    },
    [fetchCityData],
  )

  const handleCellClick = useCallback((feature) => {
    setSelectedCell(feature)
    setPopupFeature(feature)
  }, [])

  const handleViewportChange = useCallback(
    (bbox) => {
      fetchViewport(bbox)
    },
    [fetchViewport],
  )

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-title">
          <h1>Accessibility Metrics</h1>
          <span className="app-subtitle">Accessibility explorer for Indian cities</span>
        </div>
        <SearchBar onSearch={searchCities} onSelectCity={handleSelectCity} disabled={loading} />
      </header>

      <CitySelector currentCity={mapData?.city} onSelectCity={handleSelectCity} disabled={loading} />

      <main className="app-main">
        <section className="map-section" aria-label="Interactive accessibility map">
          <MapContainerView
            mapData={mapData}
            loading={loading}
            error={error}
            viewMode={viewMode}
            selectedCell={selectedCell}
            onCellClick={handleCellClick}
            onViewportChange={handleViewportChange}
            version={version}
            onRetry={retry}
          />
          <Legend viewMode={viewMode} />
        </section>

        <ControlPanel
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          selectedCell={selectedCell}
          metadata={mapData?.metadata}
        />
      </main>

      <CellPopup feature={popupFeature} onClose={() => setPopupFeature(null)} />
    </div>
  )
}
