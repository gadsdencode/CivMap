/**
 * Station Component
 * Performance-First Implementation with LOD (Level of Detail)
 * 
 * KEY UPGRADES:
 * - LOD system: Stations degrade/disappear based on zoom level
 * - Simplified rendering at low zoom for 60fps performance
 * - CSS-based crisis animations (replaces heavy SVG filters)
 * 
 * DESIGN PRINCIPLES:
 * - Clear visual hierarchy based on station significance
 * - Smooth, professional transitions
 * - Accessible interaction states
 * - Clean, modern metro map aesthetics
 */

import React, { memo, useCallback } from 'react';
import { STATION_SIZE, LINE_COLORS } from '../../constants/metroConfig';

/**
 * Get scale factor based on station significance
 */
function getSignificanceScale(significance) {
  switch (significance) {
    case 'hub':
    case 'current':
      return STATION_SIZE.hubScale || 1.2;
    case 'crisis':
      return STATION_SIZE.crisisScale || 1.1;
    case 'minor':
      return STATION_SIZE.minorScale || 0.8;
    default:
      return 1;
  }
}

const Station = memo(function Station({
  station,
  zoomLevel = 1, // New: passed from CivMap parent based on viewBox
  isHovered,
  isSelected,
  isInJourney,
  isSearchMatch,
  showLabel,
  onHover,
  onSelect,
  visibleLines
}) {
  // Determine if station should be visible based on line filters
  const isVisible = station.lines.some(line => {
    const lineKey = line.toLowerCase();
    return visibleLines[lineKey] !== false;
  });

  if (!isVisible && !isSearchMatch) return null;

  const { x, y } = station.coords;
  const primaryColor = station.color;

  // 1. Level of Detail (LOD) Logic
  // At low zoom (< 0.2), only render major Hubs or Crisis points
  // At medium zoom (< 0.6), hide labels for minor stations
  const isTooSmall = zoomLevel < 0.2;
  const isDetailView = zoomLevel > 0.6;
  const shouldRender = !isTooSmall || station.significance === 'hub' || station.significance === 'crisis' || isInJourney;
  
  if (!shouldRender) return null;

  // 2. Interaction State
  const isActive = isHovered || isSelected || isInJourney;
  const shouldShowLabel = isActive || (isDetailView && station.significance !== 'minor') || station.significance === 'hub' || showLabel || isSearchMatch;

  // 3. Significance Styling
  const getRadius = () => {
    if (isActive) return STATION_SIZE.selectedRadius || 20;
    if (isTooSmall) return (STATION_SIZE.baseRadius || 15) * 0.5; // Tiny dot for overview
    const significanceScale = getSignificanceScale(station.significance);
    return (STATION_SIZE.baseRadius || 15) * significanceScale;
  };
  const radius = getRadius();

  // Handlers
  const handleInteract = useCallback((e) => {
    e.stopPropagation();
    onSelect?.(station);
  }, [onSelect, station]);

  const handleMouseEnter = useCallback(() => onHover?.(station.id), [station.id, onHover]);
  const handleMouseLeave = useCallback(() => onHover?.(null), [onHover]);

  return (
    <g
      className={`station ${station.significance === 'crisis' ? 'crisis-active' : ''}`}
      transform={`translate(${x}, ${y})`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleInteract}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect?.(station);
        }
      }}
      onMouseDown={(e) => e.stopPropagation()}
      role="button"
      tabIndex={0}
      aria-label={`${station.name}, ${station.yearLabel}. ${station.lines.join(', ')} line${station.lines.length > 1 ? 's' : ''}`}
      style={{ 
        cursor: 'pointer',
        opacity: isVisible ? 1 : 0.35,
        transition: 'opacity 250ms ease'
      }}
    >
      {/* 4. Optimized Rendering: Simplified shapes based on importance */}
      
      {/* Journey/Active Ring (Only render if active) */}
      {isActive && (
        <circle
          r={radius * 1.8}
          fill="none"
          stroke={primaryColor}
          strokeWidth={2}
          strokeOpacity={0.5}
          className="animate-pulse"
        />
      )}

      {/* Main Marker */}
      <circle
        r={radius}
        fill="#0a0a0a"
        stroke={primaryColor}
        strokeWidth={isActive ? 6 : 3}
        className="transition-all duration-300 ease-out"
      />

      {/* Inner Dot (Only render if zoomed in or active) */}
      {(isDetailView || isActive) && (
        <circle
          r={isActive ? 8 : 4}
          fill={primaryColor}
          className="transition-all duration-300"
        />
      )}

      {/* 5. Semantic Labeling: Strictly controlled text rendering */}
      {shouldShowLabel && (
        <g className="pointer-events-none select-none">
          <text
            y={-radius - 12}
            textAnchor="middle"
            fill="white"
            fontSize={isActive ? 28 : 24}
            fontWeight="700"
            className="station-label font-mono drop-shadow-md"
            style={{ 
              opacity: isActive ? 1 : 0.8,
              transition: 'opacity 0.2s' 
            }}
          >
            {station.name.length > 28 ? `${station.name.substring(0, 28)}…` : station.name}
          </text>
          
          {/* Year Label - Only show if very zoomed in or active */}
          {(isActive || zoomLevel > 1.2) && (
            <text
              y={radius + 28}
              textAnchor="middle"
              fill={primaryColor}
              fontSize={20}
              fontWeight="600"
              className="font-mono"
            >
              {station.yearLabel}
            </text>
          )}
        </g>
      )}

      {/* Hub indicator for major stations */}
      {(station.significance === 'hub' || station.significance === 'current') && (isDetailView || isActive) && (
        <circle
          r={5}
          fill="#ffffff"
          opacity={0.9}
        />
      )}
    </g>
  );
});

export default Station;
