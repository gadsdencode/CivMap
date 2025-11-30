import React from 'react';

/**
 * Commercial-grade accessible button component
 * Ensures WCAG 2.1 compliance
 */
const AccessibleButton = ({
  children,
  onClick,
  disabled = false,
  ariaLabel,
  ariaDescribedBy,
  className = '',
  variant = 'primary',
  size = 'md',
  type = 'button',
  ...props
}) => {
  const baseClasses = 'font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-neutral-900 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-cyan-600 hover:bg-cyan-500 text-white focus:ring-cyan-500',
    secondary: 'bg-neutral-800 hover:bg-neutral-700 text-white focus:ring-neutral-500',
    ghost: 'bg-transparent hover:bg-neutral-800 text-cyan-400 focus:ring-cyan-500',
    danger: 'bg-red-600 hover:bg-red-500 text-white focus:ring-red-500'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default AccessibleButton;

