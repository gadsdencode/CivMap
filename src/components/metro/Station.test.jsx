/**
 * Component Tests for Station.jsx
 * Tests rendering, interactions, accessibility, and LOD behavior
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Station from './Station';

// Mock station data factory
const createMockStation = (overrides = {}) => ({
  id: 'test-station',
  name: 'Test Station',
  year: 1500,
  yearLabel: '1500 CE',
  lines: ['Tech'],
  color: '#22d3ee',
  significance: 'normal',
  coords: { x: 1000, y: 500 },
  ...overrides
});

// Default props factory
const createDefaultProps = (overrides = {}) => ({
  station: createMockStation(),
  zoomLevel: 1,
  isHovered: false,
  isSelected: false,
  isInJourney: false,
  isSearchMatch: false,
  showLabel: false,
  onHover: vi.fn(),
  onSelect: vi.fn(),
  visibleLines: { tech: true, war: true, population: true, philosophy: true, empire: true },
  ...overrides
});

describe('Station Component', () => {
  describe('rendering', () => {
    it('should render the station marker', () => {
      const props = createDefaultProps();
      render(
        <svg>
          <Station {...props} />
        </svg>
      );
      
      // Station should have role="button"
      const station = screen.getByRole('button');
      expect(station).toBeInTheDocument();
    });

    it('should render with correct accessibility label', () => {
      const props = createDefaultProps({
        station: createMockStation({ 
          name: 'Industrial Revolution',
          yearLabel: '1760 CE',
          lines: ['Tech', 'War']
        })
      });
      
      render(
        <svg>
          <Station {...props} />
        </svg>
      );
      
      const station = screen.getByRole('button');
      expect(station).toHaveAttribute('aria-label');
      expect(station.getAttribute('aria-label')).toContain('Industrial Revolution');
      expect(station.getAttribute('aria-label')).toContain('1760 CE');
    });

    it('should be keyboard focusable', () => {
      const props = createDefaultProps();
      render(
        <svg>
          <Station {...props} />
        </svg>
      );
      
      const station = screen.getByRole('button');
      // tabIndex can be returned as number or string depending on DOM implementation
      expect(station.tabIndex).toBe(0);
    });
  });

  describe('visibility and filtering', () => {
    it('should not render when all station lines are hidden', () => {
      const props = createDefaultProps({
        station: createMockStation({ lines: ['Tech'] }),
        visibleLines: { tech: false, war: true, population: true }
      });
      
      const { container } = render(
        <svg>
          <Station {...props} />
        </svg>
      );
      
      // Station group should not be in the DOM
      expect(container.querySelector('g.station')).toBeNull();
    });

    it('should render when at least one line is visible', () => {
      const props = createDefaultProps({
        station: createMockStation({ lines: ['Tech', 'War'] }),
        visibleLines: { tech: false, war: true, population: true }
      });
      
      render(
        <svg>
          <Station {...props} />
        </svg>
      );
      
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should render if search match even when lines hidden', () => {
      const props = createDefaultProps({
        station: createMockStation({ lines: ['Tech'] }),
        visibleLines: { tech: false },
        isSearchMatch: true
      });
      
      render(
        <svg>
          <Station {...props} />
        </svg>
      );
      
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });

  describe('Level of Detail (LOD)', () => {
    it('should not render minor stations at very low zoom (< 0.2)', () => {
      const props = createDefaultProps({
        station: createMockStation({ significance: 'minor' }),
        zoomLevel: 0.1
      });
      
      const { container } = render(
        <svg>
          <Station {...props} />
        </svg>
      );
      
      expect(container.querySelector('g.station')).toBeNull();
    });

    it('should render hub stations even at low zoom', () => {
      const props = createDefaultProps({
        station: createMockStation({ significance: 'hub' }),
        zoomLevel: 0.1
      });
      
      render(
        <svg>
          <Station {...props} />
        </svg>
      );
      
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should render crisis stations even at low zoom', () => {
      const props = createDefaultProps({
        station: createMockStation({ significance: 'crisis' }),
        zoomLevel: 0.1
      });
      
      render(
        <svg>
          <Station {...props} />
        </svg>
      );
      
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should render journey stations even at low zoom', () => {
      const props = createDefaultProps({
        station: createMockStation({ significance: 'normal' }),
        zoomLevel: 0.1,
        isInJourney: true
      });
      
      render(
        <svg>
          <Station {...props} />
        </svg>
      );
      
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });

  describe('interactions', () => {
    it('should call onHover with station id on mouse enter', async () => {
      const onHover = vi.fn();
      const props = createDefaultProps({ 
        station: createMockStation({ id: 'hover-test' }),
        onHover 
      });
      
      render(
        <svg>
          <Station {...props} />
        </svg>
      );
      
      const station = screen.getByRole('button');
      fireEvent.mouseEnter(station);
      
      expect(onHover).toHaveBeenCalledWith('hover-test');
    });

    it('should call onHover with null on mouse leave', () => {
      const onHover = vi.fn();
      const props = createDefaultProps({ onHover });
      
      render(
        <svg>
          <Station {...props} />
        </svg>
      );
      
      const station = screen.getByRole('button');
      fireEvent.mouseLeave(station);
      
      expect(onHover).toHaveBeenCalledWith(null);
    });

    it('should call onSelect with station on click', () => {
      const onSelect = vi.fn();
      const mockStation = createMockStation();
      const props = createDefaultProps({ 
        station: mockStation,
        onSelect 
      });
      
      render(
        <svg>
          <Station {...props} />
        </svg>
      );
      
      const station = screen.getByRole('button');
      fireEvent.click(station);
      
      expect(onSelect).toHaveBeenCalledWith(mockStation);
    });

    it('should call onSelect on Enter key press', () => {
      const onSelect = vi.fn();
      const mockStation = createMockStation();
      const props = createDefaultProps({ 
        station: mockStation,
        onSelect 
      });
      
      render(
        <svg>
          <Station {...props} />
        </svg>
      );
      
      const station = screen.getByRole('button');
      fireEvent.keyDown(station, { key: 'Enter' });
      
      expect(onSelect).toHaveBeenCalledWith(mockStation);
    });

    it('should call onSelect on Space key press', () => {
      const onSelect = vi.fn();
      const mockStation = createMockStation();
      const props = createDefaultProps({ 
        station: mockStation,
        onSelect 
      });
      
      render(
        <svg>
          <Station {...props} />
        </svg>
      );
      
      const station = screen.getByRole('button');
      fireEvent.keyDown(station, { key: ' ' });
      
      expect(onSelect).toHaveBeenCalledWith(mockStation);
    });

    it('should stop click event propagation', () => {
      const onSelect = vi.fn();
      const parentClick = vi.fn();
      const props = createDefaultProps({ onSelect });
      
      render(
        <svg onClick={parentClick}>
          <Station {...props} />
        </svg>
      );
      
      const station = screen.getByRole('button');
      fireEvent.click(station);
      
      expect(onSelect).toHaveBeenCalled();
      expect(parentClick).not.toHaveBeenCalled();
    });
  });

  describe('visual states', () => {
    it('should show label when hovered', () => {
      const props = createDefaultProps({
        station: createMockStation({ name: 'Hovered Station' }),
        isHovered: true
      });
      
      render(
        <svg>
          <Station {...props} />
        </svg>
      );
      
      expect(screen.getByText('Hovered Station')).toBeInTheDocument();
    });

    it('should show label when selected', () => {
      const props = createDefaultProps({
        station: createMockStation({ name: 'Selected Station' }),
        isSelected: true
      });
      
      render(
        <svg>
          <Station {...props} />
        </svg>
      );
      
      expect(screen.getByText('Selected Station')).toBeInTheDocument();
    });

    it('should show label for hub stations at detail zoom', () => {
      const props = createDefaultProps({
        station: createMockStation({ name: 'Hub Station', significance: 'hub' }),
        zoomLevel: 0.8
      });
      
      render(
        <svg>
          <Station {...props} />
        </svg>
      );
      
      expect(screen.getByText('Hub Station')).toBeInTheDocument();
    });

    it('should show pulsing ring when active', () => {
      const props = createDefaultProps({
        isHovered: true
      });
      
      const { container } = render(
        <svg>
          <Station {...props} />
        </svg>
      );
      
      // Active ring should have animate-pulse class
      const pulsingRing = container.querySelector('.animate-pulse');
      expect(pulsingRing).toBeInTheDocument();
    });

    it('should truncate long station names', () => {
      const longName = 'This is a very long station name that exceeds the character limit';
      const props = createDefaultProps({
        station: createMockStation({ name: longName }),
        isHovered: true
      });
      
      render(
        <svg>
          <Station {...props} />
        </svg>
      );
      
      // Should be truncated with ellipsis
      const label = screen.getByText(/This is a very long station/);
      expect(label.textContent).toContain('…');
      expect(label.textContent.length).toBeLessThanOrEqual(30); // 28 chars + ellipsis
    });

    it('should apply crisis styling for crisis stations', () => {
      const props = createDefaultProps({
        station: createMockStation({ significance: 'crisis' })
      });
      
      const { container } = render(
        <svg>
          <Station {...props} />
        </svg>
      );
      
      const stationGroup = container.querySelector('g.station');
      expect(stationGroup).toHaveClass('crisis-active');
    });
  });

  describe('significance scaling', () => {
    it('should render larger radius for hub stations', () => {
      const hubProps = createDefaultProps({
        station: createMockStation({ significance: 'hub' })
      });
      const normalProps = createDefaultProps({
        station: createMockStation({ significance: 'normal' })
      });
      
      const { container: hubContainer } = render(
        <svg data-testid="hub">
          <Station {...hubProps} />
        </svg>
      );
      
      const { container: normalContainer } = render(
        <svg data-testid="normal">
          <Station {...normalProps} />
        </svg>
      );
      
      // Hub station's main circle should have larger radius
      const hubCircle = hubContainer.querySelector('circle:not(.animate-pulse)');
      const normalCircle = normalContainer.querySelector('circle:not(.animate-pulse)');
      
      const hubRadius = parseFloat(hubCircle.getAttribute('r'));
      const normalRadius = parseFloat(normalCircle.getAttribute('r'));
      
      expect(hubRadius).toBeGreaterThan(normalRadius);
    });

    it('should render smaller radius for minor stations', () => {
      const minorProps = createDefaultProps({
        station: createMockStation({ significance: 'minor' }),
        zoomLevel: 0.8 // High enough to render minor stations
      });
      const normalProps = createDefaultProps({
        station: createMockStation({ significance: 'normal' }),
        zoomLevel: 0.8
      });
      
      const { container: minorContainer } = render(
        <svg data-testid="minor">
          <Station {...minorProps} />
        </svg>
      );
      
      const { container: normalContainer } = render(
        <svg data-testid="normal">
          <Station {...normalProps} />
        </svg>
      );
      
      const minorCircle = minorContainer.querySelector('circle:not(.animate-pulse)');
      const normalCircle = normalContainer.querySelector('circle:not(.animate-pulse)');
      
      const minorRadius = parseFloat(minorCircle.getAttribute('r'));
      const normalRadius = parseFloat(normalCircle.getAttribute('r'));
      
      expect(minorRadius).toBeLessThan(normalRadius);
    });
  });

  describe('year label visibility', () => {
    it('should show year label when active', () => {
      const props = createDefaultProps({
        station: createMockStation({ yearLabel: '1776 CE' }),
        isHovered: true
      });
      
      render(
        <svg>
          <Station {...props} />
        </svg>
      );
      
      expect(screen.getByText('1776 CE')).toBeInTheDocument();
    });

    it('should show year label at high zoom levels (> 1.2)', () => {
      const props = createDefaultProps({
        station: createMockStation({ yearLabel: '1945 CE', significance: 'hub' }),
        zoomLevel: 1.5
      });
      
      render(
        <svg>
          <Station {...props} />
        </svg>
      );
      
      expect(screen.getByText('1945 CE')).toBeInTheDocument();
    });
  });

  describe('opacity states', () => {
    it('should have full opacity when line is visible', () => {
      const props = createDefaultProps({
        station: createMockStation({ lines: ['Tech'] }),
        visibleLines: { tech: true }
      });
      
      const { container } = render(
        <svg>
          <Station {...props} />
        </svg>
      );
      
      const stationGroup = container.querySelector('g.station');
      expect(stationGroup.style.opacity).toBe('1');
    });
  });
});

