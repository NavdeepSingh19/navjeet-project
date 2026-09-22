import { X } from 'lucide-react'
import { formatScore } from '../utils/format'

export default function CellPopup({ feature, onClose }) {
  if (!feature) return null
  const { properties } = feature

  return (
    <div className="cell-popup-overlay" onClick={onClose}>
      <div
        className="cell-popup"
        role="dialog"
        aria-modal="true"
        aria-label="Selected cell details"
        onClick={(event) => event.stopPropagation()}
      >
        <button type="button" className="cell-popup-close" onClick={onClose} aria-label="Close details">
          <X size={18} />
        </button>
        <h3 className="mono">{properties.h3_index}</h3>
        <dl>
          <div><dt>Population</dt><dd>{Math.round(properties.population).toLocaleString()}</dd></div>
          <div><dt>Destinations score</dt><dd>{formatScore(properties.total_destinations)}</dd></div>
          <div><dt>Amenity variety</dt><dd>{properties.variety} types</dd></div>
        </dl>
      </div>
    </div>
  )
}
