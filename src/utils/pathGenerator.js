/**
 * SVG Path Generation Utilities
 * Clean, functional approach to generating metro line paths
 * Dynamically generates paths from station data to ensure perfect alignment
 */

import { CONVERGENCE_OFFSETS } from '../constants/metroConfig';

/**
 * Generate a smooth bezier curve path through points
 * Enhanced to handle straight lines (corridors) better
 * @param {Array<{x: number, y: number}>} points - Array of coordinate points
 * @returns {string} SVG path d attribute
 */
export function generateSmoothPath(points) {
  if (!points || points.length < 2) return '';
  
  let d = `M ${points[0].x} ${points[0].y}`;
  
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    
    // Calculate control points
    const isHorizontal = Math.abs(prev.y - curr.y) < 1;
    
    if (isHorizontal) {
      // Linear line for horizontal segments
      d += ` L ${curr.x} ${curr.y}`;
    } else {
      // Dynamic tension based on distance
      // If points are very close horizontally but far vertically, we need lower tension
      // to avoid "overshoot" loops
      const dx = curr.x - prev.x;
      const dy = Math.abs(curr.y - prev.y);
      
      // Standard tension
      let tension = 0.45;
      
      // If slope is very steep (short X, big Y), reduce tension
      if (dx < dy * 0.5) {
        tension = 0.3;
      }
      
      // Control Point 1 (leaving previous)
      const cp1x = prev.x + (dx * tension);
      const cp1y = prev.y; // Keep Y tangent flat at start
      
      // Control Point 2 (arriving at current)
      const cp2x = curr.x - (dx * tension);
      const cp2y = curr.y; // Keep Y tangent flat at end
      
      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${curr.x} ${curr.y}`;
    }
  }
  
  return d;
}

/**
 * Generate braided path for Green line (Population)
 * @param {Array<{x: number, y: number}>} points - Array of coordinate points
 * @returns {{main: string, braid1: string, braid2: string}} Braided path variants
 */
export function generateBraidedPath(points) {
  const basePath = generateSmoothPath(points);
  
  // Create subtle offset paths for braided visual effect
  // These are visual only - the main path is what connects stations
  const offset1 = points.map(p => ({ x: p.x - 6, y: p.y + 4 }));
  const offset2 = points.map(p => ({ x: p.x + 6, y: p.y - 4 }));
  
  return {
    main: basePath, // This is the actual path that passes through stations
    braid1: generateSmoothPath(offset1), // Visual effect only
    braid2: generateSmoothPath(offset2)  // Visual effect only
  };
}

/**
 * Generate all metro line paths dynamically based on stations
 * This ensures every line passes perfectly through the center of every station it serves
 * @param {Function} yearToX - Function to convert year to X coordinate
 * @param {number} viewboxHeight - Height of the viewbox
 * @param {Array} stations - Array of processed station objects
 * @returns {Object} Path strings keyed by line name
 */
export function generateMetroPaths(yearToX, viewboxHeight, stations) {
  // Define consistent Y positions (Corridors) for each line
  const LINE_Y = {
    tech: viewboxHeight * 0.20,       // Cyan - Top
    war: viewboxHeight * 0.35,        // Red - Upper middle  
    population: viewboxHeight * 0.50, // Green - Center
    philosophy: viewboxHeight * 0.65, // Orange - Lower middle
    empire: viewboxHeight * 0.80      // Purple - Bottom
  };
  
  // Final convergence point (The Singularity)
  const CONVERGENCE_X = yearToX(2025);
  const CONVERGENCE_Y_BASE = viewboxHeight * 0.15;
  
  /**
   * Helper to get path points for a specific line
   * @param {string} lineKey - Line identifier (lowercase: 'tech', 'war', etc.)
   * @returns {Array<{x: number, y: number}>} Path points
   */
  const getPointsForLine = (lineKey) => {
    const lineId = lineKey.charAt(0).toUpperCase() + lineKey.slice(1);
    const corridorY = LINE_Y[lineKey];
    
    // 1. Start Point (Far Left)
    const points = [
      { x: 0, y: corridorY },
      { x: yearToX(-10000), y: corridorY }
    ];
    
    // 2. Filter and Sort Stations
    const lineStations = stations
      .filter(s => s.lines.includes(lineId))
      .sort((a, b) => a.year - b.year);
    
    // 3. Connect Stations with Smart Waypoints
    for (let i = 0; i < lineStations.length; i++) {
      const station = lineStations[i];
      const nextStation = lineStations[i + 1];
      const lastPt = points[points.length - 1];
      
      // Determine if we are "off corridor"
      const isOnCorridor = Math.abs(lastPt.y - corridorY) < 1;
      const stationIsOnCorridor = Math.abs(station.coords.y - corridorY) < 1;
      
      // Calculate dynamic ramp length based on vertical distance
      // Steeper vertical changes need longer horizontal runways
      const dy = Math.abs(lastPt.y - station.coords.y);
      const rampLength = Math.max(100, dy * 1.5); // 1.5 ratio usually looks good
      
      // CHECK: Is there enough space to ramp to the station?
      const distanceToStation = station.coords.x - lastPt.x;
      
      if (distanceToStation > rampLength * 2) {
        // PLENTY OF SPACE:
        // If we are not on corridor, return to it first
        if (!isOnCorridor) {
           const returnX = lastPt.x + rampLength;
           // Only return if it doesn't overshoot the station ramp start
           if (returnX < station.coords.x - rampLength) {
             points.push({ x: returnX, y: corridorY });
           }
        }
        
        // Now travel along corridor (implicit) and ramp to station
        if (!stationIsOnCorridor) {
          const rampStartX = station.coords.x - rampLength;
          // Ensure we don't backtrack
          if (rampStartX > points[points.length - 1].x) {
             points.push({ x: rampStartX, y: corridorY });
          }
        }
      } 
      // NOT ENOUGH SPACE: Direct connection (ZigZag)
      // We rely on the Bezier curve to smooth this direct line
      
      // Add the station point
      points.push({ x: station.coords.x, y: station.coords.y });
      
      // POST-STATION LOGIC:
      // Should we return to corridor immediately after?
      // Only if the next station is far away or doesn't exist.
      if (nextStation) {
        const distToNext = nextStation.coords.x - station.coords.x;
        const nextDy = Math.abs(nextStation.coords.y - corridorY);
        const nextRamp = Math.max(100, nextDy * 1.5);
        
        // If next station is far, return to corridor
        if (distToNext > (rampLength + nextRamp + 100)) {
           if (!stationIsOnCorridor) {
             const returnX = station.coords.x + rampLength;
             points.push({ x: returnX, y: corridorY });
           }
        }
        // Else: Stay at current Y or direct connect to next station
      } else {
        // No next station, definitely return to corridor for the finale
        if (!stationIsOnCorridor) {
           const returnX = station.coords.x + rampLength;
           points.push({ x: returnX, y: corridorY });
        }
      }
    }
    
    // 4. Convergence (The Singularity)
    const lastPoint = points[points.length - 1];
    const convergeY = CONVERGENCE_Y_BASE + (CONVERGENCE_OFFSETS[lineKey] || 0);
    
    // Smooth transition to convergence
    const finalRampX = CONVERGENCE_X - 300;
    
    if (lastPoint.x < finalRampX) {
      points.push({ x: finalRampX, y: lastPoint.y });
    }
    
    points.push({ 
      x: CONVERGENCE_X, 
      y: convergeY 
    });
    
    // 5. Infinite Future (shoot off to the right)
    points.push({ 
      x: CONVERGENCE_X + 2000, 
      y: convergeY 
    });
    
    return points;
  };

  // Generate paths for each line
  const techPoints = getPointsForLine('tech');
  const warPoints = getPointsForLine('war');
  const populationPoints = getPointsForLine('population');
  const philosophyPoints = getPointsForLine('philosophy');
  const empirePoints = getPointsForLine('empire');

  return {
    blue: generateSmoothPath(techPoints),
    red: generateSmoothPath(warPoints),
    green: generateBraidedPath(populationPoints), 
    orange: generateSmoothPath(philosophyPoints),
    purple: generateSmoothPath(empirePoints),
    
    tech: generateSmoothPath(techPoints),
    war: generateSmoothPath(warPoints),
    population: generateBraidedPath(populationPoints),
    philosophy: generateSmoothPath(philosophyPoints),
    empire: generateSmoothPath(empirePoints),
    
    connections: {}
  };
}
