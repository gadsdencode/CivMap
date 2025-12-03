/**
 * Component Tests for Toast.jsx
 * Tests rendering, auto-dismiss, accessibility, and container management
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import Toast, { ToastContainer } from './Toast';

describe('Toast Component', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('rendering', () => {
    it('should render the toast message', () => {
      render(<Toast message="Test message" onClose={vi.fn()} />);
      
      expect(screen.getByText('Test message')).toBeInTheDocument();
    });

    it('should render with correct ARIA role', () => {
      render(<Toast message="Test message" onClose={vi.fn()} />);
      
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('should have close button with accessible label', () => {
      render(<Toast message="Test" onClose={vi.fn()} />);
      
      const closeButton = screen.getByLabelText('Close notification');
      expect(closeButton).toBeInTheDocument();
    });
  });

  describe('toast types', () => {
    it('should render success toast with correct styling', () => {
      const { container } = render(
        <Toast message="Success!" type="success" onClose={vi.fn()} />
      );
      
      const toast = container.firstChild;
      expect(toast.className).toContain('bg-green');
    });

    it('should render error toast with correct styling', () => {
      const { container } = render(
        <Toast message="Error!" type="error" onClose={vi.fn()} />
      );
      
      const toast = container.firstChild;
      expect(toast.className).toContain('bg-red');
    });

    it('should render warning toast with correct styling', () => {
      const { container } = render(
        <Toast message="Warning!" type="warning" onClose={vi.fn()} />
      );
      
      const toast = container.firstChild;
      expect(toast.className).toContain('bg-amber');
    });

    it('should render info toast by default', () => {
      const { container } = render(
        <Toast message="Info" onClose={vi.fn()} />
      );
      
      const toast = container.firstChild;
      expect(toast.className).toContain('bg-cyan');
    });
  });

  describe('accessibility - aria-live', () => {
    it('should use assertive aria-live for errors', () => {
      render(<Toast message="Error" type="error" onClose={vi.fn()} />);
      
      const alert = screen.getByRole('alert');
      expect(alert).toHaveAttribute('aria-live', 'assertive');
    });

    it('should use polite aria-live for non-errors', () => {
      render(<Toast message="Info" type="info" onClose={vi.fn()} />);
      
      const alert = screen.getByRole('alert');
      expect(alert).toHaveAttribute('aria-live', 'polite');
    });

    it('should use polite for success type', () => {
      render(<Toast message="Success" type="success" onClose={vi.fn()} />);
      
      const alert = screen.getByRole('alert');
      expect(alert).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('auto-dismiss', () => {
    it('should call onClose after default duration (5000ms)', async () => {
      const onClose = vi.fn();
      render(<Toast message="Auto dismiss" onClose={onClose} />);
      
      expect(onClose).not.toHaveBeenCalled();
      
      act(() => {
        vi.advanceTimersByTime(5000);
      });
      
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose after custom duration', () => {
      const onClose = vi.fn();
      render(<Toast message="Custom duration" onClose={onClose} duration={3000} />);
      
      act(() => {
        vi.advanceTimersByTime(2999);
      });
      expect(onClose).not.toHaveBeenCalled();
      
      act(() => {
        vi.advanceTimersByTime(1);
      });
      expect(onClose).toHaveBeenCalled();
    });

    it('should not auto-dismiss when duration is 0', () => {
      const onClose = vi.fn();
      render(<Toast message="Persistent" onClose={onClose} duration={0} />);
      
      act(() => {
        vi.advanceTimersByTime(10000);
      });
      
      expect(onClose).not.toHaveBeenCalled();
    });

    it('should cleanup timer on unmount', () => {
      const onClose = vi.fn();
      const { unmount } = render(
        <Toast message="Cleanup test" onClose={onClose} duration={5000} />
      );
      
      act(() => {
        vi.advanceTimersByTime(2000);
      });
      
      unmount();
      
      act(() => {
        vi.advanceTimersByTime(5000);
      });
      
      // Should not have been called since component unmounted
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('manual dismiss', () => {
    it('should call onClose when close button is clicked', () => {
      const onClose = vi.fn();
      render(<Toast message="Click to close" onClose={onClose} />);
      
      const closeButton = screen.getByLabelText('Close notification');
      fireEvent.click(closeButton);
      
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });
});

describe('ToastContainer Component', () => {
  it('should render multiple toasts', () => {
    const toasts = [
      { id: '1', message: 'Toast 1', type: 'info' },
      { id: '2', message: 'Toast 2', type: 'success' },
      { id: '3', message: 'Toast 3', type: 'error' }
    ];
    
    render(<ToastContainer toasts={toasts} removeToast={vi.fn()} />);
    
    expect(screen.getByText('Toast 1')).toBeInTheDocument();
    expect(screen.getByText('Toast 2')).toBeInTheDocument();
    expect(screen.getByText('Toast 3')).toBeInTheDocument();
  });

  it('should call removeToast with correct id when toast is dismissed', () => {
    const removeToast = vi.fn();
    const toasts = [
      { id: 'toast-123', message: 'Dismissible', type: 'info' }
    ];
    
    render(<ToastContainer toasts={toasts} removeToast={removeToast} />);
    
    const closeButton = screen.getByLabelText('Close notification');
    fireEvent.click(closeButton);
    
    expect(removeToast).toHaveBeenCalledWith('toast-123');
  });

  it('should render empty when no toasts', () => {
    const { container } = render(
      <ToastContainer toasts={[]} removeToast={vi.fn()} />
    );
    
    // Container should exist but have no toast children
    const toastElements = container.querySelectorAll('[role="alert"]');
    expect(toastElements.length).toBe(0);
  });

  it('should position container at top-right with high z-index', () => {
    const { container } = render(
      <ToastContainer toasts={[{ id: '1', message: 'Positioned' }]} removeToast={vi.fn()} />
    );
    
    const toastContainer = container.firstChild;
    expect(toastContainer.className).toContain('fixed');
    expect(toastContainer.className).toContain('top-4');
    expect(toastContainer.className).toContain('right-4');
    expect(toastContainer.className).toContain('z-[100]');
  });

  it('should pass custom duration to individual toasts', () => {
    vi.useFakeTimers();
    const removeToast = vi.fn();
    const toasts = [
      { id: '1', message: 'Custom duration', type: 'info', duration: 2000 }
    ];
    
    render(<ToastContainer toasts={toasts} removeToast={removeToast} />);
    
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    
    expect(removeToast).toHaveBeenCalledWith('1');
    vi.useRealTimers();
  });

  it('should maintain ARIA attributes for accessibility', () => {
    const { container } = render(
      <ToastContainer toasts={[]} removeToast={vi.fn()} />
    );
    
    const toastContainer = container.firstChild;
    expect(toastContainer).toHaveAttribute('aria-live', 'polite');
    expect(toastContainer).toHaveAttribute('aria-atomic', 'false');
  });
});

