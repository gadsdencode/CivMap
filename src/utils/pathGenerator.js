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

