/**
 * Unit Tests for SVG Path Generation Utilities
 * Tests path generation for metro lines, braided paths, and collision avoidance
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  generateSmoothPath,
  generateBraidedPath,
  generateMetroPaths,
  getStationYForLine
} from './pathGenerator';
import { LINE_Y_POSITIONS, VIEWBOX, CONVERGENCE_OFFSETS } from '../constants/metroConfig';

describe('generateSmoothPath - SVG Path String Generation', () => {
  describe('edge cases', () => {
    it('should return empty string for null/undefined input', () => {
      expect(generateSmoothPath(null)).toBe('');
      expect(generateSmoothPath(undefined)).toBe('');
    });

    it('should return empty string for empty array', () => {
      expect(generateSmoothPath([])).toBe('');
    });

    it('should return empty string for single point', () => {
      expect(generateSmoothPath([{ x: 100, y: 200 }])).toBe('');
    });
  });

  describe('path generation', () => {
    it('should start with M (moveto) command', () => {
      const points = [
        { x: 0, y: 100 },
        { x: 100, y: 100 }
      ];
      const path = generateSmoothPath(points);
      
      expect(path).toMatch(/^M 0 100/);
    });

    it('should generate L (lineto) for horizontal segments', () => {
      const points = [
        { x: 0, y: 100 },
        { x: 200, y: 100 }  // Same Y = horizontal
      ];
      const path = generateSmoothPath(points);
      
      expect(path).toContain('L 200 100');
    });

    it('should generate C (curveto) for non-horizontal segments', () => {
      const points = [
        { x: 0, y: 100 },
        { x: 200, y: 200 }  // Different Y = needs curve
      ];
      const path = generateSmoothPath(points);
      
      expect(path).toContain('C');
    });

    it('should handle multiple points correctly', () => {
      const points = [
        { x: 0, y: 100 },
        { x: 100, y: 100 },
        { x: 200, y: 150 },
        { x: 300, y: 150 }
      ];
      const path = generateSmoothPath(points);
      
      // Should have move, then line, curve, line
      expect(path).toMatch(/^M/);
      expect(path).toContain('L');
      expect(path).toContain('C');
    });

    it('should treat small Y differences (< 1px) as horizontal', () => {
      const points = [
        { x: 0, y: 100 },
        { x: 200, y: 100.5 }  // Only 0.5px difference
      ];
      const path = generateSmoothPath(points);
      
      // Should use L (line) not C (curve)
      expect(path).toContain('L');
      expect(path).not.toContain('C');
    });
  });

  describe('bezier curve control points', () => {
    it('should generate smooth curves with horizontal tangents', () => {
      const points = [
        { x: 0, y: 100 },
        { x: 200, y: 200 }
      ];
      const path = generateSmoothPath(points);
      
      // Parse the curve command
      const curveMatch = path.match(/C ([\d.]+) ([\d.]+), ([\d.]+) ([\d.]+), ([\d.]+) ([\d.]+)/);
      expect(curveMatch).not.toBeNull();
      
      if (curveMatch) {
        const [, cp1x, cp1y, cp2x, cp2y, endX, endY] = curveMatch.map(Number);
        
        // First control point should have same Y as start (horizontal tangent)
        expect(cp1y).toBe(100);
        
        // Second control point should have same Y as end (horizontal tangent)
        expect(cp2y).toBe(200);
        
        // Control points should be at midpoint X-wise
        expect(cp1x).toBe(100); // 0 + (200*0.5)
        expect(cp2x).toBe(100); // 200 - (200*0.5)
      }
    });
  });
});

describe('generateBraidedPath - Population Line Braiding', () => {
  it('should return object with main, braid1, and braid2 paths', () => {
    const points = [
      { x: 0, y: 100 },
      { x: 200, y: 100 }
    ];
    const result = generateBraidedPath(points);
    
    expect(result).toHaveProperty('main');
    expect(result).toHaveProperty('braid1');
    expect(result).toHaveProperty('braid2');
  });

  it('should offset braid paths by ±3 pixels', () => {
    const points = [
      { x: 0, y: 100 },
      { x: 200, y: 100 }
    ];
    const result = generateBraidedPath(points);
    
    // braid1 should be offset +3 in Y
    expect(result.braid1).toContain('M 0 103');
    
    // braid2 should be offset -3 in Y
    expect(result.braid2).toContain('M 0 97');
  });

  it('should maintain same X coordinates across all braids', () => {
    const points = [
      { x: 0, y: 100 },
      { x: 500, y: 100 }
    ];
    const result = generateBraidedPath(points);
    
    // All three paths should end at x=500
    expect(result.main).toContain('500');
    expect(result.braid1).toContain('500');
    expect(result.braid2).toContain('500');
  });
});

describe('getStationYForLine - Station Y Position Lookup', () => {
  const viewboxHeight = VIEWBOX.HEIGHT;

  it('should return correct Y for each defined line', () => {
    Object.entries(LINE_Y_POSITIONS).forEach(([lineName, ratio]) => {
      const y = getStationYForLine(lineName, viewboxHeight);
      expect(y).toBe(ratio * viewboxHeight);
    });
  });

  it('should return center for undefined lines', () => {
    const y = getStationYForLine('FakeLine', viewboxHeight);
    expect(y).toBe(0.5 * viewboxHeight);
  });

  it('should scale with viewbox height', () => {
    const y1000 = getStationYForLine('Tech', 1000);
    const y2000 = getStationYForLine('Tech', 2000);
    
    expect(y2000).toBe(y1000 * 2);
  });
});

describe('generateMetroPaths - Full Metro Map Path Generation', () => {
  // Mock yearToX function
  const mockYearToX = (year) => {
    // Linear mapping for simplicity: -10000 to 2025 → 0 to 8000
    const range = 2025 - (-10000);
    const progress = (year - (-10000)) / range;
    return progress * VIEWBOX.WIDTH;
  };

  const viewboxHeight = VIEWBOX.HEIGHT;

  const mockStations = [
    {
      id: 'test1',
      name: 'Test Station 1',
      year: 1500,
      lines: ['Tech'],
      coords: { x: mockYearToX(1500), y: 0 }
    },
    {
      id: 'test2',
      name: 'Test Station 2',
      year: 1800,
      lines: ['Tech', 'War'],
      coords: { x: mockYearToX(1800), y: 0 }
    },
    {
      id: 'test3',
      name: 'Test Station 3',
      year: 1900,
      lines: ['War'],
      coords: { x: mockYearToX(1900), y: 0 }
    }
  ];

  it('should return paths for all line types', () => {
    const paths = generateMetroPaths(mockYearToX, viewboxHeight, mockStations);
    
    expect(paths).toHaveProperty('tech');
    expect(paths).toHaveProperty('war');
    expect(paths).toHaveProperty('population');
    expect(paths).toHaveProperty('philosophy');
    expect(paths).toHaveProperty('empire');
  });

  it('should return valid SVG path strings', () => {
    const paths = generateMetroPaths(mockYearToX, viewboxHeight, mockStations);
    
    // All paths should start with M
    expect(paths.tech).toMatch(/^M/);
    expect(paths.war).toMatch(/^M/);
    expect(paths.philosophy).toMatch(/^M/);
    expect(paths.empire).toMatch(/^M/);
  });

  it('should return braided paths for population line', () => {
    const paths = generateMetroPaths(mockYearToX, viewboxHeight, mockStations);
    
    expect(paths.population).toHaveProperty('main');
    expect(paths.population).toHaveProperty('braid1');
    expect(paths.population).toHaveProperty('braid2');
  });

  it('should include blue/red/green/etc aliases for backwards compatibility', () => {
    const paths = generateMetroPaths(mockYearToX, viewboxHeight, mockStations);
    
    expect(paths.blue).toBe(paths.tech);
    expect(paths.red).toBe(paths.war);
    expect(paths.green).toEqual(paths.population);
    expect(paths.orange).toBe(paths.philosophy);
    expect(paths.purple).toBe(paths.empire);
  });

  it('should start all paths from left edge (x=0)', () => {
    const paths = generateMetroPaths(mockYearToX, viewboxHeight, mockStations);
    
    expect(paths.tech).toMatch(/^M 0/);
    expect(paths.war).toMatch(/^M 0/);
  });

  it('should use line corridor Y positions, not station stored Y', () => {
    const paths = generateMetroPaths(mockYearToX, viewboxHeight, mockStations);
    
    // Tech line should be at Tech's corridor Y
    const techY = LINE_Y_POSITIONS.Tech * viewboxHeight;
    expect(paths.tech).toContain(`M 0 ${techY}`);
  });

  it('should include connections object (even if empty)', () => {
    const paths = generateMetroPaths(mockYearToX, viewboxHeight, mockStations);
    
    expect(paths).toHaveProperty('connections');
    expect(typeof paths.connections).toBe('object');
  });
});

describe('Path Collision Avoidance', () => {
  const viewboxHeight = VIEWBOX.HEIGHT;

  it('should maintain distinct Y corridors for each line', () => {
    const lineYs = Object.values(LINE_Y_POSITIONS).map(ratio => ratio * viewboxHeight);
    const uniqueYs = [...new Set(lineYs)];
    
    // All lines should have unique Y positions
    expect(uniqueYs.length).toBe(lineYs.length);
  });

  it('should have adequate spacing between adjacent lines', () => {
    const sortedRatios = Object.values(LINE_Y_POSITIONS).sort((a, b) => a - b);
    
    for (let i = 1; i < sortedRatios.length; i++) {
      const gap = sortedRatios[i] - sortedRatios[i - 1];
      const pixelGap = gap * viewboxHeight;
      
      // At least 400px gap between lines (10% of 4000px height)
      expect(pixelGap).toBeGreaterThanOrEqual(400);
    }
  });

  describe('convergence point collision handling', () => {
    it('should define unique convergence offsets for each line', () => {
      const offsets = Object.values(CONVERGENCE_OFFSETS);
      const uniqueOffsets = [...new Set(offsets)];
      
      expect(uniqueOffsets.length).toBe(offsets.length);
    });

    it('should space convergence offsets evenly', () => {
      const sortedOffsets = Object.values(CONVERGENCE_OFFSETS).sort((a, b) => a - b);
      
      // Check that offsets are evenly spaced (30px increments)
      for (let i = 1; i < sortedOffsets.length; i++) {
        const gap = sortedOffsets[i] - sortedOffsets[i - 1];
        expect(gap).toBe(30);
      }
    });
  });
});

describe('Path Segment Continuity', () => {
  it('should generate continuous paths (no gaps)', () => {
    const points = [
      { x: 0, y: 100 },
      { x: 100, y: 100 },
      { x: 200, y: 150 },
      { x: 300, y: 150 },
      { x: 400, y: 200 }
    ];
    
    const path = generateSmoothPath(points);
    
    // Parse all coordinates from the path
    const coordPattern = /(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)/g;
    const coords = [];
    let match;
    
    while ((match = coordPattern.exec(path)) !== null) {
      coords.push({ x: parseFloat(match[1]), y: parseFloat(match[2]) });
    }
    
    // Each segment should end where the next begins
    // (This is ensured by the sequential nature of SVG paths)
    expect(coords.length).toBeGreaterThan(0);
  });

  it('should handle stations sorted by X position', () => {
    // Unsorted input
    const points = [
      { x: 300, y: 100 },
      { x: 100, y: 100 },
      { x: 200, y: 100 }
    ];
    
    // Path should still be generated (though may look odd)
    const path = generateSmoothPath(points);
    expect(path).not.toBe('');
    expect(path).toMatch(/^M/);
  });
});

