/**
 * MapOverlay Component
 * Handles all UI overlay elements for the Civilization Metro Map
 * 
 * Separated from CivMap.jsx to maintain clean separation of concerns:
 * - CivMap.jsx: Core map logic, state management, and layout orchestration
 * - MapOverlay.jsx: Search, Filter, Legend, and control UI elements
 * 
 * This improves code maintainability and reduces the risk of breaking
 * core map logic when tweaking UI.
 */

import React, { memo } from 'react';
import { Search, Filter, Map, HelpCircle, X, Play } from 'lucide-react';

/**
 * Search Input Component
 * Handles station search with autocomplete-like behavior
 */
const SearchInput = memo(function SearchInput({
  searchQuery,
  onSearchChange,
  onClearSearch,
  onKeyDown,
  filteredStationsCount
}) {
  return (
    <div className="relative">
      <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-cyan-400/60" />
      <input
        type="text"
        id="station-finder"
        role="combobox"
        aria-expanded={searchQuery && filteredStationsCount > 0}
        aria-autocomplete="list"
        aria-controls="station-finder-results"
        aria-label="Search stations"
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder="Search..."
        className="pl-8 pr-7 py-1.5 bg-neutral-900/90 backdrop-blur-md border border-cyan-900/50 rounded-lg text-white text-sm placeholder-cyan-400/40 focus:outline-none focus:border-cyan-500 w-44"
        autoComplete="off"
      />
      {searchQuery && (
        <button
          onClick={onClearSearch}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-cyan-400/60 hover:text-white"
          aria-label="Clear search"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
});

/**
 * Search Results Dropdown Component
 * Displays filtered station results
 */
const SearchResults = memo(function SearchResults({
  filteredStations,
  onSelectStation,
  announce
}) {
  if (!filteredStations || filteredStations.length === 0) return null;

  return (
    <div
      id="station-finder-results"
      role="listbox"
      aria-label={`${filteredStations.length} stations found`}
      className="w-64 max-h-80 overflow-y-auto bg-neutral-900/95 backdrop-blur-md border border-cyan-900/50 rounded-lg shadow-2xl"
    >
      {filteredStations.slice(0, 8).map((station, idx) => (
        <button
          key={station.id}
          role="option"
          aria-selected={idx === 0}
          onClick={() => {
            onSelectStation(station);
            announce(`Navigated to ${station.name}`);
          }}
          className="w-full text-left p-2.5 hover:bg-neutral-800 border-b border-neutral-700/30 transition-colors focus:outline-none focus:bg-cyan-900/30"
        >
          <div className="font-medium text-white text-sm">{station.name}</div>
          <div className="text-xs text-cyan-400/70">{station.yearLabel}</div>
        </button>
      ))}
      {filteredStations.length > 8 && (
        <div className="p-2 text-xs text-neutral-500 text-center">
          +{filteredStations.length - 8} more
        </div>
      )}
    </div>
  );
});

/**
 * Filter Panel Component
 * Line visibility toggles, labels toggle, and era quick filters
 */
const FilterPanel = memo(function FilterPanel({
  visibleLines,
  showAllLabels,
  focusedEra,
  onToggleLine,
  onToggleLabels,
  onEraFilter
}) {
  const lineConfig = [
    { key: 'tech', label: 'Tech', color: 'bg-cyan-500' },
    { key: 'population', label: 'Population', color: 'bg-green-500' },
    { key: 'war', label: 'War', color: 'bg-red-500' },
    { key: 'empire', label: 'Empire', color: 'bg-purple-500' },
    { key: 'philosophy', label: 'Philosophy', color: 'bg-amber-500' }
  ];

  const eraConfig = [
    { label: 'All', range: null },
    { label: 'Ancient', range: [-10000, -1000] },
    { label: 'Classical', range: [-1000, 500] },
    { label: 'Medieval', range: [500, 1500] },
    { label: 'Modern', range: [1500, 1900] },
    { label: 'Now', range: [1900, 2025] }
  ];

  return (
    <div className="bg-neutral-900/95 backdrop-blur-md border border-cyan-900/50 rounded-lg p-3 shadow-xl w-56">
      <div className="text-[10px] uppercase tracking-widest text-cyan-500 mb-2">Lines</div>
      <div className="grid grid-cols-1 gap-1.5">
        {lineConfig.map(line => (
          <label key={line.key} className="flex items-center gap-2 cursor-pointer py-0.5">
            <input
              type="checkbox"
              checked={visibleLines[line.key]}
              onChange={() => onToggleLine(line.key)}
              className="w-3 h-3 rounded border-cyan-900/50 bg-neutral-800 text-cyan-500"
            />
            <div className={`w-3 h-3 rounded-full ${line.color} ${visibleLines[line.key] ? 'opacity-100' : 'opacity-30'}`}></div>
            <span className="text-xs text-neutral-300">{line.label}</span>
          </label>
        ))}
      </div>
      
      <div className="mt-2 pt-2 border-t border-cyan-900/30">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showAllLabels}
            onChange={onToggleLabels}
            className="w-3 h-3 rounded border-cyan-900/50 bg-neutral-800 text-cyan-500"
          />
          <span className="text-xs text-neutral-300">Show all labels</span>
        </label>
      </div>

      {/* Era Quick Filters */}
      <div className="mt-2 pt-2 border-t border-cyan-900/30">
        <div className="text-[10px] uppercase tracking-widest text-cyan-500 mb-1">Era</div>
        <div className="flex flex-wrap gap-1">
          {eraConfig.map(era => (
            <button
              key={era.label}
              onClick={() => onEraFilter(era.range)}
              className={`px-1.5 py-0.5 text-[10px] rounded ${
                JSON.stringify(focusedEra) === JSON.stringify(era.range)
                  ? 'bg-cyan-600 text-white'
                  : 'bg-neutral-800 text-neutral-400 hover:text-white'
              }`}
            >
              {era.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
});

/**
 * Journey Mode Controls Component
 * Navigation controls for guided tour mode
 */
const JourneyControls = memo(function JourneyControls({
  journeyIndex,
  journeyStationsLength,
  onNavigateJourney,
  onEndJourney
}) {
  return (
    <div className="bg-gradient-to-r from-cyan-900/90 to-purple-900/90 backdrop-blur-md border border-cyan-500/50 rounded-lg p-3 shadow-xl">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Play size={14} className="text-cyan-300" />
          <span className="text-xs font-bold text-white">Journey {journeyIndex + 1}/{journeyStationsLength}</span>
        </div>
        <button onClick={onEndJourney} className="text-cyan-400/60 hover:text-white">
          <X size={14} />
        </button>
      </div>
      <div className="flex gap-1.5">
        <button
          onClick={() => onNavigateJourney('prev')}
          className="flex-1 px-2 py-1 bg-neutral-800 hover:bg-neutral-700 rounded text-xs text-white"
        >
          ← Prev
        </button>
        <button
          onClick={() => onNavigateJourney('next')}
          className="flex-1 px-2 py-1 bg-cyan-600 hover:bg-cyan-500 rounded text-xs text-white"
        >
          Next →
        </button>
      </div>
    </div>
  );
});

/**
 * Legend Footer Component
 * Displays line color legend at the bottom of the map
 */
const LegendItem = memo(function LegendItem({ color, label }) {
  return (
    <div className="flex items-center gap-1.5 shrink-0">
      <div className={`w-2.5 h-2.5 rounded-full ${color}`}></div>
      <span className="text-[10px] uppercase tracking-wider text-neutral-400">{label}</span>
    </div>
  );
});

const LegendFooter = memo(function LegendFooter() {
  return (
    <footer className="h-10 bg-neutral-950/90 backdrop-blur-sm border-t border-neutral-800/50 flex items-center justify-center gap-6 px-4 z-20 shrink-0">
      <LegendItem color="bg-cyan-400" label="Tech" />
      <LegendItem color="bg-green-500" label="Population" />
      <LegendItem color="bg-red-500" label="War" />
      <LegendItem color="bg-purple-500" label="Empire" />
      <LegendItem color="bg-amber-500" label="Philosophy" />
    </footer>
  );
});

/**
 * Control Panel Component
 * Contains Search, Filter buttons, and Journey controls
 * Positioned absolute top-left of the map
 */
const ControlPanel = memo(function ControlPanel({
  // Visibility state
  showFilters,
  showMinimap,
  
  // Search state
  searchQuery,
  filteredStations,
  
  // Filter state
  visibleLines,
  showAllLabels,
  focusedEra,
  
  // Journey state
  journeyMode,
  journeyIndex,
  journeyStations,
  
  // Actions
  actions,
  navigateJourney,
  announce
}) {
  // Handle search keyboard events
  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter' && filteredStations.length > 0) {
      e.preventDefault();
      actions.centerOnStation(filteredStations[0]);
      actions.selectStation(filteredStations[0]);
      announce(`Navigated to ${filteredStations[0].name}`);
    }
    if (e.key === 'ArrowDown' && filteredStations.length > 0) {
      e.preventDefault();
      const firstResult = filteredStations[0];
      actions.centerOnStation(firstResult);
      announce(`Found ${filteredStations.length} stations.`);
    }
  };

  // Handle station selection from search results
  const handleSelectStation = (station) => {
    actions.centerOnStation(station);
    actions.selectStation(station);
  };

  return (
    <div className="absolute top-14 left-12 z-30 flex flex-col gap-2">
      {/* Top Row: Search + Quick Actions */}
      <div className="flex items-center gap-2">
        {/* Search Input */}
        <SearchInput
          searchQuery={searchQuery}
          onSearchChange={actions.setSearchQuery}
          onClearSearch={() => { actions.setSearchQuery(''); announce('Search cleared'); }}
          onKeyDown={handleSearchKeyDown}
          filteredStationsCount={filteredStations.length}
        />
        
        {/* Compact Icon Buttons */}
        <button
          onClick={() => actions.toggleFilters()}
          className={`p-1.5 backdrop-blur-md border rounded-lg transition-colors ${showFilters ? 'bg-cyan-900/50 border-cyan-500/50 text-cyan-300' : 'bg-neutral-900/90 border-cyan-900/50 text-cyan-400 hover:bg-neutral-800'}`}
          title="Filters"
          aria-label="Toggle filters"
        >
          <Filter size={18} />
        </button>
        <button
          onClick={() => actions.toggleMinimap()}
          className={`p-1.5 backdrop-blur-md border rounded-lg transition-colors ${showMinimap ? 'bg-cyan-900/50 border-cyan-500/50 text-cyan-300' : 'bg-neutral-900/90 border-cyan-900/50 text-cyan-400 hover:bg-neutral-800'}`}
          title={showMinimap ? "Hide Minimap" : "Show Minimap"}
          aria-label="Toggle minimap"
        >
          <Map size={18} />
        </button>
        <button
          onClick={() => actions.setWelcome(true)}
          className="p-1.5 bg-neutral-900/90 backdrop-blur-md border border-cyan-900/50 rounded-lg text-cyan-400 hover:bg-neutral-800 transition-colors"
          title="Help"
          aria-label="Show help"
        >
          <HelpCircle size={18} />
        </button>
      </div>
      
      {/* Search Results Dropdown */}
      {searchQuery && filteredStations.length > 0 && (
        <SearchResults
          filteredStations={filteredStations}
          onSelectStation={handleSelectStation}
          announce={announce}
        />
      )}

      {/* Filter Panel */}
      {showFilters && (
        <FilterPanel
          visibleLines={visibleLines}
          showAllLabels={showAllLabels}
          focusedEra={focusedEra}
          onToggleLine={actions.toggleLine}
          onToggleLabels={actions.toggleLabels}
          onEraFilter={actions.setEraFilter}
        />
      )}

      {/* Journey Mode Controls */}
      {journeyMode && (
        <JourneyControls
          journeyIndex={journeyIndex}
          journeyStationsLength={journeyStations.length}
          onNavigateJourney={navigateJourney}
          onEndJourney={actions.endJourney}
        />
      )}
    </div>
  );
});

/**
 * Main MapOverlay Component
 * Orchestrates all overlay UI elements - Control Panel only
 * LegendFooter is exported separately for correct positioning
 */
const MapOverlay = memo(function MapOverlay({
  // Visibility state
  showUI,
  showFilters,
  showMinimap,
  
  // Search state
  searchQuery,
  filteredStations,
  
  // Filter state
  visibleLines,
  showAllLabels,
  focusedEra,
  
  // Journey state
  journeyMode,
  journeyIndex,
  journeyStations,
  
  // Actions
  actions,
  navigateJourney,
  announce
}) {
  if (!showUI) return null;

  return (
    <ControlPanel
      showFilters={showFilters}
      showMinimap={showMinimap}
      searchQuery={searchQuery}
      filteredStations={filteredStations}
      visibleLines={visibleLines}
      showAllLabels={showAllLabels}
      focusedEra={focusedEra}
      journeyMode={journeyMode}
      journeyIndex={journeyIndex}
      journeyStations={journeyStations}
      actions={actions}
      navigateJourney={navigateJourney}
      announce={announce}
    />
  );
});

// Named exports for individual components (allows granular imports if needed)
export { 
  SearchInput, 
  SearchResults, 
  FilterPanel, 
  JourneyControls, 
  ControlPanel,
  LegendItem, 
  LegendFooter 
};

// Default export for the main orchestrating component
export default MapOverlay;

