'use strict';
const root=document.getElementById('tt99-goodies-root');
const CATS={number:'Number',fractions:'Fractions',operations:'Operations',measure:'Measure',geometry:'Geometry',random:'Classroom',canvas:'Canvas'};
function q(s,ctx=root){return ctx.querySelector(s)}function qa(s,ctx=root){return [...ctx.querySelectorAll(s)]}
function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function clamp(v,a,b){return Math.max(a,Math.min(b,v))}function num(v,d=0){const n=Number(v);return Number.isFinite(n)?n:d}
function gcd(a,b){a=Math.abs(Math.round(a));b=Math.abs(Math.round(b));while(b){[a,b]=[b,a%b]}return a||1}
function money(p){return p>=100?'£'+(p/100).toFixed(p%100?2:0):(p+'p')}
function field(label,input,help=''){return `<label class="gd-field"><span>${label}</span>${input}${help?`<small class="gd-help">${help}</small>`:''}</label>`}
function btn(text,id,primary=false){return `<button class="gd-btn${primary?' gd-btn--primary':''}" id="${id}" type="button">${text}</button>`}
function setPanels(controls,stage){q('#gd-controls').innerHTML=controls;q('#gd-stage').innerHTML=stage}
