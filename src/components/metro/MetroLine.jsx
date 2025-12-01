/**
 * MetroLine Component
 * Renders a single metro line with proper layering for depth and visual polish
 * 
 * VISUAL LAYERS (bottom to top):
 * 1. Shadow/depth layer - Creates 3D effect
 * 2. Main line - Primary visible stroke
 * 3. Glowing core - Neon-like center glow
 * 
 * DESIGN PRINCIPLES:
 * - Smooth animation with CSS transitions
 * - Clear visual hierarchy through layering
 * - Proper opacity handling for filtered states
 */

import React, { memo, useMemo } from 'react';
import { PATH_STROKE, EFFECTS, ANIMATION } from '../../constants/metroConfig';

/**
 * Single metro line with shadow, main stroke, and glowing core
 */
const MetroLine = memo(function MetroLine({
  pathData,
  lineConfig,
  animationProgress = 1,
  isVisible = true,
  isHighlighted = false,
  filterId
}) {
  if (!pathData) return null;

  const { id, colorDark, colorMid, color, colorGlow } = lineConfig;
  
  // Calculate stroke dash for animation
  // 12000px dasharray ensures continuous lines across the full 8000px viewbox with margin
  const strokeDasharray = 12000;
  const strokeDashoffset = strokeDasharray * (1 - animationProgress);
  
  // Memoize style objects for performance
  const baseAnimationStyle = useMemo(() => ({
    strokeDasharray,
    strokeDashoffset,
    transition: `stroke-dashoffset ${ANIMATION.pathDrawDuration}ms ease-out`
  }), [strokeDasharray, strokeDashoffset]);

  // Opacity calculations based on visibility and highlight state
  const opacityMultiplier = isVisible ? 1 : EFFECTS.lineInactiveOpacity;
  const highlightBoost = isHighlighted ? 1.1 : 1;

  return (
    <g 
      className="metro-line" 
      data-line={id}
      style={{
        transition: `opacity ${ANIMATION.transitionDuration}ms ease`
      }}
    >
      {/* Layer 1: Background shadow for depth */}
      <path
        d={pathData}
        fill="none"
        stroke={colorDark}
        strokeWidth={PATH_STROKE.background}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
          ...baseAnimationStyle,
          opacity: Math.min(0.5 * opacityMultiplier, 0.5)
        }}
      />
      
      {/* Layer 2: Main line stroke */}
      <path
        d={pathData}
        fill="none"
        stroke={colorMid}
        strokeWidth={PATH_STROKE.main}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
          ...baseAnimationStyle,
          opacity: EFFECTS.lineActiveOpacity * opacityMultiplier * highlightBoost
        }}
      />
      
      {/* Layer 3: Glowing core - creates the neon effect */}
      <path
        d={pathData}
        fill="none"
        stroke={colorGlow || color}
        strokeWidth={PATH_STROKE.core}
        strokeLinecap="round"
        strokeLinejoin="round"
        filter={filterId ? `url(#${filterId})` : undefined}
        style={{
          ...baseAnimationStyle,
          opacity: 0.85 * opacityMultiplier * highlightBoost
        }}
      />

      {/* Layer 4: Ultra-bright center (optional, for highlighted lines) */}
      {isHighlighted && (
        <path
          d={pathData}
          fill="none"
          stroke="#ffffff"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            ...baseAnimationStyle,
            opacity: 0.4 * opacityMultiplier
          }}
        />
      )}
    </g>
  );
});

/**
 * Braided Metro Line Component
 * Special variant for the Population (Green) line with DNA-helix effect
 */
export const BraidedMetroLine = memo(function BraidedMetroLine({
  pathData,
  lineConfig,
  animationProgress = 1,
  isVisible = true,
  filterId
}) {
  if (!pathData || typeof pathData !== 'object') return null;

  const { main, braid1, braid2 } = pathData;
  const { id, colorDark, colorMid, color, colorGlow } = lineConfig;

  const strokeDasharray = 12000;
  const strokeDashoffset = strokeDasharray * (1 - animationProgress);

  const baseStyle = useMemo(() => ({
    strokeDasharray,
    strokeDashoffset,
    transition: `stroke-dashoffset ${ANIMATION.pathDrawDuration}ms ease-out`
  }), [strokeDasharray, strokeDashoffset]);

  const opacityMultiplier = isVisible ? 1 : EFFECTS.lineInactiveOpacity;

  return (
    <g 
      className="metro-line braided" 
      data-line={id}
      style={{
        transition: `opacity ${ANIMATION.transitionDuration}ms ease`
      }}
    >
      {/* Shadow layers for all strands */}
      <path
        d={main}
        fill="none"
        stroke={colorDark}
        strokeWidth={PATH_STROKE.background}
        strokeLinecap="round"
        style={{
          ...baseStyle,
          opacity: 0.4 * opacityMultiplier
        }}
      />

      {/* Braid strand 1 - offset path */}
      <path
        d={braid1}
        fill="none"
        stroke={colorMid}
        strokeWidth={PATH_STROKE.braidMain || 10}
        strokeLinecap="round"
        style={{
          ...baseStyle,
          opacity: 0.6 * opacityMultiplier
        }}
      />

      {/* Braid strand 2 - offset path */}
      <path
        d={braid2}
        fill="none"
        stroke={colorMid}
        strokeWidth={PATH_STROKE.braidMain || 10}
        strokeLinecap="round"
        style={{
          ...baseStyle,
          opacity: 0.6 * opacityMultiplier
        }}
      />

      {/* Main center strand */}
      <path
        d={main}
        fill="none"
        stroke={colorMid}
        strokeWidth={PATH_STROKE.main}
        strokeLinecap="round"
        style={{
          ...baseStyle,
          opacity: EFFECTS.lineActiveOpacity * opacityMultiplier
        }}
      />

      {/* Glowing core for main strand */}
      <path
        d={main}
        fill="none"
        stroke={colorGlow || color}
        strokeWidth={PATH_STROKE.core}
        strokeLinecap="round"
        filter={filterId ? `url(#${filterId})` : undefined}
        style={{
          ...baseStyle,
          opacity: 0.85 * opacityMultiplier
        }}
      />

      {/* Subtle glow for braid strands */}
      <path
        d={braid1}
        fill="none"
        stroke={colorGlow || color}
        strokeWidth={3}
        strokeLinecap="round"
        style={{
          ...baseStyle,
          opacity: 0.5 * opacityMultiplier
        }}
      />
      <path
        d={braid2}
        fill="none"
        stroke={colorGlow || color}
        strokeWidth={3}
        strokeLinecap="round"
        style={{
          ...baseStyle,
          opacity: 0.5 * opacityMultiplier
        }}
      />
    </g>
  );
});

export default MetroLine;
