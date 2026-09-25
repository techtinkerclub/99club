/* 99 Club Studio · coherent Online Play icon set v1.0
 * One deliberately drawn SVG family for the full Online Play catalogue.
 * Icons inherit currentColor so the existing badge palette remains in charge.
 */
(function(global){
'use strict';

const svg=body=>'<svg class="tt99-game-icon-svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'+body+'</svg>';

const ICONS={
  sumplete: svg('<rect x="3.5" y="3.5" width="17" height="17" rx="2"/><path d="M12 3.5v17M3.5 12h17M5.5 18.5l5-5"/>'),
  cornersum: svg('<rect x="5" y="5" width="14" height="14" rx="1.5"/><path d="M12 5v14M5 12h14"/><circle cx="5" cy="5" r="1.4" fill="currentColor" stroke="none"/><circle cx="19" cy="5" r="1.4" fill="currentColor" stroke="none"/><circle cx="5" cy="19" r="1.4" fill="currentColor" stroke="none"/><circle cx="19" cy="19" r="1.4" fill="currentColor" stroke="none"/>'),
  linkedsum: svg('<circle cx="7" cy="8" r="3"/><circle cx="17" cy="8" r="3"/><circle cx="12" cy="17" r="3"/><path d="M9.6 9.5l1.5 4.6M14.4 9.5l-1.5 4.6M10 8h4"/>'),
  killersudoku: svg('<rect x="3" y="3" width="18" height="18" rx="1.5"/><path d="M9 3v18M15 3v18M3 9h18M3 15h18"/><path d="M3 3h7v5h5v7h6" stroke-width="2.5"/>'),
  kakuro: svg('<rect x="3" y="3" width="18" height="18" rx="1.5"/><path d="M9 3v18M15 3v18M3 9h18M3 15h18M3 3l6 6"/><path d="M5.3 7.2h2.1M6.35 6.15v2.1"/>'),
  arithmeticcages: svg('<rect x="3" y="3" width="18" height="18" rx="1.5"/><path d="M9 3v18M15 3v18M3 9h18M3 15h18"/><path d="M3 3h12v6h6v12H9v-6H3z" stroke-width="2.4"/>'),
  brokencalc: svg('<rect x="5" y="2.8" width="14" height="18.4" rx="2"/><rect x="7.5" y="5.3" width="9" height="3.2" rx=".8"/><path d="M8 12h1M12 12h1M16 12h1M8 15.5h1M12 15.5h1M16 15.5h1M8 19h1M12 19h1"/><path d="M15.6 17.6l2.8 2.8M18.4 17.6l-2.8 2.8"/>'),
  target: svg('<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.7" fill="currentColor" stroke="none"/><path d="M18 6l3-3M17 3h4v4"/>'),
  operationgrid: svg('<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16M15 4v16M3 12h18"/><path d="M5.5 8h1.8M6.4 7.1v1.8M11.1 8h1.8M17.3 7.2l1.6 1.6M18.9 7.2l-1.6 1.6"/>'),
  maze: svg('<path d="M4 19V5h6v5H8v5h8V9h4"/><path d="M4 19h5v-2M20 9V4h-5"/><circle cx="4" cy="19" r="1.3" fill="currentColor" stroke="none"/><path d="M18 2l3 2-3 2"/>'),
  crossnumber: svg('<path d="M8 3h8v5h5v8h-5v5H8v-5H3V8h5z"/><path d="M8 8h8v8H8zM12 8v8M8 12h8"/><circle cx="6" cy="10" r=".8" fill="currentColor" stroke="none"/><circle cx="18" cy="14" r=".8" fill="currentColor" stroke="none"/>'),
  arithmagon: svg('<path d="M12 3l8 15H4z"/><circle cx="12" cy="3" r="2"/><circle cx="4" cy="18" r="2"/><circle cx="20" cy="18" r="2"/><circle cx="12" cy="11.8" r="1.5"/>'),
  pyramid: svg('<rect x="9" y="3" width="6" height="4" rx="1"/><rect x="6" y="8.5" width="6" height="4" rx="1"/><rect x="12" y="8.5" width="6" height="4" rx="1"/><rect x="3" y="14" width="6" height="4" rx="1"/><rect x="9" y="14" width="6" height="4" rx="1"/><rect x="15" y="14" width="6" height="4" rx="1"/>'),
  numberwheels: svg('<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="2.2"/><path d="M12 3.5V9.8M12 14.2v6.3M3.5 12h6.3M14.2 12h6.3M6 6l4.4 4.4M13.6 13.6L18 18M18 6l-4.4 4.4M10.4 13.6L6 18"/>'),
  numbersearch: svg('<rect x="3" y="3" width="13" height="13" rx="1.5"/><path d="M7.3 3v13M11.7 3v13M3 7.3h13M3 11.7h13"/><circle cx="16.8" cy="16.8" r="3.1"/><path d="M19.1 19.1L22 22"/>'),
  equationcrossgrid: svg('<path d="M8 3h8v5h5v8h-5v5H8v-5H3V8h5z"/><path d="M6 10h4M8 8v4M14 10h4M14 14h4M14 17h4"/>'),
  squaresearch: svg('<rect x="3" y="3" width="18" height="18" rx="1.5"/><path d="M9 3v18M15 3v18M3 9h18M3 15h18"/><rect x="9" y="9" width="6" height="6" rx=".8" stroke-width="2.6"/>'),
  insertops: svg('<circle cx="4.5" cy="12" r="2.2"/><circle cx="19.5" cy="12" r="2.2"/><rect x="9" y="8.5" width="6" height="7" rx="1.2"/><path d="M11 12h2M12 11v2M6.8 12H9M15 12h2.3"/>'),
  symbols: svg('<circle cx="6" cy="7" r="2.6"/><path d="M15.5 4.5l3 5h-6z"/><rect x="8.8" y="14.5" width="6.4" height="6.4" rx="1"/><path d="M8.2 8.5l2.3 5.8M15.8 9.5l-2.2 4.8"/>'),
  functionmachine: svg('<path d="M2.5 12h4M17.5 12h4"/><path d="M5 9.5L7.5 12 5 14.5M19 9.5l2.5 2.5-2.5 2.5"/><rect x="7.5" y="6" width="10" height="12" rx="2"/><path d="M10 10h5M12.5 7.5v5M10 15h5"/>'),
  balance: svg('<rect x="4" y="5" width="16" height="14" rx="2"/><path d="M7 10h4M13 10h4M8 14h8"/>'),
  mobilebalance: svg('<path d="M12 3v3M7 6h10M8 6v4M16 6v4M4 10h8M12 10h8M5.5 10v4M10.5 10v4M13.5 10v4M18.5 10v4"/><circle cx="5.5" cy="16.5" r="2"/><rect x="8.5" y="14.5" width="4" height="4" rx=".8"/><path d="M13.5 18.5l2-4 2 4z"/><circle cx="18.5" cy="16.5" r="2"/>'),
  magic: svg('<rect x="3" y="3" width="18" height="18" rx="1.5"/><path d="M9 3v18M15 3v18M3 9h18M3 15h18M3 3l18 18M21 3L3 21"/>'),
  magicshape: svg('<path d="M12 2.8l2.5 6.2 6.7.5-5.1 4.3 1.6 6.5-5.7-3.5-5.7 3.5 1.6-6.5-5.1-4.3 6.7-.5z"/><circle cx="12" cy="12" r="1.7"/>'),
  alphametics: svg('<path d="M3.5 18L7 6l3.5 12M4.8 13h4.4"/><path d="M13 8h7l-5 10h5"/><path d="M12 12h1.8"/>'),
  numbertrail: svg('<path d="M4 18c0-5 5-5 5-9s5-4 7-1 4 2 4-2"/><circle cx="4" cy="18" r="1.6" fill="currentColor" stroke="none"/><circle cx="9" cy="9" r="1.6" fill="currentColor" stroke="none"/><circle cx="16" cy="8" r="1.6" fill="currentColor" stroke="none"/><circle cx="20" cy="6" r="1.6" fill="currentColor" stroke="none"/>'),
  propertymaze: svg('<path d="M4 20V4h16v6h-6v4h3v6H9v-4H6V9h5V4"/><circle cx="4" cy="20" r="1.4" fill="currentColor" stroke="none"/><path d="M17 20h3v-3"/>'),
  diagonalpath: svg('<rect x="3" y="3" width="18" height="18" rx="1.5"/><path d="M9 3v18M15 3v18M3 9h18M3 15h18"/><path d="M5.7 17.8l5.2-5.2 3 3 4.4-7.2" stroke-width="2.4"/><circle cx="5.7" cy="17.8" r="1.1" fill="currentColor" stroke="none"/><circle cx="18.3" cy="8.4" r="1.1" fill="currentColor" stroke="none"/>'),
  sudoku: svg('<rect x="3" y="3" width="18" height="18" rx="1.4"/><path d="M9 3v18M15 3v18M3 9h18M3 15h18" stroke-width="2.3"/><path d="M6 3v18M12 3v18M18 3v18M3 6h18M3 12h18M3 18h18" stroke-width=".8" opacity=".65"/>'),
  futoshiki: svg('<rect x="3" y="3" width="18" height="18" rx="1.5"/><path d="M9 3v18M15 3v18M3 9h18M3 15h18"/><path d="M10.5 11l-3 2 3 2M16.5 9l-3-2-3 2"/>'),
  takuzu: svg('<rect x="3" y="3" width="18" height="18" rx="1.5"/><path d="M12 3v18M3 12h18"/><circle cx="7.5" cy="7.5" r="2"/><path d="M16.5 5.5v4M7.5 14.5v4"/><circle cx="16.5" cy="16.5" r="2"/>'),
  numberpath: svg('<rect x="3" y="3" width="18" height="18" rx="1.5"/><path d="M6 17h4v-5h4V7h4" stroke-width="2.4"/><circle cx="6" cy="17" r="1.4" fill="currentColor" stroke="none"/><circle cx="10" cy="12" r="1.4" fill="currentColor" stroke="none"/><circle cx="14" cy="7" r="1.4" fill="currentColor" stroke="none"/><circle cx="18" cy="7" r="1.4" fill="currentColor" stroke="none"/>'),
  nonogram: svg('<rect x="3" y="3" width="18" height="18" rx="1.5"/><path d="M9 3v18M15 3v18M3 9h18M3 15h18"/><rect x="3" y="3" width="6" height="6" fill="currentColor" stroke="none" opacity=".9"/><rect x="15" y="9" width="6" height="6" fill="currentColor" stroke="none" opacity=".9"/><rect x="9" y="15" width="6" height="6" fill="currentColor" stroke="none" opacity=".9"/>'),
  mathsmines: svg('<path d="M12 3l5.5 4.7L12 21 6.5 7.7z"/><path d="M6.5 7.7h11M9 7.7L12 21M15 7.7L12 21"/><circle cx="4" cy="4" r="1" fill="currentColor" stroke="none"/><circle cx="20" cy="4" r="1" fill="currentColor" stroke="none"/>'),
  hashi: svg('<circle cx="5" cy="7" r="2.3"/><circle cx="19" cy="7" r="2.3"/><circle cx="12" cy="18" r="2.3"/><path d="M7.3 6h9.4M7.3 8h9.4M6.7 8.5l4 7M17.3 8.5l-4 7"/>'),
  colourlogic: svg('<rect x="3" y="3" width="8" height="8" rx="1.3" fill="currentColor" stroke="none" opacity=".9"/><rect x="13" y="3" width="8" height="8" rx="1.3" fill="currentColor" stroke="none" opacity=".55"/><rect x="3" y="13" width="8" height="8" rx="1.3" fill="currentColor" stroke="none" opacity=".3"/><rect x="13" y="13" width="8" height="8" rx="1.3"/><path d="M15.5 17l1.7 1.7 3-3"/>'),
  shikaku: svg('<rect x="3" y="3" width="18" height="18" rx="1.5"/><path d="M10 3v9H3M10 12h11M15 12v9"/><circle cx="6.5" cy="7.5" r="1.2" fill="currentColor" stroke="none"/><circle cx="15.5" cy="7.5" r="1.2" fill="currentColor" stroke="none"/><circle cx="8.5" cy="16.5" r="1.2" fill="currentColor" stroke="none"/><circle cx="18" cy="16.5" r="1.2" fill="currentColor" stroke="none"/>'),
  perimeterregions: svg('<rect x="3" y="3" width="18" height="18" rx="1.5"/><path d="M9 3v18M15 3v18M3 9h18M3 15h18"/><path d="M3 3h12v6h6v12H9v-6H3z" stroke-width="2.7"/>'),
  wordsearch: svg('<rect x="3" y="3" width="13" height="13" rx="1.5"/><path d="M7.3 3v13M11.7 3v13M3 7.3h13M3 11.7h13"/><path d="M5 10l1.3-4 1.3 4M5.4 8.7h1.8"/><circle cx="16.8" cy="16.8" r="3.1"/><path d="M19.1 19.1L22 22"/>'),
  crossword: svg('<rect x="3" y="3" width="18" height="18" rx="1.5"/><path d="M7.5 3v18M12 3v18M16.5 3v18M3 7.5h18M3 12h18M3 16.5h18"/><rect x="3" y="3" width="4.5" height="4.5" fill="currentColor" stroke="none"/><rect x="12" y="7.5" width="4.5" height="4.5" fill="currentColor" stroke="none"/><rect x="7.5" y="16.5" width="4.5" height="4.5" fill="currentColor" stroke="none"/>')
};

function render(id){return ICONS[id]||svg('<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M8 12h8M12 8v8"/>');}
function has(id){return Object.prototype.hasOwnProperty.call(ICONS,id);}
function ids(){return Object.keys(ICONS);}

global.TT99GameIcons=Object.freeze({version:'1.0',render,has,ids});
})(typeof globalThis!=='undefined'?globalThis:this);
