/**
 * MapRenderer Component
 * Handles all SVG rendering logic for the Civilization Metro Map
 * 
 * Separated from CivMap.jsx to maintain clean separation of concerns:
 * - CivMap.jsx: State management and UI layout
 * - MapRenderer.jsx: SVG rendering and visual presentation
 */

import React, { memo } from 'react';
import { MetroLine } from './metro';
import { LINES, VIEWBOX as VIEWBOX_CONFIG } from '../constants/metroConfig';

const MapRenderer = memo(function MapRenderer({
  svgRef,
  viewBox,
  paths,
  filteredStations,
  visibleLines,
  animationProgress,
  narrativeFocusLine,
  hoveredStation,
  selectedStation,
  journeyMode,
  journeyIndex,
  journeyStations,
  searchQuery,
  showAllLabels,
  currentZoom,
  labelOffsets,
  timeMarkers,
  VIEWBOX_WIDTH,
  VIEWBOX_HEIGHT,
  onStationHover,
  onStationSelect,
  onStationJourneyGoTo
}) {
  // Line Y positions (must match pathGenerator.js)
  const lineYPositions = {
    'Tech': 0.18 * VIEWBOX_CONFIG.HEIGHT,
    'War': 0.36 * VIEWBOX_CONFIG.HEIGHT,
    'Population': 0.50 * VIEWBOX_CONFIG.HEIGHT,
    'Philosophy': 0.64 * VIEWBOX_CONFIG.HEIGHT,
    'Empire': 0.82 * VIEWBOX_CONFIG.HEIGHT
  };

  const lineMap = { 'Tech': 'tech', 'Population': 'population', 'War': 'war', 'Empire': 'empire', 'Philosophy': 'philosophy' };
  const colors = { 'Tech': '#22d3ee', 'Population': '#22c55e', 'War': '#ef4444', 'Empire': '#9333ea', 'Philosophy': '#fbbf24' };

  return (
    <svg 
      ref={svgRef}
      className="w-full h-full relative z-10"
      viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        {/* Enhanced Glow Filters */}
        <filter id="glow-blue" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="6" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
        <filter id="glow-red" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
        <filter id="glow-green" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="5" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
        <filter id="mist" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="20"/>
        </filter>
        <filter id="spark" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2"/>
          <feColorMatrix values="1 0 0 0 0  0 0.2 0 0 0  0 0 0.2 0 0  0 0 0 1 0"/>
        </filter>
        
        {/* HIGH PRIORITY: Dynamic Glitch Filter for Crisis Stations */}
        <filter id="glitch" x="-50%" y="-50%" width="200%" height="200%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.9"
            numOctaves="4"
            result="turbulence"
          >
            <animate
              attributeName="baseFrequency"
              values="0.7;1.2;0.8;1.1;0.9"
              dur="0.3s"
              repeatCount="indefinite"
            />
          </feTurbulence>
          <feDisplacementMap
            in="SourceGraphic"
            in2="turbulence"
            scale="8"
            xChannelSelector="R"
            yChannelSelector="G"
          />
          <feGaussianBlur stdDeviation="1" result="blur"/>
          <feMerge>
            <feMergeNode in="blur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
        
        {/* Glitch filter for War line - unstable, vibrating effect */}
        <filter id="glitch-war" x="-50%" y="-50%" width="200%" height="200%">
          <feTurbulence
            type="turbulence"
            baseFrequency="0.5"
            numOctaves="3"
            result="turbulence"
          >
            <animate
              attributeName="baseFrequency"
              values="0.3;0.7;0.4;0.6;0.5"
              dur="0.5s"
              repeatCount="indefinite"
            />
          </feTurbulence>
          <feDisplacementMap
            in="SourceGraphic"
            in2="turbulence"
            scale="4"
            xChannelSelector="R"
            yChannelSelector="B"
          />
          <feGaussianBlur stdDeviation="2"/>
        </filter>
        
        {/* Singularity Visual Climax - Event Horizon Distortion */}
        <filter id="singularity-distortion" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="15" result="blur"/>
          <feColorMatrix
            type="matrix"
            values="1 0 0 0 0
                    0 1 0 0 0
                    0 0 1 0 0
                    0 0 0 1.5 0"
            result="brighten"
          />
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.3"
            numOctaves="5"
            result="turbulence"
          >
            <animate
              attributeName="baseFrequency"
              values="0.2;0.4;0.3;0.35;0.25"
              dur="2s"
              repeatCount="indefinite"
            />
          </feTurbulence>
          <feDisplacementMap
            in="brighten"
            in2="turbulence"
            scale="20"
            xChannelSelector="R"
            yChannelSelector="G"
          />
          <feMerge>
            <feMergeNode/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
        
        {/* Particle effect for Singularity */}
        <filter id="singularity-particles" x="-200%" y="-200%" width="500%" height="500%">
          <feGaussianBlur stdDeviation="3" result="blur"/>
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0
                    0 0 0 0 0
                    1 1 1 0 0
                    0 0 0 1 0"
          />
        </filter>
        
        {/* Animated gradient for Blue line */}
        <linearGradient id="blueGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#22d3ee" stopOpacity="1" />
          <animate attributeName="y2" values="0%;100%;0%" dur="3s" repeatCount="indefinite" />
        </linearGradient>
      </defs>

      {/* Time Axis */}
      <g className="time-axis" opacity="0.4">
        {timeMarkers.map((marker, idx) => (
          <g key={idx}>
            <line
              x1={marker.x}
              y1={VIEWBOX_HEIGHT - 80}
              x2={marker.x}
              y2={VIEWBOX_HEIGHT}
              stroke="#22d3ee"
              strokeWidth="3"
              strokeDasharray="5,5"
            />
            <text
              x={marker.x}
              y={VIEWBOX_HEIGHT - 20}
              textAnchor="middle"
              fill="#22d3ee"
              fontSize="24"
              fontFamily="monospace"
              opacity="0.7"
              fontWeight="bold"
            >
              {marker.label}
            </text>
          </g>
        ))}
        <text
          x={VIEWBOX_WIDTH / 2}
          y={VIEWBOX_HEIGHT - 5}
          textAnchor="middle"
          fill="#22d3ee"
          fontSize="20"
          fontFamily="monospace"
          opacity="0.5"
          className="uppercase tracking-widest"
          fontWeight="bold"
        >
          Time (Piecewise Scale) • 12,025 Years of Human Civilization
        </text>
      </g>

      {/* Metro Lines - Performance-First with Narrative Focus */}
      <MetroLine
        pathData={paths.orange}
        lineConfig={LINES.Philosophy}
        animationProgress={animationProgress}
        isVisible={visibleLines.philosophy}
        isNarrativeFocus={narrativeFocusLine === 'philosophy'}
        isCrisisMode={false}
      />
      
      <MetroLine
        pathData={paths.purple}
        lineConfig={LINES.Empire}
        animationProgress={animationProgress}
        isVisible={visibleLines.empire}
        isNarrativeFocus={narrativeFocusLine === 'empire'}
        isCrisisMode={false}
      />

      <MetroLine
        // Handle object structure for braided lines or string for simple lines
        pathData={typeof paths.green === 'string' ? paths.green : paths.green.main}
        lineConfig={LINES.Population}
        animationProgress={animationProgress}
        isVisible={visibleLines.population}
        isNarrativeFocus={narrativeFocusLine === 'population'}
        isCrisisMode={false}
      />

      <MetroLine
        pathData={paths.red}
        lineConfig={LINES.War}
        animationProgress={animationProgress}
        isVisible={visibleLines.war}
        isNarrativeFocus={narrativeFocusLine === 'war'}
        isCrisisMode={true} // War line always has crisis mode for visual impact
      />

      <MetroLine
        pathData={paths.blue}
        lineConfig={LINES.Tech}
        animationProgress={animationProgress}
        isVisible={visibleLines.tech}
        isNarrativeFocus={narrativeFocusLine === 'tech'}
        isCrisisMode={false}
      />

      {/* PROPER METRO MAP: Render each station ON ITS LINE(S) at the line's Y position */}
      {/* For multi-line stations, render a marker on EACH line */}
      {filteredStations.map((s) => {
        const isHovered = hoveredStation === s.id;
        const isSelected = selectedStation?.id === s.id;
        const isInJourney = journeyMode && journeyStations[journeyIndex] === s.id;
        const isSearchMatch = searchQuery && (s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.yearLabel.toLowerCase().includes(searchQuery.toLowerCase()));
        const shouldShowLabel = showAllLabels || isHovered || isSelected || isInJourney || isSearchMatch;
        const isActive = isHovered || isSelected || isInJourney;
        
        // Get visible lines for this station
        const visibleStationLines = s.lines.filter(line => visibleLines[lineMap[line]] !== false);
        if (visibleStationLines.length === 0 && !isSearchMatch) return null;
        
        // LOD: At very low zoom, only show major stations (hubs, crisis, or in journey)
        const isTooSmall = currentZoom < 0.2;
        const shouldRenderStation = !isTooSmall || s.significance === 'hub' || s.significance === 'crisis' || isInJourney || isSearchMatch;
        if (!shouldRenderStation) return null;
        
        // Render a marker on EACH line this station belongs to
        return (
          <g key={s.id}>
            {/* Vertical connector for multi-line stations */}
            {visibleStationLines.length > 1 && (
              <line
                x1={s.coords.x}
                y1={Math.min(...visibleStationLines.map(l => lineYPositions[l]))}
                x2={s.coords.x}
                y2={Math.max(...visibleStationLines.map(l => lineYPositions[l]))}
                stroke="#ffffff"
                strokeWidth={4}
                strokeOpacity={0.3}
                strokeDasharray="8,8"
                className="pointer-events-none"
              />
            )}
            
            {/* Station marker on each line - LOD aware */}
            {visibleStationLines.map((line, idx) => {
              const lineY = lineYPositions[line];
              const lineColor = colors[line];
              const isPrimaryLine = idx === 0;
              
              // LOD: Adjust radius based on zoom level
              const baseRadius = isActive ? 20 : 15;
              const radius = currentZoom < 0.2 ? baseRadius * 0.5 : baseRadius;
              
              const isCrisis = s.significance === 'crisis';
              const isSingularity = s.id === 'singularity';
              const isDetailView = currentZoom > 0.6; // Define here for use in this scope
              
              return (
                <g
                  key={`${s.id}-${line}`}
                  className="station-marker"
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={() => onStationHover(s.id)}
                  onMouseLeave={() => onStationHover(null)}
                  onClick={(e) => {
                    e.stopPropagation();
                    onStationSelect(s);
                    if (journeyMode) {
                      const jdx = journeyStations.indexOf(s.id);
                      if (jdx !== -1) onStationJourneyGoTo(jdx, s);
                    }
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  {/* Glow effect on active */}
                  {isActive && (
                    <circle
                      cx={s.coords.x}
                      cy={lineY}
                      r={radius * 2.5}
                      fill={lineColor}
                      fillOpacity={0.15}
                      className="pointer-events-none"
                    />
                  )}
                  
                  {/* Singularity: Event Horizon Distortion Effect */}
                  {isSingularity && isPrimaryLine && (
                    <circle
                      cx={s.coords.x}
                      cy={lineY}
                      r={radius * 4}
                      fill="none"
                      stroke="#22d3ee"
                      strokeWidth={2}
                      strokeOpacity={0.3}
                      filter="url(#singularity-distortion)"
                      className="pointer-events-none"
                    >
                      <animate
                        attributeName="r"
                        values={`${radius * 3};${radius * 5};${radius * 3}`}
                        dur="3s"
                        repeatCount="indefinite"
                      />
                    </circle>
                  )}
                  
                  {/* Outer ring - with CSS glitch class for crisis stations (replaces SVG filter) */}
                  <circle
                    cx={s.coords.x}
                    cy={lineY}
                    r={radius}
                    fill="#0a0a0a"
                    stroke={lineColor}
                    strokeWidth={isActive ? 6 : 4}
                    className={isCrisis ? "crisis-active" : ""}
                  />
                  
                  {/* Inner dot - only render if zoomed in or active (LOD) */}
                  {(isDetailView || isActive) && (
                    <circle
                      cx={s.coords.x}
                      cy={lineY}
                      r={isActive ? 8 : 6}
                      fill={lineColor}
                      className={isCrisis ? "crisis-active" : ""}
                    />
                  )}
                  
                  {/* Singularity: Radiating particles */}
                  {isSingularity && isPrimaryLine && (
                    <>
                      {[...Array(8)].map((_, i) => (
                        <line
                          key={`particle-${i}`}
                          x1={s.coords.x}
                          y1={lineY}
                          x2={s.coords.x + Math.cos((i * Math.PI * 2) / 8) * (radius * 3)}
                          y2={lineY + Math.sin((i * Math.PI * 2) / 8) * (radius * 3)}
                          stroke="#22d3ee"
                          strokeWidth={2}
                          strokeOpacity={0.6}
                          filter="url(#singularity-particles)"
                        >
                          <animate
                            attributeName="x2"
                            values={`${s.coords.x + Math.cos((i * Math.PI * 2) / 8) * (radius * 2)};${s.coords.x + Math.cos((i * Math.PI * 2) / 8) * (radius * 4)};${s.coords.x + Math.cos((i * Math.PI * 2) / 8) * (radius * 2)}`}
                            dur="2s"
                            repeatCount="indefinite"
                          />
                          <animate
                            attributeName="y2"
                            values={`${lineY + Math.sin((i * Math.PI * 2) / 8) * (radius * 2)};${lineY + Math.sin((i * Math.PI * 2) / 8) * (radius * 4)};${lineY + Math.sin((i * Math.PI * 2) / 8) * (radius * 2)}`}
                            dur="2s"
                            repeatCount="indefinite"
                          />
                        </line>
                      ))}
                    </>
                  )}
                  
                  {/* Hub indicator */}
                  {s.significance === 'hub' && (
                    <circle
                      cx={s.coords.x}
                      cy={lineY}
                      r={3}
                      fill="#ffffff"
                    />
                  )}
                </g>
              );
            })}
            
            {/* Label - LOD aware: only show if zoomed in enough or active */}
            {/* MEDIUM PRIORITY: Apply collision detection offsets */}
            {shouldShowLabel && (currentZoom > 0.6 || isActive) && (
              <g className="pointer-events-none select-none">
                {(() => {
                  const topY = Math.min(...visibleStationLines.map(l => lineYPositions[l]));
                  const isDetailView = currentZoom > 0.6; // Re-define in this closure scope
                  const labelOffset = labelOffsets[s.id] || 0; // Get collision offset
                  const labelY = topY - 30 - labelOffset; // Apply offset
                  return (
                    <>
                      {/* Name label background */}
                      <text
                        x={s.coords.x}
                        y={labelY}
                        textAnchor="middle"
                        fill="#000"
                        fontSize={isActive ? 28 : 24}
                        fontFamily="'JetBrains Mono', monospace"
                        fontWeight="700"
                        stroke="#000"
                        strokeWidth={6}
                        strokeLinejoin="round"
                        opacity={0.5}
                        className="station-label"
                      >
                        {s.name.length > 25 ? `${s.name.substring(0, 25)}…` : s.name}
                      </text>
                      {/* Name label */}
                      <text
                        x={s.coords.x}
                        y={labelY}
                        textAnchor="middle"
                        fill="#ffffff"
                        fontSize={isActive ? 28 : 24}
                        fontFamily="'JetBrains Mono', monospace"
                        fontWeight="700"
                        className="station-label"
                      >
                        {s.name.length > 25 ? `${s.name.substring(0, 25)}…` : s.name}
                      </text>
                      {/* Year label - Only show if very zoomed in or active (LOD) */}
                      {(isActive || currentZoom > 1.2) && (
                        <text
                          x={s.coords.x}
                          y={labelY + 24}
                          textAnchor="middle"
                          fill={colors[visibleStationLines[0]]}
                          fontSize={20}
                          fontFamily="'JetBrains Mono', monospace"
                          fontWeight="600"
                        >
                          {s.yearLabel}
                        </text>
                      )}
                    </>
                  );
                })()}
              </g>
            )}
          </g>
        );
      })}
    </svg>
  );
});

export default MapRenderer;

