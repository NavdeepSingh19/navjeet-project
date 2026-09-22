CONTEXT
I have a web app that visualizes H3-hexagon accessibility data for cities (currently Mumbai).
It has a "View Mode" selector with three options: Accessibility, Population, Variety.
Reference file: `Improvements.pdf` is saved in the project folder — read it for the exact
QGIS symbology screenshots (color ramps, class breaks, legend layout) referenced below.

The underlying data fields per H3 cell are:
- population
- total_destinations  (this is what "Accessibility" view mode currently visualizes)
- variety

CURRENT PROBLEM
The map is currently color-coding values into arbitrary discrete buckets:
- Accessibility: Excellent / Good / Moderate / Poor — and it's unclear how these
  buckets are computed; it also looks like it's combining total_destinations AND
  variety into one score, which shouldn't happen (see PDF page 1 legend).
- Population: Low / Medium / High
- Variety: Low / Medium / High
None of these bucket boundaries match the actual data distribution, and the
categories shown in the "Selected Cell" panel (e.g. "Accessibility: Excellent")
don't correspond to any field that exists in the dataset.

WHAT TO BUILD

1) Fix the View Mode selector behavior
   - Confirm/keep: selecting a mode (Population / Accessibility / Variety) shows
     ONLY that feature's visualization on the map. Do not blend accessibility and
     variety into a single combined score.

2) Replace bucket categories with proper graduated classification
   For **Population** and **Accessibility (total_destinations)**:
   - Use "Natural Breaks / Jenks" classification with 7 classes, computed from the
     actual data distribution of that field (matches QGIS "Graduated" mode shown
     in the PDF reference screenshots).
   - Population color ramp: dark purple/navy (low) → green → yellow → orange → red (high),
     matching the QGIS reference image on page with "1,2 population" symbology.
   - Total_destinations (Accessibility) color ramp: black/dark purple (low) →
     magenta/pink → yellow (high) — matches a magma/plasma-style ramp, per the
     "1,2 total_destinations" reference image.
   - Implement Jenks natural breaks in code (e.g. via a library like `simple-statistics`
     `.ckmeans()` or a jenks implementation) rather than hardcoding fixed thresholds,
     so it adapts per dataset/city — but see item 5 below re: consistency.

   For **Variety**:
   - Use a "Categorized" (discrete, not binned) classification — one distinct color
     per integer value 0 through 10, plus an "all other" catch-all color for values
     above 10, matching the QGIS reference screenshot exactly.
   - Color ramp: black/dark purple (0) → blue/teal → light green (10), viridis-style.

   Exact hex values aren't specified in the source screenshots — pick the closest
   standard perceptual colormap (viridis for variety, magma/plasma for
   total_destinations, and a similar multi-hue ramp for population) unless I provide
   hex codes separately. Flag this assumption in your output.

3) Fix the "City Summary" panel
   - Currently shows: Total population, Avg. accessibility, Cells shown.
   - ADD: Avg. variety (avg_variety) as a fourth stat in this panel.

4) Fix the "Selected Cell" panel
   - Currently shows an "Accessibility" row as a category label (e.g. "Excellent")
     that doesn't map to any real field.
   - Replace this with ONE of the following (pick the simpler implementation,
     but make the meaning explicit either way):
     a) Show the raw total_destinations numeric value (already shown as
        "Destinations score") and DROP the separate categorical "Accessibility"
        label, OR
     b) If a categorical accessibility label must stay, explicitly define and
        document the calculation (e.g. thresholds derived from total_destinations
        + variety, clearly labeled) and add a tooltip/legend note explaining it.
   - Keep Population, Destinations score, and Variety as raw numeric values in
     this panel — do not show buckets here, only in the map legend.

5) Consistency requirement
   - The SAME classification method and SAME color ramp/breakpoints must be used
     across all cities for a given variable (population, total_destinations,
     variety) — i.e., don't recompute Jenks breaks per city if that would make
     colors mean different things city-to-city. Compute breaks either globally
     (across all loaded city datasets) or make this configurable — ask me if
     unclear before assuming.

6) Legend updates
   - Update the map legend for each view mode to show the new class ranges
     (e.g. "0–206", "206–597"... for population) instead of the old Low/Medium/
     High or Excellent/Good/Moderate/Poor labels.

ACCEPTANCE CRITERIA
- Switching View Mode shows only that field's data, correctly classified.
- Population and Accessibility maps show 7 graduated classes with Jenks breaks
  and the specified color ramps.
- Variety map shows a distinct color per integer 0–10 plus an "all other" bucket.
- City Summary panel shows 4 stats: total population, avg accessibility,
  avg variety, cells shown.
- Selected Cell panel shows real numeric values with no undefined categorical
  labels.
- Legends update to reflect the real class breakpoints for each variable.

Please review `Improvements.pdf` in the project folder first, then propose your
implementation plan (which files/components you'll touch) before writing code.