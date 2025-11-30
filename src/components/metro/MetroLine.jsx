/**
 * MetroLine Component
 * Renders a single metro line with proper layering for depth
 */

import React, { memo } from 'react';
import { PATH_STROKE } from '../../constants/metroConfig';

/**
 * Single metro line with shadow, main stroke, and glowing core
 */
const MetroLine = memo(function MetroLine({
  pathData,
  lineConfig,
  animationProgress = 1,
  isVisible = true,
  filterId
}) {
  if (!pathData || !isVisible) return null;

  const { colorDark, colorMid, color } = lineConfig;
  const strokeDasharray = 5000;
  const strokeDashoffset = strokeDasharray * (1 - animationProgress);
  
  const baseStyle = {
    strokeDasharray,
    strokeDashoffset,
    transition: 'stroke-dashoffset 0.1s linear'
  };

  return (
    <g className="metro-line" data-line={lineConfig.id}>
      {/* Background shadow for depth */}
      <path
        d={pathData}
        fill="none"
        stroke={colorDark}
        strokeWidth={PATH_STROKE.background}
        strokeLinecap="round"
        style={{
          ...baseStyle,
          opacity: isVisible ? 0.5 : 0.15
        }}
      />
      
      {/* Main line */}
      <path
        d={pathData}
        fill="none"
        stroke={colorMid}
        strokeWidth={PATH_STROKE.main}
        strokeLinecap="round"
        style={{
          ...baseStyle,
          opacity: isVisible ? 1 : 0.3
        }}
      />
      
      {/* Glowing core */}
      <path
        d={pathData}
        fill="none"
        stroke={color}
        strokeWidth={PATH_STROKE.core}
        strokeLinecap="round"
        filter={filterId ? `url(#${filterId})` : undefined}
        style={{
          ...baseStyle,
          opacity: isVisible ? 0.9 : 0.25
        }}
      />
    </g>
  );
});

export default MetroLine;

