/**
 * Metro Map Configuration Constants
 * Single source of truth for all visual and behavioral constants
 * 
 * DESIGN PHILOSOPHY:
 * - Clean, professional metro map aesthetics
 * - Clear visual hierarchy between line types
 * - Comfortable spacing to prevent visual clutter
 * - Smooth, modern feel with subtle glow effects
 */

// Canvas Dimensions
export const VIEWBOX = {
  WIDTH: 8000,
  HEIGHT: 4000,
  MIN_ZOOM: 0.05,
  MAX_ZOOM: 20
};

// Timeline Configuration
export const TIMELINE = {
  START: -10000,  // 10,000 BCE
  END: 2025,      // 2025 CE
  get RANGE() { return this.END - this.START; }
};

// Line Configuration - Each metro line's visual identity
// Y positions use golden ratio spacing for visual harmony
export const LINES = {
  Tech: {
    id: 'tech',
    name: 'Technology',
    color: '#22d3ee',      // Cyan
    colorDark: '#0e7490',
    colorMid: '#0891b2',
    colorGlow: '#67e8f9',  // Lighter cyan for glow
    yPosition: 0.18,       // Top tier - Innovation rises
    description: 'Innovations that shaped human capability'
  },
  War: {
    id: 'war',
    name: 'Conflict',
    color: '#ef4444',      // Red
    colorDark: '#7f1d1d',
    colorMid: '#dc2626',
    colorGlow: '#fca5a5',  // Lighter red for glow
    yPosition: 0.36,       // Upper middle
    description: 'Wars and conflicts that altered history'
  },
  Population: {
    id: 'population',
    name: 'Population',
    color: '#22c55e',      // Green
    colorDark: '#14532d',
    colorMid: '#16a34a',
    colorGlow: '#86efac',  // Lighter green for glow
    yPosition: 0.50,       // Dead center - Foundation of civilization
    description: 'The growth and movement of humanity'
  },
  Philosophy: {
    id: 'philosophy',
    name: 'Ideas',
    color: '#fbbf24',      // Amber/Gold
    colorDark: '#78350f',
    colorMid: '#f59e0b',
    colorGlow: '#fde68a',  // Lighter amber for glow
    yPosition: 0.64,       // Lower middle
    description: 'Philosophy, religion, and transformative ideas'
  },
  Empire: {
    id: 'empire',
    name: 'Empire',
    color: '#a855f7',      // Purple
    colorDark: '#4c1d95',
    colorMid: '#7c3aed',
    colorGlow: '#d8b4fe',  // Lighter purple for glow
    yPosition: 0.82,       // Bottom tier - Empires rise and fall
    description: 'Rise and fall of civilizations'
  }
};

// Quick accessor for line colors
export const LINE_COLORS = Object.fromEntries(
  Object.entries(LINES).map(([key, config]) => [key, config.color])
);

// Quick accessor for line Y positions
export const LINE_Y_POSITIONS = Object.fromEntries(
  Object.entries(LINES).map(([key, config]) => [key, config.yPosition])
);

// Convergence point where all lines meet (the "singularity")
export const CONVERGENCE = {
  year: 2025,
  yPosition: 0.15
};

// Offsets for the final convergence bundle to prevent collision
// Using explicit 30px increments for clean parallel lines at the singularity
// Creates a visual "cable bundle" effect rather than a tangled knot
export const CONVERGENCE_OFFSETS = {
  tech: 0,          // Lead line - Technology drives us forward
  population: 30,   // Tight follow (30px gap)
  war: 60,          // Mid-pack (60px from top)
  empire: 90,       // Lower tier (90px from top)
  philosophy: 120   // Trailing - Ideas synthesize all others (120px from top)
};

// Journey Mode - Key stations for guided tour
export const JOURNEY_STATIONS = [
  'neolithic',
  'uruk',
  'classical',
  'columbian',
  'industrial',
  'crisis',
  'singularity'
];

// Era Definitions for quick filtering
export const ERAS = {
  ancient: { label: 'Ancient', range: [-10000, -1000], color: '#854d0e' },
  classical: { label: 'Classical', range: [-1000, 500], color: '#1e40af' },
  medieval: { label: 'Medieval', range: [500, 1500], color: '#7c2d12' },
  modern: { label: 'Modern', range: [1500, 1900], color: '#166534' },
  contemporary: { label: 'Contemporary', range: [1900, 2025], color: '#7c3aed' }
};

// Animation timing - tuned for smooth, professional feel
export const ANIMATION = {
  pathDrawDuration: 3000,     // Initial path drawing
  transitionDuration: 250,    // UI transitions (faster for snappiness)
  tooltipDelay: 100,          // Tooltip appear delay (reduced for responsiveness)
  hoverTransition: 200,       // Hover state transitions
  zoomTransition: 300,        // Zoom animation
  panInertia: 0.92            // Pan momentum decay factor
};

// Station visual sizing - refined for clarity at various zoom levels
export const STATION_SIZE = {
  baseRadius: 28,             // Slightly smaller base for less crowding
  selectedRadius: 34,         // Selected state
  hoverScale: 1.35,           // Hover enlargement (slightly reduced)
  searchMatchScale: 1.15,     // Search match highlight
  
  // Label typography
  labelFontSize: 26,          // Base label size
  selectedLabelFontSize: 30,  // Selected label size
  yearFontSize: 22,           // Year label size
  
  // Glow and effects
  glowRadius: 80,             // Hover glow radius
  journeyRingRadius: 100,     // Journey mode highlight ring
  
  // Significance-based scaling
  hubScale: 1.15,             // Major hub stations (multi-line)
  crisisScale: 1.1,           // Crisis events
  minorScale: 0.9             // Minor stations
};

// Path stroke widths - refined visual hierarchy
export const PATH_STROKE = {
  background: 24,             // Shadow/depth layer
  main: 16,                   // Primary line stroke
  core: 6,                    // Glowing core
  
  // Braided line (Population) specific
  braidMain: 12,              // Braided strands
  braidOffset: 4              // Braid separation
};

// Visual effects configuration
export const EFFECTS = {
  // Glow filter settings
  glowBlur: 8,                // Blur radius for glow
  glowOpacity: 0.6,           // Glow opacity
  
  // Shadow settings
  shadowBlur: 4,
  shadowOffset: 2,
  shadowOpacity: 0.3,
  
  // Line opacity states
  lineActiveOpacity: 1,
  lineInactiveOpacity: 0.25,
  lineDimmedOpacity: 0.4
};

// Minimap configuration
export const MINIMAP = {
  width: 180,
  height: 90,
  padding: 8,
  viewportStroke: 2,
  lineStroke: 2
};

// Zoom presets for quick navigation
export const ZOOM_PRESETS = {
  overview: { scale: 0.1, label: 'Full Timeline' },
  era: { scale: 0.3, label: 'Era View' },
  detail: { scale: 0.8, label: 'Detail View' },
  station: { scale: 1.5, label: 'Station Focus' }
};

// Keyboard navigation
export const KEYBOARD = {
  panSpeed: 100,              // Pixels per keypress
  zoomStep: 0.15,             // Zoom increment per keypress
  stationSkip: 1              // Stations to skip in navigation
};
