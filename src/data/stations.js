/**
 * Station Data
 * Single source of truth for all historical station data
 * Separated from component for maintainability and potential future API integration
 */

import { LINE_Y_POSITIONS, VIEWBOX } from '../constants/metroConfig';
import { yearToX } from '../utils/coordinates';

/**
 * Icon type identifiers mapped to station characteristics
 * These are resolved to actual JSX icons in the component layer
 */
const ICON_TYPES = {
  USERS: 'users',
  SETTINGS: 'settings',
  CASTLE: 'castle',
  BOOK: 'bookOpen',
  SKULL: 'skull',
  ZAP: 'zap',
  GLOBE: 'globe',
  CPU: 'cpu',
  SMARTPHONE: 'smartphone',
  ATOM: 'atom',
  GAUGE: 'gauge',
  PRINTER: 'printer',
  ALERT: 'alertTriangle'
};

// Raw station definitions - the historical data
const STATION_DATA = [
  {
    id: 'neolithic',
    name: 'The Neolithic Junction',
    year: -10000,
    yearLabel: '10,000 BCE',
    lines: ['Tech', 'Population'],
    significance: 'major',
    iconType: ICON_TYPES.USERS,
    iconSize: 'large',
    narrative: {
      visual: "The thin Cyan line (Tech) and the thin Vine (Green) collide and fuse.",
      atmosphere: "The smell of wet earth and grain. A quiet, spacious beginning.",
      insight: "The first permanent structure. 4 Million people. The wanderers settle."
    },
    details: "Passengers arrive from the Hunter-Gatherer Express. Everyone switches to the Sedentary Line. This is the first permanent structure on the map. Before this, the lines were wandering paths. Now, the Green line begins its upward curve.",
    population: "4 Million"
  },
  {
    id: 'pottery',
    name: 'Pottery & Ceramics',
    year: -8000,
    yearLabel: '8,000 BCE',
    lines: ['Tech'],
    significance: 'minor',
    iconType: ICON_TYPES.SETTINGS,
    narrative: {
      visual: "The Blue Line develops new textures. Containers emerge.",
      atmosphere: "The heat of kilns. The transformation of clay.",
      insight: "Storage and preservation. The first manufactured containers."
    },
    details: "Early pottery enables food storage and cooking. Technology enables new ways of living.",
    population: "~5 Million"
  },
  {
    id: 'copper',
    name: 'Copper Age',
    year: -6000,
    yearLabel: '6,000 BCE',
    lines: ['Tech'],
    significance: 'minor',
    iconType: ICON_TYPES.SETTINGS,
    narrative: {
      visual: "The Blue Line gains a metallic sheen. First metalworking.",
      atmosphere: "The glow of molten copper. The first forges.",
      insight: "Metals enter the timeline. Tools become more durable."
    },
    details: "Copper smelting begins. The first metal tools and ornaments.",
    population: "~7 Million"
  },
  {
    id: 'mesopotamia',
    name: 'Mesopotamian Cities',
    year: -4000,
    yearLabel: '4,000 BCE',
    lines: ['Empire', 'Population'],
    significance: 'major',
    iconType: ICON_TYPES.CASTLE,
    narrative: {
      visual: "The Purple Line begins to form. First cities emerge.",
      atmosphere: "The bustle of urban life. The first markets.",
      insight: "Urbanization begins. The map shows concentrated nodes."
    },
    details: "First true cities in Mesopotamia. Urban civilization takes root.",
    population: "~7 Million"
  },
  {
    id: 'egypt',
    name: 'Ancient Egypt',
    year: -3100,
    yearLabel: '3,100 BCE',
    lines: ['Empire', 'Tech'],
    significance: 'major',
    iconType: ICON_TYPES.CASTLE,
    narrative: {
      visual: "The Purple Line solidifies. Pyramids rise along the tracks.",
      atmosphere: "The weight of stone. The flow of the Nile.",
      insight: "First great empire. Monumental architecture defines the landscape."
    },
    details: "Unification of Upper and Lower Egypt. The first pharaonic dynasty.",
    population: "~1 Million"
  },
  {
    id: 'uruk',
    name: 'Uruk Central',
    year: -3500,
    yearLabel: '3,500 BCE',
    lines: ['Tech', 'Empire', 'Population'],
    significance: 'hub',
    iconType: ICON_TYPES.CASTLE,
    iconSize: 'large',
    narrative: {
      visual: "The Purple Line (Empire) emerges from the ground here. The Blue Line flashes brightly with the invention of Writing.",
      atmosphere: "Dust, clay tablets, and the sound of bureaucrats tallying grain.",
      insight: "Civilization 'locks in.' The lines become rigid. We see the first 'System Map' being drawn by scribes."
    },
    details: "The Wheel (3200 BCE) station is just one stop away—the pace of the train accelerates noticeably after this station.",
    population: "~1 Million"
  },
  {
    id: 'indus',
    name: 'Indus Valley',
    year: -3300,
    yearLabel: '3,300 BCE',
    lines: ['Empire', 'Tech'],
    significance: 'major',
    iconType: ICON_TYPES.CASTLE,
    narrative: {
      visual: "The Purple Line branches. Planned cities emerge.",
      atmosphere: "The order of grid streets. The flow of water systems.",
      insight: "Urban planning reaches new heights. The map shows intentional design."
    },
    details: "Harappa and Mohenjo-Daro. Advanced city planning and drainage.",
    population: "~1 Million"
  },
  {
    id: 'wheel',
    name: 'The Wheel',
    year: -3200,
    yearLabel: '3,200 BCE',
    lines: ['Tech'],
    significance: 'major',
    iconType: ICON_TYPES.SETTINGS,
    narrative: {
      visual: "The Blue Line accelerates. First mechanical advantage.",
      atmosphere: "The creak of wooden wheels on stone roads.",
      insight: "Mobility transforms civilization. The train picks up speed."
    },
    details: "One stop from Uruk Central. The acceleration begins.",
    population: "~1.5 Million"
  },
  {
    id: 'bronze',
    name: 'Bronze Age',
    year: -3000,
    yearLabel: '3,000 BCE',
    lines: ['Tech', 'War'],
    significance: 'major',
    iconType: ICON_TYPES.SETTINGS,
    narrative: {
      visual: "The Blue Line strengthens. Alloy technology emerges.",
      atmosphere: "The glow of bronze. The clang of stronger weapons.",
      insight: "Alloys create superior materials. Technology compounds."
    },
    details: "Bronze smelting spreads. Stronger tools and weapons transform warfare.",
    population: "~14 Million"
  },
  {
    id: 'pyramids',
    name: 'Great Pyramids',
    year: -2600,
    yearLabel: '2,600 BCE',
    lines: ['Empire', 'Tech'],
    significance: 'major',
    iconType: ICON_TYPES.CASTLE,
    narrative: {
      visual: "The Purple Line reaches skyward. Monumental architecture.",
      atmosphere: "The weight of eternity. Stone against sky.",
      insight: "Human ambition made permanent. The map shows what we can build."
    },
    details: "Pyramids of Giza. Engineering marvels that define an era.",
    population: "~27 Million"
  },
  {
    id: 'code-hammurabi',
    name: "Hammurabi's Code",
    year: -1750,
    yearLabel: '1,750 BCE',
    lines: ['Philosophy', 'Empire'],
    significance: 'major',
    iconType: ICON_TYPES.BOOK,
    narrative: {
      visual: "The Orange Line solidifies. Written law emerges.",
      atmosphere: "The weight of justice. The permanence of rules.",
      insight: "Law becomes codified. The map shows the structure of order."
    },
    details: "First comprehensive legal code. Written laws govern society.",
    population: "~50 Million"
  },
  {
    id: 'iron',
    name: 'Iron Age',
    year: -1200,
    yearLabel: '1,200 BCE',
    lines: ['Tech', 'War'],
    significance: 'major',
    iconType: ICON_TYPES.SETTINGS,
    narrative: {
      visual: "The Blue Line strengthens. Metalworking transforms tools and weapons.",
      atmosphere: "The ring of hammer on anvil. The glow of forges.",
      insight: "Harder materials enable new possibilities. The tracks become more durable."
    },
    details: "A major technological leap. Tools and weapons become more effective.",
    population: "~50 Million"
  },
  {
    id: 'olympics',
    name: 'First Olympics',
    year: -776,
    yearLabel: '776 BCE',
    lines: ['Philosophy', 'Population'],
    significance: 'minor',
    iconType: ICON_TYPES.USERS,
    narrative: {
      visual: "The Orange Line celebrates. Human achievement becomes spectacle.",
      atmosphere: "The roar of crowds. The pursuit of excellence.",
      insight: "Competition and culture unite. The map shows shared human values."
    },
    details: "First recorded Olympic Games. Cultural exchange through competition.",
    population: "~100 Million"
  },
  {
    id: 'buddha',
    name: 'Buddha & Philosophy',
    year: -563,
    yearLabel: '563 BCE',
    lines: ['Philosophy'],
    significance: 'major',
    iconType: ICON_TYPES.BOOK,
    narrative: {
      visual: "The Orange Line deepens. Eastern philosophy emerges.",
      atmosphere: "The silence of meditation. The search for truth.",
      insight: "Philosophy offers new paths. The map shows alternative routes."
    },
    details: "Birth of Siddhartha Gautama. Buddhism and new philosophical traditions.",
    population: "~100 Million"
  },
  {
    id: 'confucius',
    name: 'Confucius',
    year: -551,
    yearLabel: '551 BCE',
    lines: ['Philosophy', 'Empire'],
    significance: 'major',
    iconType: ICON_TYPES.BOOK,
    narrative: {
      visual: "The Orange Line branches eastward. Ethical systems form.",
      atmosphere: "The wisdom of ages. The structure of society.",
      insight: "Moral philosophy shapes civilization. The map shows cultural foundations."
    },
    details: "Birth of Confucius. Confucianism shapes Chinese civilization.",
    population: "~100 Million"
  },
  {
    id: 'persian',
    name: 'Persian Empire',
    year: -550,
    yearLabel: '550 BCE',
    lines: ['Empire'],
    significance: 'major',
    iconType: ICON_TYPES.CASTLE,
    narrative: {
      visual: "The Purple Line expands dramatically. First super-empire.",
      atmosphere: "The scale of conquest. The unity of diverse peoples.",
      insight: "Empire reaches new scale. The map shows unprecedented territory."
    },
    details: "Achaemenid Empire under Cyrus the Great. First truly global empire.",
    population: "~100 Million"
  },
  {
    id: 'classical',
    name: 'Classical Era',
    year: -500,
    yearLabel: '500 BCE',
    lines: ['Empire', 'Philosophy'],
    significance: 'hub',
    iconType: ICON_TYPES.CASTLE,
    narrative: {
      visual: "The Purple Line expands. Great empires rise (Rome, Persia, China).",
      atmosphere: "The sound of marching legions. The grandeur of marble cities.",
      insight: "Empires become the dominant structure. The map shows vast territories."
    },
    details: "Rome, Persia, and China create the first truly global empires.",
    population: "~100 Million"
  },
  {
    id: 'alexander',
    name: 'Alexander the Great',
    year: -336,
    yearLabel: '336 BCE',
    lines: ['Empire', 'Philosophy'],
    significance: 'major',
    iconType: ICON_TYPES.CASTLE,
    narrative: {
      visual: "The Purple Line stretches to breaking. Empire at its limit.",
      atmosphere: "The speed of conquest. The fusion of cultures.",
      insight: "Empire reaches its geographic limits. The map shows the edge of possibility."
    },
    details: "Alexander's conquests. Hellenistic culture spreads across continents.",
    population: "~150 Million"
  },
  {
    id: 'qin',
    name: 'Qin Dynasty',
    year: -221,
    yearLabel: '221 BCE',
    lines: ['Empire', 'Tech'],
    significance: 'major',
    iconType: ICON_TYPES.CASTLE,
    narrative: {
      visual: "The Purple Line consolidates in the East. Unified China.",
      atmosphere: "The weight of unity. The Great Wall begins.",
      insight: "China unifies. The map shows a new power center."
    },
    details: "Qin Shi Huang unifies China. Standardization and centralization.",
    population: "~200 Million"
  },
  {
    id: 'rome',
    name: 'Roman Republic',
    year: -509,
    yearLabel: '509 BCE',
    lines: ['Empire', 'Philosophy'],
    significance: 'major',
    iconType: ICON_TYPES.CASTLE,
    narrative: {
      visual: "The Purple Line gains structure. Republic emerges.",
      atmosphere: "The balance of power. The rule of law.",
      insight: "New form of governance. The map shows political innovation."
    },
    details: "Roman Republic established. New model of government.",
    population: "~100 Million"
  },
  {
    id: 'jesus',
    name: 'Jesus & Christianity',
    year: 0,
    yearLabel: '1 CE',
    lines: ['Philosophy'],
    significance: 'major',
    iconType: ICON_TYPES.BOOK,
    narrative: {
      visual: "The Orange Line transforms. New spiritual path emerges.",
      atmosphere: "The birth of hope. The spread of faith.",
      insight: "Religious revolution. The map shows a new philosophical direction."
    },
    details: "Birth of Jesus. Christianity begins to spread.",
    population: "~200 Million"
  },
  {
    id: 'han',
    name: 'Han Dynasty Peak',
    year: 100,
    yearLabel: '100 CE',
    lines: ['Empire', 'Tech'],
    significance: 'major',
    iconType: ICON_TYPES.CASTLE,
    narrative: {
      visual: "The Purple Line reaches new heights in the East.",
      atmosphere: "The Silk Road. The exchange of goods and ideas.",
      insight: "China at its peak. Trade routes connect civilizations."
    },
    details: "Han Dynasty golden age. Silk Road trade flourishes.",
    population: "~250 Million"
  },
  {
    id: 'fall-rome',
    name: 'Fall of Rome',
    year: 476,
    yearLabel: '476 CE',
    lines: ['War', 'Empire'],
    significance: 'major',
    iconType: ICON_TYPES.SKULL,
    narrative: {
      visual: "The Purple Line fractures. The Red Line surges. The map reorganizes.",
      atmosphere: "The collapse of order. The migration of peoples.",
      insight: "Empires fall, but the tracks remain. New stations emerge from the ruins."
    },
    details: "The Western Roman Empire falls. The map of Europe redraws itself.",
    population: "~200 Million"
  },
  {
    id: 'justinian',
    name: 'Justinian Code',
    year: 529,
    yearLabel: '529 CE',
    lines: ['Philosophy', 'Empire'],
    significance: 'minor',
    iconType: ICON_TYPES.BOOK,
    narrative: {
      visual: "The Orange Line codifies. Law becomes systematic.",
      atmosphere: "The weight of legal tradition. The structure of justice.",
      insight: "Legal systems formalize. The map shows the framework of order."
    },
    details: "Justinian's Code. Roman law preserved and systematized.",
    population: "~200 Million"
  },
  {
    id: 'tang',
    name: 'Tang Dynasty',
    year: 618,
    yearLabel: '618 CE',
    lines: ['Empire', 'Philosophy'],
    significance: 'major',
    iconType: ICON_TYPES.CASTLE,
    narrative: {
      visual: "The Purple Line flourishes in the East. Golden age.",
      atmosphere: "The prosperity of peace. The flow of poetry.",
      insight: "China's cultural peak. The map shows artistic achievement."
    },
    details: "Tang Dynasty begins. Golden age of Chinese civilization.",
    population: "~250 Million"
  },
  {
    id: 'islamic-golden',
    name: 'Islamic Golden Age',
    year: 800,
    yearLabel: '800 CE',
    lines: ['Tech', 'Philosophy'],
    significance: 'major',
    iconType: ICON_TYPES.BOOK,
    narrative: {
      visual: "The Blue Line brightens in the East. Knowledge flows along new routes.",
      atmosphere: "The scent of libraries. The exchange of ideas across continents.",
      insight: "Science and mathematics advance. The map shows new intellectual centers."
    },
    details: "Baghdad becomes a hub of learning. Knowledge spreads along trade routes.",
    population: "~250 Million"
  },
  {
    id: 'gunpowder',
    name: 'Gunpowder',
    year: 850,
    yearLabel: '850 CE',
    lines: ['Tech', 'War'],
    significance: 'major',
    iconType: ICON_TYPES.SETTINGS,
    narrative: {
      visual: "The Blue Line gains explosive power. New force enters the map.",
      atmosphere: "The smell of sulfur. The flash of fire.",
      insight: "Chemical power harnessed. Warfare transforms forever."
    },
    details: "Gunpowder invented in China. Will transform warfare and technology.",
    population: "~250 Million"
  },
  {
    id: 'vikings',
    name: 'Viking Age',
    year: 793,
    yearLabel: '793 CE',
    lines: ['War', 'Tech'],
    significance: 'major',
    iconType: ICON_TYPES.SKULL,
    narrative: {
      visual: "The Red Line surges northward. Raiders reshape the map.",
      atmosphere: "The sound of oars. The fear of the unknown.",
      insight: "Exploration through conquest. The map expands northward."
    },
    details: "Viking raids begin. Exploration and trade across the North Atlantic.",
    population: "~250 Million"
  },
  {
    id: 'magna-carta',
    name: 'Magna Carta',
    year: 1215,
    yearLabel: '1215 CE',
    lines: ['Philosophy', 'Empire'],
    significance: 'major',
    iconType: ICON_TYPES.BOOK,
    narrative: {
      visual: "The Orange Line constrains power. Rights emerge.",
      atmosphere: "The weight of parchment. The limit of kings.",
      insight: "Power becomes limited. The map shows new political structures."
    },
    details: "Magna Carta signed. Foundation of constitutional law.",
    population: "~400 Million"
  },
  {
    id: 'mongol',
    name: 'Mongol Empire',
    year: 1206,
    yearLabel: '1206 CE',
    lines: ['Empire', 'War'],
    significance: 'major',
    iconType: ICON_TYPES.CASTLE,
    narrative: {
      visual: "The Purple Line explodes. Largest land empire.",
      atmosphere: "The thunder of hooves. The unity of the steppe.",
      insight: "Empire reaches unprecedented scale. The map shows continental unity."
    },
    details: "Genghis Khan unites Mongols. Largest contiguous empire in history.",
    population: "~400 Million"
  },
  {
    id: 'black-death',
    name: 'Black Death',
    year: 1347,
    yearLabel: '1347 CE',
    lines: ['Population', 'War'],
    significance: 'crisis',
    iconType: ICON_TYPES.SKULL,
    narrative: {
      visual: "The Green Line plummets. The Red Line of disease spreads.",
      atmosphere: "The silence of empty streets. The weight of loss.",
      insight: "Population crashes. The map shows the fragility of civilization."
    },
    details: "Black Death arrives in Europe. 30-50% of population dies.",
    population: "~350 Million (then ~250 Million)"
  },
  {
    id: 'renaissance',
    name: 'Renaissance',
    year: 1400,
    yearLabel: '1400 CE',
    lines: ['Philosophy', 'Tech'],
    significance: 'major',
    iconType: ICON_TYPES.BOOK,
    narrative: {
      visual: "The Orange Line shifts. Humanism emerges. The map rediscovers itself.",
      atmosphere: "The smell of paint and marble. The sound of new ideas.",
      insight: "The past illuminates the future. The map becomes a work of art."
    },
    details: "Europe rediscovers classical knowledge. The Orange Line shifts toward humanism.",
    population: "~350 Million"
  },
  {
    id: 'gutenberg',
    name: 'Gutenberg Bible',
    year: 1455,
    yearLabel: '1455 CE',
    lines: ['Tech', 'Philosophy'],
    significance: 'major',
    iconType: ICON_TYPES.PRINTER,
    narrative: {
      visual: "The Blue Line multiplies. Knowledge becomes mass-produced.",
      atmosphere: "The smell of ink. The weight of books.",
      insight: "Information revolution begins. The map becomes reproducible."
    },
    details: "First major book printed with movable type. Information age begins.",
    population: "~400 Million"
  },
  {
    id: 'printing',
    name: 'Printing Press',
    year: 1440,
    yearLabel: '1440 CE',
    lines: ['Tech', 'Philosophy'],
    significance: 'major',
    iconType: ICON_TYPES.PRINTER,
    narrative: {
      visual: "The Blue Line brightens. Knowledge becomes reproducible.",
      atmosphere: "The smell of ink and paper. The mechanical rhythm of the press.",
      insight: "Information spreads exponentially. The map of the world becomes accessible to all."
    },
    details: "Just prior to the Columbian Exchange. Ensures maps of the new world are distributed to everyone.",
    population: "~400 Million"
  },
  {
    id: 'columbian',
    name: 'Columbian Exchange Terminal',
    year: 1492,
    yearLabel: '1492 CE',
    lines: ['Empire', 'Population', 'Tech'],
    significance: 'hub',
    iconType: ICON_TYPES.GLOBE,
    iconSize: 'large',
    narrative: {
      visual: "A chaotic knot. The Purple Line (Empires) splits and wraps around the entire globe (Spain/Portugal). The Green Line (Population) suffers a glitch—a dip due to disease in the Americas—before surging upward.",
      atmosphere: "Salt water, gold, and gunpowder.",
      insight: "The 'World Map' connects. Previously, the Metro had two separate systems (East and West). Now, they are one grid."
    },
    details: "The Printing Press station just prior ensures that maps of this new world are distributed to everyone.",
    population: "~500 Million (dip then surge)"
  },
  {
    id: 'scientific-rev',
    name: 'Scientific Revolution',
    year: 1543,
    yearLabel: '1543 CE',
    lines: ['Tech', 'Philosophy'],
    significance: 'major',
    iconType: ICON_TYPES.BOOK,
    narrative: {
      visual: "The Blue Line accelerates. Observation replaces authority.",
      atmosphere: "The precision of measurement. The clarity of reason.",
      insight: "Science becomes method. The map shows systematic discovery."
    },
    details: "Copernicus publishes On the Revolutions. Scientific method emerges.",
    population: "~500 Million"
  },
  {
    id: 'enlightenment',
    name: 'Enlightenment',
    year: 1687,
    yearLabel: '1687 CE',
    lines: ['Philosophy', 'Tech'],
    significance: 'major',
    iconType: ICON_TYPES.BOOK,
    narrative: {
      visual: "The Orange Line brightens. Reason illuminates the map.",
      atmosphere: "The clarity of thought. The power of ideas.",
      insight: "Philosophy becomes systematic. The map shows intellectual revolution."
    },
    details: "Newton's Principia. Age of Reason begins.",
    population: "~600 Million"
  },
  {
    id: 'steam',
    name: 'Steam Engine',
    year: 1712,
    yearLabel: '1712 CE',
    lines: ['Tech'],
    significance: 'major',
    iconType: ICON_TYPES.GAUGE,
    narrative: {
      visual: "The Blue Line gains power. Mechanical force emerges.",
      atmosphere: "The hiss of steam. The rhythm of pistons.",
      insight: "Energy harnessed. The map shows new sources of power."
    },
    details: "Newcomen's steam engine. First practical steam power.",
    population: "~650 Million"
  },
  {
    id: 'watt',
    name: "Watt's Engine",
    year: 1769,
    yearLabel: '1769 CE',
    lines: ['Tech'],
    significance: 'major',
    iconType: ICON_TYPES.GAUGE,
    narrative: {
      visual: "The Blue Line transforms into steel rails. Steam power emerges.",
      atmosphere: "The hiss of steam, the clank of metal, the rhythm of industry.",
      insight: "Mechanical power multiplies human capability. The train gains its engine."
    },
    details: "Provides the power for the Industrial Grand Central station ahead.",
    population: "~750 Million"
  },
  {
    id: 'french-rev',
    name: 'French Revolution',
    year: 1789,
    yearLabel: '1789 CE',
    lines: ['War', 'Philosophy', 'Empire'],
    significance: 'major',
    iconType: ICON_TYPES.SKULL,
    narrative: {
      visual: "The Red Line surges. The Purple Line fractures. Liberty emerges.",
      atmosphere: "The cry of revolution. The fall of the old order.",
      insight: "Political revolution. The map shows new forms of governance."
    },
    details: "French Revolution begins. Age of revolutions starts.",
    population: "~800 Million"
  },
  {
    id: 'industrial',
    name: 'Industrial Grand Central',
    year: 1800,
    yearLabel: '1800 CE',
    lines: ['Tech', 'Population', 'Philosophy'],
    significance: 'hub',
    iconType: ICON_TYPES.ZAP,
    iconSize: 'large',
    narrative: {
      visual: "The Blue Line turns into steel rails and emits steam. The Green Line goes vertical (hitting 1 Billion). The Orange Line shifts from Faith to Reason (Secular Rights).",
      atmosphere: "Coal smoke, piston beats, and the roar of the masses.",
      insight: "For the first time, the 'Tech' line moves faster than the 'Empire' line. The train is now moving so fast that the scenery blurs."
    },
    details: "Watt's Engine (1769) provides the power. The Orange Line shifts from Faith to Reason.",
    population: "1 Billion"
  },
  {
    id: 'railroad',
    name: 'Railroads',
    year: 1825,
    yearLabel: '1825 CE',
    lines: ['Tech'],
    significance: 'major',
    iconType: ICON_TYPES.SETTINGS,
    narrative: {
      visual: "The Blue Line becomes literal rails. Distance collapses.",
      atmosphere: "The rhythm of wheels. The speed of connection.",
      insight: "Transportation revolution. The map shrinks through speed."
    },
    details: "First public railway. Transportation transforms civilization.",
    population: "~1 Billion"
  },
  {
    id: 'telegraph',
    name: 'Telegraph',
    year: 1844,
    yearLabel: '1844 CE',
    lines: ['Tech'],
    significance: 'major',
    iconType: ICON_TYPES.ZAP,
    narrative: {
      visual: "The Blue Line becomes instant. Information at light speed.",
      atmosphere: "The click of keys. The pulse of messages.",
      insight: "Communication revolution. The map becomes real-time."
    },
    details: "First telegraph message. Instant long-distance communication.",
    population: "~1.2 Billion"
  },
  {
    id: 'darwin',
    name: 'Origin of Species',
    year: 1859,
    yearLabel: '1859 CE',
    lines: ['Philosophy', 'Tech'],
    significance: 'major',
    iconType: ICON_TYPES.BOOK,
    narrative: {
      visual: "The Orange Line shifts. Understanding of life transforms.",
      atmosphere: "The weight of evidence. The shift of perspective.",
      insight: "Scientific revolution in biology. The map shows new understanding."
    },
    details: "Darwin publishes Origin of Species. Evolution theory emerges.",
    population: "~1.3 Billion"
  },
  {
    id: 'ww1',
    name: 'World War I',
    year: 1914,
    yearLabel: '1914 CE',
    lines: ['War', 'Tech'],
    significance: 'crisis',
    iconType: ICON_TYPES.SKULL,
    narrative: {
      visual: "The Red Line engulfs the map. Industrial war emerges.",
      atmosphere: "The roar of artillery. The mud of trenches.",
      insight: "War becomes industrial. The map shows total conflict."
    },
    details: "World War I begins. First industrial-scale global war.",
    population: "~1.8 Billion"
  },
  {
    id: 'crisis',
    name: 'The Crisis Hub',
    year: 1914,
    yearLabel: '1914–1945',
    lines: ['War', 'Tech', 'Empire', 'Philosophy'],
    significance: 'crisis',
    iconType: ICON_TYPES.SKULL,
    iconSize: 'large',
    narrative: {
      visual: "The map is scorched. The Red Line (War) bleeds over everything, obscuring the tracks. The Green Line wavers (70M dead). The Purple Line fractures (British Empire falls) and consolidates into two massive blocks (USA/USSR).",
      atmosphere: "Static, sirens, and the blinding flash of Los Alamos (1945).",
      insight: "The Atomic Station: The Blue Line becomes dangerous. It's no longer just a tool; it's an existential threat."
    },
    details: "Existentialism (Orange): Passengers leave this station looking over their shoulders, questioning the nature of the ride. Green line wavers (70M dead). Empire consolidates into blocks.",
    population: "~2.5 Billion (70M lost)"
  },
  {
    id: 'penicillin',
    name: 'Penicillin',
    year: 1928,
    yearLabel: '1928 CE',
    lines: ['Tech', 'Population'],
    significance: 'major',
    iconType: ICON_TYPES.SETTINGS,
    narrative: {
      visual: "The Blue Line heals. Medicine transforms.",
      atmosphere: "The hope of cure. The defeat of disease.",
      insight: "Medical revolution. The map shows longer, healthier lives."
    },
    details: "Penicillin discovered. Antibiotic age begins.",
    population: "~2 Billion"
  },
  {
    id: 'atomic',
    name: 'The Atomic Station',
    year: 1945,
    yearLabel: '1945 CE',
    lines: ['Tech', 'War'],
    significance: 'crisis',
    iconType: ICON_TYPES.ATOM,
    narrative: {
      visual: "The Blue Line becomes a weapon. A blinding flash illuminates the map.",
      atmosphere: "The silence after the explosion. The weight of infinite power.",
      insight: "Technology reaches the point of self-destruction. The Blue Line is no longer just progress—it's a choice between creation and annihilation."
    },
    details: "Los Alamos. The Blue Line becomes an existential threat. Passengers question the ride.",
    population: "~2.5 Billion"
  },
  {
    id: 'dna',
    name: 'DNA Structure',
    year: 1953,
    yearLabel: '1953 CE',
    lines: ['Tech', 'Philosophy'],
    significance: 'major',
    iconType: ICON_TYPES.ATOM,
    narrative: {
      visual: "The Blue Line reveals life's code. Biology becomes information.",
      atmosphere: "The elegance of the double helix. The code of existence.",
      insight: "Life understood at molecular level. The map shows the code of life."
    },
    details: "DNA structure discovered. Genetic age begins.",
    population: "~2.7 Billion"
  },
  {
    id: 'space',
    name: 'Space Age',
    year: 1957,
    yearLabel: '1957 CE',
    lines: ['Tech'],
    significance: 'major',
    iconType: ICON_TYPES.ZAP,
    narrative: {
      visual: "The Blue Line escapes Earth. The map expands beyond the planet.",
      atmosphere: "The silence of space. The beep of satellites.",
      insight: "Humanity reaches beyond Earth. The map shows new frontiers."
    },
    details: "Sputnik launched. Space age begins.",
    population: "~2.8 Billion"
  },
  {
    id: 'internet',
    name: 'ARPANET',
    year: 1969,
    yearLabel: '1969 CE',
    lines: ['Tech'],
    significance: 'major',
    iconType: ICON_TYPES.CPU,
    narrative: {
      visual: "The Blue Line networks. Digital connections form.",
      atmosphere: "The pulse of data. The birth of networks.",
      insight: "Networking begins. The map shows digital connections."
    },
    details: "ARPANET first message. Internet age begins.",
    population: "~3.6 Billion"
  },
  {
    id: 'pc',
    name: 'Personal Computer',
    year: 1977,
    yearLabel: '1977 CE',
    lines: ['Tech'],
    significance: 'major',
    iconType: ICON_TYPES.CPU,
    narrative: {
      visual: "The Blue Line becomes personal. Computing democratizes.",
      atmosphere: "The glow of screens. The power in every home.",
      insight: "Computing becomes accessible. The map shows personal technology."
    },
    details: "Apple II and Commodore PET. Personal computing revolution.",
    population: "~4.2 Billion"
  },
  {
    id: 'web',
    name: 'The Web',
    year: 1991,
    yearLabel: '1991 CE',
    lines: ['Tech'],
    significance: 'major',
    iconType: ICON_TYPES.CPU,
    narrative: {
      visual: "The Blue Line begins its vertical ascent. Information becomes instant and global.",
      atmosphere: "The hum of modems, the glow of screens, the birth of digital space.",
      insight: "The world becomes a network. Distance collapses. The map becomes the territory."
    },
    details: "The first stop in the Digital Singularity. Information flows at the speed of light.",
    population: "~5.4 Billion"
  },
  {
    id: 'human-genome',
    name: 'Human Genome',
    year: 2003,
    yearLabel: '2003 CE',
    lines: ['Tech', 'Philosophy'],
    significance: 'major',
    iconType: ICON_TYPES.ATOM,
    narrative: {
      visual: "The Blue Line maps life itself. The code is read.",
      atmosphere: "The completion of a map. The understanding of self.",
      insight: "Human genome sequenced. The map shows our complete code."
    },
    details: "Human Genome Project completed. Genetic medicine advances.",
    population: "~6.4 Billion"
  },
  {
    id: 'smartphone',
    name: 'Smartphone',
    year: 2007,
    yearLabel: '2007 CE',
    lines: ['Tech', 'Population'],
    significance: 'major',
    iconType: ICON_TYPES.SMARTPHONE,
    narrative: {
      visual: "The Blue Line accelerates further. The network fits in your pocket.",
      atmosphere: "The glow of screens everywhere. Constant connection. The world in your hand.",
      insight: "The map becomes personal. Everyone carries the entire network. The train is in every pocket."
    },
    details: "The network becomes mobile. The Blue Line reaches into every moment of life.",
    population: "~6.7 Billion"
  },
  {
    id: 'singularity',
    name: 'Digital Singularity / AGI',
    year: 2025,
    yearLabel: '2025 CE',
    lines: ['Tech', 'Population', 'Philosophy', 'Empire'],
    significance: 'current',
    iconType: ICON_TYPES.ALERT,
    iconSize: 'large',
    narrative: {
      visual: "The current station. The map here is so dense it is almost solid light. Blue Line: Vertical ascent. Green Line: Peaking at 8.1 Billion. Purple Line: The 'Unipolar' track is dissolving into a complex web of multipolarity.",
      atmosphere: "The hum of servers, the glow of screens, and a sense of vertigo.",
      insight: "We are currently standing on the platform at 'Everywhere / AGI (2025).' Looking down the tunnel, the tracks disappear into a fog called 'The Future.' The Blue Line is so bright it illuminates the tunnel ahead, but we cannot see where the track leads."
    },
    details: "Current Location. Compression: The distance between 'Game Changing' stations has shrunk from millennia to months. Convergence: The Orange Line (Philosophy/Ethics) is frantically trying to catch up to the Blue Line (Tech). The Next Stop: The map lists no stops after 2025. The track is being laid down by the train as it moves. Passenger Warning: Please mind the gap between your biological evolution (Green Line) and your technological reality (Blue Line).",
    population: "8.1 Billion"
  }
];

