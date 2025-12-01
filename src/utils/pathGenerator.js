/**
 * SVG Path Generation Utilities
 * Commercial-grade path smoothing with horizontal tangents
 * Ensures lines pass EXACTLY through station centers with clean curves
 * 
 * KEY FEATURES:
 * - Horizontal tangent entry/exit at all stations (no corner cutting)
 * - Intelligent corridor return for long gaps
 * - Clean "marshalling yard" convergence at singularity
 * - Adaptive smoothing based on station density
 */

import { CONVERGENCE_OFFSETS } from '../constants/metroConfig';

/**
 * Calculate adaptive smoothing factor based on segment characteristics
 * Prevents overshoot on short segments and ensures proper curves on long ones
 * @param {number} dx - Horizontal distance between points
 * @param {number} dy - Vertical distance between points
 * @returns {number} Smoothing factor (0.3 - 0.5)
 */
function getAdaptiveSmoothing(dx, dy) {
  const absDy = Math.abs(dy);
  
  // If nearly horizontal, no smoothing needed (will use line)
  if (absDy < 1) return 0.5;
  
  // Calculate the aspect ratio (width vs height of the curve)
  const aspectRatio = Math.abs(dx) / absDy;
  
  // For very steep segments (short horizontal, tall vertical),
  // use lower smoothing to prevent the S-curve from becoming too tight
  if (aspectRatio < 1) {
    // Steep: scale smoothing down (0.3 minimum)
    return Math.max(0.3, 0.3 + (aspectRatio * 0.2));
  }
  
  // For normal to wide segments, use full smoothing
  return 0.5;
}

/**
 * Generate a strict Cubic Bezier path that guarantees horizontal entry/exit
 * This prevents "overshoot" and ensures the line passes EXACTLY through station centers.
 * @param {Array<{x: number, y: number}>} points - Array of coordinate points
 * @returns {string} SVG path d attribute
 */
export function generateSmoothPath(points) {
  if (!points || points.length < 2) return '';

  // Start at the first point
  let d = `M ${points[0].x} ${points[0].y}`;

  for (let i = 1; i < points.length; i++) {
    const curr = points[i];
    const prev = points[i - 1];

    // Check if this is a horizontal segment (same Y)
    const isHorizontal = Math.abs(prev.y - curr.y) < 1;

    if (isHorizontal) {
      // Linear line for horizontal segments - more efficient
      d += ` L ${curr.x} ${curr.y}`;
    } else {
      // Calculate distances
      const dx = curr.x - prev.x;
      const dy = curr.y - prev.y;

      // Get adaptive smoothing based on segment characteristics
      const smoothing = getAdaptiveSmoothing(dx, dy);

      // Control Point 1: Move horizontally to the right from previous point
      // This ensures the line LEAVES the previous station horizontally
      const cp1 = {
        x: prev.x + (dx * smoothing),
        y: prev.y
      };

      // Control Point 2: Move horizontally to the left from current point
      // This ensures the line ARRIVES at the current station horizontally
      const cp2 = {
        x: curr.x - (dx * smoothing),
        y: curr.y
      };

      // Cubic Bezier command - line enters and exits each station horizontally
      d += ` C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${curr.x} ${curr.y}`;
    }
  }

  return d;
}

/**
 * Generate braided path for Green line (Population)
 * Creates a DNA-helix-like visual effect representing population dynamics
 * @param {Array<{x: number, y: number}>} points - Array of coordinate points
 * @returns {{main: string, braid1: string, braid2: string}} Braided path variants
 */
export function generateBraidedPath(points) {
  const basePath = generateSmoothPath(points);

  // Tighter offsets for a cleaner, professional look
  // Y-only offset maintains horizontal alignment
  const offset1 = points.map(p => ({ x: p.x, y: p.y + 3 }));
  const offset2 = points.map(p => ({ x: p.x, y: p.y - 3 }));

  return {
    main: basePath,
    braid1: generateSmoothPath(offset1),
    braid2: generateSmoothPath(offset2)
  };
}

/**
 * Generate all metro line paths dynamically based on stations
 * This ensures every line passes perfectly through the center of every station it serves
 * 
 * DESIGN PRINCIPLES:
 * 1. Direct station-to-station connections (no forced corridor returns between close stations)
 * 2. Corridor return only for large gaps (>600px) to maintain visual organization
 * 3. Clean pre-convergence alignment for organized singularity arrival
 * 
 * @param {Function} yearToX - Function to convert year to X coordinate
 * @param {number} viewboxHeight - Height of the viewbox
 * @param {Array} stations - Array of processed station objects
 * @returns {Object} Path strings keyed by line name
 */
