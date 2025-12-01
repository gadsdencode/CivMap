/**
 * SVG Path Generation Utilities
 * 
 * PROPER METRO MAP APPROACH:
 * - Each line is a CONTINUOUS horizontal path at its corridor Y
 * - Stations on that line appear AT the line's Y (not at some other line's Y)
 * - Lines only deviate for convergence at 2025
 * 
 * This creates the classic metro map aesthetic where lines are mostly horizontal
 * with smooth curves only where necessary.
 */

import { CONVERGENCE_OFFSETS, LINE_Y_POSITIONS, CONVERGENCE } from '../constants/metroConfig';

/**
 * Generate smooth path with horizontal tangents
 */
export function generateSmoothPath(points) {
  if (!points || points.length < 2) return '';

  let d = `M ${points[0].x} ${points[0].y}`;

  for (let i = 1; i < points.length; i++) {
    const curr = points[i];
    const prev = points[i - 1];
    const dx = curr.x - prev.x;
    const dy = Math.abs(curr.y - prev.y);

    if (dy < 1) {
      d += ` L ${curr.x} ${curr.y}`;
    } else {
      const cp1x = prev.x + (dx * 0.5);
      const cp2x = curr.x - (dx * 0.5);
      d += ` C ${cp1x} ${prev.y}, ${cp2x} ${curr.y}, ${curr.x} ${curr.y}`;
    }
  }

  return d;
}

/**
 * Generate braided path for Population line
 */
export function generateBraidedPath(points) {
  const main = generateSmoothPath(points);
  const braid1 = generateSmoothPath(points.map(p => ({ x: p.x, y: p.y + 3 })));
  const braid2 = generateSmoothPath(points.map(p => ({ x: p.x, y: p.y - 3 })));
  return { main, braid1, braid2 };
}

/**
 * PROPER Metro Map Path Generation
 * 
 * KEY INSIGHT: Each line draws stations at ITS OWN Y CORRIDOR.
 * The station's X position comes from the data, but Y is the LINE's corridor Y.
 * 
 * This creates continuous horizontal lines with stations as stops along the way.
 */
export function generateMetroPaths(yearToX, viewboxHeight, stations) {
  const CONVERGENCE_X = yearToX(2025);
  const CONVERGENCE_Y = CONVERGENCE.yPosition * viewboxHeight;

  const buildPath = (lineKey) => {
    const lineName = lineKey.charAt(0).toUpperCase() + lineKey.slice(1);
    const corridorY = (LINE_Y_POSITIONS[lineName] || 0.5) * viewboxHeight;
    
    // Get stations for this line, sorted by X
    const lineStations = stations
      .filter(s => s.lines.includes(lineName))
      .sort((a, b) => a.coords.x - b.coords.x);

    const points = [];

    // START: Left edge at corridor Y
    points.push({ x: 0, y: corridorY });

    // ALL STATIONS: Place them at THIS LINE'S Y, not their stored Y
    // This keeps the line continuous and horizontal
    for (const station of lineStations) {
      points.push({ 
        x: station.coords.x, 
        y: corridorY  // KEY: Use the LINE's Y, not station's stored Y
      });
    }

    // END: Curve to convergence point
    const finalY = CONVERGENCE_Y + (CONVERGENCE_OFFSETS[lineKey] || 0);
    
    const lastX = lineStations.length > 0 
      ? lineStations[lineStations.length - 1].coords.x 
      : 0;
    
    if (lastX < CONVERGENCE_X - 10) {
      points.push({ x: CONVERGENCE_X, y: finalY });
    }
    
    // Extend to future
    points.push({ x: CONVERGENCE_X + 2000, y: finalY });

    return points;
  };

  return {
    blue: generateSmoothPath(buildPath('tech')),
    red: generateSmoothPath(buildPath('war')),
    green: generateBraidedPath(buildPath('population')),
    orange: generateSmoothPath(buildPath('philosophy')),
    purple: generateSmoothPath(buildPath('empire')),
    tech: generateSmoothPath(buildPath('tech')),
    war: generateSmoothPath(buildPath('war')),
    population: generateBraidedPath(buildPath('population')),
    philosophy: generateSmoothPath(buildPath('philosophy')),
    empire: generateSmoothPath(buildPath('empire')),
    connections: {}
  };
}

/**
 * Get station Y position for a specific line
 * Used by station rendering to position stations on each line they belong to
 */
export function getStationYForLine(lineName, viewboxHeight) {
  return (LINE_Y_POSITIONS[lineName] || 0.5) * viewboxHeight;
}
