/**
 * Map Controller Hook
 * Handles pan/zoom/touch interactions for the Civilization Metro Map
 * 
 * Key fixes applied:
 * - Uses refs for panning state to avoid stale closures
 * - Properly syncs React state on pan end
 * - Supports touch events (pinch-to-zoom, touch panning)
 * - Uses non-passive wheel event for proper zoom
 * - Consistent zoom constraints from config
 */

import { useCallback, useRef, useEffect } from 'react';
import { VIEWBOX, ANIMATION } from '../constants/metroConfig';

const VIEWBOX_WIDTH = VIEWBOX.WIDTH;
const VIEWBOX_HEIGHT = VIEWBOX.HEIGHT;
const MIN_ZOOM = VIEWBOX.MIN_ZOOM;
const MAX_ZOOM = VIEWBOX.MAX_ZOOM;

/**
 * Custom hook for map interaction controls (pan, zoom, touch)
 * @param {Object} params - Configuration object
 * @param {Object} params.viewBox - Current viewBox state
 * @param {Function} params.setViewBox - Function to update viewBox
 * @param {boolean} params.isPanning - Whether currently panning (for external state sync)
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
  // === REFS FOR INTERNAL STATE (avoids stale closures) ===
  const isPanningRef = useRef(false);
  const viewBoxRef = useRef(viewBox); // Always current viewBox
  
  // Pan tracking refs
  const panStartRef = useRef({ x: 0, y: 0 });
  const viewBoxAtPanStartRef = useRef({ x: 0, y: 0, width: 0, height: 0 });
  const panAnimationFrameRef = useRef(null);
  const latestMouseEventRef = useRef(null);
  
  // Touch tracking refs
  const touchStartRef = useRef({ x: 0, y: 0 });
  const initialPinchDistanceRef = useRef(null);
  const initialPinchViewBoxRef = useRef(null);
  const touchesRef = useRef([]);
  
  // Zoom animation ref
  const zoomAnimationRef = useRef(null);

  // Keep viewBoxRef in sync with prop
  useEffect(() => {
    viewBoxRef.current = viewBox;
  }, [viewBox]);

  // Keep isPanningRef in sync with prop
  useEffect(() => {
    isPanningRef.current = isPanning;
  }, [isPanning]);

  /**
   * Constrain viewBox to valid bounds
   */
  const constrainViewBox = useCallback((vb) => {
    const constrainedWidth = Math.max(
      VIEWBOX_WIDTH * MIN_ZOOM,
      Math.min(VIEWBOX_WIDTH * MAX_ZOOM, vb.width)
    );
    const constrainedHeight = Math.max(
      VIEWBOX_HEIGHT * MIN_ZOOM,
      Math.min(VIEWBOX_HEIGHT * MAX_ZOOM, vb.height)
    );
    
    return {
      x: Math.max(0, Math.min(VIEWBOX_WIDTH - constrainedWidth, vb.x)),
      y: Math.max(0, Math.min(VIEWBOX_HEIGHT - constrainedHeight, vb.y)),
      width: constrainedWidth,
      height: constrainedHeight
    };
  }, []);

  /**
   * Convert screen coordinates to SVG coordinates
   */
  const screenToSVG = useCallback((screenX, screenY) => {
    if (!svgRef.current || !containerRef.current) return null;
    
    try {
      const rect = containerRef.current.getBoundingClientRect();
      const mouseX = screenX - rect.left;
      const mouseY = screenY - rect.top;
      
      const svgPoint = svgRef.current.createSVGPoint();
      svgPoint.x = mouseX;
      svgPoint.y = mouseY;
      
      const ctm = svgRef.current.getScreenCTM();
      if (!ctm) return null;
      
      return svgPoint.matrixTransform(ctm.inverse());
    } catch (err) {
      console.error('screenToSVG error:', err);
      return null;
    }
  }, [svgRef, containerRef]);

  /**
   * Check if the click target is an interactive element
   */
  const isInteractiveElement = useCallback((target) => {
    if (!target) return false;
    
    let element = target;
    const maxDepth = 10; // Prevent infinite loops
    let depth = 0;
    
    while (element && element !== containerRef.current && element !== document.body && depth < maxDepth) {
      // Station elements
      if (element.classList?.contains('station') || element.classList?.contains('station-marker')) {
        return true;
      }
      // Buttons and links
      if (element.tagName === 'BUTTON' || element.tagName === 'A') {
        return true;
      }
      // Form elements
      if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA' || element.tagName === 'SELECT') {
        return true;
      }
      // Check for closest button/link
      if (element.closest?.('button, a, [role="button"]')) {
        return true;
      }
      element = element.parentElement;
      depth++;
    }
    return false;
  }, [containerRef]);

  /**
   * Check if element is valid for panning
   */
  const isPannableTarget = useCallback((target) => {
    if (!target) return false;
    
    const isContainer = target === containerRef.current;
    const isSvgElement = ['svg', 'path', 'line', 'rect', 'defs', 'g'].includes(target.tagName?.toLowerCase());
    const isNotStation = !target.classList?.contains('station') && !target.classList?.contains('station-marker');
    
    return (isContainer || (isSvgElement && isNotStation)) && !isInteractiveElement(target);
  }, [containerRef, isInteractiveElement]);

  // === PANNING HANDLERS ===

  /**
   * Handle mouse down for panning
   */
  const handleMouseDown = useCallback((e) => {
    // Only handle left mouse button
    if (e.button !== 0) return;
    
    // Don't pan if clicking on interactive element
    if (!isPannableTarget(e.target)) return;
    
    // Store initial positions
    panStartRef.current = { x: e.clientX, y: e.clientY };
    viewBoxAtPanStartRef.current = { ...viewBoxRef.current };
    
    // Start panning
    isPanningRef.current = true;
    startPan();
    
    e.preventDefault();
    e.stopPropagation();
  }, [isPannableTarget, startPan]);

  /**
   * Handle mouse move for panning
   * Uses requestAnimationFrame for smooth 60fps updates
   */
  const handleMouseMove = useCallback((e) => {
    // Use ref to check panning state (avoids stale closure)
    if (!isPanningRef.current) return;
    if (!containerRef.current || !svgRef.current) return;
    
    // Store latest event for RAF callback
    latestMouseEventRef.current = e;
    
    // Throttle updates via requestAnimationFrame
    if (panAnimationFrameRef.current) return;
    
    panAnimationFrameRef.current = requestAnimationFrame(() => {
      panAnimationFrameRef.current = null;
      
      // Double-check we're still panning
      if (!isPanningRef.current || !latestMouseEventRef.current) return;
      
      const event = latestMouseEventRef.current;
      const rect = containerRef.current.getBoundingClientRect();
      
      // Calculate pixel delta from pan start
      const deltaX = event.clientX - panStartRef.current.x;
      const deltaY = event.clientY - panStartRef.current.y;
      
      // Convert pixel delta to viewBox units
      // Scale factor: viewBox units per pixel
      const scaleX = viewBoxAtPanStartRef.current.width / rect.width;
      const scaleY = viewBoxAtPanStartRef.current.height / rect.height;
      
      // Calculate new viewBox position (negative because dragging right should move view left)
      const newViewBox = {
        x: viewBoxAtPanStartRef.current.x - deltaX * scaleX,
        y: viewBoxAtPanStartRef.current.y - deltaY * scaleY,
        width: viewBoxAtPanStartRef.current.width,
        height: viewBoxAtPanStartRef.current.height
      };
      
      // Constrain to bounds
      const constrained = constrainViewBox(newViewBox);
      
      // Update SVG directly for performance (bypass React)
      svgRef.current.setAttribute('viewBox', 
        `${constrained.x} ${constrained.y} ${constrained.width} ${constrained.height}`
      );
      
      // Update ref for sync on mouse up
      viewBoxRef.current = constrained;
    });
    
    e.preventDefault();
  }, [containerRef, svgRef, constrainViewBox]);

  /**
   * Handle mouse up - sync React state
   */
  const handleMouseUp = useCallback((e) => {
    if (!isPanningRef.current) return;
    
    // Cancel any pending animation frame
    if (panAnimationFrameRef.current) {
      cancelAnimationFrame(panAnimationFrameRef.current);
      panAnimationFrameRef.current = null;
    }
    
    // Sync React state with current viewBox
    setViewBox(viewBoxRef.current);
    
    // Reset state
    latestMouseEventRef.current = null;
    isPanningRef.current = false;
    endPan();
    
    e?.preventDefault();
  }, [setViewBox, endPan]);

  // === WHEEL ZOOM HANDLER ===

  /**
   * Handle wheel for zooming
   * Zooms toward/from mouse position
   */
  const handleWheel = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!containerRef.current || !svgRef.current) return;
    
    // Cancel any ongoing zoom animation
    if (zoomAnimationRef.current) {
      zoomAnimationRef.current();
      zoomAnimationRef.current = null;
    }
    
    const rect = containerRef.current.getBoundingClientRect();
    
    // Get mouse position in SVG coordinates
    const svgPoint = screenToSVG(e.clientX, e.clientY);
    if (!svgPoint) return;
    
    // Calculate zoom factor (positive deltaY = zoom out)
    const zoomFactor = e.deltaY > 0 ? 1.15 : 0.87;
    
    // Calculate new dimensions
    const currentVB = viewBoxRef.current;
    const newWidth = currentVB.width * zoomFactor;
    const newHeight = currentVB.height * zoomFactor;
    
    // Constrain dimensions
    const constrainedWidth = Math.max(VIEWBOX_WIDTH * MIN_ZOOM, Math.min(VIEWBOX_WIDTH * MAX_ZOOM, newWidth));
    const constrainedHeight = Math.max(VIEWBOX_HEIGHT * MIN_ZOOM, Math.min(VIEWBOX_HEIGHT * MAX_ZOOM, newHeight));
    
    // If we hit zoom limits, don't animate
    if (constrainedWidth === currentVB.width && constrainedHeight === currentVB.height) return;
    
    // Calculate mouse position as percentage of container
    const mouseXPercent = (e.clientX - rect.left) / rect.width;
    const mouseYPercent = (e.clientY - rect.top) / rect.height;
    
    // Calculate new position to keep mouse point stable
    const newX = svgPoint.x - mouseXPercent * constrainedWidth;
    const newY = svgPoint.y - mouseYPercent * constrainedHeight;
    
    // Create target viewBox
    const targetViewBox = constrainViewBox({
      x: newX,
      y: newY,
      width: constrainedWidth,
      height: constrainedHeight
    });
    
    // Smooth animation
    const startViewBox = { ...currentVB };
    const duration = ANIMATION.zoomTransition || 200;
    const startTime = performance.now();
    let animationFrameId = null;
    let cancelled = false;
    
    const animate = (currentTime) => {
      if (cancelled) return;
      
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease-out quad for snappy zoom
      const ease = 1 - (1 - progress) * (1 - progress);
      
      const interpolatedViewBox = {
        x: startViewBox.x + (targetViewBox.x - startViewBox.x) * ease,
        y: startViewBox.y + (targetViewBox.y - startViewBox.y) * ease,
        width: startViewBox.width + (targetViewBox.width - startViewBox.width) * ease,
        height: startViewBox.height + (targetViewBox.height - startViewBox.height) * ease
      };
      
      // Update both ref and state
      viewBoxRef.current = interpolatedViewBox;
      setViewBox(interpolatedViewBox);
      
      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animate);
      } else {
        zoomAnimationRef.current = null;
      }
    };
    
    animationFrameId = requestAnimationFrame(animate);
    
    // Store cancel function
    zoomAnimationRef.current = () => {
      cancelled = true;
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [containerRef, svgRef, screenToSVG, constrainViewBox, setViewBox]);

  // === TOUCH HANDLERS ===

  /**
   * Calculate distance between two touch points
   */
  const getTouchDistance = useCallback((touches) => {
    if (touches.length < 2) return 0;
    const dx = touches[1].clientX - touches[0].clientX;
    const dy = touches[1].clientY - touches[0].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }, []);

  /**
   * Get center point between two touches
   */
  const getTouchCenter = useCallback((touches) => {
    if (touches.length < 2) {
      return { x: touches[0].clientX, y: touches[0].clientY };
    }
    return {
      x: (touches[0].clientX + touches[1].clientX) / 2,
      y: (touches[0].clientY + touches[1].clientY) / 2
    };
  }, []);

  /**
   * Handle touch start
   */
  const handleTouchStart = useCallback((e) => {
    if (!containerRef.current || !svgRef.current) return;
    
    const touches = Array.from(e.touches);
    touchesRef.current = touches;
    
    if (touches.length === 1) {
      // Single touch - pan
      if (!isPannableTarget(e.target)) return;
      
      touchStartRef.current = { x: touches[0].clientX, y: touches[0].clientY };
      viewBoxAtPanStartRef.current = { ...viewBoxRef.current };
      isPanningRef.current = true;
      startPan();
      
    } else if (touches.length === 2) {
      // Two touches - pinch zoom
      initialPinchDistanceRef.current = getTouchDistance(touches);
      initialPinchViewBoxRef.current = { ...viewBoxRef.current };
      
      // If we were panning, stop
      if (isPanningRef.current) {
        isPanningRef.current = false;
        endPan();
      }
    }
    
    e.preventDefault();
  }, [containerRef, svgRef, isPannableTarget, startPan, endPan, getTouchDistance]);

  /**
   * Handle touch move
   */
  const handleTouchMove = useCallback((e) => {
    if (!containerRef.current || !svgRef.current) return;
    
    const touches = Array.from(e.touches);
    touchesRef.current = touches;
    
    if (touches.length === 1 && isPanningRef.current) {
      // Single touch panning
      const rect = containerRef.current.getBoundingClientRect();
      
      const deltaX = touches[0].clientX - touchStartRef.current.x;
      const deltaY = touches[0].clientY - touchStartRef.current.y;
      
      const scaleX = viewBoxAtPanStartRef.current.width / rect.width;
      const scaleY = viewBoxAtPanStartRef.current.height / rect.height;
      
      const newViewBox = constrainViewBox({
        x: viewBoxAtPanStartRef.current.x - deltaX * scaleX,
        y: viewBoxAtPanStartRef.current.y - deltaY * scaleY,
        width: viewBoxAtPanStartRef.current.width,
        height: viewBoxAtPanStartRef.current.height
      });
      
      // Update SVG directly
      svgRef.current.setAttribute('viewBox', 
        `${newViewBox.x} ${newViewBox.y} ${newViewBox.width} ${newViewBox.height}`
      );
      viewBoxRef.current = newViewBox;
      
    } else if (touches.length === 2 && initialPinchDistanceRef.current) {
      // Pinch zoom
      const currentDistance = getTouchDistance(touches);
      const scale = initialPinchDistanceRef.current / currentDistance;
      
      const center = getTouchCenter(touches);
      const svgCenter = screenToSVG(center.x, center.y);
      if (!svgCenter) return;
      
      const initialVB = initialPinchViewBoxRef.current;
      const newWidth = initialVB.width * scale;
      const newHeight = initialVB.height * scale;
      
      // Get container rect for percentage calculation
      const rect = containerRef.current.getBoundingClientRect();
      const centerXPercent = (center.x - rect.left) / rect.width;
      const centerYPercent = (center.y - rect.top) / rect.height;
      
      const newViewBox = constrainViewBox({
        x: svgCenter.x - centerXPercent * newWidth,
        y: svgCenter.y - centerYPercent * newHeight,
        width: newWidth,
        height: newHeight
      });
      
      // Update SVG directly
      svgRef.current.setAttribute('viewBox', 
        `${newViewBox.x} ${newViewBox.y} ${newViewBox.width} ${newViewBox.height}`
      );
      viewBoxRef.current = newViewBox;
    }
    
    e.preventDefault();
  }, [containerRef, svgRef, constrainViewBox, getTouchDistance, getTouchCenter, screenToSVG]);

  /**
   * Handle touch end
   */
  const handleTouchEnd = useCallback((e) => {
    const remainingTouches = Array.from(e.touches);
    
    if (remainingTouches.length === 0) {
      // All touches ended
      if (isPanningRef.current) {
        setViewBox(viewBoxRef.current);
        isPanningRef.current = false;
        endPan();
      }
      
      if (initialPinchDistanceRef.current) {
        setViewBox(viewBoxRef.current);
        initialPinchDistanceRef.current = null;
        initialPinchViewBoxRef.current = null;
      }
    } else if (remainingTouches.length === 1 && initialPinchDistanceRef.current) {
      // Went from pinch to single touch - start panning from current position
      touchStartRef.current = { x: remainingTouches[0].clientX, y: remainingTouches[0].clientY };
      viewBoxAtPanStartRef.current = { ...viewBoxRef.current };
      initialPinchDistanceRef.current = null;
      initialPinchViewBoxRef.current = null;
      isPanningRef.current = true;
      startPan();
    }
    
    touchesRef.current = remainingTouches;
    e.preventDefault();
  }, [setViewBox, endPan, startPan]);

  // === EFFECT: Window-level mouse listeners ===
  useEffect(() => {
    // Only attach window listeners when panning
    // Use refs in handlers to avoid stale closures
    
    const handleWindowMouseMove = (e) => {
      if (isPanningRef.current) {
        handleMouseMove(e);
      }
    };
    
    const handleWindowMouseUp = (e) => {
      if (isPanningRef.current) {
        handleMouseUp(e);
      }
    };
    
    // Always attach listeners but they check isPanningRef internally
    window.addEventListener('mousemove', handleWindowMouseMove, { passive: false });
    window.addEventListener('mouseup', handleWindowMouseUp);
    
    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  // === EFFECT: Non-passive wheel listener ===
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    // Must use addEventListener for non-passive wheel
    container.addEventListener('wheel', handleWheel, { passive: false });
    
    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, [containerRef, handleWheel]);

  // === EFFECT: Touch listeners ===
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: false });
    container.addEventListener('touchcancel', handleTouchEnd, { passive: false });
    
    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      container.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [containerRef, handleTouchStart, handleTouchMove, handleTouchEnd]);

  // === EFFECT: Panning cursor and selection styles ===
  useEffect(() => {
    if (isPanning) {
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'grabbing';
    } else {
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    }
    
    return () => {
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, [isPanning]);

  // === EFFECT: Cleanup on unmount ===
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
    // Note: handleWheel is attached via useEffect, not returned
    // Touch handlers are attached via useEffect, not returned
  };
}
