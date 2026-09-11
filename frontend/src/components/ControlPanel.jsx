import { Info } from 'lucide-react'
import { getAccessibilityInfo } from '../utils/colors'
import { formatScore } from '../utils/format'

const MODES = [
  { key: 'accessibility', label: 'Accessibility' },
  { key: 'population', label: 'Population' },
  { key: 'variety', label: 'Variety' },
]

export function CellDetailsCard({ properties }) {
  const info = getAccessibilityInfo(properties)
  return (
    <div className="detail-card">
      <p><span>H3 index</span><strong className="mono">{properties.h3_index}</strong></p>
      <p><span>Population</span><strong>{Math.round(properties.population).toLocaleString()}</strong></p>
      <p><span>Destinations score</span><strong>{formatScore(properties.total_destinations)}</strong></p>
      <p><span>Variety</span><strong>{properties.variety}</strong></p>
      <p>
        <span>Accessibility</span>
        <strong className="accessibility-badge" style={{ color: info.color }}>{info.label}</strong>
      </p>
    </div>
  )
}

export default function ControlPanel({ viewMode, onViewModeChange, selectedCell, metadata }) {
  return (
    <aside className="control-panel" aria-label="Map controls">
      <section>
        <h2>View Mode</h2>
        <div role="radiogroup" aria-label="Select metric to visualize" className="mode-toggle">
          {MODES.map((mode) => (
            <label key={mode.key} className={viewMode === mode.key ? 'mode-option selected' : 'mode-option'}>
              <input
                type="radio"
                name="viewMode"
                value={mode.key}
                checked={viewMode === mode.key}
                onChange={() => onViewModeChange(mode.key)}
              />
              {mode.label}
            </label>
          ))}
        </div>
      </section>

      {metadata && (
        <section className="city-summary">
          <h2>City Summary</h2>
          <div className="summary-card">
            <p><span>Total population</span><strong>{metadata.total_population?.toLocaleString()}</strong></p>
            <p><span>Avg. accessibility</span><strong>{metadata.avg_accessibility} min</strong></p>
            <p><span>Cells shown</span><strong>{metadata.returned_cells} / {metadata.total_cells}</strong></p>
          </div>
        </section>
      )}

      <section className="cell-details">
        <h2>Selected Cell</h2>
        {selectedCell ? (
          <CellDetailsCard properties={selectedCell.properties} />
        ) : (
          <p className="empty-hint">
            <Info size={14} aria-hidden="true" /> Click a hexagon on the map to see its details here.
          </p>
        )}
      </section>
    </aside>
  )
}
