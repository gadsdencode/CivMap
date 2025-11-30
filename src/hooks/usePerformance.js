import { useEffect, useRef, useCallback } from 'react';

/**
 * Performance monitoring hook
 * Tracks render performance and provides analytics hooks
 */
export const usePerformance = (componentName) => {
  const renderStartRef = useRef(null);
  const renderCountRef = useRef(0);

  useEffect(() => {
    renderStartRef.current = performance.now();
    renderCountRef.current += 1;

    return () => {
      if (renderStartRef.current) {
        const renderTime = performance.now() - renderStartRef.current;
        
        // Log slow renders (threshold: 16ms for 60fps)
        if (renderTime > 16) {
          console.warn(`[Performance] ${componentName} render took ${renderTime.toFixed(2)}ms`);
        }

        // Analytics hook (can be connected to analytics service)
        if (window.analytics && typeof window.analytics.track === 'function') {
          window.analytics.track('component_render', {
            component: componentName,
            renderTime,
            renderCount: renderCountRef.current
          });
        }
      }
    };
  });

  return {
    renderCount: renderCountRef.current
  };
};

/**
 * Debounce hook for performance optimization
 */
export const useDebounce = (callback, delay) => {
  const timeoutRef = useRef(null);

  const debouncedCallback = useCallback((...args) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedCallback;
};

/**
 * Throttle hook for performance optimization
 */
export const useThrottle = (callback, delay) => {
  const lastRunRef = useRef(Date.now());

  const throttledCallback = useCallback((...args) => {
    if (Date.now() - lastRunRef.current >= delay) {
      callback(...args);
      lastRunRef.current = Date.now();
    }
  }, [callback, delay]);

  return throttledCallback;
};

