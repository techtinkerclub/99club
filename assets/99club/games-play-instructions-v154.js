/* 99 Club Studio · Online Play instruction cleanup v1.54.1
 * One concise instruction block above the board for every playable game.
 * Removes duplicated under-board helper copy while preserving genuinely
 * puzzle-specific live information (currently Word Search directions).
 */
(function(global){
'use strict';
const Play=global.TT99GamesPlay;if(!Play?.adapters)return;

const COPY={
  shikaku:'Drag out rectangles so each one contains exactly one clue and covers that many squares. Cover the whole grid without overlaps.',
  sumplete:'Cross out numbers you do not need so the numbers left in every row and column match the targets. Tap a number to cross it out; tap it again to restore it.',
  nonogram:'Use the row and column clues to reveal the picture. Each clue gives the lengths of shaded blocks, with at least one empty square between separate blocks. Tap a cell to cycle shaded → × → blank.',
  mathsmines:'Each clue counts the gems in its eight surrounding squares. Tap an empty square to cycle Gem ◆ → Safe × → blank; the clue colours update as you work.',
  takuzu:'Fill the grid with 0s and 1s. Every row and column needs equal numbers of each, no three identical digits may touch, and no two completed rows or columns may be the same. Tap a blank to cycle 0 → 1 → blank.',
  sudoku:'Place each number once in every row and column; Sudoku also requires each outlined box to contain every number once. Select a blank, then choose a number from the keypad.',
  futoshiki:'Use each number once in every row and column, and obey every inequality sign — the point faces the smaller number. Select a blank, then use the keypad.',
  killersudoku:'Use normal Sudoku rules, and make the digits in each dashed cage add to its target without repeating a digit inside that cage. Select a blank, then use the keypad.',
  kakuro:'Fill each white square with 1–9. Every across or down run must add to its clue, and a digit cannot repeat within one run. Select a white square, then use the keypad.',
  arithmeticcages:'Fill the grid with 1–N, using each number once in every row and column. Each outlined cage must make its target using the operation shown.',
  alphametics:'Replace each letter with a digit so the written addition is correct. The same letter keeps the same digit, different letters use different digits, and a word cannot start with 0.',
  cornersum:'Place the digits 1–9 exactly once. Each circle is the total of the four cells around it; use the overlapping sums to work out the missing digits.',
  linkedsum:'Place the digits 1–9 exactly once. Each circle totals its four surrounding cells, and the A/B/C coloured groups must also match their totals.',
  hashi:'Connect every island into one network. An island’s number is the total number of bridge lines touching it; bridges never cross and a pair can have at most two. Tap a bridge space to cycle one line → two → none.',
  numberpath:'Fill the grid with consecutive numbers so each number touches the one before and after by a side, not a corner. The next missing number is shown above the grid; tap a blank square to place it.',
  wordsearch:'Find every maths word by dragging from its first letter to its last. Challenge puzzles may give definitions instead of the words.',
  brokencalc:'Make each target using only the calculator keys that still work. Working keys may be reused; faded broken keys cannot be pressed.',
  target:'Combine the supplied number tiles with the allowed operations to make each target exactly. Use each tile at most once; brackets are available when you need to change the normal order of operations.',
  operationgrid:'Fill the operator boxes so every equation is true, following brackets and the normal order of operations. Translate the solved signs into the number code, then use that key to crack the secret word.'
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

  // One instruction block is enough; the older sidebar paragraph duplicates it.
  const how=document.querySelector('.tt99-play-how');if(how&&!how.hidden)how.hidden=true;

  // Word Search has a genuinely puzzle-specific direction rule. Mirror it at
  // the top, then CSS hides the old copy under the board with the other notes.
  const board=document.getElementById('tt99-play-board');
  const directionTip=board?.querySelector('.tt99-play-wordsearch .tt99-play-board-tip');
  const text=directionTip?.textContent?.trim()||'';
  if(liveRule){
    if(text){if(liveRule.textContent!==text)liveRule.textContent=text;if(liveRule.hidden)liveRule.hidden=false;}
    else{if(liveRule.textContent)liveRule.textContent='';if(!liveRule.hidden)liveRule.hidden=true;}
  }
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
