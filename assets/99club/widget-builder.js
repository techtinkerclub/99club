(function(){
'use strict';
const root=document.getElementById('tt99-widget-builder'),W=window.TT99SchoolWidget;
if(!root||!W)return;
const STORE='tt99-widget-builder-v1',HANDOFF='tt99-widget-handoff-v1';
const clubNames={11:'11 Club',22:'22 Club',33:'33 Club',44:'44 Club',55:'55 Club',66:'66 Club',77:'77 Club',88:'88 Club',99:'99 Club',bronze:'Bronze',silver:'Silver',gold:'Gold',platinum:'Platinum',diamond:'Diamond'};
let draft=loadDraft(),status='';

function clone(v){return JSON.parse(JSON.stringify(v));}
function loadDraft(){try{return W.normalise(JSON.parse(localStorage.getItem(STORE)||'{}'));}catch(_){return W.normalise({selectedClubs:W.CLUB_IDS,games:[]});}}
function save(){draft=W.normalise(draft);try{localStorage.setItem(STORE,JSON.stringify(draft));}catch(_){}}
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function download(name,text,type='application/json'){const blob=new Blob([text],{type}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),800);}
function copy(text,msg){const fallback=()=>{const t=document.createElement('textarea');t.value=text;t.style.position='fixed';t.style.opacity='0';document.body.appendChild(t);t.select();const ok=document.execCommand('copy');t.remove();if(!ok)throw new Error('copy');};Promise.resolve(navigator.clipboard?.writeText?navigator.clipboard.writeText(text):fallback()).then(()=>{status=msg;render();}).catch(()=>{status='Could not copy automatically. Select the text below and copy it manually.';render();});}
function puzzleLabel(p){return p.minYear===p.maxYear?'Year '+p.minYear:'Years '+p.minYear+'–'+p.maxYear;}
function applyHandoff(){
 let raw='';try{raw=localStorage.getItem(HANDOFF)||'';localStorage.removeItem(HANDOFF);}catch(_){}
 if(!raw)return;
 try{
   const h=JSON.parse(raw);
   if(h.kind==='clubs'&&h.clubs){
     const imported=W.fromClubRules(h),selected=draft.selectedClubs?.length?draft.selectedClubs:W.CLUB_IDS;
     draft={...draft,schemeId:imported.schemeId,orientation:imported.orientation,clubPatches:imported.clubPatches,selectedClubs:selected};
     status='Current 99 Club rules imported. Choose which Club levels the widget should display.';
   }else if(h.kind==='puzzle'&&h.link){
     const next=W.normalise({...draft,puzzles:[...(draft.puzzles||[]),h]});
     draft=next;status='Current puzzle pack added to the widget.';
   }
   save();
 }catch(_){}
}
function importToken(text){
 const token=W.tokenFromText(text);if(!token)throw new Error('No TT99W1 widget configuration was found.');
 draft=W.decode(token);save();status='Existing widget configuration imported. This is an editable copy; the live school website has not changed.';render();
}
function render(){
 draft=W.normalise(draft);save();
 const core=W.CLUB_IDS.slice(0,9),advanced=W.CLUB_IDS.slice(9);
 const clubCheck=id=>'<label class="tt99-wb-check"><input type="checkbox" data-club="'+esc(id)+'" '+(draft.selectedClubs.includes(id)?'checked':'')+'><span>'+esc(clubNames[id]||id)+'</span></label>';
 const packs=draft.puzzles.length?draft.puzzles.map((p,i)=>'<div class="tt99-wb-pack"><div><strong>'+esc(puzzleLabel(p))+' puzzle pack</strong><small>'+p.gameCount+' selected game'+(p.gameCount===1?'':'s')+' · locked parent link</small></div><button class="tt99-wb-btn tt99-wb-danger" type="button" data-remove-pack="'+i+'">Remove</button></div>').join(''):'<div class="tt99-wb-empty">No printable puzzle packs in this widget yet. Configure a pack in Maths Games &amp; Puzzles, open its sharing window and choose <b>Add current pack to website widget</b>.</div>';
 const games=W.GAME_IDS.map(id=>'<label class="tt99-wb-check"><input type="checkbox" data-game="'+esc(id)+'" '+(draft.games.includes(id)?'checked':'')+'><span>'+esc(W.GAME_TITLES[id]||id)+'</span></label>').join('');
 let url='',embed='';try{url=W.buildUrl(draft,location.origin);embed=W.embedCode(draft,location.origin);}catch(err){status=err?.message||'The widget configuration is too large.';}
 root.innerHTML='<div class="tt99-wb-hero"><div><span class="tt99-wb-kicker">Optional school publishing route</span><h1>School Website Widget</h1><p>Build one compact, read-only practice panel for a school website. The existing cards, PNG images and website packs remain the standard alternative.</p></div><a class="tt99-wb-back" href="/">← 99 Club Studio</a></div>'+
 '<div class="tt99-wb-note"><strong>Nothing here publishes automatically.</strong> Changes only reach the school website after an authorised website editor replaces the existing embed code in the school CMS.</div>'+
 '<div class="tt99-wb-layout"><div>'+
 '<section class="tt99-wb-card"><div class="tt99-wb-headrow"><div><h2>1. 99 Club levels</h2></div><div class="tt99-wb-actions"><button class="tt99-wb-btn" id="wb-all-clubs">All</button><button class="tt99-wb-btn" id="wb-no-clubs">None</button></div></div><p>Visibility only. To change the maths rules themselves, use the normal 99 Club editor and reopen this builder from <b>Parent practice links</b>.</p><div class="tt99-wb-subhead">11–99</div><div class="tt99-wb-clubs">'+core.map(clubCheck).join('')+'</div><div class="tt99-wb-subhead">Post-99</div><div class="tt99-wb-clubs">'+advanced.map(clubCheck).join('')+'</div><div class="tt99-wb-actions" style="margin-top:12px"><a class="tt99-wb-linkbtn" href="/" target="_blank" rel="noopener">Edit Club rules in Studio</a></div></section>'+
 '<section class="tt99-wb-card"><h2>2. Printable puzzle packs</h2><p>Up to four locked packs. Personal-vocabulary packs are deliberately excluded from widget v1.</p>'+packs+'<div class="tt99-wb-actions" style="margin-top:12px"><a class="tt99-wb-linkbtn" href="/games/" target="_blank" rel="noopener">Open Maths Games &amp; Puzzles</a></div></section>'+
 '<section class="tt99-wb-card"><div class="tt99-wb-headrow"><div><h2>3. Online games</h2></div><div class="tt99-wb-actions"><button class="tt99-wb-btn" id="wb-no-games">Clear games</button></div></div><p>Select only the games you actually want parents to see. Maximum 24 keeps the widget useful rather than turning it into the whole Studio catalogue.</p><div class="tt99-wb-games">'+games+'</div></section>'+
 '<section class="tt99-wb-card"><h2>4. Widget behaviour</h2><p>The widget only shows tabs that contain something.</p><div class="tt99-wb-field"><label for="wb-default-tab">Default tab</label><select id="wb-default-tab"><option value="clubs" '+(draft.defaultTab==='clubs'?'selected':'')+'>99 Club</option><option value="puzzles" '+(draft.defaultTab==='puzzles'?'selected':'')+'>Printable puzzles</option><option value="games" '+(draft.defaultTab==='games'?'selected':'')+'>Play online</option></select></div></section>'+
 '<section class="tt99-wb-card"><h2>Import / handover</h2><p>Anyone can reconstruct a public widget configuration, but only someone with access to the school CMS can replace the live embed.</p><div class="tt99-wb-field"><label for="wb-import-text">Existing widget URL or embed code</label><textarea id="wb-import-text" placeholder="Paste an existing https://99studio.uk/widget/#w=... URL or iframe code"></textarea></div><div class="tt99-wb-actions" style="margin-top:9px"><button class="tt99-wb-btn" id="wb-import">Recreate from existing widget</button><button class="tt99-wb-btn" id="wb-save-json">Save widget setup</button><label class="tt99-wb-linkbtn">Restore widget setup<input class="tt99-wb-hidden-file" id="wb-restore-json" type="file" accept=".json,application/json"></label></div></section>'+
 '</div><aside class="tt99-wb-preview"><h2>Parent preview</h2><div class="tt99-wb-preview-wrap"><iframe id="wb-preview-frame" src="'+esc(url)+'" title="School maths widget preview" sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"></iframe></div>'+
 '<section class="tt99-wb-card tt99-wb-publish"><h2>Use on the school website</h2><p>Copy one embed into Juniper or another CMS. Updating later means generating a new embed here and replacing the old one in the CMS.</p><div class="tt99-wb-actions"><button class="tt99-wb-btn primary" id="wb-copy-embed">Copy embed code</button><button class="tt99-wb-btn" id="wb-copy-url">Copy widget URL</button></div><div class="tt99-wb-field" style="margin-top:10px"><label for="wb-code">Generated embed</label><textarea id="wb-code" class="tt99-wb-code" readonly>'+esc(embed)+'</textarea></div>'+(status?'<div class="tt99-wb-status" role="status">'+esc(status)+'</div>':'')+'</section></aside></div>';
 bind();
}
function bind(){
 root.querySelectorAll('[data-club]').forEach(el=>el.addEventListener('change',()=>{const set=new Set(draft.selectedClubs);el.checked?set.add(el.dataset.club):set.delete(el.dataset.club);draft.selectedClubs=W.CLUB_IDS.filter(id=>set.has(id));status='';render();}));
 root.querySelectorAll('[data-game]').forEach(el=>el.addEventListener('change',()=>{let ids=new Set(draft.games);if(el.checked&&ids.size>=24){el.checked=false;status='Widget v1 is limited to 24 online games. Remove one before adding another.';render();return;}el.checked?ids.add(el.dataset.game):ids.delete(el.dataset.game);draft.games=W.GAME_IDS.filter(id=>ids.has(id));status='';render();}));
 root.querySelectorAll('[data-remove-pack]').forEach(btn=>btn.addEventListener('click',()=>{draft.puzzles.splice(Number(btn.dataset.removePack),1);status='Puzzle pack removed from this widget draft.';render();}));
 root.querySelector('#wb-all-clubs')?.addEventListener('click',()=>{draft.selectedClubs=[...W.CLUB_IDS];status='';render();});
 root.querySelector('#wb-no-clubs')?.addEventListener('click',()=>{draft.selectedClubs=[];status='';render();});
 root.querySelector('#wb-no-games')?.addEventListener('click',()=>{draft.games=[];status='';render();});
 root.querySelector('#wb-default-tab')?.addEventListener('change',e=>{draft.defaultTab=e.target.value;status='';render();});
 root.querySelector('#wb-copy-embed')?.addEventListener('click',()=>copy(W.embedCode(draft,location.origin),'Embed code copied. Paste it into the school website CMS.'));
 root.querySelector('#wb-copy-url')?.addEventListener('click',()=>copy(W.buildUrl(draft,location.origin),'Widget URL copied.'));
 root.querySelector('#wb-code')?.addEventListener('click',e=>e.currentTarget.select());
 root.querySelector('#wb-import')?.addEventListener('click',()=>{try{importToken(root.querySelector('#wb-import-text')?.value||'');}catch(err){status=err?.message||'That widget could not be imported.';render();}});
 root.querySelector('#wb-save-json')?.addEventListener('click',()=>{const payload={kind:'tt99-school-widget-setup',configVersion:1,savedAt:new Date().toISOString(),config:W.normalise(draft)};download('99studio-school-widget.json',JSON.stringify(payload,null,2)+'\n');status='Widget setup downloaded.';render();});
 root.querySelector('#wb-restore-json')?.addEventListener('change',async e=>{const file=e.target.files?.[0];if(!file)return;try{const d=JSON.parse(await file.text());if(d?.kind!=='tt99-school-widget-setup'||Number(d.configVersion)!==1||!d.config)throw new Error('That file is not a 99 Studio widget setup.');draft=W.normalise(d.config);save();status='Widget setup restored.';render();}catch(err){status=err?.message||'That widget setup could not be restored.';render();}});
}
applyHandoff();
const direct=W.tokenFromText(decodeURIComponent(location.hash||''));if(direct){try{draft=W.decode(direct);save();status='Widget configuration loaded from the URL.';}catch(_){}}
render();
})();