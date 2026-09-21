(function(){
'use strict';
const root=document.getElementById('tt99-widget-builder'),W=window.TT99SchoolWidget;
if(!root||!W)return;

const LEGACY_STORE='tt99-widget-builder-v1',HANDOFF='tt99-widget-handoff-v1';
const SU=window.TT99SchoolUsage;
const BUILDER_MODE=requestedType()==='games'?'games':'club';
const STORE=BUILDER_MODE==='games'?'tt99-games-widget-builder-v1':'tt99-club-widget-builder-v1';
const track=(name,params)=>window.TT99Analytics?.track(name,params);
const clubNames={11:'11 Club',22:'22 Club',33:'33 Club',44:'44 Club',55:'55 Club',66:'66 Club',77:'77 Club',88:'88 Club',99:'99 Club',bronze:'Bronze',silver:'Silver',gold:'Gold',platinum:'Platinum',diamond:'Diamond'};
let draft=loadDraft(),status='';

function clone(v){return JSON.parse(JSON.stringify(v));}
function newIntegrationId(){
  try{
    const a=new Uint32Array(2);crypto.getRandomValues(a);
    return 'wid_'+a[0].toString(36)+a[1].toString(36);
  }catch(_){return 'wid_'+Date.now().toString(36)+Math.floor(Math.random()*1e9).toString(36);}
}
function ensureIntegrationId(config){
  if(!config.integrationId||!W.cleanIntegrationId?.(config.integrationId))config.integrationId=newIntegrationId();
  return config;
}
function schoolKey(){return SU?.makeSchoolKey?.(draft.school?.name||'')||'';}
function analyticsSummary(extra={}){
  return {
    widget_type:draft.widgetType,
    school_key:schoolKey()||undefined,
    source_origin:SU?.referrerOrigin?.()||undefined,
    club_count:draft.selectedClubs?.length||0,
    puzzle_pack_count:draft.puzzles?.length||0,
    online_game_count:draft.games?.length||0,
    has_school_name:draft.school?.name?1:0,
    has_school_logo:draft.school?.logo?1:0,
    custom_vocabulary_count:(draft.puzzles||[]).reduce((n,p)=>n+(Number(p.vocabCount)||0),0),
    ...extra
  };
}
function requestedType(){
  const q=new URLSearchParams(location.search).get('type');
  return q==='games'?'games':'club';
}
function loadDraft(){
  try{
    const own=localStorage.getItem(STORE),legacy=own?'':localStorage.getItem(LEGACY_STORE);
    const saved=JSON.parse(own||legacy||'{}'),previousType=saved.widgetType;
    saved.widgetType=BUILDER_MODE;
    if(!own&&legacy&&previousType&&previousType!==BUILDER_MODE){
      saved.integrationId='';
      if(BUILDER_MODE==='club'){saved.selectedClubs=[...W.CLUB_IDS];saved.puzzles=[];saved.games=[];}
      else{saved.selectedClubs=[];saved.clubPatches={};}
    }
    return ensureIntegrationId(W.normalise(saved));
  }catch(_){return ensureIntegrationId(W.normalise({widgetType:BUILDER_MODE,selectedClubs:BUILDER_MODE==='club'?W.CLUB_IDS:[],games:[]}));}
}
function save(){draft=ensureIntegrationId(W.normalise({...draft,widgetType:BUILDER_MODE}));try{localStorage.setItem(STORE,JSON.stringify(draft));}catch(_){}}
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function download(name,text,type='application/json'){const blob=new Blob([text],{type}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),800);}
function copy(text,msg){
  const fallback=()=>{const t=document.createElement('textarea');t.value=text;t.style.position='fixed';t.style.opacity='0';document.body.appendChild(t);t.select();const ok=document.execCommand('copy');t.remove();if(!ok)throw new Error('copy');};
  Promise.resolve(navigator.clipboard?.writeText?navigator.clipboard.writeText(text):fallback()).then(()=>{status=msg;render();}).catch(()=>{status='Could not copy automatically. Select the text below and copy it manually.';render();});
}
function logoPreview(){return draft.school?.logo||'/assets/99club/images/99club-studio-shield.png';}
function compactLogo(dataUrl){
  return new Promise((resolve,reject)=>{
    if(!dataUrl)return resolve({dataUrl:'',width:0,height:0});
    const img=new Image();
    img.onload=()=>{
      try{
        const max=96,scale=Math.min(1,max/Math.max(img.naturalWidth,img.naturalHeight)),w=Math.max(1,Math.round(img.naturalWidth*scale)),h=Math.max(1,Math.round(img.naturalHeight*scale));
        const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
        const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,w,h);ctx.drawImage(img,0,0,w,h);
        let out=canvas.toDataURL('image/jpeg',.76);
        if(out.length>9000)out=canvas.toDataURL('image/jpeg',.58);
        if(out.length>18000)out=canvas.toDataURL('image/jpeg',.42);
        resolve(out.length<=18000?{dataUrl:out,width:w,height:h}:{dataUrl:'',width:0,height:0});
      }catch(err){reject(err);}
    };
    img.onerror=()=>reject(new Error('logo'));
    img.src=dataUrl;
  });
}
async function fileLogo(file){
  if(!file)return {dataUrl:'',width:0,height:0};
  if(file.size>8*1024*1024)throw new Error('Please choose a logo smaller than 8 MB.');
  return compactLogo(await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(String(r.result||''));r.onerror=()=>reject(r.error||new Error('logo'));r.readAsDataURL(file);}));
}
async function applyHandoff(){
  let raw='';try{raw=localStorage.getItem(HANDOFF)||'';localStorage.removeItem(HANDOFF);}catch(_){}
  if(!raw)return false;
  try{
    const h=JSON.parse(raw);
    if(BUILDER_MODE==='club'&&h.kind==='clubs'&&h.clubs){
      const imported=W.fromClubRules({...h,widgetType:'club'}),selected=draft.selectedClubs?.length?draft.selectedClubs:W.CLUB_IDS;
      draft={...draft,widgetType:'club',schemeId:imported.schemeId,orientation:imported.orientation,clubPatches:imported.clubPatches,selectedClubs:selected};
      if(imported.school?.name)draft.school.name=imported.school.name;
      const rawLogo=h.school?.logoDataUrl||h.school?.logo||'';
      if(rawLogo){const logo=await compactLogo(rawLogo);if(logo.dataUrl)Object.assign(draft.school,{logo:logo.dataUrl,logoWidth:logo.width,logoHeight:logo.height});}
      status='Current 99 Club rules and school identity imported. Choose which Club levels to display.';
    }else if(BUILDER_MODE==='games'&&h.kind==='puzzle'&&h.link){
      draft={...draft,widgetType:'games'};
      if(h.schoolName)draft.school.name=String(h.schoolName).slice(0,80);
      if(h.logoDataUrl){const logo=await compactLogo(h.logoDataUrl);if(logo.dataUrl)Object.assign(draft.school,{logo:logo.dataUrl,logoWidth:logo.width,logoHeight:logo.height});}
      draft=W.normalise({...draft,puzzles:[...(draft.puzzles||[]),h]});
      status=h.vocabCount?'Puzzle pack added, including '+h.vocabCount+' school vocabulary entr'+(h.vocabCount===1?'y':'ies')+'.':'Current puzzle pack added to the Maths Games widget.';
    }
    save();return true;
  }catch(_){return false;}
}
function importToken(text){
  const token=W.tokenFromText(text);if(!token)throw new Error('No TT99W1 widget configuration was found.');
  const imported=ensureIntegrationId(W.decode(token));
  if(imported.widgetType!==BUILDER_MODE)throw new Error(BUILDER_MODE==='club'?'This configuration belongs to the Maths Games Widget builder.':'This configuration belongs to the 99 Club Widget builder.');
  draft=imported;save();status='Existing widget configuration recreated. The live school website has not changed.';track('widget_existing_import',analyticsSummary());render();
}
function typeName(){return BUILDER_MODE==='club'?'99 Club Widget':'Maths Games Widget';}
function identityCard(){
  const hasLogo=!!draft.school?.logo;
  return '<section class="tt99-wb-card"><h2>School identity</h2><p>The school name and logo appear in the public widget header. They are intentionally public website content and are stored inside the embed configuration.</p>'+
   '<div class="tt99-wb-identity"><div class="tt99-wb-logo-preview"><img src="'+esc(logoPreview())+'" alt=""></div><div class="tt99-wb-identity-fields"><div class="tt99-wb-field"><label for="wb-school-name">School name</label><input id="wb-school-name" type="text" maxlength="80" value="'+esc(draft.school?.name||'')+'" placeholder="e.g. Radford Semele CofE Primary School"></div>'+
   '<div class="tt99-wb-actions"><label class="tt99-wb-linkbtn">Choose logo<input class="tt99-wb-hidden-file" id="wb-logo" type="file" accept="image/png,image/jpeg,image/webp"></label>'+(hasLogo?'<button class="tt99-wb-btn" id="wb-remove-logo" type="button">Remove logo</button>':'')+'</div><small class="tt99-wb-help">The builder creates a small web copy of the logo so the embed stays compact. The original image remains in your browser setup.</small></div></div></section>';
}
function clubsCard(){
  const core=W.CLUB_IDS.slice(0,9),advanced=W.CLUB_IDS.slice(9);
  const clubCheck=id=>'<label class="tt99-wb-check"><input type="checkbox" data-club="'+esc(id)+'" '+(draft.selectedClubs.includes(id)?'checked':'')+'><span>'+esc(clubNames[id]||id)+'</span></label>';
  return '<section class="tt99-wb-card"><div class="tt99-wb-headrow"><div><h2>99 Club levels</h2></div><div class="tt99-wb-actions"><button class="tt99-wb-btn" id="wb-all-clubs">All</button><button class="tt99-wb-btn" id="wb-no-clubs">None</button></div></div>'+
   '<p>This chooses what parents see. Change the actual maths rules in the normal 99 Club editor, then reopen this builder from Parent practice links.</p><div class="tt99-wb-subhead">11–99</div><div class="tt99-wb-clubs">'+core.map(clubCheck).join('')+'</div><div class="tt99-wb-subhead">Post-99</div><div class="tt99-wb-clubs">'+advanced.map(clubCheck).join('')+'</div>'+
   '<div class="tt99-wb-actions" style="margin-top:12px"><a class="tt99-wb-linkbtn" href="/" target="_blank" rel="noopener">Edit Club rules in Studio</a></div></section>';
}
function puzzlesCard(){
  const packs=draft.puzzles.length?draft.puzzles.map((p,i)=>{
    const vocab=p.vocabCount?'<span class="tt99-wb-public-badge">'+p.vocabCount+' public vocab entr'+(p.vocabCount===1?'y':'ies')+'</span>':'';
    const title=String(p.title||'Maths puzzle pack').trim()||'Maths puzzle pack';
    return '<div class="tt99-wb-pack"><div><strong>'+esc(title)+'</strong><small>'+p.gameCount+' selected game'+(p.gameCount===1?'':'s')+' · shared parent link</small>'+vocab+'<label class="tt99-wb-field tt99-wb-pack-name"><span>Display name</span><input type="text" maxlength="80" data-pack-title="'+i+'" value="'+esc(title)+'" placeholder="e.g. Friday maths puzzles"></label></div><button class="tt99-wb-btn tt99-wb-danger" type="button" data-remove-pack="'+i+'">Remove</button></div>';
  }).join(''):'<div class="tt99-wb-empty">No printable puzzle packs yet. Configure one in Maths Games &amp; Puzzles, open its sharing window and choose <b>Open widget builder</b>.</div>';
  const vocabTotal=draft.puzzles.reduce((n,p)=>n+(Number(p.vocabCount)||0),0);
  return '<section class="tt99-wb-card"><h2>Printable puzzle packs</h2><p>Add up to four shared puzzle packs. Packs may include your custom mathematical vocabulary.</p>'+
   (vocabTotal?'<div class="tt99-wb-vocab-note"><strong>Public vocabulary:</strong> these shared packs contain '+vocabTotal+' school-entered vocabulary entr'+(vocabTotal===1?'y':'ies')+'. Terms and definitions can be read by anyone with the public widget link. Do not use pupil names or private information.</div>':'')+
   packs+'<div class="tt99-wb-actions" style="margin-top:12px"><a class="tt99-wb-linkbtn" href="/games/" target="_blank" rel="noopener">Configure another puzzle pack</a></div></section>';
}
function gamesCard(){
  const games=W.GAME_IDS.map(id=>'<label class="tt99-wb-check"><input type="checkbox" data-game="'+esc(id)+'" '+(draft.games.includes(id)?'checked':'')+'><span>'+esc(W.GAME_TITLES[id]||id)+'</span></label>').join('');
  return '<section class="tt99-wb-card"><div class="tt99-wb-headrow"><div><h2>Online games</h2></div><div class="tt99-wb-actions"><button class="tt99-wb-btn" id="wb-no-games">Clear games</button></div></div><p>Select only the games you want parents to see. Maximum 24 keeps the widget focused.</p><div class="tt99-wb-games">'+games+'</div></section>';
}
function behaviourCard(){
  if(BUILDER_MODE!=='games')return '';
  const choices=[];
  if(draft.puzzles.length)choices.push(['puzzles','Printable puzzles']);
  if(draft.games.length)choices.push(['games','Play online']);
  if(choices.length<2)return '';
  return '<section class="tt99-wb-card"><h2>Default section</h2><p>Choose what parents see first. They can switch between printable packs and online games inside the Games widget.</p><div class="tt99-wb-field"><label for="wb-default-tab">Open first</label><select id="wb-default-tab">'+choices.map(([id,label])=>'<option value="'+id+'" '+(draft.defaultTab===id?'selected':'')+'>'+label+'</option>').join('')+'</select></div></section>';
}
function handoverCard(){
  return '<section class="tt99-wb-card"><h2>Import / handover</h2><p>Recreating a public widget gives you an editable copy; it does not alter the school website. Only someone with access to edit the school website can replace the live embed.</p><div class="tt99-wb-field"><label for="wb-import-text">Existing widget URL or embed code</label><textarea id="wb-import-text" placeholder="Paste an existing https://99studio.uk/widget/#w=... URL or iframe code"></textarea></div><div class="tt99-wb-actions" style="margin-top:9px"><button class="tt99-wb-btn" id="wb-import">Recreate existing widget</button><button class="tt99-wb-btn" id="wb-save-json">Save widget setup</button><label class="tt99-wb-linkbtn">Restore widget setup<input class="tt99-wb-hidden-file" id="wb-restore-json" type="file" accept=".json,application/json"></label></div></section>';
}
function render(){
  draft=W.normalise({...draft,widgetType:BUILDER_MODE});save();
  let url='',embed='';try{url=W.buildUrl(draft,location.origin);embed=W.embedCode(draft,location.origin);}catch(err){status=err?.message||'The widget configuration is too large.';}
  const body=[identityCard()];
  if(BUILDER_MODE==='club')body.push(clubsCard());
  if(BUILDER_MODE==='games')body.push(puzzlesCard(),gamesCard());
  body.push(behaviourCard(),handoverCard());
  root.innerHTML='<div class="tt99-wb-hero"><div><span class="tt99-wb-kicker">Optional school publishing route</span><h1>'+esc(typeName())+'</h1><p>Create a compact, branded, read-only panel for a school website. The existing cards, PNG images and website packs remain available as the no-embed alternative.</p><div class="tt99-wb-actions" style="margin-top:12px"><a class="tt99-wb-linkbtn" href="/schools/#widgets" target="_blank" rel="noopener">School website integration help</a></div></div><a class="tt99-wb-back" href="'+(BUILDER_MODE==='games'?'/games/':'/')+'">← '+(BUILDER_MODE==='games'?'Maths Games &amp; Puzzles':'99 Club Studio')+'</a></div>'+
   '<div class="tt99-wb-note">When you are happy with the preview, copy the embed code and add it to the school website.</div>'+
   '<div class="tt99-wb-layout"><div>'+body.join('')+'</div><aside class="tt99-wb-preview"><h2>Parent preview</h2><div class="tt99-wb-preview-wrap"><iframe id="wb-preview-frame" src="'+esc(url)+'" title="'+esc(typeName())+' preview" sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"></iframe></div>'+
   '<section class="tt99-wb-card tt99-wb-publish"><h2>Use on the school website</h2><p>Copy this embed into your school website editor. Updating later means creating a revised embed here and replacing the old one in the website editor.</p><div class="tt99-wb-actions"><button class="tt99-wb-btn primary" id="wb-copy-embed">Copy embed code</button><button class="tt99-wb-btn" id="wb-copy-url">Copy widget URL</button></div><div class="tt99-wb-field" style="margin-top:10px"><label for="wb-code">Generated embed</label><textarea id="wb-code" class="tt99-wb-code" readonly>'+esc(embed)+'</textarea></div>'+(status?'<div class="tt99-wb-status" role="status">'+esc(status)+'</div>':'')+'</section></aside></div>';
  bind();
}
function bind(){
  root.querySelector('#wb-school-name')?.addEventListener('change',e=>{draft.school.name=String(e.target.value||'').trim().slice(0,80);status='School name updated in this widget draft.';render();});
  root.querySelector('#wb-logo')?.addEventListener('change',async e=>{const file=e.target.files?.[0];if(!file)return;try{const logo=await fileLogo(file);if(!logo.dataUrl)throw new Error('The logo could not be reduced enough for the public widget.');Object.assign(draft.school,{logo:logo.dataUrl,logoWidth:logo.width,logoHeight:logo.height});status='School logo added to this widget.';render();}catch(err){status=err?.message||'That logo could not be used.';render();}});
  root.querySelector('#wb-remove-logo')?.addEventListener('click',()=>{Object.assign(draft.school,{logo:'',logoWidth:0,logoHeight:0});status='School logo removed from this widget draft.';render();});
  root.querySelectorAll('[data-club]').forEach(el=>el.addEventListener('change',()=>{const set=new Set(draft.selectedClubs);el.checked?set.add(el.dataset.club):set.delete(el.dataset.club);draft.selectedClubs=W.CLUB_IDS.filter(id=>set.has(id));status='';render();}));
  root.querySelectorAll('[data-game]').forEach(el=>el.addEventListener('change',()=>{const ids=new Set(draft.games);if(el.checked&&ids.size>=24){status='Widget v1 is limited to 24 online games. Remove one before adding another.';render();return;}el.checked?ids.add(el.dataset.game):ids.delete(el.dataset.game);draft.games=W.GAME_IDS.filter(id=>ids.has(id));status='';render();}));
  root.querySelectorAll('[data-pack-title]').forEach(input=>input.addEventListener('change',()=>{const i=Number(input.dataset.packTitle),title=String(input.value||'').trim().slice(0,80)||'Maths puzzle pack';if(draft.puzzles[i])draft.puzzles[i].title=title;status='Puzzle pack display name updated.';render();}));
  root.querySelectorAll('[data-remove-pack]').forEach(btn=>btn.addEventListener('click',()=>{draft.puzzles.splice(Number(btn.dataset.removePack),1);status='Puzzle pack removed from this widget draft.';render();}));
  root.querySelector('#wb-all-clubs')?.addEventListener('click',()=>{draft.selectedClubs=[...W.CLUB_IDS];status='';render();});
  root.querySelector('#wb-no-clubs')?.addEventListener('click',()=>{draft.selectedClubs=[];status='';render();});
  root.querySelector('#wb-no-games')?.addEventListener('click',()=>{draft.games=[];status='';render();});
  root.querySelector('#wb-default-tab')?.addEventListener('change',e=>{draft.defaultTab=e.target.value;status='';render();});
  root.querySelector('#wb-copy-embed')?.addEventListener('click',()=>{
    copy(W.embedCode(draft,location.origin),typeName()+' embed code copied.');
    track('widget_embed_copy',analyticsSummary());
    SU?.trackStudio?.('widget_embed_copy',draft.school?.name||'',{area:'widget_builder'});
  });
  root.querySelector('#wb-copy-url')?.addEventListener('click',()=>{
    copy(W.buildUrl(draft,location.origin),typeName()+' URL copied.');
    track('widget_url_copy',analyticsSummary());
  });
  root.querySelector('#wb-code')?.addEventListener('click',e=>e.currentTarget.select());
  root.querySelector('#wb-import')?.addEventListener('click',()=>{try{importToken(root.querySelector('#wb-import-text')?.value||'');}catch(err){status=err?.message||'That widget could not be imported.';render();}});
  root.querySelector('#wb-save-json')?.addEventListener('click',()=>{const payload={kind:'tt99-school-widget-setup',configVersion:1,savedAt:new Date().toISOString(),config:W.normalise(draft)};download('99studio-'+draft.widgetType+'-widget.json',JSON.stringify(payload,null,2)+'\n');track('widget_setup_save',analyticsSummary());status='Widget setup downloaded.';render();});
  root.querySelector('#wb-restore-json')?.addEventListener('change',async e=>{const file=e.target.files?.[0];if(!file)return;try{const d=JSON.parse(await file.text());if(d?.kind!=='tt99-school-widget-setup'||Number(d.configVersion)!==1||!d.config)throw new Error('That file is not a 99 Club Studio widget setup.');const imported=ensureIntegrationId(W.normalise(d.config));if(imported.widgetType!==BUILDER_MODE)throw new Error(BUILDER_MODE==='club'?'That file belongs to the Maths Games Widget builder.':'That file belongs to the 99 Club Widget builder.');draft=imported;save();track('widget_setup_restore',analyticsSummary());status='Widget setup restored.';render();}catch(err){status=err?.message||'That widget setup could not be restored.';render();}});
}

(async function start(){
  await applyHandoff();
  const direct=W.tokenFromText(decodeURIComponent(location.hash||''));
  if(direct){try{const imported=W.decode(direct);if(imported.widgetType===BUILDER_MODE){draft=imported;save();status='Widget configuration loaded from the URL.';}else status=BUILDER_MODE==='club'?'That URL belongs to the Maths Games Widget builder.':'That URL belongs to the 99 Club Widget builder.';}catch(_){}}
  window.addEventListener('load',()=>track('widget_builder_open',analyticsSummary({entry_type:requestedType()||draft.widgetType})),{once:true});
  SU?.trackStudio?.('widget_builder_open',draft.school?.name||'',{area:'widget_builder'});
  render();
})();
})();