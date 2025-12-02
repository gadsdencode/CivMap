/**
 * Map Controller Hook
 * Extracts pan/zoom/event logic from main component for better maintainability
 * LOW PRIORITY: Architecture improvement for testability and separation of concerns
 */

import { useCallback, useRef, useEffect } from 'react';
import { VIEWBOX } from '../constants/metroConfig';

const VIEWBOX_WIDTH = VIEWBOX.WIDTH;
const VIEWBOX_HEIGHT = VIEWBOX.HEIGHT;

/**
 * Custom hook for map interaction controls (pan, zoom, events)
 * @param {Object} params - Configuration object
 * @param {Object} params.viewBox - Current viewBox state
 * @param {Function} params.setViewBox - Function to update viewBox
 * @param {boolean} params.isPanning - Whether currently panning
 * @param {Function} params.startPan - Function to start panning
 * @param {Function} params.endPan - Function to end panning
 * @param {Object} params.containerRef - Ref to container element
 * @param {Object} params.svgRef - Ref to SVG element
 * @returns {Object} Map controller handlers and state
 */
export function useMapController({
  viewBox,
  setViewBox,
  isPanning,
  startPan,
  endPan,
  containerRef,
  svgRef
}) {
  // Refs for panning state
  const panStartRef = useRef({ x: 0, y: 0 });
  const viewBoxStartRef = useRef({ x: 0, y: 0, width: 0, height: 0 });
  const svgPointStartRef = useRef({ x: 0, y: 0 });
  const panAnimationFrameRef = useRef(null);
  const latestMouseEventRef = useRef(null);
  
  // Ref for zoom animation
  const zoomAnimationRef = useRef(null);

  // Check if the click target is an interactive element
  const isInteractiveElement = useCallback((target) => {
    if (!target) return false;
    
    let element = target;
    while (element && element !== containerRef.current && element !== document.body) {
      if (element.classList && element.classList.contains('station')) {
        return true;
      }
      if (element.tagName === 'BUTTON' || element.tagName === 'A' || 
          element.closest && (element.closest('button') || element.closest('a'))) {
        return true;
      }
      if (element.tagName === 'text' && element.closest && element.closest('.station')) {
        return true;
      }
      if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA' || element.tagName === 'SELECT') {
        return true;
      }
      element = element.parentElement;
    }
    return false;
  }, [containerRef]);

  // Handle mouse down for panning
  const handleMouseDown = useCallback((e) => {
    const target = e.target;
    const isInteractive = isInteractiveElement(target);
    
    if (e.button !== 0) return;
    if (isInteractive) return;
    
    const isContainer = target === containerRef.current;
    const isSvgBackground = target.tagName === 'svg' || 
                            target.tagName === 'path' || 
                            target.tagName === 'line' ||
                            target.tagName === 'defs' ||
                            (target.tagName === 'text' && !target.closest?.('.station')) ||
                            (target.tagName === 'g' && !target.classList?.contains('station'));
    
    if ((isContainer || isSvgBackground) && svgRef.current && containerRef.current) {
      panStartRef.current = { x: e.clientX, y: e.clientY };
      viewBoxStartRef.current = { ...viewBox };
      
      const rect = containerRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      const svgPoint = svgRef.current.createSVGPoint();
      svgPoint.x = mouseX;
      svgPoint.y = mouseY;
      const pointInSvg = svgPoint.matrixTransform(svgRef.current.getScreenCTM().inverse());
      svgPointStartRef.current = { x: pointInSvg.x, y: pointInSvg.y };
      
      startPan();
      e.preventDefault();
      e.stopPropagation();
    }
  }, [isInteractiveElement, viewBox, startPan, containerRef, svgRef]);

  // Handle mouse move for panning (with direct SVG updates for performance)
  const handleMouseMove = useCallback((e) => {
    if (isPanning && containerRef.current && svgRef.current) {
      try {
        latestMouseEventRef.current = e;
        
        if (!panAnimationFrameRef.current) {
          panAnimationFrameRef.current = requestAnimationFrame(() => {
            panAnimationFrameRef.current = null;
            
            if (!isPanning || !containerRef.current || !svgRef.current || !latestMouseEventRef.current) {
              return;
            }
            
            const event = latestMouseEventRef.current;
            const rect = containerRef.current.getBoundingClientRect();
            const mouseX = event.clientX - rect.left;
            const mouseY = event.clientY - rect.top;
            
            const svgPoint = svgRef.current.createSVGPoint();
            svgPoint.x = mouseX;
            svgPoint.y = mouseY;
            const currentPointInSvg = svgPoint.matrixTransform(svgRef.current.getScreenCTM().inverse());
            
            const dx = svgPointStartRef.current.x - currentPointInSvg.x;
            const dy = svgPointStartRef.current.y - currentPointInSvg.y;
            
            const newViewBox = {
              ...viewBoxStartRef.current,
              x: viewBoxStartRef.current.x + dx,
              y: viewBoxStartRef.current.y + dy
            };
            
            const constrainedViewBox = {
              x: Math.max(0, Math.min(VIEWBOX_WIDTH - newViewBox.width, newViewBox.x)),
              y: Math.max(0, Math.min(VIEWBOX_HEIGHT - newViewBox.height, newViewBox.y)),
              width: newViewBox.width,
              height: newViewBox.height
            };
            
            // Update SVG directly (bypasses React for performance)
            svgRef.current.setAttribute('viewBox', 
              `${constrainedViewBox.x} ${constrainedViewBox.y} ${constrainedViewBox.width} ${constrainedViewBox.height}`
            );
            
            viewBoxStartRef.current = constrainedViewBox;
          });
        }
        
        e.preventDefault();
      } catch (err) {
        console.error('Pan error:', err);
        endPan();
      }
    }
  }, [isPanning, endPan, containerRef, svgRef]);

  // Handle mouse up for panning (sync React state)
  const handleMouseUp = useCallback((e) => {
    if (isPanning) {
      if (panAnimationFrameRef.current) {
        cancelAnimationFrame(panAnimationFrameRef.current);
        panAnimationFrameRef.current = null;
      }
      
      if (svgRef.current && viewBoxStartRef.current) {
        const currentViewBoxAttr = svgRef.current.getAttribute('viewBox');
        if (currentViewBoxAttr) {
          const [x, y, width, height] = currentViewBoxAttr.split(' ').map(Number);
          setViewBox({ x, y, width, height });
        } else {
          setViewBox(viewBoxStartRef.current);
        }
      }
      
      latestMouseEventRef.current = null;
      endPan();
      e?.preventDefault();
    }
  }, [isPanning, endPan, setViewBox, svgRef]);

  // Handle wheel for zooming (with smooth transitions)
  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const zoomFactor = e.deltaY > 0 ? 1.15 : 0.85;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect || !svgRef.current) return;

    if (zoomAnimationRef.current) {
      zoomAnimationRef.current();
      zoomAnimationRef.current = null;
    }

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const svgPoint = svgRef.current.createSVGPoint();
    svgPoint.x = mouseX;
    svgPoint.y = mouseY;
    const pointInSvg = svgPoint.matrixTransform(svgRef.current.getScreenCTM().inverse());

    const targetWidth = viewBox.width * zoomFactor;
    const targetHeight = viewBox.height * zoomFactor;

    const minZoom = 0.05;
    const maxZoom = 20;
    const constrainedWidth = Math.max(VIEWBOX_WIDTH * minZoom, Math.min(VIEWBOX_WIDTH * maxZoom, targetWidth));
    const constrainedHeight = Math.max(VIEWBOX_HEIGHT * minZoom, Math.min(VIEWBOX_HEIGHT * maxZoom, targetHeight));

    const targetX = pointInSvg.x - (mouseX / rect.width) * constrainedWidth;
    const targetY = pointInSvg.y - (mouseY / rect.height) * constrainedHeight;

    const targetViewBox = {
      x: Math.max(0, Math.min(VIEWBOX_WIDTH - constrainedWidth, targetX)),
      y: Math.max(0, Math.min(VIEWBOX_HEIGHT - constrainedHeight, targetY)),
      width: constrainedWidth,
      height: constrainedHeight
    };

    // Smooth transition
    const startViewBox = { ...viewBox };
    const duration = 200;
    
    const startTime = performance.now();
    let animationFrameId = null;
    let cancelled = false;

    const animate = (currentTime) => {
      if (cancelled) return;

      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      const ease = progress < 0.5 
        ? 2 * progress * progress 
        : 1 - Math.pow(-2 * progress + 2, 2) / 2;

      const currentViewBox = {
        x: startViewBox.x + (targetViewBox.x - startViewBox.x) * ease,
        y: startViewBox.y + (targetViewBox.y - startViewBox.y) * ease,
        width: startViewBox.width + (targetViewBox.width - startViewBox.width) * ease,
        height: startViewBox.height + (targetViewBox.height - startViewBox.height) * ease
      };

      setViewBox(currentViewBox);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animate);
      } else {
        zoomAnimationRef.current = null;
      }
    };

    animationFrameId = requestAnimationFrame(animate);
    zoomAnimationRef.current = () => {
      cancelled = true;
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [viewBox, setViewBox, containerRef, svgRef]);

  // Attach window-level mouse listeners during panning
  useEffect(() => {
    if (isPanning) {
      const handleWindowMouseMove = (e) => {
        handleMouseMove(e);
      };
      const handleWindowMouseUp = (e) => {
        handleMouseUp(e);
      };

      window.addEventListener('mousemove', handleWindowMouseMove);
      window.addEventListener('mouseup', handleWindowMouseUp);
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'grabbing';

      return () => {
        window.removeEventListener('mousemove', handleWindowMouseMove);
        window.removeEventListener('mouseup', handleWindowMouseUp);
        document.body.style.userSelect = '';
        document.body.style.cursor = '';
      };
    }
  }, [isPanning, handleMouseMove, handleMouseUp]);

  // Cleanup animations on unmount
  useEffect(() => {
    return () => {
      if (panAnimationFrameRef.current) {
        cancelAnimationFrame(panAnimationFrameRef.current);
      }
      if (zoomAnimationRef.current) {
        zoomAnimationRef.current();
      }
    };
  }, []);

  return {
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleWheel
  };
}

