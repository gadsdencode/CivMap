import React, { useState, useMemo, useEffect, useRef, Suspense, useCallback } from 'react';
import { Info, AlertTriangle, Users, Castle, BookOpen, Skull, Zap, X, Globe, Cpu, Smartphone, Atom, Gauge, Printer, Settings, ZoomIn, ZoomOut, Maximize2, Eye, EyeOff } from 'lucide-react';
import { useToast } from './hooks/useToast';
import { ToastContainer } from './components/Toast';
import { useKeyboardNavigation, useFocusTrap } from './hooks/useKeyboardNavigation';
import { useAccessibility, useFocusManagement } from './hooks/useAccessibility';
import { usePerformance, useDebounce, useThrottle } from './hooks/usePerformance';
import { LoadingOverlay, LoadingSpinner } from './components/Loading';
import AccessibleButton from './components/AccessibleButton';
import { generateSmoothPath, generateMetroPaths } from './src/utils/pathGenerator';
import { yearToX } from './src/utils/coordinates';
import { LINES, VIEWBOX as VIEWBOX_CONFIG, TIMELINE } from './src/constants/metroConfig';
import { useMapState } from './src/hooks/useMapState';
import { useMapController } from './src/hooks/useMapController';
import { processStations, ICON_TYPES } from './src/data/stations';
import { animateViewBox } from './src/utils/transitions';
import MapRenderer from './src/components/MapRenderer';
import MapOverlay, { LegendFooter } from './src/components/MapOverlay';
import WelcomeOverlay from './src/components/WelcomeOverlay';
import InfoSidebar from './src/components/InfoSidebar';

/**
 * Icon mapping function - converts icon type strings to JSX elements
 * Keeps JSX out of the data layer for cleaner separation of concerns
 */
const getStationIcon = (iconType, iconSize = 'normal', primaryLine) => {
  const sizeClass = iconSize === 'large' ? 'w-6 h-6' : 'w-5 h-5';
  
  // Color classes based on primary line
  const colorClasses = {
    'Tech': 'text-cyan-400',
    'War': 'text-red-400',
    'Population': 'text-green-400',
    'Philosophy': 'text-yellow-400',
    'Empire': 'text-purple-400'
  };
  const colorClass = colorClasses[primaryLine] || 'text-cyan-400';
  
  const iconMap = {
    [ICON_TYPES.USERS]: <Users className={`${sizeClass} ${colorClass}`} />,
    [ICON_TYPES.SETTINGS]: <Settings className={`${sizeClass} ${colorClass}`} />,
    [ICON_TYPES.CASTLE]: <Castle className={`${sizeClass} ${colorClass}`} />,
    [ICON_TYPES.BOOK]: <BookOpen className={`${sizeClass} ${colorClass}`} />,
    [ICON_TYPES.SKULL]: <Skull className={`${sizeClass} ${colorClass}`} />,
    [ICON_TYPES.ZAP]: <Zap className={`${sizeClass} ${colorClass}`} />,
    [ICON_TYPES.GLOBE]: <Globe className={`${sizeClass} ${colorClass}`} />,
    [ICON_TYPES.CPU]: <Cpu className={`${sizeClass} ${colorClass}`} />,
    [ICON_TYPES.SMARTPHONE]: <Smartphone className={`${sizeClass} ${colorClass}`} />,
    [ICON_TYPES.ATOM]: <Atom className={`${sizeClass} ${colorClass}`} />,
    [ICON_TYPES.GAUGE]: <Gauge className={`${sizeClass} ${colorClass}`} />,
    [ICON_TYPES.PRINTER]: <Printer className={`${sizeClass} ${colorClass}`} />,
    [ICON_TYPES.ALERT]: <AlertTriangle className={`${sizeClass} text-white`} />
  };
  
  return iconMap[iconType] || <Settings className={`${sizeClass} ${colorClass}`} />;
};

