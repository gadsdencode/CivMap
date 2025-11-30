/**
 * Human-Centric Empty States
 * Empathetic messaging for loading, errors, and empty results
 */

import React from 'react';
import { 
  Loader2, 
  AlertTriangle, 
  Search, 
  MapPin, 
  History,
  Compass
} from 'lucide-react';

/**
 * Loading state with contextual messaging
 */
export function LoadingState({ 
  message = "Loading...",
  subtext = "Preparing your journey through time"
}) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[300px] p-8 text-center">
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-cyan-500/20 rounded-full blur-xl animate-pulse" />
        <Loader2 className="w-12 h-12 text-cyan-400 animate-spin relative" />
      </div>
      <h3 className="text-xl font-bold text-white mb-2">{message}</h3>
      <p className="text-neutral-400 text-sm max-w-md">{subtext}</p>
      
      {/* Progress dots for visual feedback */}
      <div className="flex gap-1 mt-6">
        {[0, 1, 2].map(i => (
          <div 
            key={i}
            className="w-2 h-2 rounded-full bg-cyan-500 animate-bounce"
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Error state with recovery options
 */
export function ErrorState({ 
  title = "Something went wrong",
  message = "We couldn't load the map. Please try again.",
  onRetry,
  error
}) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[300px] p-8 text-center">
      <div className="p-4 bg-red-900/20 rounded-2xl mb-6">
        <AlertTriangle className="w-12 h-12 text-red-400" />
      </div>
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-neutral-400 text-sm max-w-md mb-6">{message}</p>
      
      {error && (
        <details className="mb-6 text-left max-w-md">
          <summary className="text-xs text-neutral-500 cursor-pointer hover:text-neutral-300">
            Technical details
          </summary>
          <pre className="mt-2 p-3 bg-neutral-900 rounded text-xs text-red-400 overflow-auto">
            {error.message || String(error)}
          </pre>
        </details>
      )}
      
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-medium transition-colors"
        >
          Try Again
        </button>
      )}
    </div>
  );
}

/**
 * Empty search results with suggestions
 */
export function NoSearchResults({ 
  query,
  onClearSearch,
  suggestions = []
}) {
  return (
    <div className="p-6 text-center">
      <div className="p-3 bg-amber-900/20 rounded-xl inline-block mb-4">
        <Search className="w-8 h-8 text-amber-400" />
      </div>
      <h3 className="text-lg font-bold text-white mb-2">
        No stations found for "{query}"
      </h3>
      <p className="text-neutral-400 text-sm mb-4">
        History is vast! Try a different search term or explore by era.
      </p>
      
      {suggestions.length > 0 && (
        <div className="mb-4">
          <p className="text-xs text-neutral-500 mb-2">Did you mean:</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {suggestions.map(s => (
              <button
                key={s}
                className="px-3 py-1 text-sm bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-full transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {onClearSearch && (
        <button
          onClick={onClearSearch}
          className="text-cyan-400 hover:text-cyan-300 text-sm underline underline-offset-2"
        >
          Clear search and show all stations
        </button>
      )}
    </div>
  );
}

/**
 * Welcome guidance when no station selected
 */
export function WelcomeGuidance({ onStartJourney }) {
  const tips = [
    { icon: MapPin, text: "Click any station to explore its story" },
    { icon: Search, text: "Use search to find specific events" },
    { icon: History, text: "Toggle lines to focus on specific themes" },
    { icon: Compass, text: "Try Journey Mode for a guided tour" }
  ];

  return (
    <div className="p-6 bg-gradient-to-br from-neutral-900/95 to-neutral-950/95 backdrop-blur-xl border border-cyan-900/50 rounded-xl max-w-md">
      <h3 className="text-lg font-bold text-white mb-2">
        Welcome, Traveler
      </h3>
      <p className="text-neutral-400 text-sm mb-4">
        You're about to explore 12,025 years of human civilization. 
        Each station tells a story of transformation.
      </p>
      
      <div className="space-y-3 mb-6">
        {tips.map(({ icon: Icon, text }, i) => (
          <div key={i} className="flex items-center gap-3 text-sm">
            <Icon className="w-4 h-4 text-cyan-500 flex-shrink-0" />
            <span className="text-neutral-300">{text}</span>
          </div>
        ))}
      </div>
      
      {onStartJourney && (
        <button
          onClick={onStartJourney}
          className="w-full px-4 py-3 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white rounded-lg font-medium transition-all"
        >
          Begin Guided Journey →
        </button>
      )}
    </div>
  );
}

/**
 * Journey completion celebration
 */
export function JourneyComplete({ onRestart, onExplore }) {
  return (
    <div className="p-8 text-center bg-gradient-to-br from-cyan-900/30 to-purple-900/30 rounded-2xl border border-cyan-500/30">
      <div className="text-5xl mb-4">🎉</div>
      <h3 className="text-2xl font-black text-white mb-2">
        Journey Complete!
      </h3>
      <p className="text-neutral-300 mb-6 max-w-sm mx-auto">
        You've traveled through 12,025 years of human history. 
        From the first settlements to the edge of AGI.
      </p>
      
      <div className="flex gap-3 justify-center">
        <button
          onClick={onRestart}
          className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition-colors"
        >
          Start Over
        </button>
        <button
          onClick={onExplore}
          className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition-colors"
        >
          Explore Freely
        </button>
      </div>
    </div>
  );
}

