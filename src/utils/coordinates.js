/**
 * Coordinate System Utilities
 * Handles all year-to-pixel and position calculations
 */

import { VIEWBOX, TIMELINE, LINE_Y_POSITIONS, CONVERGENCE } from '../constants/metroConfig';

/**
 * Time Anchors for Piecewise Scaling
 * key: The year in history
 * position: The percentage (0.0 to 1.0) of the screen width this year should occupy
 * 
 * DENSITY-AWARE DISTRIBUTION:
 * Allocates screen space based on NUMBER OF STATIONS, not just time span.
 * The 1900-2025 period has ~20 stations (highest density) and needs more space.
 * Ancient periods have fewer stations and can be compressed.
 * 
 * Station counts by era:
 * - Ancient (-10000 to -1000): ~12 stations → 20% of space
 * - Classical (-1000 to 500): ~15 stations → 18% of space  
 * - Medieval (500 to 1500): ~10 stations → 12% of space
 * - Early Modern (1500-1800): ~8 stations → 12% of space
 * - Industrial (1800-1900): ~10 stations → 12% of space
 * - Contemporary (1900-2025): ~20 stations → 26% of space (MOST DENSE)
 */
const TIME_ANCHORS = [
  { year: -10000, position: 0.0 },   // Start: Left edge
  { year: -3000,  position: 0.10 },  // Very early - sparse stations
  { year: -1000,  position: 0.20 },  // End of ancient
  { year: 0,      position: 0.30 },  // Turn of the common era
  { year: 500,    position: 0.38 },  // Fall of Rome
  { year: 1200,   position: 0.45 },  // Medieval peak
  { year: 1500,   position: 0.50 },  // Renaissance - MIDDLE OF SCREEN
  { year: 1750,   position: 0.58 },  // Pre-industrial
  { year: 1850,   position: 0.66 },  // Industrial revolution
  { year: 1920,   position: 0.74 },  // Early 20th century
  { year: 1960,   position: 0.82 },  // Space age / digital seeds
  { year: 1990,   position: 0.90 },  // Digital revolution starts
  { year: 2010,   position: 0.96 },  // Social/mobile era
  { year: 2025,   position: 1.0 }    // End: Right edge - Singularity
];

/**
 * Convert a historical year to X coordinate using Piecewise Linear Interpolation
 * This ensures even spacing of events regardless of the actual time difference.
 * @param {number} year - Historical year (negative for BCE)
 * @returns {number} X coordinate in viewbox space
 */
export function yearToX(year) {
  // Clamp year to timeline bounds
  if (year < TIMELINE.START) return 0;
  if (year > TIMELINE.END) return VIEWBOX.WIDTH;
  
  // Find the segment this year belongs to
  const anchorIndex = TIME_ANCHORS.findIndex(a => year <= a.year);
  
  // Handle edge cases
  if (anchorIndex === 0) return 0;
  if (anchorIndex === -1) return VIEWBOX.WIDTH;
  
  const startAnchor = TIME_ANCHORS[anchorIndex - 1];
  const endAnchor = TIME_ANCHORS[anchorIndex];
  
  // Calculate percentage within this specific segment
  const segmentDuration = endAnchor.year - startAnchor.year;
  const yearProgress = (year - startAnchor.year) / segmentDuration;
  
  // Map to viewbox position based on anchor positions
  const segmentWidth = endAnchor.position - startAnchor.position;
  const viewboxProgress = startAnchor.position + (yearProgress * segmentWidth);
  
  return viewboxProgress * VIEWBOX.WIDTH;
}

/**
 * Get the Y coordinate for a specific line's horizontal corridor
 * @param {string} lineName - Name of the line ('Tech', 'War', etc.)
 * @returns {number} Y coordinate in viewbox space
 */
export function getLineY(lineName) {
  const yPercent = LINE_Y_POSITIONS[lineName] || 0.50;
  return yPercent * VIEWBOX.HEIGHT;
}

/**
 * Create a coordinate object for a station
 * @param {number} year - Historical year
 * @param {string} primaryLine - Primary line this station belongs to
 * @returns {{x: number, y: number}} Coordinate object
 */
export function createStationCoord(year, primaryLine) {
  return {
    x: yearToX(year),
    y: getLineY(primaryLine)
  };
}

/**
 * Calculate the convergence point coordinates
 * @returns {{x: number, y: number}} Convergence coordinates
 */
export function getConvergencePoint() {
  return {
    x: yearToX(CONVERGENCE.year),
    y: CONVERGENCE.yPosition * VIEWBOX.HEIGHT
  };
}

/**
 * Constrain a viewBox to valid bounds
 * @param {Object} viewBox - ViewBox with x, y, width, height
 * @returns {Object} Constrained viewBox
 */
export function constrainViewBox({ x, y, width, height }) {
  const constrainedWidth = Math.max(
    VIEWBOX.WIDTH * VIEWBOX.MIN_ZOOM,
    Math.min(VIEWBOX.WIDTH * VIEWBOX.MAX_ZOOM, width)
  );
  const constrainedHeight = Math.max(
    VIEWBOX.HEIGHT * VIEWBOX.MIN_ZOOM,
    Math.min(VIEWBOX.HEIGHT * VIEWBOX.MAX_ZOOM, height)
  );
  
  return {
    x: Math.max(0, Math.min(VIEWBOX.WIDTH - constrainedWidth, x)),
    y: Math.max(0, Math.min(VIEWBOX.HEIGHT - constrainedHeight, y)),
    width: constrainedWidth,
    height: constrainedHeight
  };
}

/**
 * Center the viewBox on a specific coordinate
 * @param {Object} currentViewBox - Current viewBox state
 * @param {{x: number, y: number}} point - Point to center on
 * @returns {Object} New viewBox centered on point
 */
export function centerViewBoxOn(currentViewBox, point) {
  return constrainViewBox({
    x: point.x - currentViewBox.width / 2,
    y: point.y - currentViewBox.height / 2,
    width: currentViewBox.width,
    height: currentViewBox.height
  });
}

/**
 * Calculate zoom transform centered on a point
 * @param {Object} viewBox - Current viewBox
 * @param {number} zoomFactor - Zoom multiplier (< 1 = zoom in, > 1 = zoom out)
 * @param {{x: number, y: number}} centerPoint - Point to zoom toward
 * @param {{width: number, height: number}} containerSize - Container dimensions
 * @returns {Object} New viewBox after zoom
 */
export function zoomToPoint(viewBox, zoomFactor, centerPoint, containerSize) {
  const newWidth = viewBox.width * zoomFactor;
  const newHeight = viewBox.height * zoomFactor;
  
  // Calculate new position to keep centerPoint stable
  const newX = centerPoint.x - (centerPoint.x - viewBox.x) * zoomFactor;
  const newY = centerPoint.y - (centerPoint.y - viewBox.y) * zoomFactor;
  
  return constrainViewBox({
    x: newX,
    y: newY,
    width: newWidth,
    height: newHeight
  });
}
