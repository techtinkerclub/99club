/* 99 Club Studio · shared pupil-instruction review layer
 * v1.39.4 — concise first-sight rules for every public game.
 * Keep each instruction self-contained enough for a pupil seeing the puzzle
 * for the first time, while leaving live/generated details beside the board.
 */
(function(global){
'use strict';
const G=global.TT99Games;if(!G||G.__instructionsV139)return;
const basePack=G.generatePack.bind(G),baseActivity=G.generateActivity.bind(G);

function compact(s){return String(s||'').replace(/\s+/g,' ').trim();}
function markerSuffix(a){
  const ms=String(a?.instruction||'').match(/\[\[[^\]]+\]\]/g)||[];
  return ms.length?' '+ms.join(' '):'';
}
function visibleOriginal(a){return compact(String(a?.instruction||'').replace(/\s*\[\[[^\]]+\]\]/g,''));}

function instruction(a){
  if(!a||a.error)return '';
  const n=Number(a.size)||0;
  switch(a.engineId){
    case'wordsearch':
      return 'Use the clue list to find every maths word. Each word stays in one straight line and follows the directions listed below; letters may be shared by different words.';
    case'crossword':
      return 'Solve the clues. Across goes left to right and Down top to bottom; write one letter per cell. Crossings share a letter. Ignore spaces and punctuation.';
    case'pyramid':
      return 'Each brick equals the sum of the two bricks directly below it. Fill every blank; use subtraction to work backwards when needed.';
    case'magic':
      if(a.puzzleType==='check')return 'Check every row, column and both main diagonals. Decide whether they all have the same total and show enough working to prove it.';
      if(a.puzzleType==='repair')return 'One value is wrong. Replace it so every row, column and both main diagonals have the same total.';
      if(a.puzzleType==='transform')return 'Apply the shown transformation, complete the new square so every row, column and both main diagonals have the same total, then find that total.';
      return 'Fill the blanks so every row, column and both main diagonals have the same total.';
    case'sudoku':
      return a.style==='latin'
        ?`Fill the grid with 1–${n}. Use each number once in every row and column; numbers may repeat elsewhere in the grid.`
        :`Fill the grid with 1–${n}. Use each number once in every row, column and outlined box; numbers may repeat elsewhere when those rules allow.`;
    case'arithmagon':
      return 'Each connection uses the two numbers at its ends and the + or × shown. Fill the blanks; use the inverse operation when working backwards.';
    case'magicshape':
      if(a.puzzleType==='check')return 'Check every marked line. Decide whether all line totals are equal and show enough addition to prove it.';
      if(a.puzzleType==='repair')return 'One value is wrong. Replace it so every marked line has the same total.';
      return `Every marked line must total ${G.formatNumber?.(a.target)??a.target}. Fill the blanks; a number at an intersection belongs to every line through it.`;
    case'numbertrail':
      return 'Follow the cells in trail order. Apply the shown rule at each step; if two rules are shown, alternate them in order. Fill every blank.';
    case'numberwheels':
      if(a.style==='factor')return 'Each spoke is one factor pair: the two box values multiply to the centre. Complete every missing box or centre value; values may repeat when the maths requires it.';
      if(a.style==='diamond')return 'The side numbers multiply to make the top and add to make the bottom. Fill every blank; if both side numbers are blank, either order is valid.';
      return 'Apply the centre rule separately to each input/output pair. Fill every blank; the same rule is reused on every spoke.';
    case'maze':
      return 'Solve question 1, then move only up, down, left or right to the adjacent square showing its answer. Continue with the next question until FINISH.';
    case'propertymaze':
      return 'Move from START to FINISH only up, down, left or right through numbers that match the stated rule. Matching squares may include dead ends.';
    case'crossnumber':
      return 'Solve each clue. Across goes left to right and Down top to bottom; write one digit per cell. Crossings share a digit, and digits may repeat in different cells.';
    case'numbersearch':
      return 'Calculate each answer, then find its digits in one continuous straight line. Use the directions listed below; target answers do not overlap.';
    case'equationcrossgrid':
      return 'Fill missing numbers and operation signs so every horizontal and vertical equation is true. Shared cells belong to both equations; values and signs may be reused.';
    case'target':
      return 'Make each target exactly. Use each supplied number tile at most once (duplicate tiles count separately); allowed operation signs may be reused. Brackets are allowed and normal operation order applies.';
    case'brokencalc':
      return 'Make each target using only the working calculator keys. Any working digit or operation key may be reused. Use normal operation order: × and ÷ before + and −.';
    case'operationgrid':
      return 'Choose an allowed operation sign for every box so each equation is true; signs may be reused. Follow brackets and normal operation order, then use the operator key to crack the code.';
    case'kakuro':
      return 'Fill white cells with 1–9. Each across/down run must add to its clue and cannot repeat a digit within that run; the same digit may appear in a different run.';
    case'arithmeticcages':
      return `Fill the grid with 1–${n}, using each number once in every row and column. Each cage must make its target; for two-cell − or ÷, either order is allowed. Cages have no extra no-repeat rule.`;
    case'sumplete':
      return 'Cross out numbers so the numbers left make every row and column target. A crossed-out number counts in neither its row nor its column.';
    case'symbols':
      return 'Use the linked clues to find each symbol value. The same symbol always has the same value; different symbols represent different letter values. Convert 1=A, 2=B, … 26=Z to reveal the word.';
    case'functionmachine':
      return 'Apply the machine stages in the printed order from Input to Output. If an input is missing, undo the stages in reverse order using inverse operations.';
    case'balance':
      return 'Balance each equation to collect its weight. On the final scale, use every collected weight exactly once and make the two pan totals equal.';
    case'futoshiki':
      return `Fill the grid with 1–${n}. Use each number once in every row and column. The pointed/narrow end of each inequality sign faces the smaller number.`;
    case'nonogram':
      return 'Shade cells to match each row and column clue. Every number is one consecutive shaded block; separate multiple blocks by at least one blank cell and keep them in clue order.';
    case'numberpath':
      return `Use every number from 1 to ${n*n} exactly once. Consecutive numbers must touch by a side — up, down, left or right — never diagonally.`;
    case'numbertowers':
      return `Fill the grid with 1–${n}, using each height once in every row and column. Each edge clue is the number of towers visible when looking into that row or column from that side.`;
    case'takuzu':
      return 'Fill every cell with 0 or 1. Each row and column has equal numbers of each; never make 000 or 111 horizontally or vertically, and no two completed rows or columns may match.';
    case'killersudoku':
      return `Use 1–${n} once in every row, column and outlined box. Each cage must add to its target, and a digit cannot repeat inside a cage.`;
    case'hashi':
      return 'Join every island into one connected network using horizontal or vertical bridges. Match each island number, use at most two bridges between a pair, and never cross bridges or pass through another island.';
    case'mathsmines':
      return `Find exactly ${a.gemCount||''} hidden gems. Each clue counts gems in the eight surrounding squares, including diagonals; clue squares themselves cannot contain gems.`;
    case'alphametics':
      return 'Replace each letter with one digit so the addition is correct. The same letter keeps its digit, different letters use different digits, and no word may start with 0.';
    case'shikaku':
      return 'Divide the whole grid into non-overlapping rectangles. Every rectangle must contain exactly one clue, and that clue equals the rectangle area in squares.';
    case'cornersum':
      return 'Place the digits 1–9 exactly once. Each corner target is the sum of the four cells in its overlapping 2 × 2 window; starter digits are fixed.';
    case'linkedsum':
      return 'Place the digits 1–9 exactly once. Match every overlapping 2 × 2 target and every A/B/C group total at the same time; starter digits are fixed.';
    case'colourlogic':
      return a.variant==='row'
        ?'Place each listed colour exactly once in the row. Every position, order and neighbour clue must be true at the same time.'
        :'Fill every box with one of the shown colours. Colours may repeat unless a rule limits them; all row, column, position, count and neighbour rules must be true together.';
    case'mobilebalance':
      return `Every horizontal bar is an equal-arm balance. Repeated shapes have the same value, and a lower branch counts as its whole combined weight above. ${a.topTotal!=null?'The top circle is the total weight of the whole mobile.':''}`;
    case'diagonalpath':
      return `Use every number from 1 to ${n*n} exactly once. Consecutive numbers may touch by a side or a corner; printed numbers are fixed.`;
    case'squaresearch':
      return `Find all ${a.matches?.length||''} non-overlapping 2 × 2 squares that make the target shown. Add all four numbers in each square; answer squares never share a cell.`;
    case'insertops':
      return 'Keep the printed numbers in order and put one allowed operation sign in each gap so the equation is true. Allowed signs may be reused; use normal operation order and no brackets.';
    case'perimeterregions':
      return 'Divide every cell into one region. Each region contains exactly one clue, and that clue is its outside perimeter measured in unit grid edges — not its area.';
    case'domino':
      return 'Start at START. Solve the calculation on each domino and match its answer to the left side of the next domino; continue until END.';
    default:
      return visibleOriginal(a);
  }
}
function reviewed(a){return compact(instruction(a))+markerSuffix(a);}
function apply(a){if(a&&!a.error)a.instruction=reviewed(a);return a;}
function applyPack(p){for(const s of p?.sheets||[])for(const a of s.activities||[])apply(a);return p;}
G.generateActivity=function(...args){return apply(baseActivity(...args));};
G.generatePack=function(...args){return applyPack(basePack(...args));};
G.reviewedInstruction=reviewed;
G.__instructionsV139=true;
})(typeof globalThis!=='undefined'?globalThis:this);
