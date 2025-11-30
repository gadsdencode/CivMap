import { useEffect, useCallback } from 'react';

/**
 * Commercial-grade keyboard navigation hook
 * Provides WCAG 2.1 compliant keyboard navigation
 */
export const useKeyboardNavigation = ({
  onEscape,
  onEnter,
  onArrowUp,
  onArrowDown,
  onArrowLeft,
  onArrowRight,
  onTab,
  enabled = true
}) => {
  const handleKeyDown = useCallback((event) => {
    if (!enabled) return;

    // Prevent default only for keys we handle
    const handledKeys = ['Escape', 'Enter', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'];
    
    if (handledKeys.includes(event.key)) {
      switch (event.key) {
        case 'Escape':
          event.preventDefault();
          onEscape?.(event);
          break;
        case 'Enter':
          if (event.target.tagName !== 'INPUT' && event.target.tagName !== 'TEXTAREA') {
            event.preventDefault();
            onEnter?.(event);
          }
          break;
        case 'ArrowUp':
          event.preventDefault();
          onArrowUp?.(event);
          break;
        case 'ArrowDown':
          event.preventDefault();
          onArrowDown?.(event);
          break;
        case 'ArrowLeft':
          event.preventDefault();
          onArrowLeft?.(event);
          break;
        case 'ArrowRight':
          event.preventDefault();
          onArrowRight?.(event);
          break;
        case 'Tab':
          onTab?.(event);
          break;
      }
    }
  }, [enabled, onEscape, onEnter, onArrowUp, onArrowDown, onArrowLeft, onArrowRight, onTab]);

  useEffect(() => {
    if (enabled) {
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [enabled, handleKeyDown]);
};

/**
 * Focus trap hook for modals and overlays
 */
export const useFocusTrap = (isActive, containerRef) => {
  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const focusableElements = containerRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTab = (e) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    // Focus first element when trap activates
    firstElement?.focus();

    containerRef.current.addEventListener('keydown', handleTab);
    return () => {
      containerRef.current?.removeEventListener('keydown', handleTab);
    };
  }, [isActive, containerRef]);
};

