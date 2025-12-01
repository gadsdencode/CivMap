/**
 * MetroLine Component
 * Performance-First Implementation with Narrative Focus States
 * 
 * KEY UPGRADES:
 * - Removed heavy SVG filters in favor of CSS animations (GPU accelerated)
 * - Added narrative focus states to guide user attention
 * - Optimized rendering with static calculations
 * 
 * VISUAL LAYERS (bottom to top):
 * 1. Shadow/depth layer - Creates 3D effect
 * 2. Main line - Primary visible stroke
 * 3. Glowing core - Neon-like center glow (pulses on narrative focus)
 */

import React, { memo, useMemo } from 'react';
import { PATH_STROKE, ANIMATION } from '../../constants/metroConfig';

/**
 * Single metro line with shadow, main stroke, and glowing core
 */
const MetroLine = memo(function MetroLine({
  pathData,
  lineConfig,
  animationProgress = 1,
  isVisible = true,
  isNarrativeFocus = false, // New: Is this line the current story focus?
  isCrisisMode = false      // New: Replaces filterId for glitches
}) {
  if (!pathData) return null;

  const { id, colorDark, colorMid, color, colorGlow } = lineConfig;
  
  // 1. Performance: Static dasharray calculation
  const strokeDasharray = 12000;
  const strokeDashoffset = strokeDasharray * (1 - animationProgress);
  
  // 2. Visual Persuasion: Dynamic styles based on narrative state
  const mainOpacity = isVisible ? (isNarrativeFocus ? 1 : 0.6) : 0.1;
  const glowOpacity = isVisible ? (isNarrativeFocus ? 0.9 : 0.4) : 0;
  
  // CSS class for performance-friendly animation
  const lineClass = `metro-line ${isCrisisMode ? 'crisis-active' : ''} ${isNarrativeFocus ? 'metro-line-narrative-active' : ''}`;

  return (
    <g 
      className={lineClass} 
      data-line={id}
      style={{ 
        '--base-width': `${PATH_STROKE.main}px`, 
        color: colorGlow,
        transition: 'opacity 0.5s ease'
      }}
    >
      {/* Layer 1: Depth/Shadow (Static) */}
      <path
        d={pathData}
        fill="none"
        stroke={colorDark}
        strokeWidth={PATH_STROKE.background}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ 
          opacity: isVisible ? 0.5 : 0.05,
          transition: 'opacity 0.5s ease'
        }}
      />
      
      {/* Layer 2: Main Body (Animated Draw) */}
      <path
        d={pathData}
        fill="none"
        stroke={colorMid}
        strokeWidth={PATH_STROKE.main}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={strokeDasharray}
        strokeDashoffset={strokeDashoffset}
        style={{
          opacity: mainOpacity,
          transition: `stroke-dashoffset ${ANIMATION.pathDrawDuration}ms ease-out, opacity 0.3s ease`
        }}
      />
      
      {/* Layer 3: The Narrative Core (Glows/Pulses on Focus) */}
      <path
        d={pathData}
        fill="none"
        stroke={colorGlow || color}
        strokeWidth={isNarrativeFocus ? PATH_STROKE.core + 2 : PATH_STROKE.core}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={strokeDasharray}
        strokeDashoffset={strokeDashoffset}
        style={{
          opacity: glowOpacity,
          transition: 'opacity 0.3s ease, stroke-width 0.3s ease'
        }}
      />
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
  isNarrativeFocus = false,
  isCrisisMode = false
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

  const opacityMultiplier = isVisible ? 1 : 0.1;
  const mainOpacity = isVisible ? (isNarrativeFocus ? 1 : 0.6) : 0.1;
  const glowOpacity = isVisible ? (isNarrativeFocus ? 0.9 : 0.4) : 0;
  
  const lineClass = `metro-line braided ${isCrisisMode ? 'crisis-active' : ''} ${isNarrativeFocus ? 'metro-line-narrative-active' : ''}`;

  return (
    <g 
      className={lineClass}
      data-line={id}
      style={{ 
        '--base-width': `${PATH_STROKE.main}px`,
        color: colorGlow,
        transition: 'opacity 0.5s ease'
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
          opacity: mainOpacity
        }}
      />

      {/* Glowing core for main strand */}
      <path
        d={main}
        fill="none"
        stroke={colorGlow || color}
        strokeWidth={isNarrativeFocus ? PATH_STROKE.core + 2 : PATH_STROKE.core}
        strokeLinecap="round"
        style={{
          ...baseStyle,
          opacity: glowOpacity,
          transition: 'opacity 0.3s ease, stroke-width 0.3s ease'
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
