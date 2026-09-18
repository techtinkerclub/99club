/* Regression guard: both source pages currently declare the same custom permalink.
 * They must therefore load the same current Custom Worksheet asset stack,
 * including the graphical Angles module, or GitHub Pages/Jekyll can emit a stale page.
 */
const fs=require('fs'),path=require('path');
const ROOT=path.resolve(__dirname,'../../..');
function assert(ok,msg){if(!ok)throw new Error(msg);}
const a=fs.readFileSync(path.join(ROOT,'_pages/99-club-custom.md'),'utf8');
const b=fs.readFileSync(path.join(ROOT,'99-club-custom.md'),'utf8');
assert(a===b,'Duplicate /tools/99-club/custom/ source pages have drifted');
for(const file of ['custom-graphs.js','custom-coordinates.js','custom-piecharts.js','custom-angles.js','custom-app.js']){
  assert(a.includes(`/assets/99club/${file}`),`Custom page does not load ${file}`);
}
assert(/custom-angles\.js\?v=8/.test(a),'Angles asset cache version is not v8');
assert(/custom-app\.js\?v=227/.test(a),'Custom app cache version is not v227');
console.log('Custom entrypoint smoke: PASS');
