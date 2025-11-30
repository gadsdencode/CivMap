import React from 'react';
import { Loader2 } from 'lucide-react';

export const LoadingSpinner = ({ size = 'md', className = '' }) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <Loader2 
      className={`${sizes[size]} animate-spin text-cyan-400 ${className}`}
      aria-label="Loading"
      role="status"
    >
      <span className="sr-only">Loading...</span>
    </Loader2>
  );
};

export const LoadingOverlay = ({ message = 'Loading...', fullScreen = true }) => {
  return (
    <div 
      className={`${fullScreen ? 'fixed inset-0' : 'absolute inset-0'} bg-neutral-950/90 backdrop-blur-sm flex items-center justify-center z-50`}
      role="status"
      aria-live="polite"
      aria-label={message}
    >
      <div className="text-center">
        <LoadingSpinner size="lg" className="mx-auto mb-4" />
        <p className="text-cyan-300 text-lg font-medium">{message}</p>
        <p className="text-neutral-500 text-sm mt-2">Please wait...</p>
      </div>
    </div>
  );
};

export const SkeletonLoader = ({ className = '' }) => {
  return (
    <div className={`animate-pulse bg-neutral-800 rounded ${className}`} aria-hidden="true" />
  );
};

