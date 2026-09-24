/* 99 Club Studio · Online Play instruction cleanup v1.54.3
 * One concise, complete first-sight rule block above the board for every
 * playable game. Avoids duplicated helper paragraphs while keeping genuinely
 * puzzle-specific live rules such as Word/Number Search directions.
 */
(function(global){
'use strict';
const Play=global.TT99GamesPlay;if(!Play?.adapters)return;

const COPY={
  wordsearch:'Find every maths word by dragging in one straight line from its first letter to its last. Letters may belong to more than one word; use the direction rule shown directly below.',
  crossword:'Solve the clues and fill the grid one letter per cell. Across goes left to right and Down top to bottom; crossings share a letter, and spaces or punctuation are not entered.',
  pyramid:'Each brick equals the sum of the two directly below it. Fill every blank; work backwards with subtraction when needed.',
  magic:'A magic square has the same total in every row, column and both main diagonals. Follow the task shown: complete it, check it, repair the wrong value or transform it.',
  arithmagon:'Each connection uses the two numbers at its ends and the + or × shown. Fill the missing values; use the inverse operation when working backwards.',
  magicshape:'Every marked line must have the same total. Follow the task shown: fill the blanks, decide whether it is magic or repair the wrong value; an intersection belongs to every line through it.',
  numbertrail:'Follow the trail in cell order and apply the shown rule at every step. If two rules are shown, alternate them in the same order throughout.',
  numberwheels:'Use the diagram rule shown: wheels reuse the centre rule on every spoke; factor-web pairs multiply to the centre; diamond side numbers multiply for the top and add for the bottom.',
  maze:'Solve the questions in order. From your current square move only up, down, left or right to the adjacent square containing that answer, then continue until FINISH.',
  propertymaze:'Move from START to FINISH only up, down, left or right through numbers matching the stated property. Matching squares may include deliberate dead ends.',
  crossnumber:'Solve each clue and enter only digits — no units or operation signs. Across runs left to right and Down top to bottom; crossings share a digit, and digits may repeat in different cells.',
  numbersearch:'Calculate each listed answer, then drag across its digits in one continuous straight line. Target answers do not overlap; use the direction rule shown directly below.',
  equationcrossgrid:'Fill missing numbers and operation signs so every horizontal and vertical equation is true. Shared cells belong to both equations; values and operation signs may be reused.',
  target:'Make each target exactly. Use each supplied number tile at most once (duplicate tiles are separate), but allowed operation signs may be reused. Brackets are available and normal operation order applies.',
  brokencalc:'Make each target using only the working calculator keys. Any working digit or operation key may be pressed more than once; normal operation order applies.',
  operationgrid:'Tap an operator box to cycle through the allowed signs. Make every equation true; signs may be reused. Follow brackets and normal operation order, then use the operator key to crack the final code.',
  kakuro:'Fill each white square with 1–9. Every across/down run must add to its clue and cannot repeat a digit within that run; the same digit may appear in a different run.',
  arithmeticcages:'Use the numbers 1 up to the grid size exactly once in every row and column. Each cage must make its target; for two-cell − or ÷, either order is allowed. Cages have no extra no-repeat rule.',
  sumplete:'Cross out numbers so the numbers left make every row and column target. A crossed-out number counts in neither its row nor its column; tap again to restore it.',
  symbols:'Use the linked clues to find each symbol value. The same symbol always has the same value and different symbols represent different letter values; convert 1=A, 2=B, … 26=Z to reveal the word.',
  functionmachine:'Apply the machine stages in printed order from Input to Output. If the input is missing, undo the stages in reverse order using inverse operations.',
  balance:'Make both sides of each equation equal. A solved balance unlocks its common value as a weight; on the final scale, use every collected weight exactly once and make the two pan totals equal.',
  alphametics:'Replace each letter with one digit so the addition is correct. The same letter keeps its digit, different letters use different digits, and no word may start with 0.',
  sudoku:'Use each number once in every row and column, and in Sudoku once in every outlined box. The rule is per row, column and box — a number may appear again elsewhere in the grid.',
  futoshiki:'Use each number once in every row and column. Obey every inequality sign: the pointed/narrow end faces the smaller number.',
  nonogram:'Use the row and column clues to shade the picture. Each number is one consecutive block; separate multiple blocks by at least one empty cell and keep them in clue order. Tap a cell to cycle shaded → × → blank.',
  numberpath:'Use every number in the sequence exactly once. Consecutive numbers touch by a side, never diagonally, and printed numbers are fixed. The next missing number is shown; tap a blank square to place it.',
  numbertowers:'Use each height once in every row and column. Each edge clue tells how many towers are visible looking into that row or column from that side.',
  takuzu:'Fill the grid with 0s and 1s. Every row and column needs equal numbers of each, no 000 or 111 may appear horizontally or vertically, and no two completed rows or columns may match. Tap a blank to cycle 0 → 1 → blank.',
  killersudoku:'Use normal Sudoku rules. Each dashed cage must also add to its target, and a digit cannot repeat inside a cage.',
  hashi:'Connect every island into one network using horizontal or vertical bridges. Match each island number, use at most two bridges between a pair, and never cross or pass through another island. Tap a bridge space to cycle one → two → none.',
  mathsmines:'Find exactly the stated number of gems. Each clue counts gems in its eight surrounding squares, including diagonals; clue squares cannot contain gems. Tap an empty square to cycle gem → safe × → blank.',
  shikaku:'Divide the whole grid into non-overlapping rectangles. Every rectangle must contain exactly one clue, and that clue equals the rectangle area in squares.',
  cornersum:'Place the digits 1–9 exactly once. Each circle is the sum of the four cells in its overlapping 2 × 2 window; any starter digits are fixed.',
  linkedsum:'Place the digits 1–9 exactly once. Match every overlapping 2 × 2 circle total and every A/B/C group total at the same time; starter digits are fixed.',
  colourlogic:'Tap a box to cycle colours and make every clue true. In a row puzzle use each listed colour exactly once; in a grid puzzle colours may repeat unless a rule limits them. Obey all count, position and neighbour rules.',
  mobilebalance:'Every horizontal bar is an equal-arm balance. Repeated shapes have the same value, and a lower branch counts as its whole combined weight on the bar above.',
  diagonalpath:'Use every number from 1 to the final number exactly once. Consecutive numbers may touch by a side or corner; printed anchors are fixed. The next missing number is shown; tap a blank square to place it.',
  squaresearch:'Find every non-overlapping 2 × 2 block whose four numbers total the target. Correct blocks never share a cell; tap a 2 × 2 block to select or clear it.',
  insertops:'Keep the printed numbers in order and put one allowed operation sign in every gap. Allowed signs may be reused; normal operation order applies and brackets are not used.',
  perimeterregions:'Divide every cell into one region. Each region has exactly one clue, equal to its outside perimeter in unit grid edges — not its area. Tap or drag on internal grid lines to draw boundaries.'
};

for(const [id,text] of Object.entries(COPY)){
  const a=Play.adapters.get(id);if(!a)continue;
  a.instruction=text;
}

let panel=null,liveRule=null,scheduled=false;
function arrange(){
  const card=document.querySelector('.tt99-play-board-card'),head=card?.querySelector('.tt99-play-board-head'),instruction=document.getElementById('tt99-play-instruction');
  if(!card||!head||!instruction)return;
  if(!panel||!panel.isConnected){
    panel=document.createElement('div');panel.className='tt99-play-top-instructions tt99-play-top-instructions-v154';
    liveRule=document.createElement('p');liveRule.className='tt99-play-live-rule';liveRule.hidden=true;
    head.insertAdjacentElement('afterend',panel);
  }
  if(instruction.parentElement!==panel)panel.appendChild(instruction);
  if(liveRule&&liveRule.parentElement!==panel)panel.appendChild(liveRule);
  instruction.classList.add('is-top');

  // One rule block is enough; the older sidebar paragraph repeats it.
  const how=document.querySelector('.tt99-play-how');if(how&&!how.hidden)how.hidden=true;

  // Search directions depend on the generated puzzle/settings, so mirror that
  // genuinely live rule at the top before hiding the old under-board note.
  const board=document.getElementById('tt99-play-board');
  const isSearchBoard=board?.matches?.('.tt99-play-wordsearch, .tt99-play-numbersearch');
  const directionTip=isSearchBoard?board.querySelector('.tt99-play-board-tip'):null;
  const text=directionTip?.textContent?.trim()||'';
  if(liveRule){
    if(text){if(liveRule.textContent!==text)liveRule.textContent=text;if(liveRule.hidden)liveRule.hidden=false;}
    else{if(liveRule.textContent)liveRule.textContent='';if(!liveRule.hidden)liveRule.hidden=true;}
  }

  // The reviewed top instruction is now the single source for static first-use
  // rules. Search direction notes are deliberately kept in the board DOM as a
  // hidden live source; removing them caused the next MutationObserver pass to
  // clear the mirrored direction rule above the board.
  const duplicateSelectors=[
    '.tt99-sumplete-wrap .tt99-play-board-tip',
    '.tt99-play-nonogram + .tt99-cycle-note',
    '.tt99-nonogram-scroll + .tt99-cycle-note',
    '.tt99-play-mines .tt99-cycle-note',
    '.tt99-play-hashi .tt99-hashi-note',
    '.tt99-play-numberpath .tt99-cycle-note',
    '.tt99-pyramid-board + .tt99-cycle-note',
    '.tt99-play-brokencalc .tt99-arith-note',
    '.tt99-play-target .tt99-arith-note',
    '.tt99-play-propertymaze .tt99-propertymaze-tip',
    '.tt99-play-answermaze .tt99-answermaze-tip',
    '.tt99-play-sumgrid .tt99-play-board-tip',
    '.tt99-play-operationgrid .tt99-opgrid-cycle',
    '.tt99-play-operationgrid .tt99-opgrid-rule',
    '.tt99-play-colourlogic .tt99-cl-tap',
    '.tt99-extra-path-grid + .tt99-arith-note',
    '.tt99-extra-op-equation.online ~ .tt99-arith-note',
    '.tt99-extra-perimeter-grid.online + .tt99-arith-note'
  ];
  duplicateSelectors.forEach(sel=>board?.querySelectorAll(sel).forEach(el=>el.remove()));
}
function scheduleArrange(){
  if(scheduled)return;scheduled=true;
  const run=()=>{scheduled=false;arrange();};
  if(typeof requestAnimationFrame==='function')requestAnimationFrame(run);else setTimeout(run,0);
}
function boot(){
  arrange();
  const root=document.getElementById('tt99-play-root');
  // Mutations inside arrange() can themselves be observed. Scheduling once per
  // frame prevents observer cascades and keeps this layer cheap even on phones.
  if(root&&window.MutationObserver)new MutationObserver(scheduleArrange).observe(root,{childList:true,subtree:true});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})(typeof globalThis!=='undefined'?globalThis:this);
