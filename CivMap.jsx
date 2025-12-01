import React, { useState, useMemo, useEffect, useRef, Suspense, useCallback } from 'react';
import { Info, AlertTriangle, TrendingUp, Users, Castle, BookOpen, Skull, Zap, X, Globe, Cpu, Smartphone, Atom, Gauge, Printer, Settings, ZoomIn, ZoomOut, Maximize2, Move, Search, Filter, Play, Eye, EyeOff, Map, HelpCircle, ChevronRight } from 'lucide-react';
import { useToast } from './hooks/useToast';
import { ToastContainer } from './components/Toast';
import { useKeyboardNavigation, useFocusTrap } from './hooks/useKeyboardNavigation';
import { useAccessibility, useFocusManagement } from './hooks/useAccessibility';
import { usePerformance, useDebounce, useThrottle } from './hooks/usePerformance';
import { LoadingOverlay, LoadingSpinner } from './components/Loading';
import AccessibleButton from './components/AccessibleButton';
import { MetroLine, Station } from './src/components/metro';
import { generateSmoothPath, generateMetroPaths } from './src/utils/pathGenerator';
import { yearToX } from './src/utils/coordinates';
import { LINES, VIEWBOX as VIEWBOX_CONFIG, TIMELINE } from './src/constants/metroConfig';
import { useMapState } from './src/hooks/useMapState';
import { processStations, ICON_TYPES } from './src/data/stations';
import { animateViewBox } from './src/utils/transitions';

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
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const viewBoxStartRef = useRef({ x: 0, y: 0 });
  const svgPointStartRef = useRef({ x: 0, y: 0 }); // SVG coordinate where pan started
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const welcomeRef = useRef(null);
  const panTransformRef = useRef({ x: 0, y: 0 }); // Current pan transform offset
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
  
  // Focus trap for welcome modal
  useFocusTrap(showWelcome, welcomeRef);

  // Memoized paths - Dynamically generated from station data
  // We strictly use the 'stations' calculated above to ensure
  // the lines pass exactly through the station coordinates.
  const paths = useMemo(() => {
    return generateMetroPaths(yearToX, VIEWBOX_HEIGHT, stations);
  }, [yearToX, stations]);

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
        announce('Civilization Metro Map loaded successfully');
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

  // Throttled pan update using requestAnimationFrame for smooth performance
  const panAnimationFrameRef = useRef(null);
  const latestMouseEventRef = useRef(null);

  // Check if the click target is an interactive element (station, button, etc.)
  const isInteractiveElement = useCallback((target) => {
    if (!target) return false;
    
    // Check if target or any parent has a class indicating it's interactive
    let element = target;
    while (element && element !== containerRef.current && element !== document.body) {
      // Check for station elements (g elements with station class)
      if (element.classList && element.classList.contains('station')) {
        return true;
      }
      // Check for buttons and other interactive elements
      if (element.tagName === 'BUTTON' || element.tagName === 'A' || 
          element.closest && (element.closest('button') || element.closest('a'))) {
        return true;
      }
      // Check if it's a text element that's part of a station label
      if (element.tagName === 'text' && element.closest && element.closest('.station')) {
        return true;
      }
      // Check for input elements
      if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA' || element.tagName === 'SELECT') {
        return true;
      }
      element = element.parentElement;
    }
    return false;
  }, []);

  const handleMouseDown = useCallback((e) => {
    // Only pan if clicking on background (not on stations or interactive elements)
    const target = e.target;
    
    // Check if clicking on an interactive element (stations call stopPropagation, so this is a safety check)
    const isInteractive = isInteractiveElement(target);
    
    // Only start panning on left mouse button
    if (e.button !== 0) return;
    
    // Don't pan if clicking on interactive elements
    if (isInteractive) return;
    
    // Allow panning on container div or SVG background elements
    // Stations already call stopPropagation, so their clicks won't reach here
    const isContainer = target === containerRef.current;
    const isSvgBackground = target.tagName === 'svg' || 
                            target.tagName === 'path' || 
                            target.tagName === 'line' ||
                            target.tagName === 'defs' ||
                            (target.tagName === 'text' && !target.closest?.('.station')) ||
                            (target.tagName === 'g' && !target.classList?.contains('station'));
    
    if ((isContainer || isSvgBackground) && svgRef.current && containerRef.current) {
      // Store screen coordinates for mouse tracking
      setPanStart({ x: e.clientX, y: e.clientY });
      
      // Store initial viewBox position
      viewBoxStartRef.current = { x: viewBox.x, y: viewBox.y, width: viewBox.width, height: viewBox.height };
      
      // Convert initial mouse position to SVG coordinates using proper transformation
      const rect = containerRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      const svgPoint = svgRef.current.createSVGPoint();
      svgPoint.x = mouseX;
      svgPoint.y = mouseY;
      const pointInSvg = svgPoint.matrixTransform(svgRef.current.getScreenCTM().inverse());
      svgPointStartRef.current = { x: pointInSvg.x, y: pointInSvg.y };
      
      actions.startPan();
      e.preventDefault();
      e.stopPropagation();
    }
  }, [isInteractiveElement, viewBox, actions]);

  const handleMouseMove = useCallback((e) => {
    if (isPanning && containerRef.current && svgRef.current) {
      try {
        // Store latest mouse event for throttled processing
        latestMouseEventRef.current = e;
        
        // CRITICAL PERFORMANCE FIX: Throttle with requestAnimationFrame for smooth 60fps
        // Update viewBox directly (not CSS transform) to avoid coordinate system conflicts
        if (!panAnimationFrameRef.current) {
          panAnimationFrameRef.current = requestAnimationFrame(() => {
            panAnimationFrameRef.current = null;
            
            if (!isPanning || !containerRef.current || !svgRef.current || !latestMouseEventRef.current) {
              return;
            }
            
            const event = latestMouseEventRef.current;
            const rect = containerRef.current.getBoundingClientRect();
            const mouseX = event.clientX - rect.left;
            const mouseY = event.clientY - rect.top;
            
            // Convert current mouse position to SVG coordinates using transformation matrix
            const svgPoint = svgRef.current.createSVGPoint();
            svgPoint.x = mouseX;
            svgPoint.y = mouseY;
            const currentPointInSvg = svgPoint.matrixTransform(svgRef.current.getScreenCTM().inverse());
            
            // Calculate delta in SVG coordinate space
            const dx = svgPointStartRef.current.x - currentPointInSvg.x;
            const dy = svgPointStartRef.current.y - currentPointInSvg.y;
            
            // Update viewBox directly with the delta (already in SVG coordinates)
            const newViewBox = {
              ...viewBoxStartRef.current,
              x: viewBoxStartRef.current.x + dx,
              y: viewBoxStartRef.current.y + dy
            };
            
            // Update React state - this will trigger a render but is necessary for correctness
            actions.setViewBox(newViewBox);
          });
        }
        
        e.preventDefault();
      } catch (err) {
        console.error('Pan error:', err);
        actions.endPan();
      }
    }
  }, [isPanning, actions]);

  const handleMouseUp = useCallback((e) => {
    if (isPanning) {
      // Cancel any pending pan animation frame
      if (panAnimationFrameRef.current) {
        cancelAnimationFrame(panAnimationFrameRef.current);
        panAnimationFrameRef.current = null;
      }
      
      // Process final mouse position if there's a pending event
      if (latestMouseEventRef.current && containerRef.current && svgRef.current) {
        const event = latestMouseEventRef.current;
        const rect = containerRef.current.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;
        
        const svgPoint = svgRef.current.createSVGPoint();
        svgPoint.x = mouseX;
        svgPoint.y = mouseY;
        const currentPointInSvg = svgPoint.matrixTransform(svgRef.current.getScreenCTM().inverse());
        
        const dx = svgPointStartRef.current.x - currentPointInSvg.x;
        const dy = svgPointStartRef.current.y - currentPointInSvg.y;
        
        const finalViewBox = {
          ...viewBoxStartRef.current,
          x: viewBoxStartRef.current.x + dx,
          y: viewBoxStartRef.current.y + dy
        };
        
        actions.setViewBox(finalViewBox);
      }
      
      latestMouseEventRef.current = null;
      actions.endPan();
      e?.preventDefault();
    }
  }, [isPanning, actions]);

  // Attach mouse move and up listeners to window for better drag experience
  useEffect(() => {
    if (isPanning) {
      const handleWindowMouseMove = (e) => {
        handleMouseMove(e);
      };
      const handleWindowMouseUp = (e) => {
        handleMouseUp(e);
      };

      window.addEventListener('mousemove', handleWindowMouseMove);
      window.addEventListener('mouseup', handleWindowMouseUp);
      // Prevent text selection while dragging
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'grabbing';

      return () => {
        window.removeEventListener('mousemove', handleWindowMouseMove);
        window.removeEventListener('mouseup', handleWindowMouseUp);
        document.body.style.userSelect = '';
        document.body.style.cursor = '';
      };
    }
  }, [isPanning, handleMouseMove, handleMouseUp]);

  const handleWheel = (e) => {
    e.preventDefault();
    const zoomFactor = e.deltaY > 0 ? 1.15 : 0.85; // Zoom factor (smoother)
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect || !svgRef.current) return;

    // Get mouse position relative to container
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Get current SVG point under cursor
    const svgPoint = svgRef.current.createSVGPoint();
    svgPoint.x = mouseX;
    svgPoint.y = mouseY;
    const pointInSvg = svgPoint.matrixTransform(svgRef.current.getScreenCTM().inverse());

    // Calculate new viewBox dimensions
    const newWidth = viewBox.width * zoomFactor;
    const newHeight = viewBox.height * zoomFactor;

    // Constrain zoom levels
    const minZoom = 0.05; // Can zoom out to see 20x the full map
    const maxZoom = 20; // Can zoom in 20x
    const constrainedWidth = Math.max(VIEWBOX_WIDTH * minZoom, Math.min(VIEWBOX_WIDTH * maxZoom, newWidth));
    const constrainedHeight = Math.max(VIEWBOX_HEIGHT * minZoom, Math.min(VIEWBOX_HEIGHT * maxZoom, newHeight));

    // Calculate zoom ratio (actual zoom applied)
    const actualZoom = constrainedWidth / viewBox.width;

    // Zoom to cursor point: keep the point under cursor in the same screen position
    const newX = pointInSvg.x - (mouseX / rect.width) * constrainedWidth;
    const newY = pointInSvg.y - (mouseY / rect.height) * constrainedHeight;

    actions.setViewBox({
      x: Math.max(0, Math.min(VIEWBOX_WIDTH - constrainedWidth, newX)),
      y: Math.max(0, Math.min(VIEWBOX_HEIGHT - constrainedHeight, newY)),
      width: constrainedWidth,
      height: constrainedHeight
    });
  };

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

  // Filtered and searchable stations
  // Use filtered stations from useMapState (already handles search and era filtering)
  const filteredStations = mapFilteredStations;

  // Journey stations - key milestones for guided tour
  const journeyStations = useMemo(() => [
    'neolithic', 'uruk', 'classical', 'columbian', 'industrial', 'crisis', 'singularity'
  ], []);
  
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

  const activeData = selectedStation || (hoveredStation ? stations.find(s => s.id === hoveredStation) : null);

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
      aria-label="Civilization Metro Map - Interactive timeline visualization"
    >
      {/* Loading State */}
      {isLoading && <LoadingOverlay message="Loading Civilization Metro Map..." />}
      
      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      
      {/* Welcome Overlay - Human-Centric Onboarding */}
      {showWelcome && (
        <div className="absolute inset-0 z-50 bg-neutral-950/95 backdrop-blur-xl flex items-center justify-center">
          <div className="max-w-2xl mx-4 bg-neutral-900/95 border border-cyan-900/50 rounded-2xl p-8 shadow-2xl">
            <div className="text-center mb-8">
              <h2 className="text-4xl font-black mb-4 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">
                Welcome to the Civilization Metro Map
              </h2>
              <p className="text-cyan-300/80 text-lg">
                Explore 12,025 years of human history through an interactive transit map
              </p>
            </div>
            
            <div className="space-y-6 mb-8">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-cyan-900/30 rounded-lg">
                  <Move className="w-6 h-6 text-cyan-400" />
                </div>
                <div>
                  <h3 className="font-bold text-white mb-1">Navigate</h3>
                  <p className="text-neutral-400 text-sm">Click and drag to pan • Scroll to zoom • Use controls for precise navigation</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="p-2 bg-purple-900/30 rounded-lg">
                  <Castle className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <h3 className="font-bold text-white mb-1">Explore Stations</h3>
                  <p className="text-neutral-400 text-sm">Click any station to learn about pivotal moments in human civilization</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="p-2 bg-amber-900/30 rounded-lg">
                  <Filter className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                  <h3 className="font-bold text-white mb-1">Filter & Focus</h3>
                  <p className="text-neutral-400 text-sm">Toggle lines, search stations, or take a guided journey through key moments</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="p-2 bg-green-900/30 rounded-lg">
                  <Users className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <h3 className="font-bold text-white mb-1">Five Lines of History</h3>
                  <p className="text-neutral-400 text-sm">Tech (Blue) • Population (Green) • War (Red) • Empire (Purple) • Philosophy (Orange)</p>
                </div>
              </div>
            </div>
            
            <div className="flex gap-4">
              <AccessibleButton
                onClick={() => {
                  try {
                    saveFocus();
                    const firstStation = stations.find(s => s.id === journeyStations[0]);
                    if (firstStation) {
                      actions.startJourney(firstStation);
                      announce(`Starting journey at ${firstStation.name}`);
                      success('Journey mode activated');
                    }
                    restoreFocus();
                  } catch (err) {
                    showError('Failed to start journey. Please try again.');
                    console.error('Journey start error:', err);
                  }
                }}
                variant="primary"
                size="lg"
                className="flex-1 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400"
                ariaLabel="Start guided journey through key historical moments"
              >
                <Play className="w-5 h-5 inline mr-2" aria-hidden="true" />
                Start Journey
              </AccessibleButton>
              <AccessibleButton
                onClick={() => {
                  actions.setWelcome(false);
                  announce('Welcome overlay closed. You can now explore freely.');
                  info('Tip: Use search to find specific events');
                }}
                variant="secondary"
                size="lg"
                className="flex-1"
                ariaLabel="Close welcome overlay and explore freely"
              >
                Explore Freely
              </AccessibleButton>
            </div>
          </div>
        </div>
      )}

      {/* --- UI Toggle Button (Always Visible) --- */}
      <button
        onClick={() => actions.toggleUI()}
        className="absolute top-4 left-4 z-50 p-2 bg-neutral-900/90 backdrop-blur-md border border-cyan-900/50 rounded-lg text-cyan-400 hover:bg-neutral-800 hover:text-cyan-300 transition-all shadow-lg"
        title={showUI ? "Hide UI (maximize map)" : "Show UI"}
        aria-label={showUI ? "Hide user interface" : "Show user interface"}
      >
        {showUI ? <EyeOff size={20} /> : <Eye size={20} />}
      </button>

      {/* --- Header --- */}
      {showUI && (
        <header className="absolute top-0 left-14 p-6 z-20 pointer-events-none">
          <h1 className="text-4xl font-black tracking-tighter uppercase text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]">
            Civilization Metro Map
          </h1>
          <div className="flex items-center gap-2 mt-2">
            <span className="animate-pulse w-2 h-2 rounded-full bg-green-500"></span>
            <p className="text-xs text-cyan-300/60 uppercase tracking-widest">Full Scale Visualization • 12,025 Years • Piecewise Time Axis</p>
          </div>
        </header>
      )}

      {/* Human-Centric Control Panel */}
      {showUI && (
      <div className="absolute top-20 left-4 z-30 flex flex-col gap-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-cyan-400/60" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => actions.setSearchQuery(e.target.value)}
            placeholder="Search stations..."
            className="pl-10 pr-4 py-2 bg-neutral-900/90 backdrop-blur-md border border-cyan-900/50 rounded-lg text-white text-sm placeholder-cyan-400/40 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 w-64"
          />
          {searchQuery && (
            <button
              onClick={() => actions.setSearchQuery('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-cyan-400/60 hover:text-white"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Filter Toggle */}
        <button
          onClick={() => actions.toggleFilters()}
          className="flex items-center gap-2 px-4 py-2 bg-neutral-900/90 backdrop-blur-md border border-cyan-900/50 rounded-lg text-cyan-400 hover:bg-neutral-800 transition-colors text-sm font-medium"
        >
          <Filter size={16} />
          Filters
          {showFilters && <ChevronRight size={16} className="rotate-90" />}
        </button>

        {/* Filter Panel */}
        {showFilters && (
          <div className="bg-neutral-900/95 backdrop-blur-md border border-cyan-900/50 rounded-lg p-4 shadow-2xl min-w-[280px]">
            <h3 className="text-xs uppercase tracking-widest text-cyan-500 mb-3">Toggle Lines</h3>
            <div className="space-y-2">
              {[
                { key: 'tech', label: 'Tech', color: 'cyan' },
                { key: 'population', label: 'Population', color: 'green' },
                { key: 'war', label: 'War', color: 'red' },
                { key: 'empire', label: 'Empire', color: 'purple' },
                { key: 'philosophy', label: 'Philosophy', color: 'amber' }
              ].map(line => (
                <label key={line.key} className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={visibleLines[line.key]}
                    onChange={(e) => {
                      if (!e.target.checked && visibleLines[line.key]) {
                        actions.toggleLine(line.key);
                      } else if (e.target.checked && !visibleLines[line.key]) {
                        actions.toggleLine(line.key);
                      }
                    }}
                    className="w-4 h-4 rounded border-cyan-900/50 bg-neutral-800 text-cyan-500 focus:ring-cyan-500"
                  />
                  <div className={`flex-1 h-1 rounded bg-${line.color}-500 opacity-${visibleLines[line.key] ? '100' : '30'} group-hover:opacity-100 transition-opacity`}></div>
                  <span className="text-sm text-neutral-300 min-w-[80px]">{line.label}</span>
                </label>
              ))}
            </div>
            
            <div className="mt-4 pt-4 border-t border-cyan-900/30">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showAllLabels}
                  onChange={(e) => {
                    if (e.target.checked !== showAllLabels) {
                      actions.toggleLabels();
                    }
                  }}
                  className="w-4 h-4 rounded border-cyan-900/50 bg-neutral-800 text-cyan-500"
                />
                <span className="text-sm text-neutral-300">Show all labels</span>
              </label>
            </div>

            {/* Era Quick Filters */}
            <div className="mt-4 pt-4 border-t border-cyan-900/30">
              <h3 className="text-xs uppercase tracking-widest text-cyan-500 mb-2">Quick Views</h3>
              <div className="space-y-1">
                <button
                  onClick={() => actions.setEraFilter(null)}
                  className="w-full text-left px-2 py-1 text-xs text-neutral-400 hover:text-white hover:bg-neutral-800 rounded"
                >
                  All Time
                </button>
                <button
                  onClick={() => actions.setEraFilter([-10000, -1000])}
                  className="w-full text-left px-2 py-1 text-xs text-neutral-400 hover:text-white hover:bg-neutral-800 rounded"
                >
                  Ancient (10k BCE - 1k BCE)
                </button>
                <button
                  onClick={() => actions.setEraFilter([-1000, 500])}
                  className="w-full text-left px-2 py-1 text-xs text-neutral-400 hover:text-white hover:bg-neutral-800 rounded"
                >
                  Classical (1k BCE - 500 CE)
                </button>
                <button
                  onClick={() => actions.setEraFilter([500, 1500])}
                  className="w-full text-left px-2 py-1 text-xs text-neutral-400 hover:text-white hover:bg-neutral-800 rounded"
                >
                  Medieval (500 - 1500 CE)
                </button>
                <button
                  onClick={() => actions.setEraFilter([1500, 1900])}
                  className="w-full text-left px-2 py-1 text-xs text-neutral-400 hover:text-white hover:bg-neutral-800 rounded"
                >
                  Modern (1500 - 1900 CE)
                </button>
                <button
                  onClick={() => actions.setEraFilter([1900, 2025])}
                  className="w-full text-left px-2 py-1 text-xs text-neutral-400 hover:text-white hover:bg-neutral-800 rounded"
                >
                  Contemporary (1900 - 2025 CE)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Journey Mode Controls */}
        {journeyMode && (
          <div className="bg-gradient-to-r from-cyan-900/90 to-purple-900/90 backdrop-blur-md border border-cyan-500/50 rounded-lg p-4 shadow-2xl">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold text-white">Journey Mode</h3>
                <p className="text-xs text-cyan-300/70">{journeyIndex + 1} of {journeyStations.length}</p>
              </div>
              <button
                onClick={() => actions.endJourney()}
                className="text-cyan-400/60 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => navigateJourney('prev')}
                className="flex-1 px-3 py-2 bg-neutral-800 hover:bg-neutral-700 rounded text-sm text-white transition-colors"
              >
                ← Prev
              </button>
              <button
                onClick={() => navigateJourney('next')}
                className="flex-1 px-3 py-2 bg-cyan-600 hover:bg-cyan-500 rounded text-sm text-white transition-colors"
              >
                Next →
              </button>
            </div>
          </div>
        )}

        {/* Help Button */}
        <button
          onClick={() => actions.setWelcome(true)}
          className="p-2 bg-neutral-900/90 backdrop-blur-md border border-cyan-900/50 rounded-lg text-cyan-400 hover:bg-neutral-800 transition-colors"
          title="Show Help"
        >
          <HelpCircle size={20} />
        </button>

        {/* Minimap Toggle */}
        <button
          onClick={() => actions.toggleMinimap()}
          className="p-2 bg-neutral-900/90 backdrop-blur-md border border-cyan-900/50 rounded-lg text-cyan-400 hover:bg-neutral-800 transition-colors"
          title={showMinimap ? "Hide Minimap" : "Show Minimap"}
        >
          <Map size={20} />
        </button>
      </div>
      )}

      {/* --- Main Viewport --- */}
      <div className="flex-1 relative flex">
        
        {/* SVG Canvas Container - Pan and Zoom enabled */}
        <div 
          ref={containerRef}
          className="flex-1 relative overflow-hidden bg-neutral-950"
          onMouseDown={handleMouseDown}
          onMouseMove={(e) => {
            // MEDIUM: Context-aware cursor based on era
            if (!isPanning && svgRef.current && containerRef.current) {
              const rect = containerRef.current.getBoundingClientRect();
              const mouseX = e.clientX - rect.left;
              const mouseY = e.clientY - rect.top;
              
              const svgPoint = svgRef.current.createSVGPoint();
              svgPoint.x = mouseX;
              svgPoint.y = mouseY;
              const pointInSvg = svgPoint.matrixTransform(svgRef.current.getScreenCTM().inverse());
              
              // Find closest station to determine era
              let closestStation = null;
              let minDistance = Infinity;
              
              stations.forEach(s => {
                const dx = s.coords.x - pointInSvg.x;
                const dy = s.coords.y - pointInSvg.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance < 100 && distance < minDistance) {
                  minDistance = distance;
                  closestStation = s;
                }
              });
              
              // Determine era-based cursor
              if (closestStation) {
                const year = closestStation.year;
                let cursorStyle = 'pointer';
                
                if (year < -1000) {
                  cursorStyle = 'default'; // Ancient - default cursor
                } else if (year >= 1914 && year <= 1945) {
                  cursorStyle = 'crosshair'; // Crosshair for War/Crisis
                } else if (year >= 1950) {
                  cursorStyle = 'pointer'; // Digital pointer for Modern
                }
                
                if (containerRef.current) {
                  containerRef.current.style.cursor = cursorStyle;
                }
              } else {
                if (containerRef.current) {
                  containerRef.current.style.cursor = isPanning ? 'grabbing' : 'grab';
                }
              }
            }
            
            // Call original handleMouseMove for panning
            handleMouseMove(e);
          }}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
          style={{ cursor: isPanning ? 'grabbing' : 'grab' }}
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
          
          {/* Zoom Controls */}
          {showUI && (
          <div className="absolute top-4 right-4 z-30 flex flex-col gap-2 bg-neutral-900/90 backdrop-blur-md border border-cyan-900/50 rounded-lg p-2 shadow-2xl">
            <button
              onClick={zoomIn}
              className="p-2 text-cyan-400 hover:text-cyan-300 hover:bg-neutral-800 rounded transition-colors"
              title="Zoom In"
            >
              <ZoomIn size={20} />
            </button>
            <button
              onClick={zoomOut}
              className="p-2 text-cyan-400 hover:text-cyan-300 hover:bg-neutral-800 rounded transition-colors"
              title="Zoom Out"
            >
              <ZoomOut size={20} />
            </button>
            <div className="h-px bg-cyan-900/50 my-1"></div>
            <button
              onClick={resetView}
              className="p-2 text-cyan-400 hover:text-cyan-300 hover:bg-neutral-800 rounded transition-colors"
              title="Reset View"
            >
              <Maximize2 size={20} />
            </button>
            <button
              onClick={fitToView}
              className="p-2 text-cyan-400 hover:text-cyan-300 hover:bg-neutral-800 rounded transition-colors"
              title="Fit to View"
            >
              <Move size={20} />
            </button>
            <div className="h-px bg-cyan-900/50 my-1"></div>
            <div className="px-2 py-1 text-xs text-cyan-500/70 font-mono text-center">
              {Math.round((VIEWBOX_WIDTH / viewBox.width) * 10) / 10}x
            </div>
            <div className="px-2 py-0.5 text-[10px] text-cyan-600/50 font-mono text-center">
              {Math.round((viewBox.width / VIEWBOX_WIDTH) * 100)}% view
            </div>
          </div>
          )}
          
          <svg 
            ref={svgRef}
            className="w-full h-full relative z-10"
            viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              {/* Enhanced Glow Filters */}
              <filter id="glow-blue" x="-100%" y="-100%" width="300%" height="300%">
                <feGaussianBlur stdDeviation="6" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
              <filter id="glow-red" x="-100%" y="-100%" width="300%" height="300%">
                <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
              <filter id="glow-green" x="-100%" y="-100%" width="300%" height="300%">
                <feGaussianBlur stdDeviation="5" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
              <filter id="mist" x="-100%" y="-100%" width="300%" height="300%">
                <feGaussianBlur stdDeviation="20"/>
              </filter>
              <filter id="spark" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="2"/>
                <feColorMatrix values="1 0 0 0 0  0 0.2 0 0 0  0 0 0.2 0 0  0 0 0 1 0"/>
              </filter>
              
              {/* HIGH PRIORITY: Dynamic Glitch Filter for Crisis Stations */}
              <filter id="glitch" x="-50%" y="-50%" width="200%" height="200%">
                <feTurbulence
                  type="fractalNoise"
                  baseFrequency="0.9"
                  numOctaves="4"
                  result="turbulence"
                >
                  <animate
                    attributeName="baseFrequency"
                    values="0.7;1.2;0.8;1.1;0.9"
                    dur="0.3s"
                    repeatCount="indefinite"
                  />
                </feTurbulence>
                <feDisplacementMap
                  in="SourceGraphic"
                  in2="turbulence"
                  scale="8"
                  xChannelSelector="R"
                  yChannelSelector="G"
                />
                <feGaussianBlur stdDeviation="1" result="blur"/>
                <feMerge>
                  <feMergeNode in="blur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
              
              {/* Glitch filter for War line - unstable, vibrating effect */}
              <filter id="glitch-war" x="-50%" y="-50%" width="200%" height="200%">
                <feTurbulence
                  type="turbulence"
                  baseFrequency="0.5"
                  numOctaves="3"
                  result="turbulence"
                >
                  <animate
                    attributeName="baseFrequency"
                    values="0.3;0.7;0.4;0.6;0.5"
                    dur="0.5s"
                    repeatCount="indefinite"
                  />
                </feTurbulence>
                <feDisplacementMap
                  in="SourceGraphic"
                  in2="turbulence"
                  scale="4"
                  xChannelSelector="R"
                  yChannelSelector="B"
                />
                <feGaussianBlur stdDeviation="2"/>
              </filter>
              
              {/* Singularity Visual Climax - Event Horizon Distortion */}
              <filter id="singularity-distortion" x="-100%" y="-100%" width="300%" height="300%">
                <feGaussianBlur stdDeviation="15" result="blur"/>
                <feColorMatrix
                  type="matrix"
                  values="1 0 0 0 0
                          0 1 0 0 0
                          0 0 1 0 0
                          0 0 0 1.5 0"
                  result="brighten"
                />
                <feTurbulence
                  type="fractalNoise"
                  baseFrequency="0.3"
                  numOctaves="5"
                  result="turbulence"
                >
                  <animate
                    attributeName="baseFrequency"
                    values="0.2;0.4;0.3;0.35;0.25"
                    dur="2s"
                    repeatCount="indefinite"
                  />
                </feTurbulence>
                <feDisplacementMap
                  in="brighten"
                  in2="turbulence"
                  scale="20"
                  xChannelSelector="R"
                  yChannelSelector="G"
                />
                <feMerge>
                  <feMergeNode/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
              
              {/* Particle effect for Singularity */}
              <filter id="singularity-particles" x="-200%" y="-200%" width="500%" height="500%">
                <feGaussianBlur stdDeviation="3" result="blur"/>
                <feColorMatrix
                  type="matrix"
                  values="0 0 0 0 0
                          0 0 0 0 0
                          1 1 1 0 0
                          0 0 0 1 0"
                />
              </filter>
              
              {/* Animated gradient for Blue line */}
              <linearGradient id="blueGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#22d3ee" stopOpacity="1" />
                <animate attributeName="y2" values="0%;100%;0%" dur="3s" repeatCount="indefinite" />
              </linearGradient>
            </defs>

            {/* Time Axis - Moved to sticky HTML overlay below */}
            <g className="time-axis" opacity="0.4">
              {timeMarkers.map((marker, idx) => (
                <g key={idx}>
                  <line
                    x1={marker.x}
                    y1={VIEWBOX_HEIGHT - 80}
                    x2={marker.x}
                    y2={VIEWBOX_HEIGHT}
                    stroke="#22d3ee"
                    strokeWidth="3"
                    strokeDasharray="5,5"
                  />
                  <text
                    x={marker.x}
                    y={VIEWBOX_HEIGHT - 20}
                    textAnchor="middle"
                    fill="#22d3ee"
                    fontSize="24"
                    fontFamily="monospace"
                    opacity="0.7"
                    fontWeight="bold"
                  >
                    {marker.label}
                  </text>
                </g>
              ))}
              <text
                x={VIEWBOX_WIDTH / 2}
                y={VIEWBOX_HEIGHT - 5}
                textAnchor="middle"
                fill="#22d3ee"
                fontSize="20"
                fontFamily="monospace"
                opacity="0.5"
                className="uppercase tracking-widest"
                fontWeight="bold"
              >
                Time (Piecewise Scale) • 12,025 Years of Human Civilization
              </text>
            </g>

            {/* Metro Lines - Using MetroLine Component */}
            <MetroLine
              pathData={paths.orange}
              lineConfig={LINES.Philosophy}
              animationProgress={animationProgress}
              isVisible={visibleLines.philosophy}
            />
            
            <MetroLine
              pathData={paths.purple}
              lineConfig={LINES.Empire}
              animationProgress={animationProgress}
              isVisible={visibleLines.empire}
            />

            <MetroLine
              // Handle object structure for braided lines or string for simple lines
              pathData={typeof paths.green === 'string' ? paths.green : paths.green.main}
              lineConfig={LINES.Population}
              animationProgress={animationProgress}
              isVisible={visibleLines.population}
              filterId="glow-green"
            />

            <MetroLine
              pathData={paths.red}
              lineConfig={LINES.War}
              animationProgress={animationProgress}
              isVisible={visibleLines.war}
              filterId="glitch-war"
            />

            <MetroLine
              pathData={paths.blue}
              lineConfig={LINES.Tech}
              animationProgress={animationProgress}
              isVisible={visibleLines.tech}
              filterId="glow-blue"
            />

            {/* PROPER METRO MAP: Render each station ON ITS LINE(S) at the line's Y position */}
            {/* For multi-line stations, render a marker on EACH line */}
            {filteredStations.map((s) => {
              const isHovered = hoveredStation === s.id;
              const isSelected = selectedStation?.id === s.id;
              const isInJourney = journeyMode && journeyStations[journeyIndex] === s.id;
              const isSearchMatch = searchQuery && (s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.yearLabel.toLowerCase().includes(searchQuery.toLowerCase()));
              const shouldShowLabel = showAllLabels || isHovered || isSelected || isInJourney || isSearchMatch;
              const isActive = isHovered || isSelected || isInJourney;
              
              // Line Y positions (must match pathGenerator.js)
              const lineYPositions = {
                'Tech': 0.18 * VIEWBOX_CONFIG.HEIGHT,
                'War': 0.36 * VIEWBOX_CONFIG.HEIGHT,
                'Population': 0.50 * VIEWBOX_CONFIG.HEIGHT,
                'Philosophy': 0.64 * VIEWBOX_CONFIG.HEIGHT,
                'Empire': 0.82 * VIEWBOX_CONFIG.HEIGHT
              };
              
              const lineMap = { 'Tech': 'tech', 'Population': 'population', 'War': 'war', 'Empire': 'empire', 'Philosophy': 'philosophy' };
              const colors = { 'Tech': '#22d3ee', 'Population': '#22c55e', 'War': '#ef4444', 'Empire': '#9333ea', 'Philosophy': '#fbbf24' };
              
              // Get visible lines for this station
              const visibleStationLines = s.lines.filter(line => visibleLines[lineMap[line]] !== false);
              if (visibleStationLines.length === 0 && !isSearchMatch) return null;
              
              // Render a marker on EACH line this station belongs to
              return (
                <g key={s.id}>
                  {/* Vertical connector for multi-line stations */}
                  {visibleStationLines.length > 1 && (
                    <line
                      x1={s.coords.x}
                      y1={Math.min(...visibleStationLines.map(l => lineYPositions[l]))}
                      x2={s.coords.x}
                      y2={Math.max(...visibleStationLines.map(l => lineYPositions[l]))}
                      stroke="#ffffff"
                      strokeWidth={4}
                      strokeOpacity={0.3}
                      strokeDasharray="8,8"
                      className="pointer-events-none"
                    />
                  )}
                  
                  {/* Station marker on each line */}
                  {visibleStationLines.map((line, idx) => {
                    const lineY = lineYPositions[line];
                    const lineColor = colors[line];
                    const isPrimaryLine = idx === 0;
                    const radius = isActive ? 20 : 15;
                    const isCrisis = s.significance === 'crisis';
                    const isSingularity = s.id === 'singularity';
                    
                    return (
                      <g
                        key={`${s.id}-${line}`}
                        className="station-marker"
                        style={{ cursor: 'pointer' }}
                        onMouseEnter={() => actions.hoverStation(s.id)}
                        onMouseLeave={() => actions.hoverStation(null)}
                        onClick={(e) => {
                          e.stopPropagation();
                          actions.selectStation(s);
                          if (journeyMode) {
                            const jdx = journeyStations.indexOf(s.id);
                            if (jdx !== -1) actions.journeyGoTo(jdx, s);
                          }
                        }}
                        onMouseDown={(e) => e.stopPropagation()}
                      >
                        {/* Glow effect on active */}
                        {isActive && (
                          <circle
                            cx={s.coords.x}
                            cy={lineY}
                            r={radius * 2.5}
                            fill={lineColor}
                            fillOpacity={0.15}
                            className="pointer-events-none"
                          />
                        )}
                        
                        {/* Singularity: Event Horizon Distortion Effect */}
                        {isSingularity && isPrimaryLine && (
                          <circle
                            cx={s.coords.x}
                            cy={lineY}
                            r={radius * 4}
                            fill="none"
                            stroke="#22d3ee"
                            strokeWidth={2}
                            strokeOpacity={0.3}
                            filter="url(#singularity-distortion)"
                            className="pointer-events-none"
                          >
                            <animate
                              attributeName="r"
                              values={`${radius * 3};${radius * 5};${radius * 3}`}
                              dur="3s"
                              repeatCount="indefinite"
                            />
                          </circle>
                        )}
                        
                        {/* Outer ring - with glitch filter for crisis stations */}
                        <circle
                          cx={s.coords.x}
                          cy={lineY}
                          r={radius}
                          fill="#0a0a0a"
                          stroke={lineColor}
                          strokeWidth={isActive ? 6 : 4}
                          filter={isCrisis ? "url(#glitch)" : undefined}
                        />
                        
                        {/* Inner dot */}
                        <circle
                          cx={s.coords.x}
                          cy={lineY}
                          r={isActive ? 8 : 6}
                          fill={lineColor}
                          filter={isCrisis ? "url(#glitch)" : undefined}
                        />
                        
                        {/* Singularity: Radiating particles */}
                        {isSingularity && isPrimaryLine && (
                          <>
                            {[...Array(8)].map((_, i) => (
                              <line
                                key={`particle-${i}`}
                                x1={s.coords.x}
                                y1={lineY}
                                x2={s.coords.x + Math.cos((i * Math.PI * 2) / 8) * (radius * 3)}
                                y2={lineY + Math.sin((i * Math.PI * 2) / 8) * (radius * 3)}
                                stroke="#22d3ee"
                                strokeWidth={2}
                                strokeOpacity={0.6}
                                filter="url(#singularity-particles)"
                              >
                                <animate
                                  attributeName="x2"
                                  values={`${s.coords.x + Math.cos((i * Math.PI * 2) / 8) * (radius * 2)};${s.coords.x + Math.cos((i * Math.PI * 2) / 8) * (radius * 4)};${s.coords.x + Math.cos((i * Math.PI * 2) / 8) * (radius * 2)}`}
                                  dur="2s"
                                  repeatCount="indefinite"
                                />
                                <animate
                                  attributeName="y2"
                                  values={`${lineY + Math.sin((i * Math.PI * 2) / 8) * (radius * 2)};${lineY + Math.sin((i * Math.PI * 2) / 8) * (radius * 4)};${lineY + Math.sin((i * Math.PI * 2) / 8) * (radius * 2)}`}
                                  dur="2s"
                                  repeatCount="indefinite"
                                />
                              </line>
                            ))}
                          </>
                        )}
                        
                        {/* Hub indicator */}
                        {s.significance === 'hub' && (
                          <circle
                            cx={s.coords.x}
                            cy={lineY}
                            r={3}
                            fill="#ffffff"
                          />
                        )}
                      </g>
                    );
                  })}
                  
                  {/* Label - only show once, above the topmost marker */}
                  {shouldShowLabel && (
                    <g className="pointer-events-none select-none">
                      {(() => {
                        const topY = Math.min(...visibleStationLines.map(l => lineYPositions[l]));
                        return (
                          <>
                            {/* Name label background */}
                            <text
                              x={s.coords.x}
                              y={topY - 30}
                              textAnchor="middle"
                              fill="#000"
                              fontSize={isActive ? 28 : 24}
                              fontFamily="'JetBrains Mono', monospace"
                              fontWeight="700"
                              stroke="#000"
                              strokeWidth={6}
                              strokeLinejoin="round"
                              opacity={0.5}
                            >
                              {s.name.length > 25 ? `${s.name.substring(0, 25)}…` : s.name}
                            </text>
                            {/* Name label */}
                            <text
                              x={s.coords.x}
                              y={topY - 30}
                              textAnchor="middle"
                              fill="#ffffff"
                              fontSize={isActive ? 28 : 24}
                              fontFamily="'JetBrains Mono', monospace"
                              fontWeight="700"
                            >
                              {s.name.length > 25 ? `${s.name.substring(0, 25)}…` : s.name}
                            </text>
                            {/* Year label */}
                            <text
                              x={s.coords.x}
                              y={topY - 6}
                              textAnchor="middle"
                              fill={colors[visibleStationLines[0]]}
                              fontSize={20}
                              fontFamily="'JetBrains Mono', monospace"
                              fontWeight="600"
                            >
                              {s.yearLabel}
                            </text>
                          </>
                        );
                      })()}
                    </g>
                  )}
                </g>
              );
            })}
          </svg>

          {/* Minimap - Human-Centric Spatial Orientation */}
          {showUI && showMinimap && (
            <div className="absolute bottom-4 right-4 z-30 bg-neutral-900/95 backdrop-blur-md border border-cyan-900/50 rounded-lg p-3 shadow-2xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest">Overview</span>
                <button
                  onClick={() => setShowMinimap(false)}
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
                    
                    setViewBox(prev => ({
                      ...prev,
                      x: Math.max(0, Math.min(VIEWBOX_WIDTH - prev.width, point.x - prev.width / 2)),
                      y: Math.max(0, Math.min(VIEWBOX_HEIGHT - prev.height, point.y - prev.height / 2))
                    }));
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
                  setViewBox(prev => ({
                    ...prev,
                    x: Math.max(0, Math.min(VIEWBOX_WIDTH - prev.width, centerX)),
                    y: Math.max(0, Math.min(VIEWBOX_HEIGHT - prev.height, centerY))
                  }));
                }}
                className="mt-2 w-full px-3 py-1.5 text-xs bg-cyan-900/50 hover:bg-cyan-900/70 text-cyan-300 rounded transition-colors"
              >
                Center View
              </button>
            </div>
          )}

          {/* Search Results Panel */}
          {searchQuery && filteredStations.length > 0 && (
            <div className="absolute top-24 left-4 z-30 bg-neutral-900/95 backdrop-blur-md border border-cyan-900/50 rounded-lg p-4 shadow-2xl max-w-sm max-h-96 overflow-y-auto">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-white">Search Results ({filteredStations.length})</h3>
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-cyan-400/60 hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="space-y-2">
                {filteredStations.slice(0, 10).map(s => (
                  <button
                    key={s.id}
                    onClick={() => {
                      actions.centerOnStation(s);
                    }}
                    className="w-full text-left p-3 bg-neutral-800/50 hover:bg-neutral-800 rounded border border-neutral-700/50 hover:border-cyan-500/50 transition-colors"
                  >
                    <div className="font-semibold text-white text-sm mb-1">{s.name}</div>
                    <div className="text-xs text-cyan-400">{s.yearLabel}</div>
                  </button>
                ))}
                {filteredStations.length > 10 && (
                  <p className="text-xs text-neutral-500 text-center pt-2">
                    +{filteredStations.length - 10} more results
                  </p>
                )}
              </div>
            </div>
          )}

          {/* HIGH PRIORITY: Sticky Timeline Axis - HTML Overlay */}
          {showUI && (
            <div className="absolute bottom-0 left-0 right-0 z-40 bg-neutral-950/95 backdrop-blur-md border-t border-cyan-900/50 px-4 py-3 pointer-events-none">
              <div className="flex items-center justify-between max-w-full overflow-x-auto">
                <div className="flex items-center gap-4 min-w-max">
                  {timeMarkers
                    .filter(marker => {
                      // Only show markers visible in current viewport
                      const markerX = marker.x;
                      return markerX >= viewBox.x - 200 && markerX <= viewBox.x + viewBox.width + 200;
                    })
                    .map((marker, idx) => (
                      <div key={idx} className="flex flex-col items-center">
                        <div className="h-2 w-0.5 bg-cyan-400 mb-1"></div>
                        <span className="text-xs font-mono text-cyan-400/80 whitespace-nowrap">
                          {marker.label}
                        </span>
                      </div>
                    ))}
                </div>
                <div className="text-[10px] font-mono text-cyan-500/60 uppercase tracking-widest whitespace-nowrap ml-4">
                  {Math.round((viewBox.x / VIEWBOX_WIDTH) * 100)}% • {Math.round(((viewBox.x + viewBox.width) / VIEWBOX_WIDTH) * 100)}%
                </div>
              </div>
            </div>
          )}

          {/* Prompt when idle - Human-Centric Guidance */}
          {!activeData && !searchQuery && (
            <div className="absolute bottom-20 left-8 p-6 bg-gradient-to-br from-neutral-900/95 to-neutral-950/95 backdrop-blur-xl border border-cyan-900/50 rounded-xl text-cyan-400/90 font-mono text-sm max-w-md shadow-2xl z-20">
              <div className="flex items-start gap-3 mb-4">
                <Info className="w-5 h-5 text-cyan-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="mb-2 uppercase tracking-widest text-cyan-500 font-bold text-xs">Begin Your Journey</p>
                  <p className="leading-relaxed text-sm mb-3">
                    Explore 12,025 years of human civilization. Click any station to discover pivotal moments that shaped our world.
                  </p>
                </div>
              </div>
              
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <ChevronRight className="w-3 h-3 text-cyan-500" />
                  <span>Use <strong>Search</strong> to find specific events</span>
                </div>
                <div className="flex items-center gap-2">
                  <ChevronRight className="w-3 h-3 text-cyan-500" />
                  <span>Toggle <strong>Filters</strong> to focus on specific themes</span>
                </div>
                <div className="flex items-center gap-2">
                  <ChevronRight className="w-3 h-3 text-cyan-500" />
                  <span>Try <strong>Journey Mode</strong> for a guided tour</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* --- Info Sidebar --- */}
        <div 
          className={`
            absolute right-0 top-0 h-full w-full md:w-[500px] 
            bg-neutral-950/97 backdrop-blur-xl border-l border-cyan-900/50 
            shadow-[-10px_0_30px_rgba(0,0,0,0.9)] z-30
            transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]
            ${activeData ? 'translate-x-0' : 'translate-x-full'}
          `}
        >
          {activeData && (
            <div className="flex flex-col h-full relative">
              {/* Close Button */}
              <button 
                onClick={() => actions.clearSelection()}
                className="absolute top-4 right-4 p-2 text-neutral-500 hover:text-white hover:bg-neutral-800 rounded-full transition-colors z-10"
              >
                <X size={20} />
              </button>

              {/* Content - Human-Centric: Better Visual Hierarchy */}
              <div className="p-8 overflow-y-auto custom-scrollbar">
                {/* Header - Enhanced */}
                <div className="flex items-start gap-4 mb-6">
                  <div className="p-4 bg-gradient-to-br from-neutral-900 to-neutral-950 rounded-xl border border-neutral-800 shadow-inner">
                    {activeData.icon}
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-mono text-cyan-500 uppercase tracking-widest mb-2">Station ID: {activeData.yearLabel}</div>
                    <h2 className="text-3xl font-bold text-white leading-tight mb-3">{activeData.name}</h2>
                    
                    {/* Quick Stats - Human-Centric Summary */}
                    <div className="flex flex-wrap gap-3">
                      {activeData.population && (
                        <div className="px-3 py-1.5 bg-green-900/30 border border-green-700/50 rounded-lg">
                          <div className="text-[10px] uppercase tracking-widest text-green-400 mb-0.5">Population</div>
                          <div className="text-sm font-bold text-green-300">{activeData.population}</div>
                        </div>
                      )}
                      {activeData.lines && (
                        <div className="flex flex-wrap gap-1.5">
                          {activeData.lines.map((line, idx) => {
                            const colors = {
                              'Tech': 'bg-cyan-900/30 border-cyan-700/50 text-cyan-300',
                              'Population': 'bg-green-900/30 border-green-700/50 text-green-300',
                              'War': 'bg-red-900/30 border-red-700/50 text-red-300',
                              'Empire': 'bg-purple-900/30 border-purple-700/50 text-purple-300',
                              'Philosophy': 'bg-amber-900/30 border-amber-700/50 text-amber-300'
                            };
                            return (
                              <span 
                                key={idx}
                                className={`px-2.5 py-1 text-[10px] uppercase tracking-widest border rounded-full ${colors[line] || 'bg-neutral-800 border-neutral-700 text-cyan-300'}`}
                              >
                                {line}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="h-px w-full bg-gradient-to-r from-cyan-900 via-cyan-500/50 to-cyan-900 mb-6"></div>

                {/* Sections - Human-Centric: Scannable, Hierarchical */}
                <div className="space-y-6">
                  {/* Visual Analysis - Most Important First */}
                  <div className="group">
                    <h3 className="text-xs uppercase tracking-widest text-cyan-400 mb-3 flex items-center gap-2 font-bold">
                      <TrendingUp size={16} /> What You're Seeing
                    </h3>
                    <p className="text-neutral-200 leading-relaxed pl-5 border-l-3 border-purple-500/60 text-base">
                      {activeData.visual}
                    </p>
                  </div>

                  {/* Atmosphere - Emotional Connection */}
                  <div className="group bg-gradient-to-br from-neutral-900/50 to-neutral-950/50 p-5 rounded-xl border border-cyan-900/30">
                    <h3 className="text-xs uppercase tracking-widest text-cyan-400 mb-3 flex items-center gap-2 font-bold">
                      <BookOpen size={16} /> The Experience
                    </h3>
                    <p className="text-lg font-serif italic text-cyan-100/90 leading-relaxed">
                      "{activeData.atmosphere}"
                    </p>
                  </div>

                  {/* Key Insight - Highlighted */}
                  <div className="bg-gradient-to-br from-cyan-900/40 to-purple-900/40 p-6 rounded-xl border-2 border-cyan-500/30 hover:border-cyan-500/50 transition-colors shadow-lg">
                    <h3 className="text-xs uppercase tracking-widest text-cyan-300 mb-3 flex items-center gap-2 font-bold">
                      <Info size={16} /> Key Insight
                    </h3>
                    <p className="text-neutral-100 leading-relaxed text-base font-medium">
                      {activeData.insight}
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
                        {activeData.details}
                      </p>
                    </div>
                  </details>
                </div>

                {/* Journey Navigation in Sidebar */}
                {journeyMode && (
                  <div className="mt-8 pt-6 border-t border-cyan-900/30">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs text-cyan-400">Journey Progress</span>
                      <span className="text-xs text-neutral-500">{journeyIndex + 1} / {journeyStations.length}</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => navigateJourney('prev')}
                        className="flex-1 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 rounded text-sm text-white transition-colors"
                      >
                        ← Previous
                      </button>
                      <button
                        onClick={() => navigateJourney('next')}
                        className="flex-1 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded text-sm text-white transition-colors"
                      >
                        Next →
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Sidebar Footer */}
              <div className="p-6 border-t border-neutral-800 bg-neutral-900/30">
                <div className="text-[10px] font-mono text-center text-neutral-600 uppercase tracking-[0.3em]">
                  End of Data Stream
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* --- Legend Footer --- */}
      {showUI && (
        <footer className="h-20 bg-neutral-950 border-t border-neutral-800 flex items-center justify-center gap-8 px-4 z-20 shrink-0 overflow-x-auto">
          <LegendItem color="bg-cyan-400" label="Tech" glow="shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
          <LegendItem color="bg-green-600" label="Population" glow="shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
          <LegendItem color="bg-red-500 animate-pulse" label="War" glow="shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
          <LegendItem color="bg-purple-600" label="Empire" glow="shadow-[0_0_8px_rgba(147,51,234,0.6)]" />
          <LegendItem color="bg-amber-500 blur-[1px]" label="Philosophy" glow="shadow-[0_0_8px_rgba(251,191,36,0.4)]" />
        </footer>
      )}

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

// Helper for Footer
const LegendItem = ({ color, label, glow = "" }) => (
  <div className="flex items-center gap-2 shrink-0">
    <div className={`w-4 h-4 rounded-full ${color} ${glow} opacity-90`}></div>
    <span className="text-xs uppercase tracking-widest text-neutral-400 font-medium">{label}</span>
  </div>
);

export default CivilizationMetroMap;