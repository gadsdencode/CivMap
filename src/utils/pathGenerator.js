/**
 * SVG Path Generation Utilities
 * Clean, functional approach to generating metro line paths
 * Dynamically generates paths from station data to ensure perfect alignment
 */

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
    // If we are on a long straight segment (same Y), keep it straight
    const isHorizontal = Math.abs(prev.y - curr.y) < 1;
    
    if (isHorizontal) {
      // Linear line for horizontal segments
      d += ` L ${curr.x} ${curr.y}`;
    } else {
      // Bezier curve for transitions
      // Tension determines how "tight" the curve is. 0.4 is a smooth value.
      const tension = 0.4;
      
      const dx = curr.x - prev.x;
      
      // Control Point 1 (leaving previous)
      const cp1x = prev.x + (dx * tension);
      const cp1y = prev.y; // Keep Y tangent flat at start to avoid dipping
      
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
 * 
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
  
  // Convergence offsets to create a neat vertical bundle at the end
  // This prevents z-fighting and messy overlap
  const convergenceOffsets = {
    tech: 0,
    population: 15,
    war: 30,
    empire: 45,
    philosophy: 60
  };

  /**
   * Helper to get path points for a specific line
   * @param {string} lineKey - Line identifier (lowercase: 'tech', 'war', etc.)
   * @returns {Array<{x: number, y: number}>} Path points
   */
  const getPointsForLine = (lineKey) => {
    // Convert lineKey to proper case for station matching
    const lineId = lineKey.charAt(0).toUpperCase() + lineKey.slice(1);
    
    // 1. Start Point (Far Left)
    const points = [
      { x: 0, y: LINE_Y[lineKey] },
      { x: yearToX(-10000), y: LINE_Y[lineKey] }
    ];
    
    // 2. Add all stations belonging to this line
    const lineStations = stations
      .filter(s => s.lines.includes(lineId))
      .sort((a, b) => a.year - b.year);
    
    lineStations.forEach(station => {
      const lastPt = points[points.length - 1];
      
      // Optimization: Don't add a point if it's too close to the last one (prevents kinks)
      if (Math.abs(lastPt.x - station.coords.x) > 50) {
        // If station is on a different Y (hub/multi-line station), 
        // add a transition point first to stay in lane until we need to curve
        if (Math.abs(lastPt.y - station.coords.y) > 10) {
          // Add a point just before the station to start the curve smoothly
          const transitionX = station.coords.x - 100;
          if (transitionX > lastPt.x) {
            points.push({ x: transitionX, y: lastPt.y });
          }
        }
        
        // Add the actual station point
        points.push({ x: station.coords.x, y: station.coords.y });
        
        // If we curved to a station, add a return point after to curve back to lane
        if (Math.abs(lastPt.y - station.coords.y) > 10 && station.year < 2000) {
          const returnX = station.coords.x + 100;
          points.push({ x: returnX, y: LINE_Y[lineKey] });
        }
      }
    });
    
    // 3. Add Convergence Points
    const lastStation = lineStations[lineStations.length - 1];
    const lastPoint = points[points.length - 1];
    
    // Add a pre-convergence point to smooth the curve upward
    // Only if the last station is not already very close to 2025
    if (!lastStation || lastStation.year < 2010) {
      // Stay in lane until the very end
      const preConvergeX = yearToX(2015);
      if (preConvergeX > lastPoint.x) {
        points.push({ x: preConvergeX, y: LINE_Y[lineKey] });
      }
    }
    
    // The Singularity Bundle - organized vertically
    points.push({ 
      x: CONVERGENCE_X, 
      y: CONVERGENCE_Y_BASE + convergenceOffsets[lineKey] 
    });
    
    // Infinite Future (shoot off to the right and slightly up)
    points.push({ 
      x: CONVERGENCE_X + 800, 
      y: CONVERGENCE_Y_BASE + convergenceOffsets[lineKey] - 150
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
    // Main paths - named to match existing color references
    blue: generateSmoothPath(techPoints),
    red: generateSmoothPath(warPoints),
    green: generateBraidedPath(populationPoints), // Returns object with main, braid1, braid2
    orange: generateSmoothPath(philosophyPoints),
    purple: generateSmoothPath(empirePoints),
    
    // Also provide paths keyed by line ID for flexibility
    tech: generateSmoothPath(techPoints),
    war: generateSmoothPath(warPoints),
    population: generateBraidedPath(populationPoints),
    philosophy: generateSmoothPath(philosophyPoints),
    empire: generateSmoothPath(empirePoints),
    
    // Disable complex connections for cleaner look
    connections: {}
  };
}

/**
 * Generate a path with multiple visual layers (shadow, main, core)
 * @param {Array<{x: number, y: number}>} points - Array of coordinate points
 * @returns {{main: string, shadow: string, core: string}} Path variants
 */
export function generateLayeredPath(points) {
  const main = generateSmoothPath(points);
  
  // Offset paths for visual depth (subtle, keeps same Y)
  const shadowOffset = points.map(p => ({ x: p.x, y: p.y + 2 }));
  const coreOffset = points.map(p => ({ x: p.x, y: p.y }));
  
  return {
    main,
    shadow: generateSmoothPath(shadowOffset),
    core: generateSmoothPath(coreOffset)
  };
}

/**
 * Create metro line path points for a specific line (legacy support)
 * @param {string} lineId - Line identifier ('tech', 'war', etc.)
 * @param {number} lineY - Y coordinate for this line's corridor
 * @param {Array<number>} keyYears - Years where this line has stations
 * @param {{x: number, y: number}} convergence - Convergence point
 * @param {Function} yearToX - Year to X coordinate converter
 * @returns {Array<{x: number, y: number}>} Path points
 */
export function createLinePathPoints(lineId, lineY, keyYears, convergence, yearToX) {
  // Sort years chronologically
  const sortedYears = [...keyYears].sort((a, b) => a - b);
  
  // Generate horizontal path through all key years
  const points = sortedYears.map(year => ({
    x: yearToX(year),
    y: lineY
  }));
  
  // Add convergence curve at the end (modern era)
  const lastPoint = points[points.length - 1];
  if (lastPoint) {
    // Gradual curve toward convergence
    const midX = (lastPoint.x + convergence.x) / 2;
    const midY = (lineY + convergence.y) / 2;
    
    points.push({ x: midX, y: midY });
    points.push(convergence);
  }
  
  return points;
}

/**
 * Generate all metro line paths (legacy support)
 * @param {Object} config - Configuration with yearToX, lineY positions, convergence
 * @param {Object} stationsByLine - Stations grouped by line
 * @returns {Object} Path strings keyed by line id
 */
export function generateAllPaths(config, stationsByLine) {
  const { yearToX, lineYPositions, convergencePoint, viewboxHeight } = config;
  
  const paths = {};
  
  Object.entries(lineYPositions).forEach(([lineName, yPercent]) => {
    const lineY = yPercent * viewboxHeight;
    const stations = stationsByLine[lineName] || [];
    const keyYears = stations.map(s => s.year);
    
    // Ensure we have start and end points even without stations
    if (keyYears.length === 0) {
      keyYears.push(-10000, 2025);
    }
    
    const points = createLinePathPoints(
      lineName.toLowerCase(),
      lineY,
      keyYears,
      convergencePoint,
      yearToX
    );
    
    paths[lineName.toLowerCase()] = {
      d: generateSmoothPath(points),
      points
    };
  });
  
  return paths;
}
