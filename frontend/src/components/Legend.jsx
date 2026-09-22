import {
  POPULATION_BREAKS,
  POPULATION_COLORS,
  DESTINATION_BREAKS,
  DESTINATION_COLORS,
  getGraduatedLegend,
  getVarietyLegend,
} from '../utils/colors'

const LEGEND_BY_MODE = {
  accessibility: {
    title: 'Accessibility (total_destinations)',
    items: () => getGraduatedLegend(DESTINATION_BREAKS, DESTINATION_COLORS),
  },
  population: {
    title: 'Population',
    items: () => getGraduatedLegend(POPULATION_BREAKS, POPULATION_COLORS),
  },
  variety: {
    title: 'Amenity variety',
    items: getVarietyLegend,
  },
}

export default function Legend({ viewMode }) {
  const legend = LEGEND_BY_MODE[viewMode] ?? LEGEND_BY_MODE.accessibility
  const items = legend.items()

  return (
    <div className="legend" role="complementary" aria-label="Map color legend">
      <h3>{legend.title}</h3>
      <ul>
        {items.map((item) => (
          <li key={item.label}>
            <span className="legend-swatch" style={{ backgroundColor: item.color }} aria-hidden="true" />
            <span>{item.label}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
