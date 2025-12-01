/**
 * Transition Utilities
 * Smooth easing functions for cinematic camera movements
 */

/**
 * Easing function: ease-in-out cubic
 * Smooth acceleration and deceleration
 */
export function easeInOutCubic(t) {
  return t < 0.5
    ? 4 * t * t * t
    : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/**
 * Easing function: ease-out exponential
 * Fast start, slow end
 */
export function easeOutExpo(t) {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

/**
 * Easing function: ease-in-out quint
 * More pronounced acceleration/deceleration
 */
export function easeInOutQuint(t) {
  return t < 0.5
    ? 16 * t * t * t * t * t
    : 1 - Math.pow(-2 * t + 2, 5) / 2;
}

/**
 * Animate a value from start to end over duration
 * @param {number} start - Starting value
 * @param {number} end - Ending value
 * @param {number} duration - Duration in milliseconds
 * @param {Function} easing - Easing function (default: easeInOutCubic)
 * @param {Function} onUpdate - Callback for each frame with current value
 * @param {Function} onComplete - Callback when animation completes
 * @returns {Function} Cancel function
 */
export function animateValue(start, end, duration, easing = easeInOutCubic, onUpdate, onComplete) {
  const startTime = performance.now();
  let animationFrameId = null;
  let cancelled = false;

  const animate = (currentTime) => {
    if (cancelled) return;

    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = easing(progress);
    const current = start + (end - start) * eased;

    onUpdate(current, progress);

    if (progress < 1) {
      animationFrameId = requestAnimationFrame(animate);
    } else {
      if (onComplete) onComplete();
    }
  };

  animationFrameId = requestAnimationFrame(animate);

  return () => {
    cancelled = true;
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
    }
  };
}

/**
 * Animate viewBox transition for smooth camera movement
 * @param {Object} startViewBox - Starting viewBox
 * @param {Object} endViewBox - Target viewBox
 * @param {number} duration - Duration in milliseconds
 * @param {Function} onUpdate - Callback with updated viewBox
 * @param {Function} onComplete - Callback when complete
 * @returns {Function} Cancel function
 */
export function animateViewBox(startViewBox, endViewBox, duration = 2000, onUpdate, onComplete) {
  const startTime = performance.now();
  let animationFrameId = null;
  let cancelled = false;

  const animate = (currentTime) => {
    if (cancelled) return;

    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = easeInOutCubic(progress);

    const currentViewBox = {
      x: startViewBox.x + (endViewBox.x - startViewBox.x) * eased,
      y: startViewBox.y + (endViewBox.y - startViewBox.y) * eased,
      width: startViewBox.width + (endViewBox.width - startViewBox.width) * eased,
      height: startViewBox.height + (endViewBox.height - startViewBox.height) * eased
    };

    onUpdate(currentViewBox);

    if (progress < 1) {
      animationFrameId = requestAnimationFrame(animate);
    } else {
      if (onComplete) onComplete();
    }
  };

  animationFrameId = requestAnimationFrame(animate);

  return () => {
    cancelled = true;
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
    }
  };
}

