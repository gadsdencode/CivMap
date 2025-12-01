/**
 * Station Component
 * Individual station marker with refined hover states, visual feedback, and accessibility
 * 
 * DESIGN PRINCIPLES:
 * - Clear visual hierarchy based on station significance
 * - Smooth, professional transitions
 * - Accessible interaction states
 * - Clean, modern metro map aesthetics
 */

import React, { memo, useCallback, useMemo } from 'react';
import { STATION_SIZE, LINE_COLORS, EFFECTS } from '../../constants/metroConfig';

/**
 * Get scale factor based on station significance
 */
function getSignificanceScale(significance) {
  switch (significance) {
    case 'hub':
    case 'current':
      return STATION_SIZE.hubScale;
    case 'crisis':
      return STATION_SIZE.crisisScale;
    case 'minor':
      return STATION_SIZE.minorScale;
    default:
      return 1;
  }
}

const Station = memo(function Station({
  station,
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
  const isVisible = useMemo(() => {
    return station.lines.some(line => {
      const lineKey = line.toLowerCase();
      return visibleLines[lineKey] !== false;
    });
  }, [station.lines, visibleLines]);

  if (!isVisible && !isSearchMatch) return null;

  const handleMouseEnter = useCallback(() => onHover?.(station.id), [station.id, onHover]);
  const handleMouseLeave = useCallback(() => onHover?.(null), [onHover]);
  const handleClick = useCallback((e) => {
    e.stopPropagation();
    onSelect?.(station);
  }, [station, onSelect]);

  // Calculate visual states
  const isActive = isHovered || isSelected || isInJourney;
  const significanceScale = getSignificanceScale(station.significance);
  
  const baseScale = isActive
    ? STATION_SIZE.hoverScale
    : isSearchMatch 
      ? STATION_SIZE.searchMatchScale 
      : significanceScale;
  
  const radius = isActive
    ? STATION_SIZE.selectedRadius
    : STATION_SIZE.baseRadius * significanceScale;

  const shouldShowLabel = showLabel || isActive || isSearchMatch;

  // Memoize expensive calculations
  const { x, y } = station.coords;
  const primaryColor = station.color;
  
  // Calculate stroke width based on state
  const strokeWidth = isActive ? 10 : 8;
  const innerStrokeWidth = isActive ? 4 : 3;

  return (
    <g
      className="station"
      role="button"
      tabIndex={0}
      aria-label={`${station.name}, ${station.yearLabel}. ${station.lines.join(', ')} line${station.lines.length > 1 ? 's' : ''}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect?.(station);
        }
      }}
      onMouseDown={(e) => e.stopPropagation()}
      transform={`translate(${x}, ${y}) scale(${baseScale}) translate(${-x}, ${-y})`}
      style={{
        cursor: 'pointer',
        opacity: isVisible ? 1 : 0.35,
        transition: 'opacity 250ms ease'
      }}
    >
      {/* Journey highlight ring - animated dashed circle */}
      {isInJourney && (
        <circle
          cx={x}
          cy={y}
          r={STATION_SIZE.journeyRingRadius}
          fill="none"
          stroke="#22d3ee"
          strokeWidth={6}
          strokeDasharray="16,8"
          opacity={0.7}
          style={{
            animation: 'spin 20s linear infinite'
          }}
        />
      )}

      {/* Search match highlight - soft glow ring */}
      {isSearchMatch && !isSelected && (
        <circle
          cx={x}
          cy={y}
          r={STATION_SIZE.glowRadius}
          fill="none"
          stroke="#fbbf24"
          strokeWidth={4}
          opacity={0.5}
          style={{
            animation: 'pulse 2s ease-in-out infinite'
          }}
        />
      )}

      {/* Line connection platforms - subtle ellipses showing which lines connect */}
      {station.lines.length > 1 && station.lines.map((line, idx) => {
        const lineColor = LINE_COLORS[line] || primaryColor;
        const rotation = (idx * 180) / station.lines.length;
        return (
          <ellipse
            key={`platform-${line}`}
            cx={x}
            cy={y}
            rx={42}
            ry={24}
            fill="none"
            stroke={lineColor}
            strokeWidth={6}
            strokeOpacity={isActive ? 0.35 : 0.2}
            transform={`rotate(${rotation} ${x} ${y})`}
            className="pointer-events-none"
            style={{
              transition: 'stroke-opacity 250ms ease'
            }}
          />
        );
      })}

      {/* Hover/Active glow effect */}
      {isActive && (
        <circle
          cx={x}
          cy={y}
          r={STATION_SIZE.glowRadius}
          fill={primaryColor}
          fillOpacity={0.12}
          filter="url(#glow-blue)"
          className="pointer-events-none"
        />
      )}

      {/* Outer ring - main station marker */}
      <circle
        cx={x}
        cy={y}
        r={radius}
        fill="#0a0a0a"
        stroke={primaryColor}
        strokeWidth={strokeWidth}
        style={{
          transition: 'r 200ms ease, stroke-width 200ms ease'
        }}
      />

      {/* Line connection dots - positioned around the station */}
      {station.lines.map((line, idx) => {
        const lineColor = LINE_COLORS[line] || primaryColor;
        const angle = station.lines.length === 1 
          ? 0 
          : (idx * 360) / station.lines.length - 90; // Start from top
        const dotRadius = radius * 1.2;
        const dotX = x + Math.cos(angle * Math.PI / 180) * dotRadius;
        const dotY = y + Math.sin(angle * Math.PI / 180) * dotRadius;

        return (
          <g key={`line-dot-${line}`} className="pointer-events-none">
            {/* Connection line */}
            <line
              x1={x}
              y1={y}
              x2={dotX}
              y2={dotY}
              stroke={lineColor}
              strokeWidth={2}
              strokeOpacity={isActive ? 0.6 : 0.35}
              strokeLinecap="round"
              style={{
                transition: 'stroke-opacity 200ms ease'
              }}
            />
            {/* Line indicator dot */}
            <circle
              cx={dotX}
              cy={dotY}
              r={isActive ? 7 : 6}
              fill={lineColor}
              opacity={isActive ? 1 : 0.85}
              style={{
                transition: 'r 200ms ease, opacity 200ms ease'
              }}
            />
          </g>
        );
      })}

      {/* Middle ring - secondary visual layer */}
      <circle
        cx={x}
        cy={y}
        r={radius * 0.6}
        fill="none"
        stroke={primaryColor}
        strokeWidth={innerStrokeWidth}
        opacity={isActive ? 0.8 : 0.6}
        style={{
          transition: 'opacity 200ms ease'
        }}
      />

      {/* Inner core - glowing center */}
      <circle
        cx={x}
        cy={y}
        r={isActive ? 12 : 10}
        fill={primaryColor}
        filter="url(#glow-blue)"
        style={{
          transition: 'r 200ms ease'
        }}
      />

      {/* Significance indicator for major/hub stations */}
      {(station.significance === 'hub' || station.significance === 'current') && (
        <circle
          cx={x}
          cy={y}
          r={5}
          fill="#ffffff"
          opacity={0.9}
        />
      )}

      {/* Active state pulse ring */}
      {isActive && (
        <circle
          cx={x}
          cy={y}
          r={radius * 1.8}
          fill="none"
          stroke={primaryColor}
          strokeWidth={3}
          strokeOpacity={0.2}
          style={{
            animation: 'pulse 2s ease-in-out infinite'
          }}
        />
      )}

      {/* Station name label */}
      {shouldShowLabel && (
        <g className="pointer-events-none select-none">
          {/* Label background for readability */}
          <text
            x={x}
            y={y - radius - 18}
            textAnchor="middle"
            fill="#000"
            fontSize={isActive ? STATION_SIZE.selectedLabelFontSize : STATION_SIZE.labelFontSize}
            fontFamily="'JetBrains Mono', 'SF Mono', 'Consolas', monospace"
            fontWeight="700"
            stroke="#000"
            strokeWidth={8}
            strokeLinejoin="round"
            opacity={0.5}
          >
            {station.name.length > 28 ? `${station.name.substring(0, 28)}…` : station.name}
          </text>
          {/* Label text */}
          <text
            x={x}
            y={y - radius - 18}
            textAnchor="middle"
            fill="#ffffff"
            fillOpacity={isActive ? 1 : 0.85}
            fontSize={isActive ? STATION_SIZE.selectedLabelFontSize : STATION_SIZE.labelFontSize}
            fontFamily="'JetBrains Mono', 'SF Mono', 'Consolas', monospace"
            fontWeight="700"
            style={{
              transition: 'fill-opacity 200ms ease, font-size 200ms ease'
            }}
          >
            {station.name.length > 28 ? `${station.name.substring(0, 28)}…` : station.name}
          </text>
        </g>
      )}

      {/* Year label */}
      {shouldShowLabel && (
        <g className="pointer-events-none select-none">
          {/* Year background */}
          <text
            x={x}
            y={y + radius + 35}
            textAnchor="middle"
            fill="#000"
            fontSize={STATION_SIZE.yearFontSize}
            fontFamily="'JetBrains Mono', 'SF Mono', 'Consolas', monospace"
            fontWeight="600"
            stroke="#000"
            strokeWidth={6}
            strokeLinejoin="round"
            opacity={0.4}
          >
            {station.yearLabel}
          </text>
          {/* Year text */}
          <text
            x={x}
            y={y + radius + 35}
            textAnchor="middle"
            fill={primaryColor}
            fillOpacity={isActive ? 1 : 0.85}
            fontSize={STATION_SIZE.yearFontSize}
            fontFamily="'JetBrains Mono', 'SF Mono', 'Consolas', monospace"
            fontWeight="600"
            style={{
              transition: 'fill-opacity 200ms ease'
            }}
          >
            {station.yearLabel}
          </text>
        </g>
      )}

      {/* Offset indicator - shows when station was shifted due to collision */}
      {station.wasOffset && shouldShowLabel && (
        <text
          x={x + radius + 12}
          y={y - radius - 8}
          textAnchor="start"
          fill={primaryColor}
          fontSize={16}
          fontFamily="monospace"
          opacity={isActive ? 0.7 : 0.35}
          className="pointer-events-none select-none"
          style={{
            transition: 'opacity 200ms ease'
          }}
        >
          ≈
        </text>
      )}
    </g>
  );
});

export default Station;