const CivilizationMetroMap = () => {
  // --- Performance Monitoring ---
  usePerformance('CivilizationMetroMap');

  // --- Commercial-Grade Hooks ---
  const { toasts, removeToast, success, error: showError, info } = useToast();
  const { announce } = useAccessibility();
  const { saveFocus, restoreFocus, focusElement } = useFocusManagement();
  
  // --- Constants & Coordinate System ---
  // Massive viewport to show the full scale of human civilization
  const VIEWBOX_WIDTH = 8000;
  const VIEWBOX_HEIGHT = 4000;
  
  // Local refs and state not managed by useMapState
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const welcomeRef = useRef(null);
  const journeyAnimationRef = useRef(null); // Ref to cancel journey animation

  // Debounced search for performance
  const debouncedSearchCallback = useCallback((query) => {
    if (query && announce) {
      announce(`Searching for ${query}`);
    }
  }, [announce]);
  
  const debouncedSearch = useDebounce(debouncedSearchCallback, 300);

  // Station data - processed from single source of truth (src/data/stations.js)
  // yearToX imported from src/utils/coordinates.js - single source of truth for coordinate calculations
  // Eliminates data duplication - updates to stations.js reflect everywhere
  const stations = useMemo(() => {
    // Get processed stations from central data source
    const baseStations = processStations();
    
    // Add JSX icons (kept at component level for proper React hygiene)
    return baseStations.map(station => ({
      ...station,
      icon: getStationIcon(station.iconType, station.iconSize, station.lines[0])
    }));
  }, []);

  // --- Centralized State Management ---
  // Must be called after stations is defined
  const { state, actions, navigateJourney: baseNavigateJourney, filteredStations: mapFilteredStations } = useMapState(stations);
  
  // Extract state for easier access
  const {
    isLoading,
    animationProgress,
    viewBox,
    isPanning,
    hoveredStationId,
    selectedStation,
    visibleLines,
    showWelcome,
    showFilters,
    showMinimap,
    showAllLabels,
    showUI,
    searchQuery,
    journeyMode,
    journeyIndex,
    focusedEra,
    error: loadError
  } = state;
  
  // Alias state for backward compatibility
  const hoveredStation = hoveredStationId;
  
  // Filtered and searchable stations
  // Use filtered stations from useMapState (already handles search and era filtering)
  const filteredStations = mapFilteredStations;
  
  // Journey stations - key milestones for guided tour
  const journeyStations = useMemo(() => [
    'neolithic', 'uruk', 'classical', 'columbian', 'industrial', 'crisis', 'singularity'
  ], []);
  
  // Focus trap for welcome modal
  useFocusTrap(showWelcome, welcomeRef);

  // Memoized paths - Dynamically generated from station data
  // We strictly use the 'stations' calculated above to ensure
  // the lines pass exactly through the station coordinates.
  const paths = useMemo(() => {
    return generateMetroPaths(yearToX, VIEWBOX_HEIGHT, stations);
  }, [yearToX, stations]);

  // Calculate current zoom level for LOD (Level of Detail)
  // VIEWBOX_WIDTH is 8000. If viewBox.width is 8000, zoom is 1. If 4000, zoom is 2.
  const currentZoom = useMemo(() => {
    return VIEWBOX_WIDTH / viewBox.width;
  }, [viewBox.width]);

  // MEDIUM PRIORITY: Label collision detection - prevent overlap in dense areas
  // Calculate label offsets for visible stations to avoid overlap
  const labelOffsets = useMemo(() => {
    if (currentZoom <= 0.6) return {}; // Only apply at detail zoom levels
    
    const offsets = {};
    const labelHeight = 30; // Approximate label height
    const minLabelGap = 40; // Minimum vertical gap between labels
    const visibleLabels = filteredStations
      .filter(s => {
        const isHovered = hoveredStation === s.id;
        const isSelected = selectedStation?.id === s.id;
        const isInJourney = journeyMode && journeyStations[journeyIndex] === s.id;
        const isSearchMatch = searchQuery && (s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.yearLabel.toLowerCase().includes(searchQuery.toLowerCase()));
        return showAllLabels || isHovered || isSelected || isInJourney || isSearchMatch;
      })
      .map(s => ({
        id: s.id,
        x: s.coords.x,
        y: Math.min(...s.lines.map(l => {
          const lineYPositions = {
            'Tech': 0.18 * VIEWBOX_CONFIG.HEIGHT,
            'War': 0.36 * VIEWBOX_CONFIG.HEIGHT,
            'Population': 0.50 * VIEWBOX_CONFIG.HEIGHT,
            'Philosophy': 0.64 * VIEWBOX_CONFIG.HEIGHT,
            'Empire': 0.82 * VIEWBOX_CONFIG.HEIGHT
          };
          return lineYPositions[l] || 0;
        })) - 30, // Label Y position
        priority: (selectedStation?.id === s.id ? 3 : hoveredStation === s.id ? 2 : 1) // Higher priority = less offset
      }))
      .sort((a, b) => a.x - b.x); // Sort by X position
    
    // Simple collision detection: check nearby labels and apply vertical offsets
    for (let i = 0; i < visibleLabels.length; i++) {
      const current = visibleLabels[i];
      let offsetY = 0;
      let maxOffset = 0;
      
      // Check for collisions with previous labels
      for (let j = 0; j < i; j++) {
        const other = visibleLabels[j];
        const distanceX = Math.abs(current.x - other.x);
        const distanceY = Math.abs(current.y - (other.y + offsets[other.id] || 0));
        
        // If labels are close horizontally and would overlap vertically
        if (distanceX < 200 && distanceY < minLabelGap) {
          const requiredOffset = minLabelGap - distanceY + (offsets[other.id] || 0);
          maxOffset = Math.max(maxOffset, requiredOffset);
        }
      }
      
      // Apply offset (higher priority labels get less offset)
      offsetY = maxOffset / current.priority;
      offsets[current.id] = offsetY;
    }
    
    return offsets;
  }, [filteredStations, currentZoom, showAllLabels, hoveredStation, selectedStation, journeyMode, journeyIndex, journeyStations, searchQuery]);

  // Determine narrative focus: Which line should be highlighted based on selected station?
  const narrativeFocusLine = useMemo(() => {
    if (!selectedStation || !selectedStation.lines || selectedStation.lines.length === 0) {
      return null;
    }
    // Focus on the primary line (first line) of the selected station
    return selectedStation.lines[0].toLowerCase();
  }, [selectedStation]);

  // Initialize viewBox on mount - Human-Centric: Show meaningful overview
  useEffect(() => {
    try {
      // Start with a view that shows the full timeline width but focused on the middle
      // This gives users a sense of the full scope while being centered
      const initialWidth = VIEWBOX_WIDTH * 0.8;
      const initialHeight = VIEWBOX_HEIGHT * 0.7;
      actions.setViewBox({ 
        x: VIEWBOX_WIDTH * 0.1, 
        y: VIEWBOX_HEIGHT * 0.15, 
        width: initialWidth, 
        height: initialHeight 
      });
      
      // Simulate loading time for smooth experience
      const loadTimer = setTimeout(() => {
        actions.setLoading(false);
        announce('Civilization Map loaded successfully');
      }, 800);

      return () => clearTimeout(loadTimer);
    } catch (err) {
      actions.setError(err);
      actions.setLoading(false);
      showError('Failed to initialize map. Please refresh the page.');
      console.error('Initialization error:', err);
    }
  }, [announce, showError, actions]);

  // Animate path drawing on mount with error handling
  useEffect(() => {
    if (isLoading) return;
    
    try {
      const duration = 3000;
      const startTime = Date.now();
      const animate = () => {
        try {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(elapsed / duration, 1);
          actions.setAnimationProgress(progress);
          if (progress < 1) {
            requestAnimationFrame(animate);
          } else {
            announce('Map animation complete');
          }
        } catch (err) {
          console.error('Animation error:', err);
          actions.setAnimationProgress(1); // Complete animation on error
        }
      };
      animate();
    } catch (err) {
      console.error('Animation setup error:', err);
      actions.setAnimationProgress(1);
    }
  }, [isLoading, announce, actions]);

  // LOW PRIORITY: Extract map controller logic into custom hook for maintainability
  // Note: Wheel and touch handlers are attached via useEffect in the hook
  const { handleMouseDown, handleMouseMove, handleMouseUp } = useMapController({
    viewBox,
    setViewBox: actions.setViewBox,
    isPanning,
    startPan: actions.startPan,
    endPan: actions.endPan,
    containerRef,
    svgRef
  });

  // Zoom control functions - use actions from useMapState
  const zoomIn = () => actions.zoomIn();
  const zoomOut = () => actions.zoomOut();
  const resetView = () => actions.resetView();

  const fitToView = () => {
    if (!containerRef.current) return;
    const containerWidth = containerRef.current.clientWidth;
    const containerHeight = containerRef.current.clientHeight;
    const aspectRatio = VIEWBOX_WIDTH / VIEWBOX_HEIGHT;
    const containerAspect = containerWidth / containerHeight;

    let newWidth, newHeight;
    if (containerAspect > aspectRatio) {
      newHeight = VIEWBOX_HEIGHT;
      newWidth = VIEWBOX_HEIGHT * containerAspect;
    } else {
      newWidth = VIEWBOX_WIDTH;
      newHeight = VIEWBOX_WIDTH / containerAspect;
    }

    actions.setViewBox({
      x: (VIEWBOX_WIDTH - newWidth) / 2,
      y: (VIEWBOX_HEIGHT - newHeight) / 2,
      width: newWidth,
      height: newHeight
    });
  };


  // Time axis markers - more granular for the massive timeline
  const timeMarkers = useMemo(() => {
    const markers = [];
    // More markers to show the full scale
    const years = [
      -10000, -8000, -6000, -4000, -3000, -2000, -1000, 
      -500, 0, 500, 1000, 1200, 1400, 1500, 1600, 1700, 
      1800, 1850, 1900, 1950, 2000, 2010, 2025
    ];
    years.forEach(year => {
      if (year >= TIMELINE.START && year <= TIMELINE.END) {
        markers.push({
          year,
          label: year < 0 ? `${Math.abs(year)} BCE` : year === 0 ? '1 CE' : `${year} CE`,
          x: yearToX(year)
        });
      }
    });
    return markers;
  }, []);
  
  // CRITICAL: Override journey navigation with cinematic camera transitions
  const navigateJourney = useCallback((direction) => {
    // Cancel any existing journey animation
    if (journeyAnimationRef.current) {
      journeyAnimationRef.current();
      journeyAnimationRef.current = null;
    }
    
    if (!stations.length) return;
    
    const journeyStationIds = journeyStations;
    const currentIndex = journeyIndex;
    
    let nextIndex;
    if (direction === 'next') {
      nextIndex = (currentIndex + 1) % journeyStationIds.length;
    } else {
      nextIndex = (currentIndex - 1 + journeyStationIds.length) % journeyStationIds.length;
    }
    
    const nextStation = stations.find(s => s.id === journeyStationIds[nextIndex]);
    if (!nextStation) return;
    
    // Calculate target viewBox
    const targetViewBox = {
      x: nextStation.coords.x - viewBox.width / 2,
      y: nextStation.coords.y - viewBox.height / 2,
      width: viewBox.width,
      height: viewBox.height
    };
    
    // Constrain target viewBox
    const constrainedTarget = {
      x: Math.max(0, Math.min(VIEWBOX_WIDTH - targetViewBox.width, targetViewBox.x)),
      y: Math.max(0, Math.min(VIEWBOX_HEIGHT - targetViewBox.height, targetViewBox.y)),
      width: targetViewBox.width,
      height: targetViewBox.height
    };
    
    // Start cinematic transition
    const startViewBox = { ...viewBox };
    journeyAnimationRef.current = animateViewBox(
      startViewBox,
      constrainedTarget,
      2000, // 2 second smooth transition
      (currentViewBox) => {
        // Update viewBox during animation
        actions.setViewBox(currentViewBox);
      },
      () => {
        // Animation complete - update journey state
        baseNavigateJourney(direction);
        actions.selectStation(nextStation);
        journeyAnimationRef.current = null;
      }
    );
    
    // Update journey state immediately (for UI feedback)
    if (direction === 'next') {
      actions.journeyNext(nextStation);
    } else {
      actions.journeyPrev(nextStation);
    }
  }, [stations, journeyIndex, journeyStations, viewBox, actions, baseNavigateJourney]);
  
  // Cleanup journey animation on unmount
  useEffect(() => {
    return () => {
      if (journeyAnimationRef.current) {
        journeyAnimationRef.current();
      }
    };
  }, []);

  // Only show sidebar for SELECTED stations (clicked), not on hover
  // This prevents flickering when the sidebar overlaps with far-right stations
  const activeData = selectedStation;
  
  // Hover data for tooltip (separate from sidebar)
  const hoveredData = hoveredStation ? stations.find(s => s.id === hoveredStation) : null;

  // Keyboard Navigation - Commercial-Grade
  useKeyboardNavigation({
    onEscape: () => {
      if (showWelcome) {
        actions.setWelcome(false);
        announce('Welcome overlay closed');
      } else if (selectedStation) {
        actions.clearSelection();
        announce('Station details closed');
      } else if (showFilters) {
        actions.toggleFilters();
        announce('Filters panel closed');
      }
    },
    onEnter: () => {
      if (showWelcome && !journeyMode) {
        actions.setWelcome(false);
        announce('Starting exploration');
      }
    },
    enabled: !isLoading
  });

  // Error state handling
  if (loadError) {
    return (
      <div className="flex flex-col h-screen w-full bg-neutral-950 text-cyan-50 font-sans overflow-hidden items-center justify-center p-4">
        <div className="max-w-md text-center">
          <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" aria-hidden="true" />
          <h2 className="text-2xl font-bold text-white mb-2">Failed to Load Map</h2>
          <p className="text-neutral-400 mb-6">{loadError.message || 'An unexpected error occurred'}</p>
          <AccessibleButton
            onClick={() => window.location.reload()}
            variant="primary"
            ariaLabel="Reload the application"
          >
            Reload Application
          </AccessibleButton>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="flex flex-col h-screen w-full bg-neutral-950 text-cyan-50 font-sans overflow-hidden selection:bg-cyan-500/30"
      role="application"
      aria-label="Civilization Map - Interactive timeline visualization"
    >
      {/* Loading State */}
      {isLoading && <LoadingOverlay message="Loading Civilization Map..." />}
      
      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      
      {/* Welcome Overlay - Extracted to WelcomeOverlay component */}
      <WelcomeOverlay
        isVisible={showWelcome}
        stations={stations}
        journeyStations={journeyStations}
        actions={actions}
        saveFocus={saveFocus}
        restoreFocus={restoreFocus}
        announce={announce}
        success={success}
        showError={showError}
        info={info}
      />

      {/* --- UI Toggle Button (Always Visible) --- */}
      <button
        onClick={() => actions.toggleUI()}
        className="absolute top-3 left-3 z-50 p-1.5 bg-neutral-900/90 backdrop-blur-md border border-cyan-900/50 rounded-lg text-cyan-400 hover:bg-neutral-800 hover:text-cyan-300 transition-all shadow-lg"
        title={showUI ? "Hide UI (maximize map)" : "Show UI"}
        aria-label={showUI ? "Hide user interface" : "Show user interface"}
      >
        {showUI ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>

      {/* --- Header - Compact --- */}
      {showUI && (
        <header className="absolute top-2 left-12 z-20 pointer-events-none">
          <h1 className="text-xl font-black tracking-tight uppercase text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">
            Civilization Map
          </h1>
          <p className="text-[10px] text-cyan-400/50 uppercase tracking-widest">12,025 Years of History</p>
        </header>
      )}

      {/* Human-Centric Control Panel - Extracted to MapOverlay */}
      <MapOverlay
        showUI={showUI}
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

      {/* --- Main Viewport --- */}
      <div className="flex-1 relative flex">
        
        {/* SVG Canvas Container - Pan and Zoom enabled */}
        {/* Note: Wheel and touch events are attached via useEffect in useMapController */}
        <div 
          ref={containerRef}
          className="flex-1 relative overflow-hidden bg-neutral-950"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{ 
            cursor: isPanning ? 'grabbing' : 'grab',
            touchAction: 'none' // Prevent browser handling of touch events
          }}
        >
          {/* Panning indicator */}
          {isPanning && (
            <div className="absolute top-4 left-4 z-30 px-4 py-2 bg-cyan-900/80 backdrop-blur-md border border-cyan-500/50 rounded-lg text-cyan-300 font-mono text-sm shadow-2xl animate-pulse">
              Panning... Release to stop
            </div>
          )}
          {/* Background Grid & Texture - Scaled for larger viewport */}
          <div className="absolute inset-0 z-0 pointer-events-none opacity-20 bg-[linear-gradient(rgba(34,211,238,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.1)_1px,transparent_1px)] bg-[size:100px_100px]"></div>
          <div className="absolute inset-0 z-0 pointer-events-none opacity-10 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
          
          {/* Zoom Controls - Compact */}
          {showUI && (
          <div className="absolute top-3 right-3 z-30 flex flex-col gap-1 bg-neutral-900/90 backdrop-blur-md border border-cyan-900/50 rounded-lg p-1.5 shadow-xl">
            <button
              onClick={zoomIn}
              className="p-1.5 text-cyan-400 hover:text-cyan-300 hover:bg-neutral-800 rounded transition-colors"
              title="Zoom In"
            >
              <ZoomIn size={16} />
            </button>
            <button
              onClick={zoomOut}
              className="p-1.5 text-cyan-400 hover:text-cyan-300 hover:bg-neutral-800 rounded transition-colors"
              title="Zoom Out"
            >
              <ZoomOut size={16} />
            </button>
            <div className="h-px bg-cyan-900/30 my-0.5"></div>
            <button
              onClick={resetView}
              className="p-1.5 text-cyan-400 hover:text-cyan-300 hover:bg-neutral-800 rounded transition-colors"
              title="Reset View"
            >
              <Maximize2 size={16} />
            </button>
            <div className="px-1 py-0.5 text-[10px] text-cyan-500/60 font-mono text-center">
              {Math.round(currentZoom * 10) / 10}x
            </div>
          </div>
          )}
          
          <MapRenderer
            svgRef={svgRef}
            viewBox={viewBox}
            paths={paths}
            stations={stations}
            filteredStations={filteredStations}
            visibleLines={visibleLines}
            animationProgress={animationProgress}
            narrativeFocusLine={narrativeFocusLine}
            hoveredStation={hoveredStation}
            selectedStation={selectedStation}
            journeyMode={journeyMode}
            journeyIndex={journeyIndex}
            journeyStations={journeyStations}
            searchQuery={searchQuery}
            showAllLabels={showAllLabels}
            currentZoom={currentZoom}
            labelOffsets={labelOffsets}
            timeMarkers={timeMarkers}
            VIEWBOX_WIDTH={VIEWBOX_WIDTH}
            VIEWBOX_HEIGHT={VIEWBOX_HEIGHT}
            onStationHover={actions.hoverStation}
            onStationSelect={actions.selectStation}
            onStationJourneyGoTo={actions.journeyGoTo}
          />

          {/* Minimap - Human-Centric Spatial Orientation */}
          {showUI && showMinimap && (
            <div className="absolute bottom-4 right-4 z-30 bg-neutral-900/95 backdrop-blur-md border border-cyan-900/50 rounded-lg p-3 shadow-2xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest">Overview</span>
                <button
                  onClick={() => actions.toggleMinimap()}
                  className="text-cyan-400/60 hover:text-white"
                >
                  <X size={14} />
                </button>
              </div>
              <svg 
                width="200" 
                height="100" 
                viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
                className="border border-cyan-900/30 rounded bg-neutral-950"
                preserveAspectRatio="xMidYMid meet"
                style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}
              >
                {/* Minimap background */}
                <rect width={VIEWBOX_WIDTH} height={VIEWBOX_HEIGHT} fill="rgba(10,10,10,0.9)" />
                
                {/* Minimap grid for reference */}
                <defs>
                  <pattern id="minimapGrid" width="400" height="200" patternUnits="userSpaceOnUse">
                    <line x1="0" y1="0" x2="0" y2="200" stroke="rgba(34,211,238,0.1)" strokeWidth="1" />
                    <line x1="0" y1="0" x2="400" y2="0" stroke="rgba(34,211,238,0.1)" strokeWidth="1" />
                  </pattern>
                </defs>
                <rect width={VIEWBOX_WIDTH} height={VIEWBOX_HEIGHT} fill="url(#minimapGrid)" />
                
                {/* Minimap lines (simplified, thicker for visibility) */}
                {visibleLines.tech && (
                  <path d={paths.blue} fill="none" stroke="#22d3ee" strokeWidth="4" opacity="0.7" />
                )}
                {visibleLines.population && (
                  <path d={typeof paths.green === 'string' ? paths.green : paths.green.main} fill="none" stroke="#22c55e" strokeWidth="4" opacity="0.7" />
                )}
                {visibleLines.war && (
                  <path d={paths.red} fill="none" stroke="#ef4444" strokeWidth="4" opacity="0.7" />
                )}
                {visibleLines.empire && (
                  <path d={paths.purple} fill="none" stroke="#9333ea" strokeWidth="4" opacity="0.7" />
                )}
                {visibleLines.philosophy && (
                  <path d={paths.orange} fill="none" stroke="#fbbf24" strokeWidth="4" opacity="0.5" />
                )}
                
                {/* Current viewport indicator - more prominent */}
                <rect
                  x={viewBox.x}
                  y={viewBox.y}
                  width={viewBox.width}
                  height={viewBox.height}
                  fill="rgba(34,211,238,0.1)"
                  stroke="#22d3ee"
                  strokeWidth="4"
                  strokeDasharray="6,3"
                  opacity="0.9"
                  className="cursor-pointer"
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const svg = e.currentTarget.ownerSVGElement;
                    const svgPoint = svg.createSVGPoint();
                    svgPoint.x = e.clientX - rect.left;
                    svgPoint.y = e.clientY - rect.top;
                    const point = svgPoint.matrixTransform(svg.getScreenCTM().inverse());
                    
                    actions.setViewBox({
                      ...viewBox,
                      x: Math.max(0, Math.min(VIEWBOX_WIDTH - viewBox.width, point.x - viewBox.width / 2)),
                      y: Math.max(0, Math.min(VIEWBOX_HEIGHT - viewBox.height, point.y - viewBox.height / 2))
                    });
                  }}
                />
                
                {/* Key stations on minimap - more visible */}
                {stations.filter(s => ['neolithic', 'uruk', 'columbian', 'industrial', 'crisis', 'singularity'].includes(s.id)).map(s => (
                  <circle
                    key={s.id}
                    cx={s.coords.x}
                    cy={s.coords.y}
                    r="12"
                    fill={s.color}
                    stroke="#000"
                    strokeWidth="2"
                    opacity="0.9"
                    className="cursor-pointer"
                    onClick={() => {
                      actions.centerOnStation(s);
                    }}
                  />
                ))}
              </svg>
              <button
                onClick={() => {
                  const centerX = VIEWBOX_WIDTH / 2 - viewBox.width / 2;
                  const centerY = VIEWBOX_HEIGHT / 2 - viewBox.height / 2;
                  actions.setViewBox({
                    ...viewBox,
                    x: Math.max(0, Math.min(VIEWBOX_WIDTH - viewBox.width, centerX)),
                    y: Math.max(0, Math.min(VIEWBOX_HEIGHT - viewBox.height, centerY))
                  });
                }}
                className="mt-2 w-full px-3 py-1.5 text-xs bg-cyan-900/50 hover:bg-cyan-900/70 text-cyan-300 rounded transition-colors"
              >
                Center View
              </button>
            </div>
          )}

          {/* Hover Tooltip - Shows station name/year on hover without full sidebar */}
          {/* Uses pointer-events-none to prevent flickering */}
          {hoveredData && !selectedStation && (
            <div 
              className="absolute z-50 pointer-events-none"
              style={{
                // Position tooltip near the hovered station but avoid edges
                left: Math.min(
                  Math.max(20, (hoveredData.coords.x - viewBox.x) / viewBox.width * (containerRef.current?.clientWidth || 800) - 100),
                  (containerRef.current?.clientWidth || 800) - 280
                ),
                top: Math.max(80, (hoveredData.coords.y - viewBox.y) / viewBox.height * (containerRef.current?.clientHeight || 600) - 80)
              }}
            >
              <div className="bg-neutral-900/95 backdrop-blur-md border border-cyan-500/50 rounded-lg px-4 py-3 shadow-2xl shadow-cyan-900/20 min-w-[200px] max-w-[260px]">
                <div className="text-xs font-mono text-cyan-400 uppercase tracking-widest mb-1">
                  {hoveredData.yearLabel}
                </div>
                <div className="text-base font-bold text-white leading-tight mb-2">
                  {hoveredData.name}
                </div>
                <div className="flex flex-wrap gap-1">
                  {hoveredData.lines?.map((line, idx) => {
                    const lineColors = {
                      'Tech': 'bg-cyan-500',
                      'Population': 'bg-green-500',
                      'War': 'bg-red-500',
                      'Empire': 'bg-purple-500',
                      'Philosophy': 'bg-amber-500'
                    };
                    return (
                      <span 
                        key={idx}
                        className={`w-2 h-2 rounded-full ${lineColors[line] || 'bg-gray-500'}`}
                      />
                    );
                  })}
                </div>
                <div className="text-[10px] text-cyan-400/60 mt-2 uppercase tracking-wider">
                  Click to view details
                </div>
              </div>
            </div>
          )}

          {/* Timeline Axis - Compact Overlay */}
          {showUI && (
            <div className="absolute bottom-10 left-0 right-0 z-40 bg-neutral-950/80 backdrop-blur-sm px-3 py-1.5 pointer-events-none">
              <div className="flex items-center justify-between max-w-full overflow-x-auto gap-3">
                <div className="flex items-center gap-3 min-w-max">
                  {timeMarkers
                    .filter(marker => {
                      const markerX = marker.x;
                      return markerX >= viewBox.x - 200 && markerX <= viewBox.x + viewBox.width + 200;
                    })
                    .map((marker, idx) => (
                      <span key={idx} className="text-[10px] font-mono text-cyan-400/60 whitespace-nowrap">
                        {marker.label}
                      </span>
                    ))}
                </div>
                <span className="text-[9px] font-mono text-cyan-500/40 whitespace-nowrap">
                  {Math.round(currentZoom * 10) / 10}x
                </span>
              </div>
            </div>
          )}

          {/* Prompt when idle - Human-Centric Guidance */}
          {/* Only show when UI is visible AND no station is selected AND no search active */}
          {showUI && !activeData && !searchQuery && (
            <div className="absolute bottom-20 left-4 p-4 bg-neutral-900/90 backdrop-blur-md border border-cyan-900/40 rounded-lg text-cyan-400/80 text-sm max-w-xs shadow-xl z-20">
              <div className="flex items-start gap-2 mb-2">
                <Info className="w-4 h-4 text-cyan-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs leading-relaxed">
                  Click any <strong>station</strong> to explore. Use <strong>scroll</strong> to zoom, <strong>drag</strong> to pan.
                </p>
              </div>
              <button 
                onClick={() => actions.setWelcome(true)}
                className="text-[10px] text-cyan-500 hover:text-cyan-300 uppercase tracking-wider"
              >
                Show full guide →
              </button>
            </div>
          )}
        </div>

        {/* Info Sidebar - Extracted to InfoSidebar component */}
        <InfoSidebar
          activeData={activeData}
          journeyMode={journeyMode}
          journeyIndex={journeyIndex}
          journeyStations={journeyStations}
          onClose={() => actions.clearSelection()}
          onNavigateJourney={navigateJourney}
        />
      </div>

      {/* Legend Footer - Extracted to MapOverlay */}
      {showUI && <LegendFooter />}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.3); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #475569; }
        
        @keyframes pathDraw {
          from {
            stroke-dashoffset: 100%;
          }
          to {
            stroke-dashoffset: 0%;
          }
        }
      `}</style>
    </div>
  );
};

export default CivilizationMetroMap;