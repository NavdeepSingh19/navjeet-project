import { ACCESSIBILITY_COLORS } from '../utils/colors'

const LEGEND_BY_MODE = {
  accessibility: {
    title: 'Accessibility (by total_destinations and variety)',
    items: [
      { color: ACCESSIBILITY_COLORS.excellent, label: 'Excellent', range: '0-3' },
      { color: ACCESSIBILITY_COLORS.good, label: 'Good', range: '3-9' },
      { color: ACCESSIBILITY_COLORS.moderate, label: 'Moderate', range: '9-15' },
      { color: ACCESSIBILITY_COLORS.poor, label: 'Poor', range: '15+' },
    ],
  },
  population: {
    title: 'Population density',
    items: [
      { color: 'hsl(120, 15%, 68%)', label: 'Low' },
      { color: 'hsl(120, 45%, 60%)', label: 'Medium' },
      { color: 'hsl(120, 70%, 50%)', label: 'High' },
    ],
  },
  variety: {
    title: 'Amenity variety',
    items: [
      { color: '#ecf0f1', label: 'Low' },
      { color: '#95a5a6', label: 'Medium' },
      { color: '#3498db', label: 'High' },
    ],
  },
}

export default function Legend({ viewMode }) {
  const legend = LEGEND_BY_MODE[viewMode] ?? LEGEND_BY_MODE.accessibility

  return (
    <div className="legend" role="complementary" aria-label="Map color legend">
      <h3>{legend.title}</h3>
      <ul>
        {legend.items.map((item) => (
          <li key={item.label}>
            <span className="legend-swatch" style={{ backgroundColor: item.color }} aria-hidden="true" />
            <span>
              {item.label}
              {item.range ? ` — ${item.range}` : ''}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
