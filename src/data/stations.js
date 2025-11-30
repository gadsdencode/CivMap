/**
 * Station Data
 * Separated from component for maintainability and potential future API integration
 */

import { LINE_Y_POSITIONS } from '../constants/metroConfig';
import { yearToX } from '../utils/coordinates';

// Raw station definitions - the historical data
const STATION_DATA = [
  {
    id: 'neolithic',
    name: 'The Neolithic Junction',
    year: -10000,
    yearLabel: '10,000 BCE',
    lines: ['Tech', 'Population'],
    significance: 'major',
    narrative: {
      visual: "The thin Cyan line (Tech) and the thin Vine (Green) collide and fuse.",
      atmosphere: "The smell of wet earth and grain. A quiet, spacious beginning.",
      insight: "The first permanent structure. 4 Million people. The wanderers settle."
    },
    details: "Passengers arrive from the Hunter-Gatherer Express. Everyone switches to the Sedentary Line.",
    population: "4 Million"
  },
  {
    id: 'pottery',
    name: 'Pottery & Ceramics',
    year: -8000,
    yearLabel: '8,000 BCE',
    lines: ['Tech'],
    significance: 'minor',
    narrative: {
      visual: "The Blue Line develops new textures. Containers emerge.",
      atmosphere: "The heat of kilns. The transformation of clay.",
      insight: "Storage and preservation. The first manufactured containers."
    },
    details: "Early pottery enables food storage and cooking.",
    population: "~5 Million"
  },
  {
    id: 'copper',
    name: 'Copper Age',
    year: -6000,
    yearLabel: '6,000 BCE',
    lines: ['Tech'],
    significance: 'minor',
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
    narrative: {
      visual: "The Purple Line begins to form. First cities emerge.",
      atmosphere: "The bustle of urban life. The first markets.",
      insight: "Urbanization begins. The map shows concentrated nodes."
    },
    details: "First true cities in Mesopotamia. Urban civilization takes root.",
    population: "~7 Million"
  },
  {
    id: 'uruk',
    name: 'Uruk Central',
    year: -3500,
    yearLabel: '3,500 BCE',
    lines: ['Tech', 'Empire', 'Population'],
    significance: 'hub',
    narrative: {
      visual: "The Purple Line emerges. The Blue Line flashes with Writing.",
      atmosphere: "Dust, clay tablets, bureaucrats tallying grain.",
      insight: "Civilization 'locks in.' The first 'System Map' drawn by scribes."
    },
    details: "The Wheel (3200 BCE) is one stop away—pace accelerates noticeably.",
    population: "~1 Million"
  },
  {
    id: 'egypt',
    name: 'Ancient Egypt',
    year: -3100,
    yearLabel: '3,100 BCE',
    lines: ['Empire', 'Tech'],
    significance: 'major',
    narrative: {
      visual: "The Purple Line solidifies. Pyramids rise along the tracks.",
      atmosphere: "The weight of stone. The flow of the Nile.",
      insight: "First great empire. Monumental architecture."
    },
    details: "Unification of Upper and Lower Egypt. First pharaonic dynasty.",
    population: "~1 Million"
  },
  {
    id: 'indus',
    name: 'Indus Valley',
    year: -3300,
    yearLabel: '3,300 BCE',
    lines: ['Empire', 'Tech'],
    significance: 'major',
    narrative: {
      visual: "The Purple Line branches. Planned cities emerge.",
      atmosphere: "Grid streets. Flowing water systems.",
      insight: "Urban planning reaches new heights."
    },
    details: "Harappa and Mohenjo-Daro. Advanced city planning.",
    population: "~1 Million"
  },
  {
    id: 'wheel',
    name: 'The Wheel',
    year: -3200,
    yearLabel: '3,200 BCE',
    lines: ['Tech'],
    significance: 'major',
    narrative: {
      visual: "The Blue Line accelerates. First mechanical advantage.",
      atmosphere: "The creak of wooden wheels on stone roads.",
      insight: "Mobility transforms civilization."
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
    narrative: {
      visual: "The Blue Line strengthens. Alloy technology emerges.",
      atmosphere: "The glow of bronze. Stronger weapons.",
      insight: "Alloys create superior materials."
    },
    details: "Bronze smelting spreads. Warfare transforms.",
    population: "~14 Million"
  },
  {
    id: 'pyramids',
    name: 'Great Pyramids',
    year: -2600,
    yearLabel: '2,600 BCE',
    lines: ['Empire', 'Tech'],
    significance: 'major',
    narrative: {
      visual: "The Purple Line reaches skyward.",
      atmosphere: "The weight of eternity. Stone against sky.",
      insight: "Human ambition made permanent."
    },
    details: "Pyramids of Giza. Engineering marvels.",
    population: "~27 Million"
  },
  {
    id: 'code-hammurabi',
    name: "Hammurabi's Code",
    year: -1750,
    yearLabel: '1,750 BCE',
    lines: ['Philosophy', 'Empire'],
    significance: 'major',
    narrative: {
      visual: "The Orange Line solidifies. Written law emerges.",
      atmosphere: "The weight of justice. Permanence of rules.",
      insight: "Law becomes codified."
    },
    details: "First comprehensive legal code.",
    population: "~50 Million"
  },
  {
    id: 'iron',
    name: 'Iron Age',
    year: -1200,
    yearLabel: '1,200 BCE',
    lines: ['Tech', 'War'],
    significance: 'major',
    narrative: {
      visual: "The Blue Line strengthens. Metalworking transforms.",
      atmosphere: "Ring of hammer on anvil. Glow of forges.",
      insight: "Harder materials enable new possibilities."
    },
    details: "Tools and weapons become more effective.",
    population: "~50 Million"
  },
  {
    id: 'olympics',
    name: 'First Olympics',
    year: -776,
    yearLabel: '776 BCE',
    lines: ['Philosophy', 'Population'],
    significance: 'minor',
    narrative: {
      visual: "The Orange Line celebrates.",
      atmosphere: "The roar of crowds. Pursuit of excellence.",
      insight: "Competition and culture unite."
    },
    details: "First recorded Olympic Games.",
    population: "~100 Million"
  },
  {
    id: 'buddha',
    name: 'Buddha & Philosophy',
    year: -563,
    yearLabel: '563 BCE',
    lines: ['Philosophy'],
    significance: 'major',
    narrative: {
      visual: "The Orange Line deepens. Eastern philosophy emerges.",
      atmosphere: "The silence of meditation.",
      insight: "Philosophy offers new paths."
    },
    details: "Birth of Siddhartha Gautama. Buddhism begins.",
    population: "~100 Million"
  },
  {
    id: 'confucius',
    name: 'Confucius',
    year: -551,
    yearLabel: '551 BCE',
    lines: ['Philosophy', 'Empire'],
    significance: 'major',
    narrative: {
      visual: "The Orange Line branches eastward.",
      atmosphere: "The wisdom of ages.",
      insight: "Moral philosophy shapes civilization."
    },
    details: "Confucianism shapes Chinese civilization.",
    population: "~100 Million"
  },
  {
    id: 'persian',
    name: 'Persian Empire',
    year: -550,
    yearLabel: '550 BCE',
    lines: ['Empire'],
    significance: 'major',
    narrative: {
      visual: "The Purple Line expands dramatically.",
      atmosphere: "The scale of conquest.",
      insight: "Empire reaches new scale."
    },
    details: "Achaemenid Empire under Cyrus the Great.",
    population: "~100 Million"
  },
  {
    id: 'classical',
    name: 'Classical Era',
    year: -500,
    yearLabel: '500 BCE',
    lines: ['Empire', 'Philosophy'],
    significance: 'hub',
    narrative: {
      visual: "The Purple Line expands. Great empires rise.",
      atmosphere: "Marching legions. Marble cities.",
      insight: "Empires become the dominant structure."
    },
    details: "Rome, Persia, China create global empires.",
    population: "~100 Million"
  },
  {
    id: 'alexander',
    name: 'Alexander the Great',
    year: -336,
    yearLabel: '336 BCE',
    lines: ['Empire', 'Philosophy'],
    significance: 'major',
    narrative: {
      visual: "The Purple Line stretches to breaking.",
      atmosphere: "The speed of conquest. Fusion of cultures.",
      insight: "Empire reaches geographic limits."
    },
    details: "Hellenistic culture spreads across continents.",
    population: "~150 Million"
  },
  {
    id: 'qin',
    name: 'Qin Dynasty',
    year: -221,
    yearLabel: '221 BCE',
    lines: ['Empire', 'Tech'],
    significance: 'major',
    narrative: {
      visual: "The Purple Line consolidates in the East.",
      atmosphere: "The weight of unity. Great Wall begins.",
      insight: "China unifies."
    },
    details: "Qin Shi Huang unifies China. Standardization.",
    population: "~200 Million"
  },
  {
    id: 'rome',
    name: 'Roman Republic',
    year: -509,
    yearLabel: '509 BCE',
    lines: ['Empire', 'Philosophy'],
    significance: 'major',
    narrative: {
      visual: "The Purple Line gains structure.",
      atmosphere: "Balance of power. Rule of law.",
      insight: "New form of governance."
    },
    details: "Roman Republic established.",
    population: "~100 Million"
  },
  {
    id: 'jesus',
    name: 'Jesus & Christianity',
    year: 0,
    yearLabel: '1 CE',
    lines: ['Philosophy'],
    significance: 'major',
    narrative: {
      visual: "The Orange Line transforms.",
      atmosphere: "The birth of hope. Spread of faith.",
      insight: "Religious revolution."
    },
    details: "Christianity begins to spread.",
    population: "~200 Million"
  },
  {
    id: 'han',
    name: 'Han Dynasty Peak',
    year: 100,
    yearLabel: '100 CE',
    lines: ['Empire', 'Tech'],
    significance: 'major',
    narrative: {
      visual: "The Purple Line reaches new heights in the East.",
      atmosphere: "The Silk Road. Exchange of goods and ideas.",
      insight: "China at its peak."
    },
    details: "Han Dynasty golden age. Silk Road flourishes.",
    population: "~250 Million"
  },
  {
    id: 'fall-rome',
    name: 'Fall of Rome',
    year: 476,
    yearLabel: '476 CE',
    lines: ['War', 'Empire'],
    significance: 'major',
    narrative: {
      visual: "The Purple Line fractures. The Red Line surges.",
      atmosphere: "Collapse of order. Migration of peoples.",
      insight: "Empires fall, but tracks remain."
    },
    details: "Western Roman Empire falls. Europe redraws.",
    population: "~200 Million"
  },
  {
    id: 'justinian',
    name: 'Justinian Code',
    year: 529,
    yearLabel: '529 CE',
    lines: ['Philosophy', 'Empire'],
    significance: 'minor',
    narrative: {
      visual: "The Orange Line codifies.",
      atmosphere: "Weight of legal tradition.",
      insight: "Legal systems formalize."
    },
    details: "Roman law preserved and systematized.",
    population: "~200 Million"
  },
  {
    id: 'tang',
    name: 'Tang Dynasty',
    year: 618,
    yearLabel: '618 CE',
    lines: ['Empire', 'Philosophy'],
    significance: 'major',
    narrative: {
      visual: "The Purple Line flourishes in the East.",
      atmosphere: "Prosperity. Poetry flows.",
      insight: "China's cultural peak."
    },
    details: "Golden age of Chinese civilization.",
    population: "~250 Million"
  },
  {
    id: 'islamic-golden',
    name: 'Islamic Golden Age',
    year: 800,
    yearLabel: '800 CE',
    lines: ['Tech', 'Philosophy'],
    significance: 'major',
    narrative: {
      visual: "The Blue Line brightens in the East.",
      atmosphere: "Libraries. Ideas across continents.",
      insight: "Science and mathematics advance."
    },
    details: "Baghdad becomes hub of learning.",
    population: "~250 Million"
  },
  {
    id: 'gunpowder',
    name: 'Gunpowder',
    year: 850,
    yearLabel: '850 CE',
    lines: ['Tech', 'War'],
    significance: 'major',
    narrative: {
      visual: "The Blue Line gains explosive power.",
      atmosphere: "Sulfur. Flash of fire.",
      insight: "Chemical power harnessed."
    },
    details: "Gunpowder invented in China.",
    population: "~250 Million"
  },
  {
    id: 'vikings',
    name: 'Viking Age',
    year: 793,
    yearLabel: '793 CE',
    lines: ['War', 'Tech'],
    significance: 'major',
    narrative: {
      visual: "The Red Line surges northward.",
      atmosphere: "Sound of oars. Fear of the unknown.",
      insight: "Exploration through conquest."
    },
    details: "Viking raids begin. Exploration across North Atlantic.",
    population: "~250 Million"
  },
  {
    id: 'magna-carta',
    name: 'Magna Carta',
    year: 1215,
    yearLabel: '1215 CE',
    lines: ['Philosophy', 'Empire'],
    significance: 'major',
    narrative: {
      visual: "The Orange Line constrains power.",
      atmosphere: "Weight of parchment. Limit of kings.",
      insight: "Power becomes limited."
    },
    details: "Foundation of constitutional law.",
    population: "~400 Million"
  },
  {
    id: 'mongol',
    name: 'Mongol Empire',
    year: 1206,
    yearLabel: '1206 CE',
    lines: ['Empire', 'War'],
    significance: 'major',
    narrative: {
      visual: "The Purple Line explodes.",
      atmosphere: "Thunder of hooves. Unity of the steppe.",
      insight: "Empire reaches unprecedented scale."
    },
    details: "Genghis Khan. Largest contiguous empire.",
    population: "~400 Million"
  },
  {
    id: 'black-death',
    name: 'Black Death',
    year: 1347,
    yearLabel: '1347 CE',
    lines: ['Population', 'War'],
    significance: 'crisis',
    narrative: {
      visual: "The Green Line plummets. Red spreads.",
      atmosphere: "Silence of empty streets. Weight of loss.",
      insight: "Population crashes. Fragility exposed."
    },
    details: "30-50% of Europe dies.",
    population: "~350M → ~250M"
  },
  {
    id: 'renaissance',
    name: 'Renaissance',
    year: 1400,
    yearLabel: '1400 CE',
    lines: ['Philosophy', 'Tech'],
    significance: 'major',
    narrative: {
      visual: "The Orange Line shifts. Humanism emerges.",
      atmosphere: "Paint and marble. New ideas.",
      insight: "The past illuminates the future."
    },
    details: "Europe rediscovers classical knowledge.",
    population: "~350 Million"
  },
  {
    id: 'printing',
    name: 'Printing Press',
    year: 1440,
    yearLabel: '1440 CE',
    lines: ['Tech', 'Philosophy'],
    significance: 'major',
    narrative: {
      visual: "The Blue Line brightens. Knowledge reproducible.",
      atmosphere: "Ink and paper. Mechanical rhythm.",
      insight: "Information spreads exponentially."
    },
    details: "Gutenberg. Maps become accessible to all.",
    population: "~400 Million"
  },
  {
    id: 'columbian',
    name: 'Columbian Exchange',
    year: 1492,
    yearLabel: '1492 CE',
    lines: ['Empire', 'Population', 'Tech'],
    significance: 'hub',
    narrative: {
      visual: "A chaotic knot. Empires wrap the globe.",
      atmosphere: "Salt water, gold, and gunpowder.",
      insight: "The 'World Map' connects. East and West become one grid."
    },
    details: "Two separate metro systems become one.",
    population: "~500M (dip then surge)"
  },
  {
    id: 'scientific-rev',
    name: 'Scientific Revolution',
    year: 1543,
    yearLabel: '1543 CE',
    lines: ['Tech', 'Philosophy'],
    significance: 'major',
    narrative: {
      visual: "The Blue Line accelerates.",
      atmosphere: "Precision of measurement. Clarity of reason.",
      insight: "Science becomes method."
    },
    details: "Copernicus. Scientific method emerges.",
    population: "~500 Million"
  },
  {
    id: 'enlightenment',
    name: 'Enlightenment',
    year: 1687,
    yearLabel: '1687 CE',
    lines: ['Philosophy', 'Tech'],
    significance: 'major',
    narrative: {
      visual: "The Orange Line brightens. Reason illuminates.",
      atmosphere: "Clarity of thought. Power of ideas.",
      insight: "Philosophy becomes systematic."
    },
    details: "Newton's Principia. Age of Reason.",
    population: "~600 Million"
  },
  {
    id: 'steam',
    name: 'Steam Engine',
    year: 1712,
    yearLabel: '1712 CE',
    lines: ['Tech'],
    significance: 'major',
    narrative: {
      visual: "The Blue Line gains power.",
      atmosphere: "Hiss of steam. Rhythm of pistons.",
      insight: "Energy harnessed."
    },
    details: "Newcomen's steam engine.",
    population: "~650 Million"
  },
  {
    id: 'watt',
    name: "Watt's Engine",
    year: 1769,
    yearLabel: '1769 CE',
    lines: ['Tech'],
    significance: 'major',
    narrative: {
      visual: "The Blue Line transforms into steel rails.",
      atmosphere: "Steam, metal, rhythm of industry.",
      insight: "Mechanical power multiplies capability."
    },
    details: "Power for Industrial Grand Central ahead.",
    population: "~750 Million"
  },
  {
    id: 'french-rev',
    name: 'French Revolution',
    year: 1789,
    yearLabel: '1789 CE',
    lines: ['War', 'Philosophy', 'Empire'],
    significance: 'major',
    narrative: {
      visual: "The Red Line surges. Purple fractures.",
      atmosphere: "Cry of revolution. Fall of old order.",
      insight: "Political revolution."
    },
    details: "Age of revolutions starts.",
    population: "~800 Million"
  },
  {
    id: 'industrial',
    name: 'Industrial Grand Central',
    year: 1800,
    yearLabel: '1800 CE',
    lines: ['Tech', 'Population', 'Philosophy'],
    significance: 'hub',
    narrative: {
      visual: "Blue becomes steel rails. Green goes vertical. Orange shifts from Faith to Reason.",
      atmosphere: "Coal smoke, piston beats, roar of the masses.",
      insight: "For the first time, Tech moves faster than Empire. The train moves so fast, scenery blurs."
    },
    details: "Watt's Engine provides power. 1 Billion humans.",
    population: "1 Billion"
  },
  {
    id: 'railroad',
    name: 'Railroads',
    year: 1825,
    yearLabel: '1825 CE',
    lines: ['Tech'],
    significance: 'major',
    narrative: {
      visual: "The Blue Line becomes literal rails.",
      atmosphere: "Rhythm of wheels. Speed of connection.",
      insight: "Transportation revolution."
    },
    details: "First public railway.",
    population: "~1 Billion"
  },
  {
    id: 'telegraph',
    name: 'Telegraph',
    year: 1844,
    yearLabel: '1844 CE',
    lines: ['Tech'],
    significance: 'major',
    narrative: {
      visual: "The Blue Line becomes instant.",
      atmosphere: "Click of keys. Pulse of messages.",
      insight: "Communication revolution."
    },
    details: "First telegraph message. Instant communication.",
    population: "~1.2 Billion"
  },
  {
    id: 'darwin',
    name: 'Origin of Species',
    year: 1859,
    yearLabel: '1859 CE',
    lines: ['Philosophy', 'Tech'],
    significance: 'major',
    narrative: {
      visual: "The Orange Line shifts.",
      atmosphere: "Weight of evidence. Shift of perspective.",
      insight: "Scientific revolution in biology."
    },
    details: "Evolution theory emerges.",
    population: "~1.3 Billion"
  },
  {
    id: 'ww1',
    name: 'World War I',
    year: 1914,
    yearLabel: '1914 CE',
    lines: ['War', 'Tech'],
    significance: 'crisis',
    narrative: {
      visual: "The Red Line engulfs the map.",
      atmosphere: "Roar of artillery. Mud of trenches.",
      insight: "War becomes industrial."
    },
    details: "First industrial-scale global war.",
    population: "~1.8 Billion"
  },
  {
    id: 'crisis',
    name: 'The Crisis Hub',
    year: 1914,
    yearLabel: '1914–1945',
    lines: ['War', 'Tech', 'Empire', 'Philosophy'],
    significance: 'crisis',
    narrative: {
      visual: "The map is scorched. Red bleeds over everything. Green wavers. Purple fractures.",
      atmosphere: "Static, sirens, blinding flash of Los Alamos.",
      insight: "The Atomic Station: Blue becomes dangerous. Existential threat."
    },
    details: "70M dead. Empire consolidates into USA/USSR blocks. Passengers leave looking over shoulders.",
    population: "~2.5B (70M lost)"
  },
  {
    id: 'penicillin',
    name: 'Penicillin',
    year: 1928,
    yearLabel: '1928 CE',
    lines: ['Tech', 'Population'],
    significance: 'major',
    narrative: {
      visual: "The Blue Line heals.",
      atmosphere: "Hope of cure. Defeat of disease.",
      insight: "Medical revolution."
    },
    details: "Antibiotic age begins.",
    population: "~2 Billion"
  },
  {
    id: 'atomic',
    name: 'The Atomic Station',
    year: 1945,
    yearLabel: '1945 CE',
    lines: ['Tech', 'War'],
    significance: 'crisis',
    narrative: {
      visual: "The Blue Line becomes a weapon. Blinding flash.",
      atmosphere: "Silence after explosion. Weight of infinite power.",
      insight: "Technology reaches self-destruction. Blue is no longer just progress—it's a choice."
    },
    details: "Los Alamos. Blue becomes existential threat.",
    population: "~2.5 Billion"
  },
  {
    id: 'dna',
    name: 'DNA Structure',
    year: 1953,
    yearLabel: '1953 CE',
    lines: ['Tech', 'Philosophy'],
    significance: 'major',
    narrative: {
      visual: "The Blue Line reveals life's code.",
      atmosphere: "Elegance of the helix. Code of existence.",
      insight: "Life understood at molecular level."
    },
    details: "Genetic age begins.",
    population: "~2.7 Billion"
  },
  {
    id: 'space',
    name: 'Space Age',
    year: 1957,
    yearLabel: '1957 CE',
    lines: ['Tech'],
    significance: 'major',
    narrative: {
      visual: "The Blue Line escapes Earth.",
      atmosphere: "Silence of space. Beep of satellites.",
      insight: "Humanity reaches beyond Earth."
    },
    details: "Sputnik. Space age begins.",
    population: "~2.8 Billion"
  },
  {
    id: 'internet',
    name: 'ARPANET',
    year: 1969,
    yearLabel: '1969 CE',
    lines: ['Tech'],
    significance: 'major',
    narrative: {
      visual: "The Blue Line networks.",
      atmosphere: "Pulse of data. Birth of networks.",
      insight: "Networking begins."
    },
    details: "Internet age begins.",
    population: "~3.6 Billion"
  },
  {
    id: 'pc',
    name: 'Personal Computer',
    year: 1977,
    yearLabel: '1977 CE',
    lines: ['Tech'],
    significance: 'major',
    narrative: {
      visual: "The Blue Line becomes personal.",
      atmosphere: "Glow of screens. Power in every home.",
      insight: "Computing becomes accessible."
    },
    details: "Apple II, Commodore PET.",
    population: "~4.2 Billion"
  },
  {
    id: 'web',
    name: 'The Web',
    year: 1991,
    yearLabel: '1991 CE',
    lines: ['Tech'],
    significance: 'major',
    narrative: {
      visual: "The Blue Line begins vertical ascent.",
      atmosphere: "Hum of modems. Birth of digital space.",
      insight: "World becomes a network. Distance collapses."
    },
    details: "First stop in Digital Singularity.",
    population: "~5.4 Billion"
  },
  {
    id: 'human-genome',
    name: 'Human Genome',
    year: 2003,
    yearLabel: '2003 CE',
    lines: ['Tech', 'Philosophy'],
    significance: 'major',
    narrative: {
      visual: "The Blue Line maps life itself.",
      atmosphere: "Completion of a map. Understanding of self.",
      insight: "Human genome sequenced."
    },
    details: "Genetic medicine advances.",
    population: "~6.4 Billion"
  },
  {
    id: 'smartphone',
    name: 'Smartphone',
    year: 2007,
    yearLabel: '2007 CE',
    lines: ['Tech', 'Population'],
    significance: 'major',
    narrative: {
      visual: "The Blue Line accelerates further. Network in your pocket.",
      atmosphere: "Screens everywhere. Constant connection.",
      insight: "Everyone carries the entire network. Train in every pocket."
    },
    details: "Blue reaches into every moment of life.",
    population: "~6.7 Billion"
  },
  {
    id: 'singularity',
    name: 'Digital Singularity / AGI',
    year: 2025,
    yearLabel: '2025 CE',
    lines: ['Tech', 'Population', 'Philosophy', 'Empire'],
    significance: 'current',
    narrative: {
      visual: "Current station. Map is solid light. Blue: vertical. Green: 8.1B peak. Purple: multipolar web.",
      atmosphere: "Hum of servers. Glow of screens. Vertigo.",
      insight: "Standing at 'Everywhere/AGI.' Tracks disappear into fog called 'The Future.' Blue illuminates but we cannot see where it leads."
    },
    details: "Compression: stations shrunk from millennia to months. Convergence: Orange frantically catching Blue. Next Stop: No stops listed. Track laid as train moves. WARNING: Mind the gap between biological (Green) and technological (Blue) evolution.",
    population: "8.1 Billion"
  }
];

/**
 * Process raw station data into fully computed station objects
 * @returns {Array} Processed station array with computed coordinates and colors
 */
export function processStations() {
  const LINE_COLOR_MAP = {
    'Tech': '#22d3ee',
    'War': '#dc2626',
    'Population': '#22c55e',
    'Philosophy': '#fbbf24',
    'Empire': '#a855f7'
  };

  return STATION_DATA.map(station => {
    const primaryLine = station.lines[0];
    const yPosition = LINE_Y_POSITIONS[primaryLine] || 0.5;
    
    return {
      ...station,
      color: LINE_COLOR_MAP[primaryLine] || '#ffffff',
      coords: {
        x: yearToX(station.year),
        y: yPosition * 4000 // VIEWBOX_HEIGHT
      }
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

export default STATION_DATA;

