import { useEffect, useRef, useCallback } from 'react';

/**
 * Commercial-grade accessibility hook
 * Provides ARIA announcements and screen reader support
 */
export const useAccessibility = () => {
  const announcementRef = useRef(null);

  const announce = useCallback((message, priority = 'polite') => {
    if (announcementRef.current) {
      announcementRef.current.textContent = message;
      announcementRef.current.setAttribute('aria-live', priority);
      
      // Clear after announcement
      setTimeout(() => {
        if (announcementRef.current) {
          announcementRef.current.textContent = '';
        }
      }, 1000);
    }
  }, []);

  useEffect(() => {
    // Create live region for announcements
    const liveRegion = document.createElement('div');
    liveRegion.setAttribute('role', 'status');
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.className = 'sr-only';
    liveRegion.style.cssText = 'position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); border: 0;';
    document.body.appendChild(liveRegion);
    announcementRef.current = liveRegion;

    return () => {
      if (announcementRef.current && announcementRef.current.parentNode) {
        announcementRef.current.parentNode.removeChild(announcementRef.current);
      }
    };
  }, []);

  return { announce };
};

/**
 * Hook for managing focus states
 */
export const useFocusManagement = () => {
  const previousFocusRef = useRef(null);

  const saveFocus = useCallback(() => {
    previousFocusRef.current = document.activeElement;
  }, []);

  const restoreFocus = useCallback(() => {
    if (previousFocusRef.current && previousFocusRef.current.focus) {
      previousFocusRef.current.focus();
      previousFocusRef.current = null;
    }
  }, []);

  const focusElement = useCallback((selector) => {
    const element = document.querySelector(selector);
    if (element && element.focus) {
      element.focus();
    }
  }, []);

  return { saveFocus, restoreFocus, focusElement };
};

