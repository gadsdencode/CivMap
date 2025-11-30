/**
 * Station Component
 * Individual station marker with hover states and labels
 */

import React, { memo, useCallback } from 'react';
import { STATION_SIZE, LINE_COLORS } from '../../constants/metroConfig';

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
  const isVisible = station.lines.some(line => {
    const lineKey = line.toLowerCase();
    return visibleLines[lineKey] !== false;
  });

  if (!isVisible && !isSearchMatch) return null;

  const handleMouseEnter = useCallback(() => onHover?.(station.id), [station.id, onHover]);
  const handleMouseLeave = useCallback(() => onHover?.(null), [onHover]);
  const handleClick = useCallback((e) => {
    e.stopPropagation();
    onSelect?.(station);
  }, [station, onSelect]);

  // Visual states
  const scale = isHovered || isSelected || isInJourney 
    ? STATION_SIZE.hoverScale 
    : isSearchMatch ? STATION_SIZE.searchMatchScale : 1;
  
  const radius = isSelected || isInJourney 
    ? STATION_SIZE.selectedRadius 
    : STATION_SIZE.baseRadius;

  const shouldShowLabel = showLabel || isHovered || isSelected || isInJourney || isSearchMatch;

  return (
    <g
      className="station cursor-pointer"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      onMouseDown={(e) => e.stopPropagation()}
      style={{
        transformOrigin: `${station.coords.x}px ${station.coords.y}px`,
        transform: `scale(${scale})`,
        opacity: isVisible ? 1 : 0.4,
        transition: 'transform 300ms ease, opacity 300ms ease'
      }}
    >
      {/* Journey highlight ring */}
      {isInJourney && (
        <circle
          cx={station.coords.x}
          cy={station.coords.y}
          r={120}
          fill="none"
          stroke="#22d3ee"
          strokeWidth={8}
          strokeDasharray="20,10"
          opacity={0.6}
          className="animate-pulse"
        />
      )}

      {/* Search match highlight */}
      {isSearchMatch && !isSelected && (
        <circle
          cx={station.coords.x}
          cy={station.coords.y}
          r={100}
          fill="none"
          stroke="#fbbf24"
          strokeWidth={6}
          opacity={0.5}
        />
      )}

      {/* Line connection indicators */}
      {station.lines.map((line, idx) => {
        const lineColor = LINE_COLORS[line] || station.color;
        return (
          <ellipse
            key={`platform-${line}`}
            cx={station.coords.x}
            cy={station.coords.y}
            rx={50}
            ry={30}
            fill="none"
            stroke={lineColor}
            strokeWidth={8}
            strokeOpacity={0.25}
            transform={`rotate(${idx * 45} ${station.coords.x} ${station.coords.y})`}
            className="pointer-events-none"
          />
        );
      })}

      {/* Hover glow */}
      {(isHovered || isSelected || isInJourney) && (
        <circle
          cx={station.coords.x}
          cy={station.coords.y}
          r={90}
          fill={station.color}
          fillOpacity={0.15}
          filter="url(#glow-blue)"
        />
      )}

      {/* Outer ring */}
      <circle
        cx={station.coords.x}
        cy={station.coords.y}
        r={radius}
        fill="#000"
        stroke={station.color}
        strokeWidth={isSelected || isInJourney ? 12 : 10}
        opacity={0.95}
      />

      {/* Line connection dots */}
      {station.lines.map((line, idx) => {
        const lineColor = LINE_COLORS[line] || station.color;
        const angle = (idx * 360) / station.lines.length;
        const dotRadius = isSelected || isInJourney ? 42 : 37;
        const x = station.coords.x + Math.cos(angle * Math.PI / 180) * dotRadius;
        const y = station.coords.y + Math.sin(angle * Math.PI / 180) * dotRadius;

        return (
          <g key={`line-dot-${line}`}>
            <circle
              cx={x}
              cy={y}
              r={8}
              fill={lineColor}
              opacity={0.9}
            />
            <line
              x1={station.coords.x}
              y1={station.coords.y}
              x2={x}
              y2={y}
              stroke={lineColor}
              strokeWidth={3}
              strokeOpacity={0.5}
              strokeLinecap="round"
            />
          </g>
        );
      })}

      {/* Middle ring */}
      <circle
        cx={station.coords.x}
        cy={station.coords.y}
        r={20}
        fill="none"
        stroke={station.color}
        strokeWidth={5}
        opacity={0.7}
      />

      {/* Inner core */}
      <circle
        cx={station.coords.x}
        cy={station.coords.y}
        r={isSelected || isInJourney ? 14 : 12}
        fill={station.color}
        filter="url(#glow-blue)"
      />

      {/* Active state pulse */}
      {(isHovered || isSelected) && (
        <circle
          cx={station.coords.x}
          cy={station.coords.y}
          r={60}
          fill="none"
          stroke={station.color}
          strokeWidth={8}
          strokeOpacity={0.2}
          className="animate-pulse"
        />
      )}

      {/* Station name label */}
      {shouldShowLabel && (
        <text
          x={station.coords.x}
          y={station.coords.y - 50}
          textAnchor="middle"
          fill="white"
          fillOpacity={isHovered || isSelected || isInJourney ? 1 : 0.8}
          fontSize={isSelected || isInJourney ? STATION_SIZE.selectedLabelFontSize : STATION_SIZE.labelFontSize}
          fontFamily="monospace"
          fontWeight="bold"
          className="pointer-events-none select-none drop-shadow-lg"
        >
          {station.name.length > 30 ? `${station.name.substring(0, 30)}...` : station.name}
        </text>
      )}

      {/* Year label */}
      {shouldShowLabel && (
        <text
          x={station.coords.x}
          y={station.coords.y + 90}
          textAnchor="middle"
          fill={station.color}
          fillOpacity={isHovered || isSelected || isInJourney ? 1 : 0.8}
          fontSize={isSelected || isInJourney ? 26 : 24}
          fontFamily="monospace"
          fontWeight="bold"
          className="pointer-events-none select-none drop-shadow-md"
        >
          {station.yearLabel}
        </text>
      )}
    </g>
  );
});

export default Station;

