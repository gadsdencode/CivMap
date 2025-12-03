/**
 * InfoSidebar Component
 * Station details sidebar for the Civilization Metro Map
 * 
 * Separated from CivMap.jsx to maintain clean separation of concerns:
 * - Displays detailed information about selected stations
 * - Mobile-responsive with bottom-sheet behavior
 * - Includes journey navigation when in journey mode
 */

import React, { memo } from 'react';
import { X, TrendingUp, BookOpen, Info, ChevronRight } from 'lucide-react';

/**
 * Line color configuration
 */
const LINE_COLORS = {
  'Tech': 'bg-cyan-900/30 border-cyan-700/50 text-cyan-300',
  'Population': 'bg-green-900/30 border-green-700/50 text-green-300',
  'War': 'bg-red-900/30 border-red-700/50 text-red-300',
  'Empire': 'bg-purple-900/30 border-purple-700/50 text-purple-300',
  'Philosophy': 'bg-amber-900/30 border-amber-700/50 text-amber-300'
};

/**
 * Station Header Component
 * Displays station icon, name, year, and line badges
 */
const StationHeader = memo(function StationHeader({ station }) {
  return (
    <div className="flex items-start gap-4 mb-6">
      <div className="p-4 bg-gradient-to-br from-neutral-900 to-neutral-950 rounded-xl border border-neutral-800 shadow-inner">
        {station.icon}
      </div>
      <div className="flex-1">
        <div className="text-xs font-mono text-cyan-500 uppercase tracking-widest mb-2">
          Station ID: {station.yearLabel}
        </div>
        <h2 className="text-3xl font-bold text-white leading-tight mb-3">
          {station.name}
        </h2>
        
        {/* Quick Stats */}
        <div className="flex flex-wrap gap-3">
          {station.population && (
            <div className="px-3 py-1.5 bg-green-900/30 border border-green-700/50 rounded-lg">
              <div className="text-[10px] uppercase tracking-widest text-green-400 mb-0.5">
                Population
              </div>
              <div className="text-sm font-bold text-green-300">
                {station.population}
              </div>
            </div>
          )}
          {station.lines && (
            <div className="flex flex-wrap gap-1.5">
              {station.lines.map((line, idx) => (
                <span 
                  key={idx}
                  className={`px-2.5 py-1 text-[10px] uppercase tracking-widest border rounded-full ${LINE_COLORS[line] || 'bg-neutral-800 border-neutral-700 text-cyan-300'}`}
                >
                  {line}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

/**
 * Station Content Component
 * Displays visual, atmosphere, insight, and details sections
 */
const StationContent = memo(function StationContent({ station }) {
  return (
    <div className="space-y-6">
      {/* Visual Analysis - Most Important First */}
      <div className="group">
        <h3 className="text-xs uppercase tracking-widest text-cyan-400 mb-3 flex items-center gap-2 font-bold">
          <TrendingUp size={16} /> What You're Seeing
        </h3>
        <p className="text-neutral-200 leading-relaxed pl-5 border-l-3 border-purple-500/60 text-base">
          {station.visual}
        </p>
      </div>

      {/* Atmosphere - Emotional Connection */}
      <div className="group bg-gradient-to-br from-neutral-900/50 to-neutral-950/50 p-5 rounded-xl border border-cyan-900/30">
        <h3 className="text-xs uppercase tracking-widest text-cyan-400 mb-3 flex items-center gap-2 font-bold">
          <BookOpen size={16} /> The Experience
        </h3>
        <p className="text-lg font-serif italic text-cyan-100/90 leading-relaxed">
          "{station.atmosphere}"
        </p>
      </div>

      {/* Key Insight - Highlighted */}
      <div className="bg-gradient-to-br from-cyan-900/40 to-purple-900/40 p-6 rounded-xl border-2 border-cyan-500/30 hover:border-cyan-500/50 transition-colors shadow-lg">
        <h3 className="text-xs uppercase tracking-widest text-cyan-300 mb-3 flex items-center gap-2 font-bold">
          <Info size={16} /> Key Insight
        </h3>
        <p className="text-neutral-100 leading-relaxed text-base font-medium">
          {station.insight}
        </p>
      </div>

      {/* Details - Expandable Context */}
      <details className="group">
        <summary className="cursor-pointer text-xs uppercase tracking-widest text-neutral-500 mb-3 flex items-center gap-2 hover:text-cyan-400 transition-colors list-none">
          <ChevronRight className="w-4 h-4 transform group-open:rotate-90 transition-transform" />
          <span>Full Context</span>
        </summary>
        <div className="mt-3 p-4 bg-black/30 rounded-lg border border-white/5">
          <p className="text-sm text-neutral-400 leading-relaxed font-mono">
            {station.details}
          </p>
        </div>
      </details>
    </div>
  );
});

/**
 * Journey Navigation Component
 * Navigation controls for journey mode
 */
const JourneyNavigation = memo(function JourneyNavigation({
  journeyIndex,
  journeyStationsLength,
  onNavigateJourney
}) {
  return (
    <div className="mt-8 pt-6 border-t border-cyan-900/30">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-cyan-400">Journey Progress</span>
        <span className="text-xs text-neutral-500">
          {journeyIndex + 1} / {journeyStationsLength}
        </span>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => onNavigateJourney('prev')}
          className="flex-1 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 rounded text-sm text-white transition-colors"
        >
          ← Previous
        </button>
        <button
          onClick={() => onNavigateJourney('next')}
          className="flex-1 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded text-sm text-white transition-colors"
        >
          Next →
        </button>
      </div>
    </div>
  );
});

/**
 * Sidebar Footer Component
 * Bottom footer for the sidebar
 */
const SidebarFooter = memo(function SidebarFooter() {
  return (
    <div className="p-6 border-t border-neutral-800 bg-neutral-900/30">
      <div className="text-[10px] font-mono text-center text-neutral-600 uppercase tracking-[0.3em]">
        End of Data Stream
      </div>
    </div>
  );
});

/**
 * InfoSidebar Component
 * Main sidebar component that orchestrates all sub-components
 */
const InfoSidebar = memo(function InfoSidebar({
  // Station data
  activeData,
  
  // Journey state
  journeyMode,
  journeyIndex,
  journeyStations,
  
  // Actions
  onClose,
  onNavigateJourney
}) {
  return (
    <div 
      className={`
        absolute right-0 
        ${activeData ? 'bottom-0 md:top-0 md:bottom-auto' : 'bottom-[-100vh] md:top-0 md:bottom-auto'}
        h-[80vh] md:h-full
        w-full md:w-[420px] max-w-md
        bg-neutral-950/97 backdrop-blur-xl 
        border-t md:border-t-0 md:border-l border-cyan-900/50
        rounded-t-2xl md:rounded-none
        shadow-[-10px_0_30px_rgba(0,0,0,0.9)] z-30
        transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]
        ${activeData ? 'translate-y-0 md:translate-x-0' : 'translate-y-full md:translate-x-full'}
      `}
      role="complementary"
      aria-label="Station details sidebar"
      aria-hidden={!activeData}
    >
      {activeData && (
        <div className="flex flex-col h-full relative">
          {/* Close Button */}
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-neutral-500 hover:text-white hover:bg-neutral-800 rounded-full transition-colors z-10"
            aria-label="Close station details"
          >
            <X size={20} />
          </button>

          {/* Content */}
          <div className="p-8 overflow-y-auto custom-scrollbar">
            {/* Station Header */}
            <StationHeader station={activeData} />

            {/* Divider */}
            <div className="h-px w-full bg-gradient-to-r from-cyan-900 via-cyan-500/50 to-cyan-900 mb-6"></div>

            {/* Station Content */}
            <StationContent station={activeData} />

            {/* Journey Navigation (when in journey mode) */}
            {journeyMode && (
              <JourneyNavigation
                journeyIndex={journeyIndex}
                journeyStationsLength={journeyStations.length}
                onNavigateJourney={onNavigateJourney}
              />
            )}
          </div>

          {/* Sidebar Footer */}
          <SidebarFooter />
        </div>
      )}
    </div>
  );
});

// Named exports for sub-components
export { StationHeader, StationContent, JourneyNavigation, SidebarFooter };

// Default export for main component
export default InfoSidebar;

