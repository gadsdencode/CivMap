/**
 * SVG Path Generation Utilities
 * Clean, functional approach to generating metro line paths
 */

/**
 * Generate a smooth bezier curve path through points
 * @param {Array<{x: number, y: number}>} points - Array of coordinate points
 * @returns {string} SVG path d attribute
 */
export function generateSmoothPath(points) {
  if (!points || points.length < 2) return '';
  
  let d = `M ${points[0].x} ${points[0].y}`;
  
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const next = points[i + 1] || curr;
    
    // Direction vectors for curve control
    const dx1 = curr.x - prev.x;
    const dy1 = curr.y - prev.y;
    const dx2 = (next.x - curr.x) || dx1;
    const dy2 = (next.y - curr.y) || dy1;
    
    // Control points for smooth passage through current point
    const cp1x = prev.x + dx1 * 0.3;
    const cp1y = prev.y + dy1 * 0.3;
    const cp2x = curr.x - dx2 * 0.15;
    const cp2y = curr.y - dy2 * 0.15;
    
    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${curr.x} ${curr.y}`;
  }
  
  return d;
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
 * Create metro line path points for a specific line
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
 * Generate all metro line paths
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

/**
 * Generate braided path for Green line (multiple overlapping paths)
 * @param {Array<{x: number, y: number}>} points - Array of coordinate points
 * @returns {{main: string, braid1: string, braid2: string}} Braided path variants
 */
export function generateBraidedPath(points) {
  const basePath = generateSmoothPath(points);
  // Create offset paths for braided effect - scaled for larger viewport
  // These are visual only - the main path is what connects stations
  const offset1 = points.map(p => ({ x: p.x - 8, y: p.y + 5 }));
  const offset2 = points.map(p => ({ x: p.x + 8, y: p.y - 5 }));
  return {
    main: basePath, // This is the actual path that passes through stations
    braid1: generateSmoothPath(offset1), // Visual effect only
    braid2: generateSmoothPath(offset2)  // Visual effect only
  };
}

/**
 * Generate all metro line paths with hardcoded historical waypoints
 * This function contains the specific path definitions for each metro line
 * @param {Function} yearToX - Function to convert year to X coordinate
 * @param {number} viewboxHeight - Height of the viewbox
 * @returns {Object} Path strings keyed by line name (orange, purple, green, red, blue)
 */
export function generateMetroPaths(yearToX, viewboxHeight) {
  // Define consistent Y positions for each line's corridor
  const LINE_Y = {
    tech: viewboxHeight * 0.18,      // Cyan - Top
    war: viewboxHeight * 0.34,       // Red - Upper middle  
    population: viewboxHeight * 0.50, // Green - Center
    philosophy: viewboxHeight * 0.66, // Orange - Lower middle
    empire: viewboxHeight * 0.82     // Purple - Bottom
  };
  
  // Final convergence point where all lines meet
  const CONVERGENCE_X = yearToX(2025);
  const CONVERGENCE_Y = viewboxHeight * 0.15;
  
  // 1. BLUE (Tech) - Horizontal line at top, curves up at end
  const bluePts = [
    { x: 0, y: LINE_Y.tech },
    { x: yearToX(-10000), y: LINE_Y.tech },
    { x: yearToX(-8000), y: LINE_Y.tech },
    { x: yearToX(-6000), y: LINE_Y.tech },
    { x: yearToX(-3500), y: LINE_Y.tech },
    { x: yearToX(-3200), y: LINE_Y.tech },
    { x: yearToX(-3000), y: LINE_Y.tech },
    { x: yearToX(-1200), y: LINE_Y.tech },
    { x: yearToX(800), y: LINE_Y.tech },
    { x: yearToX(1455), y: LINE_Y.tech },
    { x: yearToX(1543), y: LINE_Y.tech },
    { x: yearToX(1712), y: LINE_Y.tech },
    { x: yearToX(1800), y: LINE_Y.tech },
    { x: yearToX(1900), y: LINE_Y.tech },
    { x: yearToX(1950), y: LINE_Y.tech },
    { x: yearToX(1990), y: LINE_Y.tech },
    { x: yearToX(2010), y: LINE_Y.tech * 0.8 },
    { x: CONVERGENCE_X, y: CONVERGENCE_Y },
    { x: CONVERGENCE_X + 50, y: 0 }
  ];
  
  // 2. RED (War) - Starts later, stays horizontal in its band
  const redPts = [
    { x: yearToX(-1200), y: LINE_Y.war },
    { x: yearToX(476), y: LINE_Y.war },
    { x: yearToX(793), y: LINE_Y.war },
    { x: yearToX(1206), y: LINE_Y.war },
    { x: yearToX(1492), y: LINE_Y.war },
    { x: yearToX(1789), y: LINE_Y.war },
    { x: yearToX(1850), y: LINE_Y.war },
    { x: yearToX(1914), y: LINE_Y.war },
    { x: yearToX(1945), y: LINE_Y.war },
    { x: yearToX(1990), y: LINE_Y.war },
    { x: yearToX(2010), y: LINE_Y.war * 0.85 },
    { x: CONVERGENCE_X, y: CONVERGENCE_Y + 30 }
  ];
  
  // 3. GREEN (Population) - Center line, stays horizontal
  const greenPts = [
    { x: 0, y: LINE_Y.population },
    { x: yearToX(-10000), y: LINE_Y.population },
    { x: yearToX(-4000), y: LINE_Y.population },
    { x: yearToX(-3500), y: LINE_Y.population },
    { x: yearToX(-500), y: LINE_Y.population },
    { x: yearToX(100), y: LINE_Y.population },
    { x: yearToX(476), y: LINE_Y.population },
    { x: yearToX(1347), y: LINE_Y.population * 1.05 }, // Slight dip for Black Death
    { x: yearToX(1492), y: LINE_Y.population },
    { x: yearToX(1800), y: LINE_Y.population },
    { x: yearToX(1900), y: LINE_Y.population * 0.95 },
    { x: yearToX(1950), y: LINE_Y.population * 0.85 },
    { x: yearToX(2000), y: LINE_Y.population * 0.7 },
    { x: yearToX(2015), y: LINE_Y.population * 0.5 },
    { x: CONVERGENCE_X, y: CONVERGENCE_Y + 60 }
  ];
  
  // 4. ORANGE (Philosophy) - Lower middle band
  const orangePts = [
    { x: yearToX(-10000), y: LINE_Y.philosophy },
    { x: yearToX(-1750), y: LINE_Y.philosophy },
    { x: yearToX(-776), y: LINE_Y.philosophy },
    { x: yearToX(-563), y: LINE_Y.philosophy },
    { x: yearToX(-500), y: LINE_Y.philosophy },
    { x: yearToX(0), y: LINE_Y.philosophy },
    { x: yearToX(529), y: LINE_Y.philosophy },
    { x: yearToX(800), y: LINE_Y.philosophy },
    { x: yearToX(1215), y: LINE_Y.philosophy },
    { x: yearToX(1400), y: LINE_Y.philosophy },
    { x: yearToX(1687), y: LINE_Y.philosophy },
    { x: yearToX(1859), y: LINE_Y.philosophy },
    { x: yearToX(1950), y: LINE_Y.philosophy * 0.9 },
    { x: yearToX(2000), y: LINE_Y.philosophy * 0.75 },
    { x: CONVERGENCE_X, y: CONVERGENCE_Y + 90 }
  ];
  
  // 5. PURPLE (Empire) - Bottom band, curves up at end
  const purplePts = [
    { x: yearToX(-4000), y: LINE_Y.empire },
    { x: yearToX(-3500), y: LINE_Y.empire },
    { x: yearToX(-3300), y: LINE_Y.empire },
    { x: yearToX(-3100), y: LINE_Y.empire },
    { x: yearToX(-2600), y: LINE_Y.empire },
    { x: yearToX(-550), y: LINE_Y.empire },
    { x: yearToX(-500), y: LINE_Y.empire },
    { x: yearToX(-336), y: LINE_Y.empire },
    { x: yearToX(-221), y: LINE_Y.empire },
    { x: yearToX(100), y: LINE_Y.empire },
    { x: yearToX(618), y: LINE_Y.empire },
    { x: yearToX(1206), y: LINE_Y.empire },
    { x: yearToX(1492), y: LINE_Y.empire },
    { x: yearToX(1800), y: LINE_Y.empire * 0.95 },
    { x: yearToX(1914), y: LINE_Y.empire * 0.85 },
    { x: yearToX(2000), y: LINE_Y.empire * 0.6 },
    { x: CONVERGENCE_X, y: CONVERGENCE_Y + 120 }
  ];

  const greenBraided = generateBraidedPath(greenPts);

  return {
    orange: generateSmoothPath(orangePts),
    purple: generateSmoothPath(purplePts),
    green: greenBraided,
    red: generateSmoothPath(redPts),
    blue: generateSmoothPath(bluePts),
    connections: {} // Disable complex connections for cleaner look
  };
}

