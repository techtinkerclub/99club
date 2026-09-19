'use strict';
const assert=require('assert');
const fs=require('fs');
const path=require('path');
const src=fs.readFileSync(path.resolve(__dirname,'../games-pdf.js'),'utf8');

assert(src.includes('function readableProseSize('),'global readable prose sizing helper missing');
assert(src.includes("if(original<5.5)return 7.6"),'very small prose is no longer promoted');
assert(src.includes("if(original<6.5)return 8.0"),'small prose is no longer promoted');
assert(src.includes("if(original<7.5)return 8.4"),'ordinary instructions are no longer promoted');
assert(src.includes("let fs=h<220?7.2:h<360?8.0:8.6"),'word-search definition sizing regressed');
assert(src.includes("let fs=h<220?7.2:h<360?8.0:8.8"),'crossword clue sizing regressed');
assert(src.includes("qfs=Math.max(7.0,Math.min(8.5,qh*.42))"),'maze question sizing regressed');
assert(src.includes("leftMax=w*.54,gap=10"),'crossnumber grid/clue width split regressed');
assert(src.includes("cell=Math.min((leftMax-2)/cols,bodyH/rows,32)"),'crossnumber grid scale regressed');
assert(src.includes("Math.max(3.8,Math.min(4.8,cell*.17))"),'crossnumber clue-number sizing regressed');
assert(src.includes("fs=Math.max(7.2,Math.min(9.0,rowH*.40))"),'crossnumber clue sizing regressed');
assert(src.includes("leftW=Math.min(w*.60,bodyH),gap=10"),'number-search width split regressed');
assert(src.includes("cell=Math.min((leftW-2)/size,bodyH/size,30)"),'number-search grid scale regressed');
assert(src.includes("fs=Math.max(7.6,Math.min(9.2,rowH*.44))"),'number-search question sizing regressed');
assert(src.includes("clean(`INPUT -> ${rule} -> OUTPUT`),9.6"),'function-machine rule sizing regressed');
assert(src.includes("'Input',8.8")&&src.includes("'Output',8.8"),'function-machine table label sizing regressed');

console.log('Games v1.31.7 printable text readability regression: PASS');
