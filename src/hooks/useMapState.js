/**
 * Map State Management Hook
 * Centralized state management using useReducer for predictable state transitions
 */

import { useReducer, useCallback, useMemo } from 'react';
import { VIEWBOX, JOURNEY_STATIONS } from '../constants/metroConfig';
import { constrainViewBox, centerViewBoxOn } from '../utils/coordinates';

// Action Types - Single source of truth for all state transitions
const ActionTypes = {
  // View navigation
  SET_VIEW_BOX: 'SET_VIEW_BOX',
  ZOOM_IN: 'ZOOM_IN',
  ZOOM_OUT: 'ZOOM_OUT',
  RESET_VIEW: 'RESET_VIEW',
  CENTER_ON_STATION: 'CENTER_ON_STATION',
  
  // Station interaction
  HOVER_STATION: 'HOVER_STATION',
  SELECT_STATION: 'SELECT_STATION',
  CLEAR_SELECTION: 'CLEAR_SELECTION',
  
  // Line visibility
  TOGGLE_LINE: 'TOGGLE_LINE',
  SET_ALL_LINES_VISIBLE: 'SET_ALL_LINES_VISIBLE',
  
  // UI panels
  TOGGLE_FILTERS: 'TOGGLE_FILTERS',
  TOGGLE_MINIMAP: 'TOGGLE_MINIMAP',
  TOGGLE_LABELS: 'TOGGLE_LABELS',
  TOGGLE_UI: 'TOGGLE_UI',
  SET_WELCOME: 'SET_WELCOME',
  
  // Search
  SET_SEARCH_QUERY: 'SET_SEARCH_QUERY',
  SET_ERA_FILTER: 'SET_ERA_FILTER',
  
  // Journey mode
  START_JOURNEY: 'START_JOURNEY',
  END_JOURNEY: 'END_JOURNEY',
  JOURNEY_NEXT: 'JOURNEY_NEXT',
  JOURNEY_PREV: 'JOURNEY_PREV',
  JOURNEY_GO_TO: 'JOURNEY_GO_TO',
  
  // Loading/Animation
  SET_LOADING: 'SET_LOADING',
  SET_ANIMATION_PROGRESS: 'SET_ANIMATION_PROGRESS',
  SET_ERROR: 'SET_ERROR',
  
  // Pan
  START_PAN: 'START_PAN',
  END_PAN: 'END_PAN'
};

// Initial state factory
function createInitialState() {
  return {
    // View state
    viewBox: {
      x: VIEWBOX.WIDTH * 0.1,
      y: VIEWBOX.HEIGHT * 0.15,
      width: VIEWBOX.WIDTH * 0.8,
      height: VIEWBOX.HEIGHT * 0.7
    },
    isPanning: false,
    
    // Station state
    hoveredStationId: null,
    selectedStation: null,
    
    // Line visibility
    visibleLines: {
      tech: true,
      population: true,
      war: true,
      empire: true,
      philosophy: true
    },
    
    // UI state
    showWelcome: true,
    showFilters: false,
    showMinimap: true,
    showAllLabels: false,
    showUI: true, // Toggle for hiding all UI elements for max map visibility
    
    // Search state
    searchQuery: '',
    focusedEra: null,
    
    // Journey state
    journeyMode: false,
    journeyIndex: 0,
    
    // Loading state
    isLoading: true,
    animationProgress: 0,
    error: null
  };
}