export function generateMetroPaths(yearToX, viewboxHeight, stations) {
  // Define consistent Y positions (Corridors) for each line
  // These serve as the "default" position when no station is nearby
  const LINE_Y = {
    tech: viewboxHeight * 0.20,       // Cyan - Top
    war: viewboxHeight * 0.35,        // Red - Upper middle
    population: viewboxHeight * 0.50, // Green - Center
    philosophy: viewboxHeight * 0.65, // Orange - Lower middle
    empire: viewboxHeight * 0.80      // Purple - Bottom
  };

  // Final convergence point (The Singularity - 2025)
  const CONVERGENCE_X = yearToX(2025);
  const CONVERGENCE_Y_BASE = viewboxHeight * 0.15;

  /**
   * Helper to get path points for a specific line
   * Uses intelligent waypoint placement for smooth, professional curves
   * 
   * @param {string} lineKey - Line identifier (lowercase: 'tech', 'war', etc.)
   * @returns {Array<{x: number, y: number}>} Path points
   */
  const getPointsForLine = (lineKey) => {
    const lineId = lineKey.charAt(0).toUpperCase() + lineKey.slice(1);
    const corridorY = LINE_Y[lineKey];

    // 1. Start Point (Far Left) - Begin on the corridor
    const points = [
      { x: 0, y: corridorY },
      { x: yearToX(-10000), y: corridorY }
    ];

    // 2. Get stations for this line, sorted by X coordinate (chronological)
    const lineStations = stations
      .filter(s => s.lines.includes(lineId))
      .sort((a, b) => a.coords.x - b.coords.x);

    // 3. Connect Stations - INTELLIGENT WAYPOINT LOGIC
    // 
    // Key insight: We only return to corridor when there's a substantial gap.
    // This prevents the "sine wave" effect and creates cleaner flows.
    // 
    // THRESHOLD: 600px (reduced from 800 for smoother transitions)
    const CORRIDOR_RETURN_THRESHOLD = 600;
    const RETURN_FRACTION = 0.25; // How far into the gap to return to corridor

    for (let i = 0; i < lineStations.length; i++) {
      const station = lineStations[i];
      const prevPoint = points[points.length - 1];
      const nextStation = lineStations[i + 1];

      // Calculate distance from previous point to this station
      const distFromPrev = station.coords.x - prevPoint.x;

      // Check if we're significantly off-corridor
      const isOffCorridor = Math.abs(prevPoint.y - corridorY) > 20;

      // INTELLIGENT RETURN: Only return to corridor if:
      // 1. There's a large gap (> threshold)
      // 2. We're currently off-corridor
      // 3. This helps avoid awkward steep angles
      if (distFromPrev > CORRIDOR_RETURN_THRESHOLD && isOffCorridor) {
        // Smooth return: create two waypoints for gradual corridor alignment
        const returnX1 = prevPoint.x + (distFromPrev * RETURN_FRACTION);
        const returnX2 = station.coords.x - (distFromPrev * RETURN_FRACTION);
        
        // Only add if they don't overlap
        if (returnX2 > returnX1 + 50) {
          points.push({ x: returnX1, y: corridorY });
          points.push({ x: returnX2, y: corridorY });
        }
      }

      // Add the station point
      points.push({ x: station.coords.x, y: station.coords.y });

      // POST-STATION: Check if we should return to corridor after this station
      // Only do this if the next station is far away AND we're off corridor
      if (nextStation) {
        const distToNext = nextStation.coords.x - station.coords.x;
        const stationIsOffCorridor = Math.abs(station.coords.y - corridorY) > 20;
        
        if (distToNext > CORRIDOR_RETURN_THRESHOLD && stationIsOffCorridor) {
          // Add a smooth return point
          const returnX = station.coords.x + (distToNext * RETURN_FRACTION);
          points.push({ x: returnX, y: corridorY });
        }
      }
    }

    // 4. Clean Convergence Logic - "Marshalling Yard" approach
    const lastPoint = points[points.length - 1];
    const finalY = CONVERGENCE_Y_BASE + (CONVERGENCE_OFFSETS[lineKey] || 0);

    // Pre-convergence staging area
    // This ensures all lines travel horizontally before their final vertical adjustment
    const PRE_CONVERGENCE_BUFFER = 200;
    const preConvergenceX = CONVERGENCE_X - PRE_CONVERGENCE_BUFFER;

    if (lastPoint.x < preConvergenceX - 100) {
      // Standard case: add pre-convergence staging point
      // Step 1: Travel to pre-convergence at current Y
      points.push({ x: preConvergenceX, y: lastPoint.y });
      // Step 2: Curve to final Y at convergence
      points.push({ x: CONVERGENCE_X, y: finalY });
    } else if (lastPoint.x < CONVERGENCE_X - 50) {
      // Close to convergence: direct transition
      points.push({ x: CONVERGENCE_X, y: finalY });
    } else {
      // Already at or past convergence: ensure we end at the right Y
      if (Math.abs(lastPoint.y - finalY) > 5) {
        points.push({ x: CONVERGENCE_X, y: finalY });
      }
    }

    // 5. Infinite Future - straight line extending to the right
    // This represents the unknown future extending from the singularity
    points.push({
      x: CONVERGENCE_X + 2000,
      y: finalY
    });

    return points;
  };

  // Generate points for each line
  const techPoints = getPointsForLine('tech');
  const warPoints = getPointsForLine('war');
  const populationPoints = getPointsForLine('population');
  const philosophyPoints = getPointsForLine('philosophy');
  const empirePoints = getPointsForLine('empire');

  return {
    // Color-keyed paths (legacy support)
    blue: generateSmoothPath(techPoints),
    red: generateSmoothPath(warPoints),
    green: generateBraidedPath(populationPoints),
    orange: generateSmoothPath(philosophyPoints),
    purple: generateSmoothPath(empirePoints),

    // Line-name-keyed paths (preferred)
    tech: generateSmoothPath(techPoints),
    war: generateSmoothPath(warPoints),
    population: generateBraidedPath(populationPoints),
    philosophy: generateSmoothPath(philosophyPoints),
    empire: generateSmoothPath(empirePoints),

    // Placeholder for any inter-line connections
    connections: {}
  };
}