/**
 * Line color mapping
 */
const LINE_COLOR_MAP = {
  'Tech': '#22d3ee',
  'War': '#dc2626',
  'Population': '#22c55e',
  'Philosophy': '#fbbf24',
  'Empire': '#a855f7'
};

/**
 * Collision detection threshold - stations within this pixel distance are considered overlapping
 */
const COLLISION_THRESHOLD = 70; // pixels - diameter of station marker

/**
 * Horizontal offset amount to apply when stations overlap
 */
const COLLISION_OFFSET_X = 80; // pixels to offset horizontally (keeps stations on their lines)

/**
 * Process raw station data into fully computed station objects
 * Computes coordinates, applies color based on primary line,
 * and resolves overlapping station positions using HORIZONTAL offsets
 * to keep stations on their respective metro lines
 * @returns {Array} Processed station array with computed coordinates, colors, and flattened narrative
 */
export function processStations() {
  // First pass: compute initial coordinates
  const stationsWithCoords = STATION_DATA.map(station => {
    const primaryLine = station.lines[0];
    const yPosition = LINE_Y_POSITIONS[primaryLine] || 0.5;
    
    return {
      ...station,
      color: station.significance === 'current' ? '#fff' : (LINE_COLOR_MAP[primaryLine] || '#ffffff'),
      coords: {
        x: yearToX(station.year),
        y: yPosition * VIEWBOX.HEIGHT
      },
      visual: station.narrative?.visual,
      atmosphere: station.narrative?.atmosphere,
      insight: station.narrative?.insight
    };
  });

  // Second pass: detect and resolve collisions with HORIZONTAL offsets
  const resolvedStations = resolveStationCollisions(stationsWithCoords);
  
  return resolvedStations;
}

