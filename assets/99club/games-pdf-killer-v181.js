/* 99 Club Studio · Killer / Sum Sudoku PDF cage polish v1.82
 * The v1.40 renderer already knows the cage geometry. This wrapper only changes
 * the emitted cage-stroke commands from teal dashed to a printable neutral solid line.
 * PDF-only refinement: slightly darker/thicker than the browser preview so cage
 * boundaries survive ordinary school laser printing and photocopying.
 */
(function(global){
'use strict';
const PDF=global.TT99GamesPDF;
if(!PDF?.buildDocument)return;
const previous=PDF.buildDocument;
const OLD='0.09 0.52 0.48 RG 1.05 w [2 1.5] 0 d';
const NEW='0.45 0.50 0.51 RG 0.82 w [] 0 d';
PDF.buildDocument=function(opts={}){
  const doc=previous(opts);
  for(const page of doc?.pages||[]){
    if(!Array.isArray(page?.cmds))continue;
    page.cmds=page.cmds.map(cmd=>typeof cmd==='string'?cmd.split(OLD).join(NEW):cmd);
  }
  return doc;
};
})(typeof window!=='undefined'?window:globalThis);
