export const ACCESSIBILITY_COLORS = {
  excellent: '#2ecc71',
  good: '#f39c12',
  moderate: '#e67e22',
  poor: '#e74c3c',
}

// avgTime = total_destinations / variety (proximity score per amenity type);
// variety === 0 means no amenities nearby, treated as worst case (30 min).
export function getAccessibilityInfo(properties) {
  const totalDestinations = properties.total_destinations ?? 0
  const variety = properties.variety ?? 0
  const avgTime = variety > 0 ? totalDestinations / variety : 30

  if (avgTime < 3) {
    return { level: 'excellent', label: 'Excellent', range: '0-3', color: ACCESSIBILITY_COLORS.excellent, avgTime }
  }
  if (avgTime < 9) {
    return { level: 'good', label: 'Good', range: '3-9', color: ACCESSIBILITY_COLORS.good, avgTime }
  }
  if (avgTime < 15) {
    return { level: 'moderate', label: 'Moderate', range: '9-15', color: ACCESSIBILITY_COLORS.moderate, avgTime }
  }
  return { level: 'poor', label: 'Poor', range: '15+', color: ACCESSIBILITY_COLORS.poor, avgTime }
}

export function getPopulationColor(population, maxPopulation) {
  const intensity = maxPopulation > 0 ? Math.min(Math.max(population, 0) / maxPopulation, 1) : 0
  const saturation = 10 + intensity * 60
  const lightness = 70 - intensity * 20
  return `hsl(120, ${saturation}%, ${lightness}%)`
}

export function getVarietyColor(variety, maxVariety) {
  const intensity = maxVariety > 0 ? Math.min(Math.max(variety, 0) / maxVariety, 1) : 0
  if (intensity < 0.3) return '#ecf0f1'
  if (intensity < 0.6) return '#95a5a6'
  return '#3498db'
}

export function getColorForMode(mode, properties, context = {}) {
  if (mode === 'population') {
    return getPopulationColor(properties.population ?? 0, context.maxPopulation ?? 1)
  }
  if (mode === 'variety') {
    return getVarietyColor(properties.variety ?? 0, context.maxVariety ?? 1)
  }
  return getAccessibilityInfo(properties).color
}
