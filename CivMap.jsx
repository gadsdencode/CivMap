import React, { useState, useMemo, useEffect, useRef, Suspense, useCallback } from 'react';
import { Info, AlertTriangle, TrendingUp, Users, Castle, BookOpen, Skull, Zap, X, Globe, Cpu, Smartphone, Atom, Gauge, Printer, Settings, ZoomIn, ZoomOut, Maximize2, Move, Search, Filter, Play, Eye, EyeOff, Map, HelpCircle, ChevronRight } from 'lucide-react';
import { useToast } from './hooks/useToast';
import { ToastContainer } from './components/Toast';
import { useKeyboardNavigation, useFocusTrap } from './hooks/useKeyboardNavigation';
import { useAccessibility, useFocusManagement } from './hooks/useAccessibility';
import { usePerformance, useDebounce, useThrottle } from './hooks/usePerformance';
import { LoadingOverlay, LoadingSpinner } from './components/Loading';
import AccessibleButton from './components/AccessibleButton';

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

  // --- Loading State ---
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [hoveredStation, setHoveredStation] = useState(null);
  const [selectedStation, setSelectedStation] = useState(null);
  const [animationProgress, setAnimationProgress] = useState(0);
  
  // Pan and Zoom State
  const [viewBox, setViewBox] = useState({ x: 0, y: 0, width: VIEWBOX_WIDTH, height: VIEWBOX_HEIGHT });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const viewBoxStartRef = useRef({ x: 0, y: 0 });
  const svgRef = useRef(null);
  const containerRef = useRef(null);

  // Human-Centric UX State
  const [showWelcome, setShowWelcome] = useState(true);
  const welcomeRef = useRef(null);
  useFocusTrap(showWelcome, welcomeRef);
  const [visibleLines, setVisibleLines] = useState({
    tech: true,
    population: true,
    war: true,
    empire: true,
    philosophy: true
  });
  const [showAllLabels, setShowAllLabels] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [journeyMode, setJourneyMode] = useState(false);
  const [journeyIndex, setJourneyIndex] = useState(0);
  const [showMinimap, setShowMinimap] = useState(true);
  const [focusedEra, setFocusedEra] = useState(null);

  // Debounced search for performance
  const debouncedSearchCallback = useCallback((query) => {
    if (query && announce) {
      announce(`Searching for ${query}`);
    }
  }, [announce]);
  
  const debouncedSearch = useDebounce(debouncedSearchCallback, 300);
  
  // Time range: 10,000 BCE to 2025 CE (12,025 years total)
  // Using years from 0 = 10,000 BCE, so 2025 CE = 12,025
  const TIME_START = -10000; // 10,000 BCE
  const TIME_END = 2025; // 2025 CE
  const TIME_RANGE = TIME_END - TIME_START; // 12,025 years

  // Enhanced logarithmic scale conversion for massive timeline
  // Maps years to X position (0 to VIEWBOX_WIDTH)
  // Uses a more sophisticated logarithmic curve to show the full depth
  const yearToX = (year) => {
    // Convert year to position in timeline (0 = 10,000 BCE, 1 = 2025 CE)
    const normalized = (year - TIME_START) / TIME_RANGE;
    // Enhanced logarithmic scaling with better distribution
    // This gives more breathing room across the entire timeline
    // Using a combination of log and power functions for better visualization
    if (normalized <= 0) return 0;
    if (normalized >= 1) return VIEWBOX_WIDTH;
    
    // Logarithmic scale: log10(normalized * 9 + 1) gives us 0 to ~1
    // Then we scale it across the full width with padding
    const logValue = Math.log10(normalized * 9 + 1);
    // Add some linear component for better distribution in modern era
    const linearComponent = normalized * 0.3;
    const combined = (logValue * 0.7 + linearComponent) * VIEWBOX_WIDTH;
    
    return Math.max(0, Math.min(VIEWBOX_WIDTH, combined));
  };

  // Y positions for each metro line's horizontal corridor
  const LINE_POSITIONS = {
    'Tech': 0.18,
    'War': 0.34,
    'Population': 0.50,
    'Philosophy': 0.66,
    'Empire': 0.82
  };

  // Get coordinate for a station - positions station on its PRIMARY line
  const getCoord = (year, pctY) => ({
    x: yearToX(year),
    y: pctY * VIEWBOX_HEIGHT
  });

  // Get coordinate positioned on a specific line's corridor
  const getLineCoord = (year, lineName) => ({
    x: yearToX(year),
    y: (LINE_POSITIONS[lineName] || 0.50) * VIEWBOX_HEIGHT
  });

  // METRO-STYLE LANE SYSTEM - kept for backward compatibility
  const LANES = {
    // TECH Line (Cyan) - Top corridor
    TECH_PRIMARY: 0.18,
    TECH_SECONDARY: 0.18,
    TECH_TERTIARY: 0.18,
    // WAR Line (Red) - Upper-middle corridor
    WAR_PRIMARY: 0.34,
    WAR_SECONDARY: 0.34,
    // POPULATION Line (Green) - Center corridor
    POPULATION_PRIMARY: 0.50,
    POPULATION_SECONDARY: 0.50,
    // PHILOSOPHY Line (Orange/Amber) - Lower-middle corridor
    PHILOSOPHY_PRIMARY: 0.66,
    PHILOSOPHY_SECONDARY: 0.66,
    // EMPIRE Line (Purple) - Bottom corridor
    EMPIRE_PRIMARY: 0.82,
    EMPIRE_SECONDARY: 0.82,
    EMPIRE_TERTIARY: 0.82,
    // Special positions 
    MAJOR_HUB: 0.50,
    CRISIS: 0.34,
    SINGULARITY: 0.15
  };


  // Station data with actual years for logarithmic positioning
  // Comprehensive timeline spanning 12,025 years of human civilization
  const stations = useMemo(() => [
    {
      id: 'neolithic',
      name: 'The Neolithic Junction',
      year: -10000,
      yearLabel: '10,000 BCE',
      coords: getCoord(-10000, LANES.MAJOR_HUB),
      color: '#22d3ee',
      icon: <Users className="w-6 h-6 text-green-400" />,
      visual: "The thin Cyan line (Tech) and the thin Vine (Green) collide and fuse.",
      atmosphere: "The smell of wet earth and grain. A quiet, spacious beginning.",
      insight: "The first permanent structure. 4 Million people. The wanderers settle.",
      details: "Passengers arrive from the Hunter-Gatherer Express. Everyone switches to the Sedentary Line. This is the first permanent structure on the map. Before this, the lines were wandering paths. Now, the Green line begins its upward curve.",
      population: "4 Million",
      lines: ['Tech', 'Population']
    },
    {
      id: 'pottery',
      name: 'Pottery & Ceramics',
      year: -8000,
      yearLabel: '8,000 BCE',
      coords: getCoord(-8000, LANES.TECH_SECONDARY),
      color: '#22d3ee',
      icon: <Settings className="w-5 h-5 text-cyan-400" />,
      visual: "The Blue Line develops new textures. Containers emerge.",
      atmosphere: "The heat of kilns. The transformation of clay.",
      insight: "Storage and preservation. The first manufactured containers.",
      details: "Early pottery enables food storage and cooking. Technology enables new ways of living.",
      population: "~5 Million",
      lines: ['Tech']
    },
    {
      id: 'copper',
      name: 'Copper Age',
      year: -6000,
      yearLabel: '6,000 BCE',
      coords: getCoord(-6000, LANES.TECH_SECONDARY),
      color: '#22d3ee',
      icon: <Settings className="w-5 h-5 text-cyan-400" />,
      visual: "The Blue Line gains a metallic sheen. First metalworking.",
      atmosphere: "The glow of molten copper. The first forges.",
      insight: "Metals enter the timeline. Tools become more durable.",
      details: "Copper smelting begins. The first metal tools and ornaments.",
      population: "~7 Million",
      lines: ['Tech']
    },
    {
      id: 'mesopotamia',
      name: 'Mesopotamian Cities',
      year: -4000,
      yearLabel: '4,000 BCE',
      coords: getCoord(-4000, LANES.EMPIRE_SECONDARY),
      color: '#a855f7',
      icon: <Castle className="w-5 h-5 text-purple-400" />,
      visual: "The Purple Line begins to form. First cities emerge.",
      atmosphere: "The bustle of urban life. The first markets.",
      insight: "Urbanization begins. The map shows concentrated nodes.",
      details: "First true cities in Mesopotamia. Urban civilization takes root.",
      population: "~7 Million",
      lines: ['Empire', 'Population']
    },
    {
      id: 'egypt',
      name: 'Ancient Egypt',
      year: -3100,
      yearLabel: '3,100 BCE',
      coords: getCoord(-3100, LANES.EMPIRE_TERTIARY),
      color: '#a855f7',
      icon: <Castle className="w-5 h-5 text-purple-400" />,
      visual: "The Purple Line solidifies. Pyramids rise along the tracks.",
      atmosphere: "The weight of stone. The flow of the Nile.",
      insight: "First great empire. Monumental architecture defines the landscape.",
      details: "Unification of Upper and Lower Egypt. The first pharaonic dynasty.",
      population: "~1 Million",
      lines: ['Empire', 'Tech']
    },
    {
      id: 'uruk',
      name: 'Uruk Central',
      year: -3500,
      yearLabel: '3,500 BCE',
      coords: getCoord(-3500, LANES.MAJOR_HUB),
      color: '#a855f7',
      icon: <Castle className="w-6 h-6 text-purple-400" />,
      visual: "The Purple Line (Empire) emerges from the ground here. The Blue Line flashes brightly with the invention of Writing.",
      atmosphere: "Dust, clay tablets, and the sound of bureaucrats tallying grain.",
      insight: "Civilization 'locks in.' The lines become rigid. We see the first 'System Map' being drawn by scribes.",
      details: "The Wheel (3200 BCE) station is just one stop away—the pace of the train accelerates noticeably after this station.",
      population: "~1 Million",
      lines: ['Tech', 'Empire', 'Population']
    },
    {
      id: 'indus',
      name: 'Indus Valley',
      year: -3300,
      yearLabel: '3,300 BCE',
      coords: getCoord(-3300, LANES.EMPIRE_TERTIARY),
      color: '#a855f7',
      icon: <Castle className="w-5 h-5 text-purple-400" />,
      visual: "The Purple Line branches. Planned cities emerge.",
      atmosphere: "The order of grid streets. The flow of water systems.",
      insight: "Urban planning reaches new heights. The map shows intentional design.",
      details: "Harappa and Mohenjo-Daro. Advanced city planning and drainage.",
      population: "~1 Million",
      lines: ['Empire', 'Tech']
    },
    {
      id: 'wheel',
      name: 'The Wheel',
      year: -3200,
      yearLabel: '3,200 BCE',
      coords: getCoord(-3200, LANES.TECH_PRIMARY),
      color: '#22d3ee',
      icon: <Settings className="w-5 h-5 text-cyan-400" />,
      visual: "The Blue Line accelerates. The first mechanical advantage.",
      atmosphere: "The creak of wooden wheels on stone roads.",
      insight: "Mobility transforms civilization. The train picks up speed.",
      details: "One stop from Uruk Central. The acceleration begins.",
      population: "~1.5 Million",
      lines: ['Tech']
    },
    {
      id: 'bronze',
      name: 'Bronze Age',
      year: -3000,
      yearLabel: '3,000 BCE',
      coords: getCoord(-3000, LANES.TECH_SECONDARY),
      color: '#22d3ee',
      icon: <Settings className="w-5 h-5 text-cyan-400" />,
      visual: "The Blue Line strengthens. Alloy technology emerges.",
      atmosphere: "The glow of bronze. The clang of stronger weapons.",
      insight: "Alloys create superior materials. Technology compounds.",
      details: "Bronze smelting spreads. Stronger tools and weapons transform warfare.",
      population: "~14 Million",
      lines: ['Tech', 'War']
    },
    {
      id: 'pyramids',
      name: 'Great Pyramids',
      year: -2600,
      yearLabel: '2,600 BCE',
      coords: getCoord(-2600, LANES.EMPIRE_SECONDARY),
      color: '#a855f7',
      icon: <Castle className="w-5 h-5 text-purple-400" />,
      visual: "The Purple Line reaches skyward. Monumental architecture.",
      atmosphere: "The weight of eternity. Stone against sky.",
      insight: "Human ambition made permanent. The map shows what we can build.",
      details: "Pyramids of Giza. Engineering marvels that define an era.",
      population: "~27 Million",
      lines: ['Empire', 'Tech']
    },
    {
      id: 'code-hammurabi',
      name: "Hammurabi's Code",
      year: -1750,
      yearLabel: '1,750 BCE',
      coords: getCoord(-1750, LANES.PHILOSOPHY_SECONDARY),
      color: '#fbbf24',
      icon: <BookOpen className="w-5 h-5 text-yellow-400" />,
      visual: "The Orange Line solidifies. Written law emerges.",
      atmosphere: "The weight of justice. The permanence of rules.",
      insight: "Law becomes codified. The map shows the structure of order.",
      details: "First comprehensive legal code. Written laws govern society.",
      population: "~50 Million",
      lines: ['Philosophy', 'Empire']
    },
    {
      id: 'iron',
      name: 'Iron Age',
      year: -1200,
      yearLabel: '1,200 BCE',
      coords: getCoord(-1200, LANES.TECH_SECONDARY),
      color: '#22d3ee',
      icon: <Settings className="w-5 h-5 text-cyan-400" />,
      visual: "The Blue Line strengthens. Metalworking transforms tools and weapons.",
      atmosphere: "The ring of hammer on anvil. The glow of forges.",
      insight: "Harder materials enable new possibilities. The tracks become more durable.",
      details: "A major technological leap. Tools and weapons become more effective.",
      population: "~50 Million",
      lines: ['Tech', 'War']
    },
    {
      id: 'olympics',
      name: 'First Olympics',
      year: -776,
      yearLabel: '776 BCE',
      coords: getCoord(-776, LANES.PHILOSOPHY_SECONDARY),
      color: '#fbbf24',
      icon: <Users className="w-5 h-5 text-yellow-400" />,
      visual: "The Orange Line celebrates. Human achievement becomes spectacle.",
      atmosphere: "The roar of crowds. The pursuit of excellence.",
      insight: "Competition and culture unite. The map shows shared human values.",
      details: "First recorded Olympic Games. Cultural exchange through competition.",
      population: "~100 Million",
      lines: ['Philosophy', 'Population']
    },
    {
      id: 'buddha',
      name: 'Buddha & Philosophy',
      year: -563,
      yearLabel: '563 BCE',
      coords: getCoord(-563, LANES.PHILOSOPHY_PRIMARY),
      color: '#fbbf24',
      icon: <BookOpen className="w-5 h-5 text-yellow-400" />,
      visual: "The Orange Line deepens. Eastern philosophy emerges.",
      atmosphere: "The silence of meditation. The search for truth.",
      insight: "Philosophy offers new paths. The map shows alternative routes.",
      details: "Birth of Siddhartha Gautama. Buddhism and new philosophical traditions.",
      population: "~100 Million",
      lines: ['Philosophy']
    },
    {
      id: 'confucius',
      name: 'Confucius',
      year: -551,
      yearLabel: '551 BCE',
      coords: getCoord(-551, LANES.PHILOSOPHY_PRIMARY),
      color: '#fbbf24',
      icon: <BookOpen className="w-5 h-5 text-yellow-400" />,
      visual: "The Orange Line branches eastward. Ethical systems form.",
      atmosphere: "The wisdom of ages. The structure of society.",
      insight: "Moral philosophy shapes civilization. The map shows cultural foundations.",
      details: "Birth of Confucius. Confucianism shapes Chinese civilization.",
      population: "~100 Million",
      lines: ['Philosophy', 'Empire']
    },
    {
      id: 'persian',
      name: 'Persian Empire',
      year: -550,
      yearLabel: '550 BCE',
      coords: getCoord(-550, LANES.EMPIRE_PRIMARY),
      color: '#a855f7',
      icon: <Castle className="w-5 h-5 text-purple-400" />,
      visual: "The Purple Line expands dramatically. First super-empire.",
      atmosphere: "The scale of conquest. The unity of diverse peoples.",
      insight: "Empire reaches new scale. The map shows unprecedented territory.",
      details: "Achaemenid Empire under Cyrus the Great. First truly global empire.",
      population: "~100 Million",
      lines: ['Empire']
    },
    {
      id: 'classical',
      name: 'Classical Era',
      year: -500,
      yearLabel: '500 BCE',
      coords: getCoord(-500, LANES.MAJOR_HUB),
      color: '#a855f7',
      icon: <Castle className="w-5 h-5 text-purple-400" />,
      visual: "The Purple Line expands. Great empires rise (Rome, Persia, China).",
      atmosphere: "The sound of marching legions. The grandeur of marble cities.",
      insight: "Empires become the dominant structure. The map shows vast territories.",
      details: "Rome, Persia, and China create the first truly global empires.",
      population: "~100 Million",
      lines: ['Empire', 'Philosophy']
    },
    {
      id: 'alexander',
      name: 'Alexander the Great',
      year: -336,
      yearLabel: '336 BCE',
      coords: getCoord(-336, LANES.EMPIRE_PRIMARY),
      color: '#a855f7',
      icon: <Castle className="w-5 h-5 text-purple-400" />,
      visual: "The Purple Line stretches to breaking. Empire at its limit.",
      atmosphere: "The speed of conquest. The fusion of cultures.",
      insight: "Empire reaches its geographic limits. The map shows the edge of possibility.",
      details: "Alexander's conquests. Hellenistic culture spreads across continents.",
      population: "~150 Million",
      lines: ['Empire', 'Philosophy']
    },
    {
      id: 'qin',
      name: 'Qin Dynasty',
      year: -221,
      yearLabel: '221 BCE',
      coords: getCoord(-221, LANES.EMPIRE_SECONDARY),
      color: '#a855f7',
      icon: <Castle className="w-5 h-5 text-purple-400" />,
      visual: "The Purple Line consolidates in the East. Unified China.",
      atmosphere: "The weight of unity. The Great Wall begins.",
      insight: "China unifies. The map shows a new power center.",
      details: "Qin Shi Huang unifies China. Standardization and centralization.",
      population: "~200 Million",
      lines: ['Empire', 'Tech']
    },
    {
      id: 'rome',
      name: 'Roman Republic',
      year: -509,
      yearLabel: '509 BCE',
      coords: getCoord(-509, LANES.EMPIRE_SECONDARY),
      color: '#a855f7',
      icon: <Castle className="w-5 h-5 text-purple-400" />,
      visual: "The Purple Line gains structure. Republic emerges.",
      atmosphere: "The balance of power. The rule of law.",
      insight: "New form of governance. The map shows political innovation.",
      details: "Roman Republic established. New model of government.",
      population: "~100 Million",
      lines: ['Empire', 'Philosophy']
    },
    {
      id: 'jesus',
      name: 'Jesus & Christianity',
      year: 0,
      yearLabel: '1 CE',
      coords: getCoord(0, LANES.PHILOSOPHY_PRIMARY),
      color: '#fbbf24',
      icon: <BookOpen className="w-5 h-5 text-yellow-400" />,
      visual: "The Orange Line transforms. New spiritual path emerges.",
      atmosphere: "The birth of hope. The spread of faith.",
      insight: "Religious revolution. The map shows a new philosophical direction.",
      details: "Birth of Jesus. Christianity begins to spread.",
      population: "~200 Million",
      lines: ['Philosophy']
    },
    {
      id: 'han',
      name: 'Han Dynasty Peak',
      year: 100,
      yearLabel: '100 CE',
      coords: getCoord(100, LANES.EMPIRE_SECONDARY),
      color: '#a855f7',
      icon: <Castle className="w-5 h-5 text-purple-400" />,
      visual: "The Purple Line reaches new heights in the East.",
      atmosphere: "The Silk Road. The exchange of goods and ideas.",
      insight: "China at its peak. Trade routes connect civilizations.",
      details: "Han Dynasty golden age. Silk Road trade flourishes.",
      population: "~250 Million",
      lines: ['Empire', 'Tech']
    },
    {
      id: 'fall-rome',
      name: 'Fall of Rome',
      year: 476,
      yearLabel: '476 CE',
      coords: getCoord(476, LANES.WAR_PRIMARY),
      color: '#dc2626',
      icon: <Skull className="w-5 h-5 text-red-400" />,
      visual: "The Purple Line fractures. The Red Line surges. The map reorganizes.",
      atmosphere: "The collapse of order. The migration of peoples.",
      insight: "Empires fall, but the tracks remain. New stations emerge from the ruins.",
      details: "The Western Roman Empire falls. The map of Europe redraws itself.",
      population: "~200 Million",
      lines: ['Empire', 'War']
    },
    {
      id: 'justinian',
      name: 'Justinian Code',
      year: 529,
      yearLabel: '529 CE',
      coords: getCoord(529, LANES.PHILOSOPHY_SECONDARY),
      color: '#fbbf24',
      icon: <BookOpen className="w-5 h-5 text-yellow-400" />,
      visual: "The Orange Line codifies. Law becomes systematic.",
      atmosphere: "The weight of legal tradition. The structure of justice.",
      insight: "Legal systems formalize. The map shows the framework of order.",
      details: "Justinian's Code. Roman law preserved and systematized.",
      population: "~200 Million",
      lines: ['Philosophy', 'Empire']
    },
    {
      id: 'tang',
      name: 'Tang Dynasty',
      year: 618,
      yearLabel: '618 CE',
      coords: getCoord(618, LANES.EMPIRE_SECONDARY),
      color: '#a855f7',
      icon: <Castle className="w-5 h-5 text-purple-400" />,
      visual: "The Purple Line flourishes in the East. Golden age.",
      atmosphere: "The prosperity of peace. The flow of poetry.",
      insight: "China's cultural peak. The map shows artistic achievement.",
      details: "Tang Dynasty begins. Golden age of Chinese civilization.",
      population: "~250 Million",
      lines: ['Empire', 'Philosophy']
    },
    {
      id: 'islamic-golden',
      name: 'Islamic Golden Age',
      year: 800,
      yearLabel: '800 CE',
      coords: getCoord(800, LANES.TECH_PRIMARY),
      color: '#22d3ee',
      icon: <BookOpen className="w-5 h-5 text-cyan-400" />,
      visual: "The Blue Line brightens in the East. Knowledge flows along new routes.",
      atmosphere: "The scent of libraries. The exchange of ideas across continents.",
      insight: "Science and mathematics advance. The map shows new intellectual centers.",
      details: "Baghdad becomes a hub of learning. Knowledge spreads along trade routes.",
      population: "~250 Million",
      lines: ['Tech', 'Philosophy']
    },
    {
      id: 'gunpowder',
      name: 'Gunpowder',
      year: 850,
      yearLabel: '850 CE',
      coords: getCoord(850, LANES.TECH_SECONDARY),
      color: '#22d3ee',
      icon: <Settings className="w-5 h-5 text-cyan-400" />,
      visual: "The Blue Line gains explosive power. New force enters the map.",
      atmosphere: "The smell of sulfur. The flash of fire.",
      insight: "Chemical power harnessed. Warfare transforms forever.",
      details: "Gunpowder invented in China. Will transform warfare and technology.",
      population: "~250 Million",
      lines: ['Tech', 'War']
    },
    {
      id: 'vikings',
      name: 'Viking Age',
      year: 793,
      yearLabel: '793 CE',
      coords: getCoord(793, LANES.WAR_SECONDARY),
      color: '#dc2626',
      icon: <Skull className="w-5 h-5 text-red-400" />,
      visual: "The Red Line surges northward. Raiders reshape the map.",
      atmosphere: "The sound of oars. The fear of the unknown.",
      insight: "Exploration through conquest. The map expands northward.",
      details: "Viking raids begin. Exploration and trade across the North Atlantic.",
      population: "~250 Million",
      lines: ['War', 'Tech']
    },
    {
      id: 'magna-carta',
      name: 'Magna Carta',
      year: 1215,
      yearLabel: '1215 CE',
      coords: getCoord(1215, LANES.PHILOSOPHY_SECONDARY),
      color: '#fbbf24',
      icon: <BookOpen className="w-5 h-5 text-yellow-400" />,
      visual: "The Orange Line constrains power. Rights emerge.",
      atmosphere: "The weight of parchment. The limit of kings.",
      insight: "Power becomes limited. The map shows new political structures.",
      details: "Magna Carta signed. Foundation of constitutional law.",
      population: "~400 Million",
      lines: ['Philosophy', 'Empire']
    },
    {
      id: 'mongol',
      name: 'Mongol Empire',
      year: 1206,
      yearLabel: '1206 CE',
      coords: getCoord(1206, LANES.EMPIRE_PRIMARY),
      color: '#a855f7',
      icon: <Castle className="w-5 h-5 text-purple-400" />,
      visual: "The Purple Line explodes. Largest land empire.",
      atmosphere: "The thunder of hooves. The unity of the steppe.",
      insight: "Empire reaches unprecedented scale. The map shows continental unity.",
      details: "Genghis Khan unites Mongols. Largest contiguous empire in history.",
      population: "~400 Million",
      lines: ['Empire', 'War']
    },
    {
      id: 'black-death',
      name: 'Black Death',
      year: 1347,
      yearLabel: '1347 CE',
      coords: getCoord(1347, LANES.POPULATION_SECONDARY),
      color: '#dc2626',
      icon: <Skull className="w-5 h-5 text-red-400" />,
      visual: "The Green Line plummets. The Red Line of disease spreads.",
      atmosphere: "The silence of empty streets. The weight of loss.",
      insight: "Population crashes. The map shows the fragility of civilization.",
      details: "Black Death arrives in Europe. 30-50% of population dies.",
      population: "~350 Million (then ~250 Million)",
      lines: ['Population', 'War']
    },
    {
      id: 'renaissance',
      name: 'Renaissance',
      year: 1400,
      yearLabel: '1400 CE',
      coords: getCoord(1400, LANES.PHILOSOPHY_PRIMARY),
      color: '#fbbf24',
      icon: <BookOpen className="w-5 h-5 text-yellow-400" />,
      visual: "The Orange Line shifts. Humanism emerges. The map rediscovers itself.",
      atmosphere: "The smell of paint and marble. The sound of new ideas.",
      insight: "The past illuminates the future. The map becomes a work of art.",
      details: "Europe rediscovers classical knowledge. The Orange Line shifts toward humanism.",
      population: "~350 Million",
      lines: ['Philosophy', 'Tech']
    },
    {
      id: 'gutenberg',
      name: 'Gutenberg Bible',
      year: 1455,
      yearLabel: '1455 CE',
      coords: getCoord(1455, LANES.TECH_PRIMARY),
      color: '#22d3ee',
      icon: <Printer className="w-5 h-5 text-cyan-400" />,
      visual: "The Blue Line multiplies. Knowledge becomes mass-produced.",
      atmosphere: "The smell of ink. The weight of books.",
      insight: "Information revolution begins. The map becomes reproducible.",
      details: "First major book printed with movable type. Information age begins.",
      population: "~400 Million",
      lines: ['Tech', 'Philosophy']
    },
    {
      id: 'printing',
      name: 'Printing Press',
      year: 1440,
      yearLabel: '1440 CE',
      coords: getCoord(1440, LANES.TECH_PRIMARY),
      color: '#22d3ee',
      icon: <Printer className="w-5 h-5 text-cyan-400" />,
      visual: "The Blue Line brightens. Knowledge becomes reproducible.",
      atmosphere: "The smell of ink and paper. The mechanical rhythm of the press.",
      insight: "Information spreads exponentially. The map of the world becomes accessible to all.",
      details: "Just prior to the Columbian Exchange. Ensures maps of the new world are distributed to everyone.",
      population: "~400 Million",
      lines: ['Tech', 'Philosophy']
    },
    {
      id: 'columbian',
      name: 'Columbian Exchange Terminal',
      year: 1492,
      yearLabel: '1492 CE',
      coords: getCoord(1492, LANES.MAJOR_HUB),
      color: '#fbbf24',
      icon: <Globe className="w-6 h-6 text-yellow-400" />,
      visual: "A chaotic knot. The Purple Line (Empires) splits and wraps around the entire globe (Spain/Portugal). The Green Line (Population) suffers a glitch—a dip due to disease in the Americas—before surging upward.",
      atmosphere: "Salt water, gold, and gunpowder.",
      insight: "The 'World Map' connects. Previously, the Metro had two separate systems (East and West). Now, they are one grid.",
      details: "The Printing Press station just prior ensures that maps of this new world are distributed to everyone.",
      population: "~500 Million (dip then surge)",
      lines: ['Empire', 'Population', 'Tech']
    },
    {
      id: 'scientific-rev',
      name: 'Scientific Revolution',
      year: 1543,
      yearLabel: '1543 CE',
      coords: getCoord(1543, LANES.TECH_PRIMARY),
      color: '#22d3ee',
      icon: <BookOpen className="w-5 h-5 text-cyan-400" />,
      visual: "The Blue Line accelerates. Observation replaces authority.",
      atmosphere: "The precision of measurement. The clarity of reason.",
      insight: "Science becomes method. The map shows systematic discovery.",
      details: "Copernicus publishes On the Revolutions. Scientific method emerges.",
      population: "~500 Million",
      lines: ['Tech', 'Philosophy']
    },
    {
      id: 'enlightenment',
      name: 'Enlightenment',
      year: 1687,
      yearLabel: '1687 CE',
      coords: getCoord(1687, LANES.PHILOSOPHY_PRIMARY),
      color: '#fbbf24',
      icon: <BookOpen className="w-5 h-5 text-yellow-400" />,
      visual: "The Orange Line brightens. Reason illuminates the map.",
      atmosphere: "The clarity of thought. The power of ideas.",
      insight: "Philosophy becomes systematic. The map shows intellectual revolution.",
      details: "Newton's Principia. Age of Reason begins.",
      population: "~600 Million",
      lines: ['Philosophy', 'Tech']
    },
    {
      id: 'steam',
      name: 'Steam Engine',
      year: 1712,
      yearLabel: '1712 CE',
      coords: getCoord(1712, LANES.TECH_SECONDARY),
      color: '#22d3ee',
      icon: <Gauge className="w-5 h-5 text-cyan-400" />,
      visual: "The Blue Line gains power. Mechanical force emerges.",
      atmosphere: "The hiss of steam. The rhythm of pistons.",
      insight: "Energy harnessed. The map shows new sources of power.",
      details: "Newcomen's steam engine. First practical steam power.",
      population: "~650 Million",
      lines: ['Tech']
    },
    {
      id: 'watt',
      name: "Watt's Engine",
      year: 1769,
      yearLabel: '1769 CE',
      coords: getCoord(1769, LANES.TECH_PRIMARY),
      color: '#22d3ee',
      icon: <Gauge className="w-5 h-5 text-cyan-400" />,
      visual: "The Blue Line transforms into steel rails. Steam power emerges.",
      atmosphere: "The hiss of steam, the clank of metal, the rhythm of industry.",
      insight: "Mechanical power multiplies human capability. The train gains its engine.",
      details: "Provides the power for the Industrial Grand Central station ahead.",
      population: "~750 Million",
      lines: ['Tech']
    },
    {
      id: 'french-rev',
      name: 'French Revolution',
      year: 1789,
      yearLabel: '1789 CE',
      coords: getCoord(1789, LANES.WAR_PRIMARY),
      color: '#dc2626',
      icon: <Skull className="w-5 h-5 text-red-400" />,
      visual: "The Red Line surges. The Purple Line fractures. Liberty emerges.",
      atmosphere: "The cry of revolution. The fall of the old order.",
      insight: "Political revolution. The map shows new forms of governance.",
      details: "French Revolution begins. Age of revolutions starts.",
      population: "~800 Million",
      lines: ['War', 'Philosophy', 'Empire']
    },
    {
      id: 'industrial',
      name: 'Industrial Grand Central',
      year: 1800,
      yearLabel: '1800 CE',
      coords: getCoord(1800, LANES.MAJOR_HUB),
      color: '#ef4444',
      icon: <Zap className="w-6 h-6 text-blue-400" />,
      visual: "The Blue Line turns into steel rails and emits steam. The Green Line goes vertical (hitting 1 Billion). The Orange Line shifts from Faith to Reason (Secular Rights).",
      atmosphere: "Coal smoke, piston beats, and the roar of the masses.",
      insight: "For the first time, the 'Tech' line moves faster than the 'Empire' line. The train is now moving so fast that the scenery blurs.",
      details: "Watt's Engine (1769) provides the power. The Orange Line shifts from Faith to Reason.",
      population: "1 Billion",
      lines: ['Tech', 'Population', 'Philosophy']
    },
    {
      id: 'railroad',
      name: 'Railroads',
      year: 1825,
      yearLabel: '1825 CE',
      coords: getCoord(1825, LANES.TECH_SECONDARY),
      color: '#22d3ee',
      icon: <Settings className="w-5 h-5 text-cyan-400" />,
      visual: "The Blue Line becomes literal rails. Distance collapses.",
      atmosphere: "The rhythm of wheels. The speed of connection.",
      insight: "Transportation revolution. The map shrinks through speed.",
      details: "First public railway. Transportation transforms civilization.",
      population: "~1 Billion",
      lines: ['Tech']
    },
    {
      id: 'telegraph',
      name: 'Telegraph',
      year: 1844,
      yearLabel: '1844 CE',
      coords: getCoord(1844, LANES.TECH_SECONDARY),
      color: '#22d3ee',
      icon: <Zap className="w-5 h-5 text-cyan-400" />,
      visual: "The Blue Line becomes instant. Information at light speed.",
      atmosphere: "The click of keys. The pulse of messages.",
      insight: "Communication revolution. The map becomes real-time.",
      details: "First telegraph message. Instant long-distance communication.",
      population: "~1.2 Billion",
      lines: ['Tech']
    },
    {
      id: 'darwin',
      name: 'Origin of Species',
      year: 1859,
      yearLabel: '1859 CE',
      coords: getCoord(1859, LANES.PHILOSOPHY_PRIMARY),
      color: '#fbbf24',
      icon: <BookOpen className="w-5 h-5 text-yellow-400" />,
      visual: "The Orange Line shifts. Understanding of life transforms.",
      atmosphere: "The weight of evidence. The shift of perspective.",
      insight: "Scientific revolution in biology. The map shows new understanding.",
      details: "Darwin publishes Origin of Species. Evolution theory emerges.",
      population: "~1.3 Billion",
      lines: ['Philosophy', 'Tech']
    },
    {
      id: 'ww1',
      name: 'World War I',
      year: 1914,
      yearLabel: '1914 CE',
      coords: getCoord(1914, LANES.WAR_PRIMARY),
      color: '#dc2626',
      icon: <Skull className="w-5 h-5 text-red-400" />,
      visual: "The Red Line engulfs the map. Industrial war emerges.",
      atmosphere: "The roar of artillery. The mud of trenches.",
      insight: "War becomes industrial. The map shows total conflict.",
      details: "World War I begins. First industrial-scale global war.",
      population: "~1.8 Billion",
      lines: ['War', 'Tech']
    },
    {
      id: 'crisis',
      name: 'The Crisis Hub',
      year: 1914,
      yearLabel: '1914–1945',
      coords: getCoord(1914, LANES.CRISIS),
      color: '#dc2626',
      icon: <Skull className="w-6 h-6 text-red-500" />,
      visual: "The map is scorched. The Red Line (War) bleeds over everything, obscuring the tracks. The Green Line wavers (70M dead). The Purple Line fractures (British Empire falls) and consolidates into two massive blocks (USA/USSR).",
      atmosphere: "Static, sirens, and the blinding flash of Los Alamos (1945).",
      insight: "The Atomic Station: The Blue Line becomes dangerous. It's no longer just a tool; it's an existential threat.",
      details: "Existentialism (Orange): Passengers leave this station looking over their shoulders, questioning the nature of the ride. Green line wavers (70M dead). Empire consolidates into blocks.",
      population: "~2.5 Billion (70M lost)",
      lines: ['War', 'Tech', 'Empire', 'Philosophy']
    },
    {
      id: 'penicillin',
      name: 'Penicillin',
      year: 1928,
      yearLabel: '1928 CE',
      coords: getCoord(1928, LANES.TECH_SECONDARY),
      color: '#22d3ee',
      icon: <Settings className="w-5 h-5 text-cyan-400" />,
      visual: "The Blue Line heals. Medicine transforms.",
      atmosphere: "The hope of cure. The defeat of disease.",
      insight: "Medical revolution. The map shows longer, healthier lives.",
      details: "Penicillin discovered. Antibiotic age begins.",
      population: "~2 Billion",
      lines: ['Tech', 'Population']
    },
    {
      id: 'atomic',
      name: 'The Atomic Station',
      year: 1945,
      yearLabel: '1945 CE',
      coords: getCoord(1945, LANES.CRISIS),
      color: '#22d3ee',
      icon: <Atom className="w-5 h-5 text-cyan-400" />,
      visual: "The Blue Line becomes a weapon. A blinding flash illuminates the map.",
      atmosphere: "The silence after the explosion. The weight of infinite power.",
      insight: "Technology reaches the point of self-destruction. The Blue Line is no longer just progress—it's a choice between creation and annihilation.",
      details: "Los Alamos. The Blue Line becomes an existential threat. Passengers question the ride.",
      population: "~2.5 Billion",
      lines: ['Tech', 'War']
    },
    {
      id: 'dna',
      name: 'DNA Structure',
      year: 1953,
      yearLabel: '1953 CE',
      coords: getCoord(1953, LANES.TECH_PRIMARY),
      color: '#22d3ee',
      icon: <Atom className="w-5 h-5 text-cyan-400" />,
      visual: "The Blue Line reveals life's code. Biology becomes information.",
      atmosphere: "The elegance of the double helix. The code of existence.",
      insight: "Life understood at molecular level. The map shows the code of life.",
      details: "DNA structure discovered. Genetic age begins.",
      population: "~2.7 Billion",
      lines: ['Tech', 'Philosophy']
    },
    {
      id: 'space',
      name: 'Space Age',
      year: 1957,
      yearLabel: '1957 CE',
      coords: getCoord(1957, LANES.TECH_SECONDARY),
      color: '#22d3ee',
      icon: <Zap className="w-5 h-5 text-cyan-400" />,
      visual: "The Blue Line escapes Earth. The map expands beyond the planet.",
      atmosphere: "The silence of space. The beep of satellites.",
      insight: "Humanity reaches beyond Earth. The map shows new frontiers.",
      details: "Sputnik launched. Space age begins.",
      population: "~2.8 Billion",
      lines: ['Tech']
    },
    {
      id: 'internet',
      name: 'ARPANET',
      year: 1969,
      yearLabel: '1969 CE',
      coords: getCoord(1969, LANES.TECH_SECONDARY),
      color: '#22d3ee',
      icon: <Cpu className="w-5 h-5 text-cyan-400" />,
      visual: "The Blue Line networks. Digital connections form.",
      atmosphere: "The pulse of data. The birth of networks.",
      insight: "Networking begins. The map shows digital connections.",
      details: "ARPANET first message. Internet age begins.",
      population: "~3.6 Billion",
      lines: ['Tech']
    },
    {
      id: 'pc',
      name: 'Personal Computer',
      year: 1977,
      yearLabel: '1977 CE',
      coords: getCoord(1977, LANES.TECH_SECONDARY),
      color: '#22d3ee',
      icon: <Cpu className="w-5 h-5 text-cyan-400" />,
      visual: "The Blue Line becomes personal. Computing democratizes.",
      atmosphere: "The glow of screens. The power in every home.",
      insight: "Computing becomes accessible. The map shows personal technology.",
      details: "Apple II and Commodore PET. Personal computing revolution.",
      population: "~4.2 Billion",
      lines: ['Tech']
    },
    {
      id: 'web',
      name: 'The Web',
      year: 1991,
      yearLabel: '1991 CE',
      coords: getCoord(1991, LANES.TECH_PRIMARY),
      color: '#22d3ee',
      icon: <Cpu className="w-5 h-5 text-cyan-400" />,
      visual: "The Blue Line begins its vertical ascent. Information becomes instant and global.",
      atmosphere: "The hum of modems, the glow of screens, the birth of digital space.",
      insight: "The world becomes a network. Distance collapses. The map becomes the territory.",
      details: "The first stop in the Digital Singularity. Information flows at the speed of light.",
      population: "~5.4 Billion",
      lines: ['Tech']
    },
    {
      id: 'human-genome',
      name: 'Human Genome',
      year: 2003,
      yearLabel: '2003 CE',
      coords: getCoord(2003, LANES.TECH_PRIMARY),
      color: '#22d3ee',
      icon: <Atom className="w-5 h-5 text-cyan-400" />,
      visual: "The Blue Line maps life itself. The code is read.",
      atmosphere: "The completion of a map. The understanding of self.",
      insight: "Human genome sequenced. The map shows our complete code.",
      details: "Human Genome Project completed. Genetic medicine advances.",
      population: "~6.4 Billion",
      lines: ['Tech', 'Philosophy']
    },
    {
      id: 'smartphone',
      name: 'Smartphone',
      year: 2007,
      yearLabel: '2007 CE',
      coords: getCoord(2007, LANES.TECH_PRIMARY),
      color: '#22d3ee',
      icon: <Smartphone className="w-5 h-5 text-cyan-400" />,
      visual: "The Blue Line accelerates further. The network fits in your pocket.",
      atmosphere: "The glow of screens everywhere. Constant connection. The world in your hand.",
      insight: "The map becomes personal. Everyone carries the entire network. The train is in every pocket.",
      details: "The network becomes mobile. The Blue Line reaches into every moment of life.",
      population: "~6.7 Billion",
      lines: ['Tech', 'Population']
    },
    {
      id: 'singularity',
      name: 'Digital Singularity / AGI',
      year: 2025,
      yearLabel: '2025 CE',
      coords: getCoord(2025, LANES.SINGULARITY),
      color: '#fff',
      icon: <AlertTriangle className="w-6 h-6 text-white" />,
      visual: "The current station. The map here is so dense it is almost solid light. Blue Line: Vertical ascent. Green Line: Peaking at 8.1 Billion. Purple Line: The 'Unipolar' track is dissolving into a complex web of multipolarity.",
      atmosphere: "The hum of servers, the glow of screens, and a sense of vertigo.",
      insight: "We are currently standing on the platform at 'Everywhere / AGI (2025).' Looking down the tunnel, the tracks disappear into a fog called 'The Future.' The Blue Line is so bright it illuminates the tunnel ahead, but we cannot see where the track leads.",
      details: "Current Location. Compression: The distance between 'Game Changing' stations has shrunk from millennia to months. Convergence: The Orange Line (Philosophy/Ethics) is frantically trying to catch up to the Blue Line (Tech). The Next Stop: The map lists no stops after 2025. The track is being laid down by the train as it moves. Passenger Warning: Please mind the gap between your biological evolution (Green Line) and your technological reality (Blue Line).",
      population: "8.1 Billion",
      lines: ['Tech', 'Population', 'Philosophy', 'Empire']
    }
  ].map(station => {
    // Reposition each station onto its PRIMARY line's Y level
    // This ensures stations appear ON their lines, not floating between them
    const primaryLine = station.lines[0];
    const lineY = LINE_POSITIONS[primaryLine];
    if (lineY !== undefined) {
      return {
        ...station,
        coords: {
          x: station.coords.x,
          y: lineY * VIEWBOX_HEIGHT
        }
      };
    }
    return station;
  }), []);

  // Enhanced path generators with better curves
  // Enhanced path generation that ensures paths pass THROUGH stations
  // Human-Centric: Paths must visibly go through station centers
  const generateSmoothPath = (points) => {
    if (points.length < 2) return "";
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const next = points[i + 1] || curr;
      
      // Calculate direction vectors for smooth curves
      const dx1 = curr.x - prev.x;
      const dy1 = curr.y - prev.y;
      const dx2 = (next.x - curr.x) || dx1;
      const dy2 = (next.y - curr.y) || dy1;
      
      // Control points that ensure the curve passes through the station
      // Using tighter control to make the path visibly go through the point
      const cp1x = prev.x + dx1 * 0.3;
      const cp1y = prev.y + dy1 * 0.3;
      const cp2x = curr.x - dx2 * 0.15;
      const cp2y = curr.y - dy2 * 0.15;
      
      // Explicitly pass through the current point (station center)
      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${curr.x} ${curr.y}`;
    }
    return d;
  };
  
  // Generate explicit station connection segments
  // These create visible "tracks" that stations sit on
  const generateStationConnections = (points, stationIds, allStations) => {
    const connections = [];
    points.forEach((point, idx) => {
      // Find if this point corresponds to a station
      const station = allStations.find(s => 
        Math.abs(s.coords.x - point.x) < 5 && Math.abs(s.coords.y - point.y) < 5
      );
      
      if (station && idx > 0 && idx < points.length - 1) {
        const prev = points[idx - 1];
        const next = points[idx + 1];
        
        // Create explicit connection segments entering and leaving the station
        // This makes it visually clear the path goes THROUGH the station
        const angleIn = Math.atan2(station.coords.y - prev.y, station.coords.x - prev.x);
        const angleOut = Math.atan2(next.y - station.coords.y, next.x - station.coords.x);
        
        const radius = 40; // Distance from station center for connection points
        
        connections.push({
          stationId: station.id,
          enterX: station.coords.x - Math.cos(angleIn) * radius,
          enterY: station.coords.y - Math.sin(angleIn) * radius,
          centerX: station.coords.x,
          centerY: station.coords.y,
          exitX: station.coords.x + Math.cos(angleOut) * radius,
          exitY: station.coords.y + Math.sin(angleOut) * radius,
          station: station
        });
      }
    });
    return connections;
  };

  // Rocket trajectory for Blue line near the end (vertical ascent)
  const generateRocketPath = (points) => {
    if (points.length < 2) return "";
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      
      // Early points: smooth curve
      if (i < points.length - 2) {
        const cp1x = prev.x + (curr.x - prev.x) * 0.5;
        const cp1y = prev.y;
        const cp2x = curr.x - (curr.x - prev.x) * 0.1;
        const cp2y = curr.y;
        d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${curr.x} ${curr.y}`;
      } else {
        // Last segment: near-vertical rocket trajectory
        const midX = (prev.x + curr.x) / 2;
        d += ` Q ${midX} ${prev.y}, ${curr.x} ${curr.y}`;
      }
    }
    return d;
  };

  // Sharp angular path for War line - deterministic tension pattern
  const generateJaggedPath = (points) => {
    if (points.length < 2) return "";
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      // Create angular tension with deterministic zigzag pattern
      const midX = (prev.x + curr.x) / 2;
      const midY = (prev.y + curr.y) / 2;
      // Offset the midpoint for visual tension
      const offset = (i % 2 === 0) ? 25 : -25;
      d += ` L ${midX} ${midY + offset} L ${curr.x} ${curr.y}`;
    }
    return d;
  };

  // Stepped path for Empire line - clean metro-style with gentle steps
  const generateBlockyPath = (points) => {
    if (points.length < 2) return "";
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      // Smooth S-curve connections instead of harsh 90-degree turns
      const midX = (prev.x + curr.x) / 2;
      const cp1x = prev.x + (curr.x - prev.x) * 0.4;
      const cp2x = curr.x - (curr.x - prev.x) * 0.4;
      d += ` C ${cp1x} ${prev.y}, ${cp2x} ${curr.y}, ${curr.x} ${curr.y}`;
    }
    return d;
  };

  // Braided trunk for Green line (multiple overlapping paths)
  // Scaled for larger viewport
  // IMPORTANT: Main path passes through stations, braids are visual effect only
  const generateBraidedPath = (points) => {
    const basePath = generateSmoothPath(points);
    // Create offset paths for braided effect - scaled for larger viewport
    // These are visual only - the main path is what connects stations
    const offset1 = points.map(p => ({ x: p.x - 8, y: p.y + 5 }));
    const offset2 = points.map(p => ({ x: p.x + 8, y: p.y - 5 }));
    return {
      main: basePath, // This is the actual path that passes through stations
      braid1: generateSmoothPath(offset1), // Visual effect only
      braid2: generateSmoothPath(offset2)  // Visual effect only
    };
  };

  // Memoized paths - TRUE METRO STYLE: Each line stays in its own horizontal corridor
  // Lines only deviate for the final convergence point
  const paths = useMemo(() => {
    // Define consistent Y positions for each line's corridor
    const LINE_Y = {
      tech: VIEWBOX_HEIGHT * 0.18,      // Cyan - Top
      war: VIEWBOX_HEIGHT * 0.34,       // Red - Upper middle  
      population: VIEWBOX_HEIGHT * 0.50, // Green - Center
      philosophy: VIEWBOX_HEIGHT * 0.66, // Orange - Lower middle
      empire: VIEWBOX_HEIGHT * 0.82     // Purple - Bottom
    };
    
    // Final convergence point where all lines meet
    const CONVERGENCE_X = yearToX(2025);
    const CONVERGENCE_Y = VIEWBOX_HEIGHT * 0.15;
    
    // 1. BLUE (Tech) - Horizontal line at top, curves up at end
    const bluePts = [
      { x: 0, y: LINE_Y.tech },
      { x: yearToX(-10000), y: LINE_Y.tech },
      { x: yearToX(-8000), y: LINE_Y.tech },
      { x: yearToX(-6000), y: LINE_Y.tech },
      { x: yearToX(-3500), y: LINE_Y.tech },
      { x: yearToX(-3200), y: LINE_Y.tech },
      { x: yearToX(-3000), y: LINE_Y.tech },
      { x: yearToX(-1200), y: LINE_Y.tech },
      { x: yearToX(800), y: LINE_Y.tech },
      { x: yearToX(1455), y: LINE_Y.tech },
      { x: yearToX(1543), y: LINE_Y.tech },
      { x: yearToX(1712), y: LINE_Y.tech },
      { x: yearToX(1800), y: LINE_Y.tech },
      { x: yearToX(1900), y: LINE_Y.tech },
      { x: yearToX(1950), y: LINE_Y.tech },
      { x: yearToX(1990), y: LINE_Y.tech },
      { x: yearToX(2010), y: LINE_Y.tech * 0.8 },
      { x: CONVERGENCE_X, y: CONVERGENCE_Y },
      { x: CONVERGENCE_X + 50, y: 0 }
    ];
    
    // 2. RED (War) - Starts later, stays horizontal in its band
    const redPts = [
      { x: yearToX(-1200), y: LINE_Y.war },
      { x: yearToX(476), y: LINE_Y.war },
      { x: yearToX(793), y: LINE_Y.war },
      { x: yearToX(1206), y: LINE_Y.war },
      { x: yearToX(1492), y: LINE_Y.war },
      { x: yearToX(1789), y: LINE_Y.war },
      { x: yearToX(1850), y: LINE_Y.war },
      { x: yearToX(1914), y: LINE_Y.war },
      { x: yearToX(1945), y: LINE_Y.war },
      { x: yearToX(1990), y: LINE_Y.war },
      { x: yearToX(2010), y: LINE_Y.war * 0.85 },
      { x: CONVERGENCE_X, y: CONVERGENCE_Y + 30 }
    ];
    
    // 3. GREEN (Population) - Center line, stays horizontal
    const greenPts = [
      { x: 0, y: LINE_Y.population },
      { x: yearToX(-10000), y: LINE_Y.population },
      { x: yearToX(-4000), y: LINE_Y.population },
      { x: yearToX(-3500), y: LINE_Y.population },
      { x: yearToX(-500), y: LINE_Y.population },
      { x: yearToX(100), y: LINE_Y.population },
      { x: yearToX(476), y: LINE_Y.population },
      { x: yearToX(1347), y: LINE_Y.population * 1.05 }, // Slight dip for Black Death
      { x: yearToX(1492), y: LINE_Y.population },
      { x: yearToX(1800), y: LINE_Y.population },
      { x: yearToX(1900), y: LINE_Y.population * 0.95 },
      { x: yearToX(1950), y: LINE_Y.population * 0.85 },
      { x: yearToX(2000), y: LINE_Y.population * 0.7 },
      { x: yearToX(2015), y: LINE_Y.population * 0.5 },
      { x: CONVERGENCE_X, y: CONVERGENCE_Y + 60 }
    ];
    
    // 4. ORANGE (Philosophy) - Lower middle band
    const orangePts = [
      { x: yearToX(-10000), y: LINE_Y.philosophy },
      { x: yearToX(-1750), y: LINE_Y.philosophy },
      { x: yearToX(-776), y: LINE_Y.philosophy },
      { x: yearToX(-563), y: LINE_Y.philosophy },
      { x: yearToX(-500), y: LINE_Y.philosophy },
      { x: yearToX(0), y: LINE_Y.philosophy },
      { x: yearToX(529), y: LINE_Y.philosophy },
      { x: yearToX(800), y: LINE_Y.philosophy },
      { x: yearToX(1215), y: LINE_Y.philosophy },
      { x: yearToX(1400), y: LINE_Y.philosophy },
      { x: yearToX(1687), y: LINE_Y.philosophy },
      { x: yearToX(1859), y: LINE_Y.philosophy },
      { x: yearToX(1950), y: LINE_Y.philosophy * 0.9 },
      { x: yearToX(2000), y: LINE_Y.philosophy * 0.75 },
      { x: CONVERGENCE_X, y: CONVERGENCE_Y + 90 }
    ];
    
    // 5. PURPLE (Empire) - Bottom band, curves up at end
    const purplePts = [
      { x: yearToX(-4000), y: LINE_Y.empire },
      { x: yearToX(-3500), y: LINE_Y.empire },
      { x: yearToX(-3300), y: LINE_Y.empire },
      { x: yearToX(-3100), y: LINE_Y.empire },
      { x: yearToX(-2600), y: LINE_Y.empire },
      { x: yearToX(-550), y: LINE_Y.empire },
      { x: yearToX(-500), y: LINE_Y.empire },
      { x: yearToX(-336), y: LINE_Y.empire },
      { x: yearToX(-221), y: LINE_Y.empire },
      { x: yearToX(100), y: LINE_Y.empire },
      { x: yearToX(618), y: LINE_Y.empire },
      { x: yearToX(1206), y: LINE_Y.empire },
      { x: yearToX(1492), y: LINE_Y.empire },
      { x: yearToX(1800), y: LINE_Y.empire * 0.95 },
      { x: yearToX(1914), y: LINE_Y.empire * 0.85 },
      { x: yearToX(2000), y: LINE_Y.empire * 0.6 },
      { x: CONVERGENCE_X, y: CONVERGENCE_Y + 120 }
    ];

    const greenBraided = generateBraidedPath(greenPts);

    return {
      orange: generateSmoothPath(orangePts),
      purple: generateSmoothPath(purplePts),
      green: greenBraided,
      red: generateSmoothPath(redPts),
      blue: generateSmoothPath(bluePts),
      connections: {} // Disable complex connections for cleaner look
    };
  }, [stations]);

  // Initialize viewBox on mount - Human-Centric: Show meaningful overview
  useEffect(() => {
    try {
      // Start with a view that shows the full timeline width but focused on the middle
      // This gives users a sense of the full scope while being centered
      const initialWidth = VIEWBOX_WIDTH * 0.8;
      const initialHeight = VIEWBOX_HEIGHT * 0.7;
      setViewBox({ 
        x: VIEWBOX_WIDTH * 0.1, 
        y: VIEWBOX_HEIGHT * 0.15, 
        width: initialWidth, 
        height: initialHeight 
      });
      
      // Simulate loading time for smooth experience
      const loadTimer = setTimeout(() => {
        setIsLoading(false);
        announce('Civilization Metro Map loaded successfully');
      }, 800);

      return () => clearTimeout(loadTimer);
    } catch (err) {
      setLoadError(err);
      setIsLoading(false);
      showError('Failed to initialize map. Please refresh the page.');
      console.error('Initialization error:', err);
    }
  }, [announce, showError]);

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
          setAnimationProgress(progress);
          if (progress < 1) {
            requestAnimationFrame(animate);
          } else {
            announce('Map animation complete');
          }
        } catch (err) {
          console.error('Animation error:', err);
          setAnimationProgress(1); // Complete animation on error
        }
      };
      animate();
    } catch (err) {
      console.error('Animation setup error:', err);
      setAnimationProgress(1);
    }
  }, [isLoading, announce]);

  // Pan and Zoom Handlers
  const panViewBox = useCallback((dx, dy) => {
    setViewBox(prev => ({
      ...prev,
      x: viewBoxStartRef.current.x - dx,
      y: viewBoxStartRef.current.y - dy
    }));
  }, []);

  const throttledPan = useThrottle(panViewBox, 16); // Throttle to ~60fps

  const handleMouseDown = (e) => {
    // Only pan if clicking on background (not on stations)
    if (e.target.tagName === 'svg' || e.target.tagName === 'path' || e.target.tagName === 'line' || e.target.tagName === 'text') {
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY });
      viewBoxStartRef.current = { x: viewBox.x, y: viewBox.y };
      e.preventDefault();
    }
  };

  const handleMouseMove = useCallback((e) => {
    if (isPanning && containerRef.current) {
      try {
        const dx = (e.clientX - panStart.x) * (viewBox.width / containerRef.current.clientWidth);
        const dy = (e.clientY - panStart.y) * (viewBox.height / containerRef.current.clientHeight);
        
        throttledPan(dx, dy);
      } catch (err) {
        console.error('Pan error:', err);
        setIsPanning(false);
      }
    }
  }, [isPanning, panStart, viewBox, throttledPan]);

  const handleMouseUp = () => {
    setIsPanning(false);
  };

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

    setViewBox({
      x: Math.max(0, Math.min(VIEWBOX_WIDTH - constrainedWidth, newX)),
      y: Math.max(0, Math.min(VIEWBOX_HEIGHT - constrainedHeight, newY)),
      width: constrainedWidth,
      height: constrainedHeight
    });
  };

  // Zoom control functions
  const zoomIn = () => {
    const centerX = viewBox.x + viewBox.width / 2;
    const centerY = viewBox.y + viewBox.height / 2;
    const zoomFactor = 0.8; // Zoom in by 20%
    const newWidth = viewBox.width * zoomFactor;
    const newHeight = viewBox.height * zoomFactor;

    setViewBox({
      x: Math.max(0, Math.min(VIEWBOX_WIDTH - newWidth, centerX - newWidth / 2)),
      y: Math.max(0, Math.min(VIEWBOX_HEIGHT - newHeight, centerY - newHeight / 2)),
      width: newWidth,
      height: newHeight
    });
  };

  const zoomOut = () => {
    const centerX = viewBox.x + viewBox.width / 2;
    const centerY = viewBox.y + viewBox.height / 2;
    const zoomFactor = 1.25; // Zoom out by 25%
    const newWidth = Math.min(VIEWBOX_WIDTH, viewBox.width * zoomFactor);
    const newHeight = Math.min(VIEWBOX_HEIGHT, viewBox.height * zoomFactor);

    setViewBox({
      x: Math.max(0, Math.min(VIEWBOX_WIDTH - newWidth, centerX - newWidth / 2)),
      y: Math.max(0, Math.min(VIEWBOX_HEIGHT - newHeight, centerY - newHeight / 2)),
      width: newWidth,
      height: newHeight
    });
  };

  const resetView = () => {
    setViewBox({ x: 0, y: 0, width: VIEWBOX_WIDTH, height: VIEWBOX_HEIGHT });
  };

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

    setViewBox({
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
      if (year >= TIME_START && year <= TIME_END) {
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
  const filteredStations = useMemo(() => {
    let filtered = stations;
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(s => 
        s.name.toLowerCase().includes(query) ||
        s.yearLabel.toLowerCase().includes(query) ||
        s.details.toLowerCase().includes(query)
      );
    }
    
    // Era filter
    if (focusedEra) {
      const [start, end] = focusedEra;
      filtered = filtered.filter(s => s.year >= start && s.year <= end);
    }
    
    return filtered;
  }, [stations, searchQuery, focusedEra]);

  // Journey stations - key milestones for guided tour
  const journeyStations = useMemo(() => [
    'neolithic', 'uruk', 'classical', 'columbian', 'industrial', 'crisis', 'singularity'
  ], []);

  const activeData = selectedStation || (hoveredStation ? stations.find(s => s.id === hoveredStation) : null);

  // Journey navigation
  const navigateJourney = (direction) => {
    if (direction === 'next') {
      const nextIndex = (journeyIndex + 1) % journeyStations.length;
      setJourneyIndex(nextIndex);
      const station = stations.find(s => s.id === journeyStations[nextIndex]);
      if (station) {
        setSelectedStation(station);
        // Center view on station
        const centerX = station.coords.x - viewBox.width / 2;
        const centerY = station.coords.y - viewBox.height / 2;
        setViewBox(prev => ({
          ...prev,
          x: Math.max(0, Math.min(VIEWBOX_WIDTH - prev.width, centerX)),
          y: Math.max(0, Math.min(VIEWBOX_HEIGHT - prev.height, centerY))
        }));
      }
    } else {
      const prevIndex = (journeyIndex - 1 + journeyStations.length) % journeyStations.length;
      setJourneyIndex(prevIndex);
      const station = stations.find(s => s.id === journeyStations[prevIndex]);
      if (station) {
        setSelectedStation(station);
        const centerX = station.coords.x - viewBox.width / 2;
        const centerY = station.coords.y - viewBox.height / 2;
        setViewBox(prev => ({
          ...prev,
          x: Math.max(0, Math.min(VIEWBOX_WIDTH - prev.width, centerX)),
          y: Math.max(0, Math.min(VIEWBOX_HEIGHT - prev.height, centerY))
        }));
      }
    }
  };

  // Keyboard Navigation - Commercial-Grade
  useKeyboardNavigation({
    onEscape: () => {
      if (showWelcome) {
        setShowWelcome(false);
        announce('Welcome overlay closed');
      } else if (selectedStation) {
        setSelectedStation(null);
        announce('Station details closed');
      } else if (showFilters) {
        setShowFilters(false);
        announce('Filters panel closed');
      }
    },
    onEnter: () => {
      if (showWelcome && !journeyMode) {
        setShowWelcome(false);
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
                    setShowWelcome(false);
                    setJourneyMode(true);
                    setJourneyIndex(0);
                    const firstStation = stations.find(s => s.id === journeyStations[0]);
                    if (firstStation) {
                      setSelectedStation(firstStation);
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
                  setShowWelcome(false);
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

      {/* --- Header --- */}
      <header className="absolute top-0 left-0 p-6 z-20 pointer-events-none">
        <h1 className="text-4xl font-black tracking-tighter uppercase text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]">
          Civilization Metro Map
        </h1>
        <div className="flex items-center gap-2 mt-2">
          <span className="animate-pulse w-2 h-2 rounded-full bg-green-500"></span>
          <p className="text-xs text-cyan-300/60 uppercase tracking-widest">Full Scale Visualization • 12,025 Years • Logarithmic Time Axis</p>
        </div>
      </header>

      {/* Human-Centric Control Panel */}
      <div className="absolute top-20 left-4 z-30 flex flex-col gap-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-cyan-400/60" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search stations..."
            className="pl-10 pr-4 py-2 bg-neutral-900/90 backdrop-blur-md border border-cyan-900/50 rounded-lg text-white text-sm placeholder-cyan-400/40 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 w-64"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-cyan-400/60 hover:text-white"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Filter Toggle */}
        <button
          onClick={() => setShowFilters(!showFilters)}
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
                    onChange={(e) => setVisibleLines(prev => ({ ...prev, [line.key]: e.target.checked }))}
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
                  onChange={(e) => setShowAllLabels(e.target.checked)}
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
                  onClick={() => setFocusedEra(null)}
                  className="w-full text-left px-2 py-1 text-xs text-neutral-400 hover:text-white hover:bg-neutral-800 rounded"
                >
                  All Time
                </button>
                <button
                  onClick={() => setFocusedEra([-10000, -1000])}
                  className="w-full text-left px-2 py-1 text-xs text-neutral-400 hover:text-white hover:bg-neutral-800 rounded"
                >
                  Ancient (10k BCE - 1k BCE)
                </button>
                <button
                  onClick={() => setFocusedEra([-1000, 500])}
                  className="w-full text-left px-2 py-1 text-xs text-neutral-400 hover:text-white hover:bg-neutral-800 rounded"
                >
                  Classical (1k BCE - 500 CE)
                </button>
                <button
                  onClick={() => setFocusedEra([500, 1500])}
                  className="w-full text-left px-2 py-1 text-xs text-neutral-400 hover:text-white hover:bg-neutral-800 rounded"
                >
                  Medieval (500 - 1500 CE)
                </button>
                <button
                  onClick={() => setFocusedEra([1500, 1900])}
                  className="w-full text-left px-2 py-1 text-xs text-neutral-400 hover:text-white hover:bg-neutral-800 rounded"
                >
                  Modern (1500 - 1900 CE)
                </button>
                <button
                  onClick={() => setFocusedEra([1900, 2025])}
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
                onClick={() => setJourneyMode(false)}
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
          onClick={() => setShowWelcome(true)}
          className="p-2 bg-neutral-900/90 backdrop-blur-md border border-cyan-900/50 rounded-lg text-cyan-400 hover:bg-neutral-800 transition-colors"
          title="Show Help"
        >
          <HelpCircle size={20} />
        </button>

        {/* Minimap Toggle */}
        <button
          onClick={() => setShowMinimap(!showMinimap)}
          className="p-2 bg-neutral-900/90 backdrop-blur-md border border-cyan-900/50 rounded-lg text-cyan-400 hover:bg-neutral-800 transition-colors"
          title={showMinimap ? "Hide Minimap" : "Show Minimap"}
        >
          <Map size={20} />
        </button>
      </div>

      {/* --- Main Viewport --- */}
      <div className="flex-1 relative flex">
        
        {/* SVG Canvas Container - Pan and Zoom enabled */}
        <div 
          ref={containerRef}
          className="flex-1 relative overflow-hidden bg-neutral-950"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
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
              
              {/* Animated gradient for Blue line */}
              <linearGradient id="blueGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#22d3ee" stopOpacity="1" />
                <animate attributeName="y2" values="0%;100%;0%" dur="3s" repeatCount="indefinite" />
              </linearGradient>
            </defs>

            {/* Time Axis */}
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
                Time (Logarithmic Scale) • 12,025 Years of Human Civilization
              </text>
            </g>

            {/* 1. Orange Philosophy Line - Clean metro style */}
            {visibleLines.philosophy && (
              <>
                {/* Background glow - subtle */}
                <path 
                  d={paths.orange} 
                  fill="none" 
                  stroke="#fbbf24" 
                  strokeWidth="35" 
                  strokeOpacity="0.25" 
                  strokeLinecap="round"
                  style={{
                    strokeDasharray: 10000,
                    strokeDashoffset: 10000 * (1 - animationProgress),
                    transition: 'stroke-dashoffset 0.1s linear',
                    opacity: visibleLines.philosophy ? 1 : 0.3
                  }}
                />
                {/* Main philosophy line */}
                <path 
                  d={paths.orange} 
                  fill="none" 
                  stroke="#f59e0b" 
                  strokeWidth="18" 
                  strokeOpacity="0.9" 
                  strokeLinecap="round"
                  style={{
                    strokeDasharray: 10000,
                    strokeDashoffset: 10000 * (1 - animationProgress),
                    transition: 'stroke-dashoffset 0.1s linear',
                    opacity: visibleLines.philosophy ? 1 : 0.3
                  }}
                />
                {/* Bright core */}
                <path 
                  d={paths.orange} 
                  fill="none" 
                  stroke="#fbbf24" 
                  strokeWidth="6" 
                  strokeOpacity="0.8" 
                  strokeLinecap="round"
                  style={{
                    strokeDasharray: 10000,
                    strokeDashoffset: 10000 * (1 - animationProgress),
                    transition: 'stroke-dashoffset 0.1s linear',
                    opacity: visibleLines.philosophy ? 1 : 0.3
                  }}
                />
              </>
            )}
            
            {/* 2. Purple Empire - Clean regal metro style */}
            {visibleLines.empire && (
              <>
                {/* Background shadow */}
                <path 
                  d={paths.purple} 
                  fill="none" 
                  stroke="#4c1d95" 
                  strokeWidth="30" 
                  strokeLinecap="round"
                  style={{
                    strokeDasharray: 10000,
                    strokeDashoffset: 10000 * (1 - animationProgress),
                    transition: 'stroke-dashoffset 0.1s linear',
                    opacity: visibleLines.empire ? 0.5 : 0.15
                  }}
                />
                {/* Main purple line */}
                <path 
                  d={paths.purple} 
                  fill="none" 
                  stroke="#7c3aed" 
                  strokeWidth="18" 
                  strokeLinecap="round"
                  style={{
                    strokeDasharray: 10000,
                    strokeDashoffset: 10000 * (1 - animationProgress),
                    transition: 'stroke-dashoffset 0.1s linear',
                    opacity: visibleLines.empire ? 1 : 0.3
                  }}
                />
                {/* Bright core */}
                <path 
                  d={paths.purple} 
                  fill="none" 
                  stroke="#a855f7" 
                  strokeWidth="8" 
                  strokeLinecap="round"
                  style={{
                    strokeDasharray: 10000,
                    strokeDashoffset: 10000 * (1 - animationProgress),
                    transition: 'stroke-dashoffset 0.1s linear',
                    opacity: visibleLines.empire ? 0.9 : 0.25
                  }}
                />
              </>
            )}

            {/* 3. Green Population - Clean metro style with subtle depth */}
            {visibleLines.population && (
              <>
                {/* Background shadow for depth */}
                <path 
                  d={paths.green.main} 
                  fill="none" 
                  stroke="#14532d" 
                  strokeWidth="32" 
                  strokeLinecap="round" 
                  opacity="0.5"
                  style={{
                    strokeDasharray: 10000,
                    strokeDashoffset: 10000 * (1 - animationProgress),
                    transition: 'stroke-dashoffset 0.1s linear'
                  }}
                />
                {/* Main path */}
                <path 
                  d={paths.green.main} 
                  fill="none" 
                  stroke="#16a34a" 
                  strokeWidth="22" 
                  strokeLinecap="round" 
                  opacity="1"
                  style={{
                    strokeDasharray: 10000,
                    strokeDashoffset: 10000 * (1 - animationProgress),
                    transition: 'stroke-dashoffset 0.1s linear'
                  }}
                />
                {/* Bright core highlight */}
                <path 
                  d={paths.green.main} 
                  fill="none" 
                  stroke="#22c55e" 
                  strokeWidth="8" 
                  strokeLinecap="round"
                  filter="url(#glow-green)"
                  style={{
                    strokeDasharray: 10000,
                    strokeDashoffset: 10000 * (1 - animationProgress),
                    transition: 'stroke-dashoffset 0.1s linear'
                  }}
                />
              </>
            )}

            {/* 4. Red War - Clean angular metro style */}
            {visibleLines.war && (
              <>
                {/* Background shadow */}
                <path 
                  d={paths.red} 
                  fill="none" 
                  stroke="#7f1d1d" 
                  strokeWidth="24" 
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{
                    strokeDasharray: 10000,
                    strokeDashoffset: 10000 * (1 - animationProgress),
                    transition: 'stroke-dashoffset 0.1s linear',
                    opacity: visibleLines.war ? 0.6 : 0.2
                  }}
                />
                {/* Main red line */}
                <path 
                  d={paths.red} 
                  fill="none" 
                  stroke="#dc2626" 
                  strokeWidth="14" 
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{
                    strokeDasharray: 10000,
                    strokeDashoffset: 10000 * (1 - animationProgress),
                    transition: 'stroke-dashoffset 0.1s linear',
                    opacity: visibleLines.war ? 1 : 0.3
                  }}
                />
                {/* Bright core */}
                <path 
                  d={paths.red} 
                  fill="none" 
                  stroke="#ef4444" 
                  strokeWidth="6" 
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  filter="url(#glow-red)"
                  style={{
                    strokeDasharray: 10000,
                    strokeDashoffset: 10000 * (1 - animationProgress),
                    transition: 'stroke-dashoffset 0.1s linear',
                    opacity: visibleLines.war ? 0.9 : 0.2
                  }}
                />
              </>
            )}

            {/* 5. Blue Tech - Clean futuristic metro style */}
            {visibleLines.tech && (
              <>
                {/* Background shadow */}
                <path 
                  d={paths.blue} 
                  fill="none" 
                  stroke="#0e7490" 
                  strokeWidth="28" 
                  strokeLinecap="round"
                  style={{
                    strokeDasharray: 10000,
                    strokeDashoffset: 10000 * (1 - animationProgress),
                    transition: 'stroke-dashoffset 0.1s linear',
                    opacity: visibleLines.tech ? 0.5 : 0.15
                  }}
                />
                {/* Main cyan line */}
                <path 
                  d={paths.blue} 
                  fill="none" 
                  stroke="#0891b2" 
                  strokeWidth="18" 
                  strokeLinecap="round"
                  style={{
                    strokeDasharray: 10000,
                    strokeDashoffset: 10000 * (1 - animationProgress),
                    transition: 'stroke-dashoffset 0.1s linear',
                    opacity: visibleLines.tech ? 1 : 0.3
                  }}
                />
                {/* Bright core with glow */}
                <path 
                  d={paths.blue} 
                  fill="none" 
                  stroke="#22d3ee" 
                  strokeWidth="8" 
                  strokeLinecap="round"
                  filter="url(#glow-blue)"
                  style={{
                    strokeDasharray: 10000,
                    strokeDashoffset: 10000 * (1 - animationProgress),
                    transition: 'stroke-dashoffset 0.1s linear',
                    opacity: visibleLines.tech ? 1 : 0.3
                  }}
                />
              </>
            )}

            {/* Explicit Path-to-Station Connections - Visual Cohesion */}
            {/* These ensure stations visually connect to their paths */}
            {filteredStations.map((s) => {
              const isVisible = s.lines.some(line => {
                const lineMap = {
                  'Tech': 'tech',
                  'Population': 'population',
                  'War': 'war',
                  'Empire': 'empire',
                  'Philosophy': 'philosophy'
                };
                return visibleLines[lineMap[line]] !== false;
              });
              
              if (!isVisible) return null;
              
              // For each line this station is on, draw a subtle connection
              return s.lines.map((line) => {
                const lineMap = {
                  'Tech': 'tech',
                  'Population': 'population',
                  'War': 'war',
                  'Empire': 'empire',
                  'Philosophy': 'philosophy'
                };
                const lineKey = lineMap[line];
                if (!visibleLines[lineKey]) return null;
                
                const lineColors = {
                  'Tech': '#22d3ee',
                  'Population': '#22c55e',
                  'War': '#ef4444',
                  'Empire': '#9333ea',
                  'Philosophy': '#fbbf24'
                };
                const lineColor = lineColors[line] || s.color;
                
                // Subtle connection glow at path-station intersection
                // This creates visual cohesion showing the station is ON the path
                return (
                  <circle
                    key={`${s.id}-${line}-path-connection`}
                    cx={s.coords.x}
                    cy={s.coords.y}
                    r="50"
                    fill="none"
                    stroke={lineColor}
                    strokeWidth="10"
                    strokeOpacity="0.15"
                    className="pointer-events-none"
                  />
                );
              });
            })}

            {/* Stations - Human-Centric: Progressive Disclosure, Connected to Paths */}
            {filteredStations.map((s) => {
              const isHovered = hoveredStation === s.id;
              const isSelected = selectedStation?.id === s.id;
              const isInJourney = journeyMode && journeyStations[journeyIndex] === s.id;
              const isSearchMatch = searchQuery && (s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.yearLabel.toLowerCase().includes(searchQuery.toLowerCase()));
              const shouldShowLabel = showAllLabels || isHovered || isSelected || isInJourney || isSearchMatch;
              const scale = isHovered || isSelected || isInJourney ? 1.4 : isSearchMatch ? 1.2 : 1;
              
              // Determine visibility based on line filters
              const isVisible = s.lines.some(line => {
                const lineMap = {
                  'Tech': 'tech',
                  'Population': 'population',
                  'War': 'war',
                  'Empire': 'empire',
                  'Philosophy': 'philosophy'
                };
                return visibleLines[lineMap[line]] !== false;
              });
              
              if (!isVisible && !isSearchMatch) return null;
              
              return (
                <g 
                  key={s.id}
                  onMouseEnter={() => setHoveredStation(s.id)}
                  onMouseLeave={() => setHoveredStation(null)}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedStation(s);
                    if (journeyMode) {
                      const idx = journeyStations.indexOf(s.id);
                      if (idx !== -1) setJourneyIndex(idx);
                    }
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  className="cursor-pointer transition-all duration-300"
                  style={{ 
                    transformOrigin: `${s.coords.x}px ${s.coords.y}px`,
                    transform: `scale(${scale})`,
                    opacity: isVisible ? 1 : 0.4
                  }}
                >
                  {/* Path Connection Indicator - Subtle glow showing connection to paths */}
                  {(isHovered || isSelected) && s.lines.map((line, idx) => {
                    const lineColors = {
                      'Tech': '#22d3ee',
                      'Population': '#22c55e',
                      'War': '#ef4444',
                      'Empire': '#9333ea',
                      'Philosophy': '#fbbf24'
                    };
                    const lineColor = lineColors[line] || s.color;
                    const angle = (idx * 360) / s.lines.length;
                    const radius = 50;
                    const x2 = s.coords.x + Math.cos(angle * Math.PI / 180) * radius;
                    const y2 = s.coords.y + Math.sin(angle * Math.PI / 180) * radius;
                    
                    return (
                      <line
                        key={`connection-${line}`}
                        x1={s.coords.x}
                        y1={s.coords.y}
                        x2={x2}
                        y2={y2}
                        stroke={lineColor}
                        strokeWidth="4"
                        strokeOpacity="0.4"
                        strokeLinecap="round"
                        className="animate-pulse"
                      />
                    );
                  })}

                  {/* Journey Mode Highlight */}
                  {isInJourney && (
                    <circle 
                      cx={s.coords.x} 
                      cy={s.coords.y} 
                      r="120" 
                      fill="none" 
                      stroke="#22d3ee" 
                      strokeWidth="8"
                      strokeDasharray="20,10"
                      opacity="0.6"
                      className="animate-pulse"
                    />
                  )}
                  
                  {/* Search Match Highlight */}
                  {isSearchMatch && !isSelected && (
                    <circle 
                      cx={s.coords.x} 
                      cy={s.coords.y} 
                      r="100" 
                      fill="none" 
                      stroke="#fbbf24" 
                      strokeWidth="6"
                      opacity="0.5"
                    />
                  )}

                  {/* Visual Track Platform - Human-Centric: Station sits ON the track */}
                  {/* This creates the visual impression that the station is integrated into the path */}
                  {s.lines.map((line) => {
                    const lineColors = {
                      'Tech': '#22d3ee',
                      'Population': '#22c55e',
                      'War': '#ef4444',
                      'Empire': '#9333ea',
                      'Philosophy': '#fbbf24'
                    };
                    const lineColor = lineColors[line] || s.color;
                    
                    // Create track platform ellipse - shows station is ON the track
                    return (
                      <ellipse
                        key={`track-platform-${line}`}
                        cx={s.coords.x}
                        cy={s.coords.y}
                        rx="50"
                        ry="30"
                        fill="none"
                        stroke={lineColor}
                        strokeWidth="8"
                        strokeOpacity="0.25"
                        transform={`rotate(${s.lines.indexOf(line) * 45} ${s.coords.x} ${s.coords.y})`}
                        className="pointer-events-none"
                      />
                    );
                  })}
                  
                  {/* Station Base Glow - Connected to paths visually */}
                  <circle 
                    cx={s.coords.x} 
                    cy={s.coords.y} 
                    r={isHovered || isSelected || isInJourney ? 90 : 0} 
                    fill={s.color} 
                    fillOpacity="0.15"
                    className="transition-all duration-300"
                    filter="url(#glow-blue)"
                  />
                  
                  {/* Outer Ring - Station marker, clearly ON the track */}
                  <circle 
                    cx={s.coords.x} 
                    cy={s.coords.y} 
                    r={isSelected || isInJourney ? "35" : "30"} 
                    fill="#000" 
                    stroke={s.color} 
                    strokeWidth={isSelected || isInJourney ? "12" : "10"}
                    opacity="0.95"
                  />
                  
                  {/* Path Connection Indicators - Show which lines pass through this station */}
                  {s.lines.map((line, idx) => {
                    const lineColors = {
                      'Tech': '#22d3ee',
                      'Population': '#22c55e',
                      'War': '#ef4444',
                      'Empire': '#9333ea',
                      'Philosophy': '#fbbf24'
                    };
                    const lineColor = lineColors[line] || s.color;
                    const angle = (idx * 360) / s.lines.length;
                    const radius = isSelected || isInJourney ? 42 : 37;
                    const x = s.coords.x + Math.cos(angle * Math.PI / 180) * radius;
                    const y = s.coords.y + Math.sin(angle * Math.PI / 180) * radius;
                    
                    return (
                      <g key={`line-indicator-${line}`}>
                        {/* Connection dot - Shows this line passes through */}
                        <circle
                          cx={x}
                          cy={y}
                          r="8"
                          fill={lineColor}
                          opacity="0.9"
                          filter="url(#glow-blue)"
                        />
                        {/* Connection line - Visual link to path */}
                        <line
                          x1={s.coords.x}
                          y1={s.coords.y}
                          x2={x}
                          y2={y}
                          stroke={lineColor}
                          strokeWidth="3"
                          strokeOpacity="0.5"
                          strokeLinecap="round"
                        />
                      </g>
                    );
                  })}
                  
                  {/* Middle Ring - Station structure */}
                  <circle 
                    cx={s.coords.x} 
                    cy={s.coords.y} 
                    r="20" 
                    fill="none" 
                    stroke={s.color} 
                    strokeWidth="5"
                    opacity="0.7"
                  />
                  
                  {/* Inner Core - Station center, clearly ON the track */}
                  <circle 
                    cx={s.coords.x} 
                    cy={s.coords.y} 
                    r={isSelected || isInJourney ? "14" : "12"} 
                    fill={s.color}
                    filter="url(#glow-blue)"
                  />
                  
                  {/* Track Integration Glow - Shows station is integrated into path */}
                  {(isHovered || isSelected) && (
                    <circle
                      cx={s.coords.x}
                      cy={s.coords.y}
                      r="60"
                      fill="none"
                      stroke={s.color}
                      strokeWidth="8"
                      strokeOpacity="0.2"
                      className="animate-pulse"
                    />
                  )}

                  {/* Station Name Label - Progressive Disclosure */}
                  {shouldShowLabel && (
                    <text 
                      x={s.coords.x} 
                      y={s.coords.y - 50} 
                      textAnchor="middle" 
                      fill="white" 
                      fillOpacity={isHovered || isSelected || isInJourney ? 1 : 0.8}
                      fontSize={isSelected || isInJourney ? "32" : "28"}
                      fontFamily="monospace"
                      fontWeight="bold"
                      className="pointer-events-none select-none drop-shadow-lg"
                    >
                      {s.name.length > 30 ? s.name.substring(0, 30) + '...' : s.name}
                    </text>
                  )}

                  {/* Year Label - Progressive Disclosure */}
                  {shouldShowLabel && (
                    <text 
                      x={s.coords.x} 
                      y={s.coords.y + 90} 
                      textAnchor="middle" 
                      fill={s.color} 
                      fillOpacity={isHovered || isSelected || isInJourney ? 1 : 0.8}
                      fontSize={isSelected || isInJourney ? "26" : "24"}
                      fontFamily="monospace"
                      fontWeight="bold"
                      className="pointer-events-none select-none drop-shadow-md"
                    >
                      {s.yearLabel}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>

          {/* Minimap - Human-Centric Spatial Orientation */}
          {showMinimap && (
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
                {visibleLines.blue && (
                  <path d={paths.blue} fill="none" stroke="#22d3ee" strokeWidth="4" opacity="0.7" />
                )}
                {visibleLines.population && (
                  <path d={paths.green.main} fill="none" stroke="#22c55e" strokeWidth="4" opacity="0.7" />
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
                      setSelectedStation(s);
                      const centerX = s.coords.x - viewBox.width / 2;
                      const centerY = s.coords.y - viewBox.height / 2;
                      setViewBox(prev => ({
                        ...prev,
                        x: Math.max(0, Math.min(VIEWBOX_WIDTH - prev.width, centerX)),
                        y: Math.max(0, Math.min(VIEWBOX_HEIGHT - prev.height, centerY))
                      }));
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
                      setSelectedStation(s);
                      const centerX = s.coords.x - viewBox.width / 2;
                      const centerY = s.coords.y - viewBox.height / 2;
                      setViewBox(prev => ({
                        ...prev,
                        x: Math.max(0, Math.min(VIEWBOX_WIDTH - prev.width, centerX)),
                        y: Math.max(0, Math.min(VIEWBOX_HEIGHT - prev.height, centerY))
                      }));
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

          {/* Prompt when idle - Human-Centric Guidance */}
          {!activeData && !searchQuery && (
            <div className="absolute bottom-8 left-8 p-6 bg-gradient-to-br from-neutral-900/95 to-neutral-950/95 backdrop-blur-xl border border-cyan-900/50 rounded-xl text-cyan-400/90 font-mono text-sm max-w-md shadow-2xl z-20">
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
                onClick={() => setSelectedStation(null)}
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
      <footer className="h-20 bg-neutral-950 border-t border-neutral-800 flex items-center justify-center gap-8 px-4 z-20 shrink-0 overflow-x-auto">
        <LegendItem color="bg-cyan-400" label="Tech" glow="shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
        <LegendItem color="bg-green-600" label="Population" glow="shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
        <LegendItem color="bg-red-500 animate-pulse" label="War" glow="shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
        <LegendItem color="bg-purple-600" label="Empire" glow="shadow-[0_0_8px_rgba(147,51,234,0.6)]" />
        <LegendItem color="bg-amber-500 blur-[1px]" label="Philosophy" glow="shadow-[0_0_8px_rgba(251,191,36,0.4)]" />
      </footer>

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