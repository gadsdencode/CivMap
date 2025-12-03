/**
 * Unit Tests for Coordinate System Utilities
 * Tests year-to-pixel conversion, viewbox constraints, and zoom calculations
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  yearToX,
  getLineY,
  createStationCoord,
  getConvergencePoint,
  constrainViewBox,
  centerViewBoxOn,
  zoomToPoint
} from './coordinates';
import { VIEWBOX, LINE_Y_POSITIONS, CONVERGENCE } from '../constants/metroConfig';

describe('yearToX - Piecewise Linear Time-to-Pixel Conversion', () => {
  describe('boundary conditions', () => {
    it('should return 0 for years before timeline start (-10000)', () => {
      expect(yearToX(-15000)).toBe(0);
      expect(yearToX(-11000)).toBe(0);
    });

    it('should return VIEWBOX.WIDTH for years after timeline end (2025)', () => {
      expect(yearToX(2100)).toBe(VIEWBOX.WIDTH);
      expect(yearToX(3000)).toBe(VIEWBOX.WIDTH);
    });

    it('should return 0 for the start year (-10000)', () => {
      expect(yearToX(-10000)).toBe(0);
    });

    it('should return VIEWBOX.WIDTH for the end year (2025)', () => {
      expect(yearToX(2025)).toBe(VIEWBOX.WIDTH);
    });
  });

  describe('piecewise interpolation', () => {
    it('should map years within range to valid X coordinates', () => {
      const x1500 = yearToX(1500);
      // 1500 is at position 0.50 according to TIME_ANCHORS
      expect(x1500).toBe(VIEWBOX.WIDTH * 0.5);
    });

    it('should maintain monotonic increasing order (later years = larger X)', () => {
      const years = [-5000, -1000, 0, 500, 1000, 1500, 1800, 1900, 2000, 2025];
      const xValues = years.map(yearToX);
      
      for (let i = 1; i < xValues.length; i++) {
        expect(xValues[i]).toBeGreaterThanOrEqual(xValues[i - 1]);
      }
    });

    it('should give proportional spacing within segments', () => {
      // Between anchors at year 0 (pos 0.30) and year 500 (pos 0.38)
      // Year 250 should be roughly at position 0.34
      const x250 = yearToX(250);
      const x0 = yearToX(0);
      const x500 = yearToX(500);
      
      // Should be between the two anchor points
      expect(x250).toBeGreaterThan(x0);
      expect(x250).toBeLessThan(x500);
    });

    it('should compress ancient history (more years per pixel)', () => {
      // Ancient period: -10000 to -1000 spans 9000 years but only 20% of width
      const ancientStart = yearToX(-10000);
      const ancientEnd = yearToX(-1000);
      const ancientWidth = ancientEnd - ancientStart;
      
      // Contemporary: 1900 to 2025 spans only 125 years but gets ~26% of width
      const modernStart = yearToX(1900);
      const modernEnd = yearToX(2025);
      const modernWidth = modernEnd - modernStart;
      
      // Ancient period (9000 years) should have less width per year than modern (125 years)
      const ancientYearsPerPixel = 9000 / ancientWidth;
      const modernYearsPerPixel = 125 / modernWidth;
      
      expect(ancientYearsPerPixel).toBeGreaterThan(modernYearsPerPixel);
    });
  });
});

describe('getLineY - Line Corridor Positioning', () => {
  it('should return correct Y positions for all defined lines', () => {
    Object.entries(LINE_Y_POSITIONS).forEach(([lineName, expectedRatio]) => {
      const y = getLineY(lineName);
      expect(y).toBe(expectedRatio * VIEWBOX.HEIGHT);
    });
  });

  it('should return center (0.5) for undefined lines', () => {
    const y = getLineY('UnknownLine');
    expect(y).toBe(0.5 * VIEWBOX.HEIGHT);
  });

  it('should position Tech line at the top', () => {
    const techY = getLineY('Tech');
    const warY = getLineY('War');
    const empireY = getLineY('Empire');
    
    expect(techY).toBeLessThan(warY);
    expect(warY).toBeLessThan(empireY);
  });
});

describe('createStationCoord - Station Coordinate Factory', () => {
  it('should create coordinate objects with x and y properties', () => {
    const coord = createStationCoord(1776, 'War');
    
    expect(coord).toHaveProperty('x');
    expect(coord).toHaveProperty('y');
    expect(typeof coord.x).toBe('number');
    expect(typeof coord.y).toBe('number');
  });

  it('should use yearToX for X coordinate', () => {
    const coord = createStationCoord(1500, 'Tech');
    expect(coord.x).toBe(yearToX(1500));
  });

  it('should use getLineY for Y coordinate', () => {
    const coord = createStationCoord(1500, 'Tech');
    expect(coord.y).toBe(getLineY('Tech'));
  });
});

describe('getConvergencePoint - Singularity Point Calculation', () => {
  it('should return the convergence coordinates', () => {
    const point = getConvergencePoint();
    
    expect(point.x).toBe(yearToX(CONVERGENCE.year));
    expect(point.y).toBe(CONVERGENCE.yPosition * VIEWBOX.HEIGHT);
  });

  it('should return a point at the right edge of the timeline', () => {
    const point = getConvergencePoint();
    expect(point.x).toBe(VIEWBOX.WIDTH);
  });
});

describe('constrainViewBox - ViewBox Boundary Enforcement', () => {
  it('should not modify a valid centered viewBox', () => {
    const viewBox = {
      x: 1000,
      y: 500,
      width: VIEWBOX.WIDTH * 0.5,
      height: VIEWBOX.HEIGHT * 0.5
    };
    
    const constrained = constrainViewBox(viewBox);
    
    expect(constrained.x).toBe(viewBox.x);
    expect(constrained.y).toBe(viewBox.y);
    expect(constrained.width).toBe(viewBox.width);
    expect(constrained.height).toBe(viewBox.height);
  });

  it('should clamp x to prevent viewing beyond left edge', () => {
    const viewBox = { x: -500, y: 500, width: 2000, height: 1000 };
    const constrained = constrainViewBox(viewBox);
    
    expect(constrained.x).toBe(0);
  });

  it('should clamp y to prevent viewing beyond top edge', () => {
    const viewBox = { x: 500, y: -500, width: 2000, height: 1000 };
    const constrained = constrainViewBox(viewBox);
    
    expect(constrained.y).toBe(0);
  });

  it('should clamp x to prevent viewing beyond right edge', () => {
    const viewBox = { 
      x: VIEWBOX.WIDTH, 
      y: 500, 
      width: 2000, 
      height: 1000 
    };
    const constrained = constrainViewBox(viewBox);
    
    expect(constrained.x).toBeLessThanOrEqual(VIEWBOX.WIDTH - constrained.width);
  });

  it('should clamp width to minimum zoom level', () => {
    const viewBox = { 
      x: 0, 
      y: 0, 
      width: 10, // Very small = zoomed way in
      height: 5 
    };
    const constrained = constrainViewBox(viewBox);
    
    expect(constrained.width).toBeGreaterThanOrEqual(VIEWBOX.WIDTH * VIEWBOX.MIN_ZOOM);
  });

  it('should clamp width to maximum zoom level', () => {
    const viewBox = { 
      x: 0, 
      y: 0, 
      width: VIEWBOX.WIDTH * 50, // Huge = zoomed way out
      height: VIEWBOX.HEIGHT * 50 
    };
    const constrained = constrainViewBox(viewBox);
    
    expect(constrained.width).toBeLessThanOrEqual(VIEWBOX.WIDTH * VIEWBOX.MAX_ZOOM);
  });
});

describe('centerViewBoxOn - Center on Point', () => {
  it('should center the viewBox on the given point', () => {
    const currentViewBox = { x: 0, y: 0, width: 1000, height: 500 };
    const point = { x: 2000, y: 1000 };
    
    const centered = centerViewBoxOn(currentViewBox, point);
    
    // Point should be at center of new viewBox
    const centerX = centered.x + centered.width / 2;
    const centerY = centered.y + centered.height / 2;
    
    // Allow for constraint adjustments
    expect(centerX).toBeCloseTo(point.x, -1);
    expect(centerY).toBeCloseTo(point.y, -1);
  });

  it('should maintain the same dimensions', () => {
    const currentViewBox = { x: 0, y: 0, width: 1000, height: 500 };
    const point = { x: 2000, y: 1000 };
    
    const centered = centerViewBoxOn(currentViewBox, point);
    
    expect(centered.width).toBe(currentViewBox.width);
    expect(centered.height).toBe(currentViewBox.height);
  });

  it('should apply constraints after centering', () => {
    const currentViewBox = { x: 0, y: 0, width: 1000, height: 500 };
    const point = { x: -500, y: -500 }; // Would go off-canvas
    
    const centered = centerViewBoxOn(currentViewBox, point);
    
    // Should be constrained to canvas bounds
    expect(centered.x).toBeGreaterThanOrEqual(0);
    expect(centered.y).toBeGreaterThanOrEqual(0);
  });
});

describe('zoomToPoint - Zoom Centered on Point', () => {
  const baseViewBox = { 
    x: 1000, 
    y: 500, 
    width: 2000, 
    height: 1000 
  };
  const containerSize = { width: 1920, height: 1080 };

  it('should zoom in when factor < 1', () => {
    const centerPoint = { x: 2000, y: 1000 };
    const zoomed = zoomToPoint(baseViewBox, 0.5, centerPoint, containerSize);
    
    expect(zoomed.width).toBeLessThan(baseViewBox.width);
    expect(zoomed.height).toBeLessThan(baseViewBox.height);
  });

  it('should zoom out when factor > 1', () => {
    const centerPoint = { x: 2000, y: 1000 };
    const zoomed = zoomToPoint(baseViewBox, 2, centerPoint, containerSize);
    
    // May be clamped by max zoom
    expect(zoomed.width).toBeGreaterThanOrEqual(baseViewBox.width);
  });

  it('should keep the center point stable during zoom', () => {
    const centerPoint = { x: 2000, y: 1000 };
    
    // Before zoom: where is centerPoint relative to viewBox?
    const relX = (centerPoint.x - baseViewBox.x) / baseViewBox.width;
    const relY = (centerPoint.y - baseViewBox.y) / baseViewBox.height;
    
    const zoomed = zoomToPoint(baseViewBox, 0.5, centerPoint, containerSize);
    
    // After zoom: centerPoint should still be at similar relative position
    const newRelX = (centerPoint.x - zoomed.x) / zoomed.width;
    const newRelY = (centerPoint.y - zoomed.y) / zoomed.height;
    
    expect(newRelX).toBeCloseTo(relX, 1);
    expect(newRelY).toBeCloseTo(relY, 1);
  });

  it('should apply constraints after zoom', () => {
    const centerPoint = { x: 100, y: 100 };
    // Zoom way in on corner
    const zoomed = zoomToPoint(baseViewBox, 0.1, centerPoint, containerSize);
    
    expect(zoomed.x).toBeGreaterThanOrEqual(0);
    expect(zoomed.y).toBeGreaterThanOrEqual(0);
    expect(zoomed.width).toBeGreaterThanOrEqual(VIEWBOX.WIDTH * VIEWBOX.MIN_ZOOM);
  });
});

