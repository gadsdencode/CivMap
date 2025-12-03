/**
 * Component Tests for EmptyStates.jsx
 * Tests loading, error, empty results, welcome, and journey complete states
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  LoadingState,
  ErrorState,
  NoSearchResults,
  WelcomeGuidance,
  JourneyComplete
} from './EmptyStates';

describe('LoadingState Component', () => {
  it('should render default loading message', () => {
    render(<LoadingState />);
    
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.getByText('Preparing your journey through time')).toBeInTheDocument();
  });

  it('should render custom message and subtext', () => {
    render(
      <LoadingState 
        message="Fetching data" 
        subtext="Please wait while we gather historical events" 
      />
    );
    
    expect(screen.getByText('Fetching data')).toBeInTheDocument();
    expect(screen.getByText('Please wait while we gather historical events')).toBeInTheDocument();
  });

  it('should render loading spinner animation', () => {
    const { container } = render(<LoadingState />);
    
    // Should have spinning loader
    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('should render bouncing progress dots', () => {
    const { container } = render(<LoadingState />);
    
    const dots = container.querySelectorAll('.animate-bounce');
    expect(dots.length).toBe(3);
  });
});

describe('ErrorState Component', () => {
  it('should render default error message', () => {
    render(<ErrorState />);
    
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText("We couldn't load the map. Please try again.")).toBeInTheDocument();
  });

  it('should render custom title and message', () => {
    render(
      <ErrorState 
        title="Network Error" 
        message="Unable to connect to the server" 
      />
    );
    
    expect(screen.getByText('Network Error')).toBeInTheDocument();
    expect(screen.getByText('Unable to connect to the server')).toBeInTheDocument();
  });

  it('should render retry button when onRetry provided', () => {
    const onRetry = vi.fn();
    render(<ErrorState onRetry={onRetry} />);
    
    const retryButton = screen.getByText('Try Again');
    expect(retryButton).toBeInTheDocument();
  });

  it('should call onRetry when retry button clicked', () => {
    const onRetry = vi.fn();
    render(<ErrorState onRetry={onRetry} />);
    
    fireEvent.click(screen.getByText('Try Again'));
    
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('should not render retry button when onRetry not provided', () => {
    render(<ErrorState />);
    
    expect(screen.queryByText('Try Again')).not.toBeInTheDocument();
  });

  it('should show technical details when error provided', () => {
    const error = new Error('Database connection failed');
    render(<ErrorState error={error} />);
    
    // Details should be collapsible
    const details = screen.getByText('Technical details');
    expect(details).toBeInTheDocument();
    
    // Click to expand
    fireEvent.click(details);
    
    expect(screen.getByText('Database connection failed')).toBeInTheDocument();
  });

  it('should handle string error', () => {
    render(<ErrorState error="Simple error string" />);
    
    fireEvent.click(screen.getByText('Technical details'));
    
    expect(screen.getByText('Simple error string')).toBeInTheDocument();
  });
});

describe('NoSearchResults Component', () => {
  it('should display the search query', () => {
    render(<NoSearchResults query="atlantis" />);
    
    expect(screen.getByText(/No stations found for "atlantis"/)).toBeInTheDocument();
  });

  it('should render clear search button when handler provided', () => {
    const onClearSearch = vi.fn();
    render(<NoSearchResults query="test" onClearSearch={onClearSearch} />);
    
    const clearButton = screen.getByText('Clear search and show all stations');
    expect(clearButton).toBeInTheDocument();
  });

  it('should call onClearSearch when clear button clicked', () => {
    const onClearSearch = vi.fn();
    render(<NoSearchResults query="test" onClearSearch={onClearSearch} />);
    
    fireEvent.click(screen.getByText('Clear search and show all stations'));
    
    expect(onClearSearch).toHaveBeenCalledTimes(1);
  });

  it('should render suggestions when provided', () => {
    const suggestions = ['Roman Empire', 'Rome', 'Roman Republic'];
    render(<NoSearchResults query="rome" suggestions={suggestions} />);
    
    expect(screen.getByText('Did you mean:')).toBeInTheDocument();
    expect(screen.getByText('Roman Empire')).toBeInTheDocument();
    expect(screen.getByText('Rome')).toBeInTheDocument();
    expect(screen.getByText('Roman Republic')).toBeInTheDocument();
  });

  it('should not render suggestions section when empty', () => {
    render(<NoSearchResults query="xyz" suggestions={[]} />);
    
    expect(screen.queryByText('Did you mean:')).not.toBeInTheDocument();
  });

  it('should display helpful guidance text', () => {
    render(<NoSearchResults query="test" />);
    
    expect(screen.getByText(/History is vast!/)).toBeInTheDocument();
  });
});

describe('WelcomeGuidance Component', () => {
  it('should render welcome title', () => {
    render(<WelcomeGuidance />);
    
    expect(screen.getByText('Welcome, Traveler')).toBeInTheDocument();
  });

  it('should render introductory description', () => {
    render(<WelcomeGuidance />);
    
    expect(screen.getByText(/12,025 years of human civilization/)).toBeInTheDocument();
  });

  it('should render all navigation tips', () => {
    render(<WelcomeGuidance />);
    
    expect(screen.getByText(/Click any station/)).toBeInTheDocument();
    expect(screen.getByText(/Use search/)).toBeInTheDocument();
    expect(screen.getByText(/Toggle lines/)).toBeInTheDocument();
    expect(screen.getByText(/Journey Mode/)).toBeInTheDocument();
  });

  it('should render journey button when handler provided', () => {
    const onStartJourney = vi.fn();
    render(<WelcomeGuidance onStartJourney={onStartJourney} />);
    
    const journeyButton = screen.getByText(/Begin Guided Journey/);
    expect(journeyButton).toBeInTheDocument();
  });

  it('should call onStartJourney when button clicked', () => {
    const onStartJourney = vi.fn();
    render(<WelcomeGuidance onStartJourney={onStartJourney} />);
    
    fireEvent.click(screen.getByText(/Begin Guided Journey/));
    
    expect(onStartJourney).toHaveBeenCalledTimes(1);
  });

  it('should not render journey button when handler not provided', () => {
    render(<WelcomeGuidance />);
    
    expect(screen.queryByText(/Begin Guided Journey/)).not.toBeInTheDocument();
  });
});

describe('JourneyComplete Component', () => {
  it('should render celebration heading', () => {
    render(<JourneyComplete onRestart={vi.fn()} onExplore={vi.fn()} />);
    
    expect(screen.getByText('Journey Complete!')).toBeInTheDocument();
  });

  it('should render celebration emoji', () => {
    render(<JourneyComplete onRestart={vi.fn()} onExplore={vi.fn()} />);
    
    expect(screen.getByText('🎉')).toBeInTheDocument();
  });

  it('should render completion message', () => {
    render(<JourneyComplete onRestart={vi.fn()} onExplore={vi.fn()} />);
    
    expect(screen.getByText(/12,025 years of human history/)).toBeInTheDocument();
  });

  it('should call onRestart when Start Over clicked', () => {
    const onRestart = vi.fn();
    render(<JourneyComplete onRestart={onRestart} onExplore={vi.fn()} />);
    
    fireEvent.click(screen.getByText('Start Over'));
    
    expect(onRestart).toHaveBeenCalledTimes(1);
  });

  it('should call onExplore when Explore Freely clicked', () => {
    const onExplore = vi.fn();
    render(<JourneyComplete onRestart={vi.fn()} onExplore={onExplore} />);
    
    fireEvent.click(screen.getByText('Explore Freely'));
    
    expect(onExplore).toHaveBeenCalledTimes(1);
  });

  it('should render both action buttons', () => {
    render(<JourneyComplete onRestart={vi.fn()} onExplore={vi.fn()} />);
    
    expect(screen.getByText('Start Over')).toBeInTheDocument();
    expect(screen.getByText('Explore Freely')).toBeInTheDocument();
  });
});

