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
assert(src.includes("fs=Math.max(6.6,Math.min(8.4,rowH*.43))"),'crossnumber clue sizing regressed');
assert(src.includes("fs=Math.max(6.8,Math.min(8.2,rowH*.48))"),'number-search question sizing regressed');
assert(src.includes("clean(`INPUT -> ${rule} -> OUTPUT`),9.6"),'function-machine rule sizing regressed');
assert(src.includes("'Input',8.8")&&src.includes("'Output',8.8"),'function-machine table label sizing regressed');

console.log('Games v1.31.4 printable text readability regression: PASS');
