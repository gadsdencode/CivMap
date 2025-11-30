/**
 * Coordinate System Utilities
 * Handles all year-to-pixel and position calculations
 */

import { VIEWBOX, TIMELINE, LINE_Y_POSITIONS, CONVERGENCE } from '../constants/metroConfig';

/**
 * Convert a historical year to X coordinate using logarithmic scaling
 * This gives more visual space to recent events (information density)
 * @param {number} year - Historical year (negative for BCE)
 * @returns {number} X coordinate in viewbox space
 */
export function yearToX(year) {
  const normalized = (year - TIMELINE.START) / TIMELINE.RANGE;
  
  if (normalized <= 0) return 0;
  if (normalized >= 1) return VIEWBOX.WIDTH;
  
  // Logarithmic scale with linear blend for modern era visibility
  const logValue = Math.log10(normalized * 9 + 1);
  const linearComponent = normalized * 0.3;
  const combined = (logValue * 0.7 + linearComponent) * VIEWBOX.WIDTH;
  
  return Math.max(0, Math.min(VIEWBOX.WIDTH, combined));
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