/**
 * Detect overlapping stations and apply HORIZONTAL offsets to separate them
 * Stations stay on their line's Y position - only X is adjusted
 * @param {Array} stations - Array of stations with initial coordinates
 * @returns {Array} Stations with adjusted X coordinates to prevent overlap
 */
function resolveStationCollisions(stations) {
  // Sort by X coordinate (chronological order) then by Y for consistent processing
  const sortedStations = [...stations].sort((a, b) => {
    if (Math.abs(a.coords.x - b.coords.x) < 1) {
      return a.coords.y - b.coords.y; // Same X, sort by Y
    }
    return a.coords.x - b.coords.x;
  });
  
  // Track all placed stations with their final positions
  const placedStations = [];
  
  return sortedStations.map(station => {
    let x = station.coords.x;
    const y = station.coords.y; // Y stays fixed - station must be on its line!
    
    // Check for collisions with already-placed stations
    let collisionFound = true;
    let attempts = 0;
    const maxAttempts = 20;
    let offsetDirection = 1; // Alternate left/right
    let offsetMultiplier = 0;
    const originalX = x;
    
    while (collisionFound && attempts < maxAttempts) {
      collisionFound = false;
      
      for (const placed of placedStations) {
        const xDist = Math.abs(x - placed.x);
        const yDist = Math.abs(y - placed.y);
        
        // Check if positions are too close (collision)
        // Only collide if both X AND Y are close (same area of the map)
        if (xDist < COLLISION_THRESHOLD && yDist < COLLISION_THRESHOLD) {
          collisionFound = true;
          break;
        }
      }
      
      if (collisionFound) {
        // Apply HORIZONTAL offset in alternating directions (left/right)
        offsetMultiplier++;
        x = originalX + (COLLISION_OFFSET_X * offsetMultiplier * offsetDirection);
        offsetDirection *= -1; // Flip direction for next attempt
        
        // Constrain X to viewbox bounds
        x = Math.max(50, Math.min(VIEWBOX.WIDTH - 50, x));
      }
      
      attempts++;
    }
    
    // Record this station's final position
    placedStations.push({ x, y, id: station.id });
    
    // Return station with adjusted X coordinate (Y unchanged - stays on line!)
    return {
      ...station,
      coords: {
        x: x,
        y: y // Y is NEVER modified - station stays on its line
      },
      // Track if this station was offset (useful for UI hints)
      wasOffset: Math.abs(x - originalX) > 1
    };
  });
}

/**
 * Group stations by their lines
 * @param {Array} stations - Processed station array
 * @returns {Object} Stations grouped by line name
 */
export function groupStationsByLine(stations) {
  const groups = {
    Tech: [],
    War: [],
    Population: [],
    Philosophy: [],
    Empire: []
  };
  
  stations.forEach(station => {
    station.lines.forEach(line => {
      if (groups[line]) {
        groups[line].push(station);
      }
    });
  });
  
  // Sort each group by year
  Object.keys(groups).forEach(line => {
    groups[line].sort((a, b) => a.year - b.year);
  });
  
  return groups;
}

/**
 * Get journey milestone stations
 * @param {Array} stations - Full station array
 * @param {Array<string>} journeyIds - IDs of journey stations
 * @returns {Array} Filtered stations for journey mode
 */
export function getJourneyStations(stations, journeyIds) {
  return journeyIds
    .map(id => stations.find(s => s.id === id))
    .filter(Boolean);
}

// Export raw data for direct access if needed
export { STATION_DATA, ICON_TYPES, LINE_COLOR_MAP };
export default STATION_DATA;
