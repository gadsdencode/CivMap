/**
 * Metro Map Configuration Constants
 * Single source of truth for all visual and behavioral constants
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
// Y positions are evenly spaced for clean visual hierarchy
export const LINES = {
  Tech: {
    id: 'tech',
    name: 'Technology',
    color: '#22d3ee',
    colorDark: '#0e7490',
    colorMid: '#0891b2',
    yPosition: 0.20, // Adjusted for even spacing
    description: 'Innovations that shaped human capability'
  },
  War: {
    id: 'war', 
    name: 'Conflict',
    color: '#ef4444',
    colorDark: '#7f1d1d',
    colorMid: '#dc2626',
    yPosition: 0.35, // Adjusted for even spacing
    description: 'Wars and conflicts that altered history'
  },
  Population: {
    id: 'population',
    name: 'Population',
    color: '#22c55e',
    colorDark: '#14532d',
    colorMid: '#16a34a',
    yPosition: 0.50, // Center position
    description: 'The growth and movement of humanity'
  },
  Philosophy: {
    id: 'philosophy',
    name: 'Ideas',
    color: '#fbbf24',
    colorDark: '#78350f',
    colorMid: '#f59e0b',
    yPosition: 0.65, // Adjusted for even spacing
    description: 'Philosophy, religion, and transformative ideas'
  },
  Empire: {
    id: 'empire',
    name: 'Empire',
    color: '#a855f7',
    colorDark: '#4c1d95',
    colorMid: '#7c3aed',
    yPosition: 0.80, // Adjusted for even spacing
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
  ancient: { label: 'Ancient', range: [-10000, -1000] },
  classical: { label: 'Classical', range: [-1000, 500] },
  medieval: { label: 'Medieval', range: [500, 1500] },
  modern: { label: 'Modern', range: [1500, 1900] },
  contemporary: { label: 'Contemporary', range: [1900, 2025] }
};

// Animation timing
export const ANIMATION = {
  pathDrawDuration: 3000,
  transitionDuration: 300,
  tooltipDelay: 150
};

// Station visual sizing
export const STATION_SIZE = {
  baseRadius: 30,
  selectedRadius: 35,
  hoverScale: 1.4,
  searchMatchScale: 1.2,
  labelFontSize: 28,
  selectedLabelFontSize: 32
};

// Path stroke widths
export const PATH_STROKE = {
  background: 28,
  main: 18,
  core: 8
};