// Reducer - Pure function for state transitions
function mapReducer(state, action) {
  switch (action.type) {
    // View navigation
    case ActionTypes.SET_VIEW_BOX:
      return { ...state, viewBox: constrainViewBox(action.payload) };
      
    case ActionTypes.ZOOM_IN: {
      const { viewBox } = state;
      const zoomFactor = 0.8;
      const centerX = viewBox.x + viewBox.width / 2;
      const centerY = viewBox.y + viewBox.height / 2;
      const newWidth = viewBox.width * zoomFactor;
      const newHeight = viewBox.height * zoomFactor;
      
      return {
        ...state,
        viewBox: constrainViewBox({
          x: centerX - newWidth / 2,
          y: centerY - newHeight / 2,
          width: newWidth,
          height: newHeight
        })
      };
    }
    
    case ActionTypes.ZOOM_OUT: {
      const { viewBox } = state;
      const zoomFactor = 1.25;
      const centerX = viewBox.x + viewBox.width / 2;
      const centerY = viewBox.y + viewBox.height / 2;
      const newWidth = Math.min(VIEWBOX.WIDTH, viewBox.width * zoomFactor);
      const newHeight = Math.min(VIEWBOX.HEIGHT, viewBox.height * zoomFactor);
      
      return {
        ...state,
        viewBox: constrainViewBox({
          x: centerX - newWidth / 2,
          y: centerY - newHeight / 2,
          width: newWidth,
          height: newHeight
        })
      };
    }
    
    case ActionTypes.RESET_VIEW:
      return {
        ...state,
        viewBox: { x: 0, y: 0, width: VIEWBOX.WIDTH, height: VIEWBOX.HEIGHT }
      };
      
    case ActionTypes.CENTER_ON_STATION: {
      const station = action.payload;
      if (!station?.coords) return state;
      return {
        ...state,
        viewBox: centerViewBoxOn(state.viewBox, station.coords),
        selectedStation: station
      };
    }
    
    // Station interaction
    case ActionTypes.HOVER_STATION:
      return { ...state, hoveredStationId: action.payload };
      
    case ActionTypes.SELECT_STATION:
      return { ...state, selectedStation: action.payload };
      
    case ActionTypes.CLEAR_SELECTION:
      return { ...state, selectedStation: null };
    
    // Line visibility
    case ActionTypes.TOGGLE_LINE:
      return {
        ...state,
        visibleLines: {
          ...state.visibleLines,
          [action.payload]: !state.visibleLines[action.payload]
        }
      };
      
    case ActionTypes.SET_ALL_LINES_VISIBLE:
      return {
        ...state,
        visibleLines: {
          tech: true,
          population: true,
          war: true,
          empire: true,
          philosophy: true
        }
      };
    
    // UI panels
    case ActionTypes.TOGGLE_FILTERS:
      return { ...state, showFilters: !state.showFilters };
      
    case ActionTypes.TOGGLE_MINIMAP:
      return { ...state, showMinimap: !state.showMinimap };
      
    case ActionTypes.TOGGLE_LABELS:
      return { ...state, showAllLabels: !state.showAllLabels };
    
    case ActionTypes.TOGGLE_UI:
      return { ...state, showUI: !state.showUI };
      
    case ActionTypes.SET_WELCOME:
      return { ...state, showWelcome: action.payload };
    
    // Search
    case ActionTypes.SET_SEARCH_QUERY:
      return { ...state, searchQuery: action.payload };
      
    case ActionTypes.SET_ERA_FILTER:
      return { ...state, focusedEra: action.payload };
    
    // Journey mode
    case ActionTypes.START_JOURNEY:
      return {
        ...state,
        journeyMode: true,
        journeyIndex: 0,
        showWelcome: false,
        selectedStation: action.payload // First station
      };
      
    case ActionTypes.END_JOURNEY:
      return { ...state, journeyMode: false };
      
    case ActionTypes.JOURNEY_NEXT: {
      const nextIndex = (state.journeyIndex + 1) % JOURNEY_STATIONS.length;
      return {
        ...state,
        journeyIndex: nextIndex,
        selectedStation: action.payload // Station at next index
      };
    }
    
    case ActionTypes.JOURNEY_PREV: {
      const prevIndex = (state.journeyIndex - 1 + JOURNEY_STATIONS.length) % JOURNEY_STATIONS.length;
      return {
        ...state,
        journeyIndex: prevIndex,
        selectedStation: action.payload
      };
    }
    
    case ActionTypes.JOURNEY_GO_TO:
      return {
        ...state,
        journeyIndex: action.payload.index,
        selectedStation: action.payload.station
      };
    
    // Loading
    case ActionTypes.SET_LOADING:
      return { ...state, isLoading: action.payload };
      
    case ActionTypes.SET_ANIMATION_PROGRESS:
      return { ...state, animationProgress: action.payload };
      
    case ActionTypes.SET_ERROR:
      return { ...state, error: action.payload, isLoading: false };
    
    // Pan
    case ActionTypes.START_PAN:
      return { ...state, isPanning: true };
      
    case ActionTypes.END_PAN:
      return { ...state, isPanning: false };
      
    default:
      return state;
  }
}

/**
 * Custom hook for map state management
 * Provides both state and action creators
 */
