/**
 * SVG Path Generation Utilities
 * ULTRA-SIMPLIFIED v4 - Direct station-to-station connections ONLY
 * 
 * No corridor logic, no extra waypoints, just pure station connections.
 */

import { CONVERGENCE_OFFSETS, LINE_Y_POSITIONS, CONVERGENCE } from '../constants/metroConfig';

/**
 * Generate smooth S-curve path with horizontal tangents at each point
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
      // Horizontal - straight line
      d += ` L ${curr.x} ${curr.y}`;
    } else {
      // S-curve with horizontal tangents
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
 * ULTRA-SIMPLE path generation
 * - Start at left edge on corridor
 * - Connect directly to each station in order (NO extra waypoints)
 * - End at convergence
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

    // ALL STATIONS: Direct connection to each one
    for (const station of lineStations) {
      points.push({ x: station.coords.x, y: station.coords.y });
    }

    // END: Convergence point
    const finalY = CONVERGENCE_Y + (CONVERGENCE_OFFSETS[lineKey] || 0);
    
    // Only add convergence if we're not already there
    const lastPoint = points[points.length - 1];
    if (lastPoint.x < CONVERGENCE_X - 10) {
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
