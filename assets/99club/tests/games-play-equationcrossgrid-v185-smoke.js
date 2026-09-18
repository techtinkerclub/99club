'use strict';
const assert=require('assert');
let captured=null;
global.TT99GamesPlay={adapters:new Map([['equationcrossgrid',{mount(_root,p){captured=p;return {ok:true};}}]])};
require('../games-play-equationcrossgrid-v185.js');
const adapter=global.TT99GamesPlay.adapters.get('equationcrossgrid');
assert.equal(adapter.__v185BlocksFixed,true,'hotfix should mark adapter as patched');
adapter.mount({}, {
  solutionGrid:[['#',10,'+',71,'='],['#','#','#','-',7]],
  displayGrid:[['#',10,'+',71,'='],['#','#',null,'-',7]]
}, {});
assert.ok(captured,'patched mount should delegate to original mount');
assert.strictEqual(captured.solutionGrid[0][0],null,'unused solution cells must become null blocks');
assert.strictEqual(captured.solutionGrid[0][1],10,'real numbers must be preserved');
assert.strictEqual(captured.solutionGrid[0][2],'+','operators must be preserved');
assert.strictEqual(captured.displayGrid[1][1],null,'unused display cells must become null blocks');
assert.strictEqual(captured.displayGrid[1][2],null,'real hidden blanks must remain null');
console.log('Equation Crossgrid v1.85 block rendering smoke test passed');
