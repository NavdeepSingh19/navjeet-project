// Classification breakpoints and color ramps for the three view modes.
//
// Population and total_destinations use graduated (Jenks natural breaks)
// classification with 7 classes. The breakpoints below were computed OFFLINE
// via a classic Fisher-Jenks natural-breaks algorithm run once across the
// combined population/total_destinations values of ALL 7 city datasets
// (257,794 H3 cells total), not per-city. This is required so that, e.g.,
// "class 5" means the same population range in Mumbai as in Chennai — see
// improvements.md item 5 (cross-city consistency). If a city with a very
// different data distribution is added later, these breaks should be
// recomputed the same way (see scratchpad script used for this pass).
//
// Colors are not specified in the source QGIS screenshots (Improvements.pdf),
// so the closest standard perceptual colormaps were used instead, per the
// instruction in improvements.md item 2: a multi-hue sequential ramp
// (navy -> teal -> green -> yellow -> orange -> red) for population, the
// "magma" colormap for total_destinations, and "viridis" for variety.

// --- Population: graduated, Jenks natural breaks (7 classes) -------------
// Interior class boundaries (6 values -> 7 classes).
export const POPULATION_BREAKS = [150, 453, 803, 1237, 1741, 2383]

export const POPULATION_COLORS = [
  '#1a0033', // dark navy/purple (lowest)
  '#3b2d80', // indigo/blue
  '#2f7d8c', // teal
  '#4caf50', // green
  '#cddc39', // yellow-green
  '#ff9800', // orange
  '#d32f2f', // red (highest)
]

// --- Accessibility (total_destinations): graduated, Jenks (7 classes) ----
export const DESTINATION_BREAKS = [4, 12, 23, 36, 58, 98]

export const DESTINATION_COLORS = [
  '#000004', // black (lowest)
  '#3b0f70', // dark purple
  '#8c2981', // magenta/purple
  '#de4968', // pink/red
  '#fe9f6d', // orange
  '#fecf92', // light orange
  '#fcfdbf', // pale yellow (highest)
]

// --- Variety: categorized, one color per integer 0-10 + "all other" ------
export const VARIETY_MAX_CATEGORY = 10

export const VARIETY_COLORS = [
  '#440154', // 0 - dark purple/black
  '#482878', // 1
  '#3e4989', // 2
  '#31688e', // 3
  '#26828e', // 4
  '#1f9e89', // 5
  '#35b779', // 6
  '#6ece58', // 7
  '#b5de2b', // 8
  '#d5e21a', // 9
  '#f0f921', // 10 - light green/yellow
]

export const VARIETY_OTHER_COLOR = '#e0e0e0' // values above 10 ("all other")

/** Index (0-based) of the class a value falls into, given ascending interior breakpoints. */
export function classifyGraduated(value, breaks) {
  const v = Number(value) || 0
  let i = 0
  while (i < breaks.length && v >= breaks[i]) i += 1
  return i
}

export function getGraduatedColor(value, breaks, colors) {
  return colors[classifyGraduated(value, breaks)]
}

export function getPopulationColor(population) {
  return getGraduatedColor(population, POPULATION_BREAKS, POPULATION_COLORS)
}

export function getDestinationColor(totalDestinations) {
  return getGraduatedColor(totalDestinations, DESTINATION_BREAKS, DESTINATION_COLORS)
}

export function getVarietyColor(variety) {
  const v = Math.round(Number(variety) || 0)
  if (v > VARIETY_MAX_CATEGORY || v < 0) return VARIETY_OTHER_COLOR
  return VARIETY_COLORS[v]
}

/** Returns the color for a feature's properties under the given view mode.
 * Each mode visualizes exactly one field - modes are never blended together.
 */
export function getColorForMode(mode, properties) {
  if (mode === 'population') return getPopulationColor(properties.population)
  if (mode === 'variety') return getVarietyColor(properties.variety)
  return getDestinationColor(properties.total_destinations)
}

function formatBreak(n) {
  return Number.isInteger(n) ? n.toLocaleString() : n.toFixed(1)
}

/** Legend entries for a graduated (population/accessibility) view mode. */
export function getGraduatedLegend(breaks, colors) {
  const edges = [0, ...breaks]
  return colors.map((color, i) => {
    const lower = formatBreak(edges[i])
    const label = i === colors.length - 1 ? `${lower}+` : `${lower}–${formatBreak(edges[i + 1])}`
    return { color, label }
  })
}

/** Legend entries for the categorized (variety) view mode. */
export function getVarietyLegend() {
  const items = VARIETY_COLORS.map((color, value) => ({ color, label: String(value) }))
  items.push({ color: VARIETY_OTHER_COLOR, label: `${VARIETY_MAX_CATEGORY + 1}+ (all other)` })
  return items
}