export function useMapState(stations = []) {
  const [state, dispatch] = useReducer(mapReducer, undefined, createInitialState);
  
  // Memoized action creators
  const actions = useMemo(() => ({
    // View navigation
    setViewBox: (viewBox) => dispatch({ type: ActionTypes.SET_VIEW_BOX, payload: viewBox }),
    zoomIn: () => dispatch({ type: ActionTypes.ZOOM_IN }),
    zoomOut: () => dispatch({ type: ActionTypes.ZOOM_OUT }),
    resetView: () => dispatch({ type: ActionTypes.RESET_VIEW }),
    centerOnStation: (station) => dispatch({ type: ActionTypes.CENTER_ON_STATION, payload: station }),
    
    // Station interaction  
    hoverStation: (stationId) => dispatch({ type: ActionTypes.HOVER_STATION, payload: stationId }),
    selectStation: (station) => dispatch({ type: ActionTypes.SELECT_STATION, payload: station }),
    clearSelection: () => dispatch({ type: ActionTypes.CLEAR_SELECTION }),
    
    // Line visibility
    toggleLine: (lineId) => dispatch({ type: ActionTypes.TOGGLE_LINE, payload: lineId }),
    showAllLines: () => dispatch({ type: ActionTypes.SET_ALL_LINES_VISIBLE }),
    
    // UI panels
    toggleFilters: () => dispatch({ type: ActionTypes.TOGGLE_FILTERS }),
    toggleMinimap: () => dispatch({ type: ActionTypes.TOGGLE_MINIMAP }),
    toggleLabels: () => dispatch({ type: ActionTypes.TOGGLE_LABELS }),
    toggleUI: () => dispatch({ type: ActionTypes.TOGGLE_UI }),
    setWelcome: (show) => dispatch({ type: ActionTypes.SET_WELCOME, payload: show }),
    
    // Search
    setSearchQuery: (query) => dispatch({ type: ActionTypes.SET_SEARCH_QUERY, payload: query }),
    setEraFilter: (era) => dispatch({ type: ActionTypes.SET_ERA_FILTER, payload: era }),
    
    // Journey mode
    startJourney: (firstStation) => dispatch({ type: ActionTypes.START_JOURNEY, payload: firstStation }),
    endJourney: () => dispatch({ type: ActionTypes.END_JOURNEY }),
    journeyNext: (nextStation) => dispatch({ type: ActionTypes.JOURNEY_NEXT, payload: nextStation }),
    journeyPrev: (prevStation) => dispatch({ type: ActionTypes.JOURNEY_PREV, payload: prevStation }),
    journeyGoTo: (index, station) => dispatch({ type: ActionTypes.JOURNEY_GO_TO, payload: { index, station } }),
    
    // Loading
    setLoading: (loading) => dispatch({ type: ActionTypes.SET_LOADING, payload: loading }),
    setAnimationProgress: (progress) => dispatch({ type: ActionTypes.SET_ANIMATION_PROGRESS, payload: progress }),
    setError: (error) => dispatch({ type: ActionTypes.SET_ERROR, payload: error }),
    
    // Pan
    startPan: () => dispatch({ type: ActionTypes.START_PAN }),
    endPan: () => dispatch({ type: ActionTypes.END_PAN })
  }), []);
  
  // Journey navigation helper
  const navigateJourney = useCallback((direction) => {
    if (!stations.length) return;
    
    const journeyStationIds = JOURNEY_STATIONS;
    
    if (direction === 'next') {
      const nextIndex = (state.journeyIndex + 1) % journeyStationIds.length;
      const nextStation = stations.find(s => s.id === journeyStationIds[nextIndex]);
      if (nextStation) {
        actions.journeyNext(nextStation);
        actions.centerOnStation(nextStation);
      }
    } else {
      const prevIndex = (state.journeyIndex - 1 + journeyStationIds.length) % journeyStationIds.length;
      const prevStation = stations.find(s => s.id === journeyStationIds[prevIndex]);
      if (prevStation) {
        actions.journeyPrev(prevStation);
        actions.centerOnStation(prevStation);
      }
    }
  }, [state.journeyIndex, stations, actions]);
  
  // Filtered stations based on search and era
  const filteredStations = useMemo(() => {
    let filtered = stations;
    
    if (state.searchQuery) {
      const query = state.searchQuery.toLowerCase();
      filtered = filtered.filter(s =>
        s.name.toLowerCase().includes(query) ||
        s.yearLabel.toLowerCase().includes(query) ||
        s.details?.toLowerCase().includes(query)
      );
    }
    
    if (state.focusedEra) {
      const [start, end] = state.focusedEra;
      filtered = filtered.filter(s => s.year >= start && s.year <= end);
    }
    
    return filtered;
  }, [stations, state.searchQuery, state.focusedEra]);
  
  return {
    state,
    actions,
    navigateJourney,
    filteredStations
  };
}

export { ActionTypes };

