(function(G){
'use strict';
if(!G)return;
const {q,qa,esc,field,btn,setPanels}=G;
const MODES={constant:'Constant difference',increasing:'Changing difference',geometric:'Multiply by a constant',alternating:'Alternating differences'};
function integer(value,min,max,fallback){const n=Number(value);return value==null||value===''||!Number.isFinite(n)?fallback:Math.max(min,Math.min(max,Math.round(n)))}
function normalise(raw={}){
 const mode=Object.hasOwn(MODES,raw.mode)?raw.mode:'constant',length=integer(raw.length,3,8,6);
 return {mode,length,start:integer(raw.start,-20,50,1),step:integer(raw.step,-20,20,3),change:integer(raw.change,-10,10,1),factor:integer(raw.factor,2,4,2),second:integer(raw.second,-20,20,-1),shown:integer(raw.shown,1,length,length),rule:raw.rule!==false,links:raw.links!==false};
}
function model(raw){
 const s=normalise(raw),terms=[s.start],steps=[];
 for(let i=1;i<s.length;i++){
   const d=s.mode==='increasing'?s.step+(i-1)*s.change:s.mode==='alternating'&&i%2===0?s.second:s.step;
   const next=s.mode==='geometric'?terms[i-1]*s.factor:terms[i-1]+d;
   steps.push(s.mode==='geometric'?'× '+s.factor:(d<0?'− ':'+ ')+Math.abs(d));terms.push(next);
 }
 const signed=n=>(n<0?'− ':'+ ')+Math.abs(n);
 const rule=s.mode==='constant'?'Add '+(s.step<0?'('+s.step+')':s.step)+' each time':s.mode==='increasing'?'Start with '+signed(s.step)+'; change the difference by '+signed(s.change)+' each step':s.mode==='geometric'?'Multiply by '+s.factor+' each time':'Alternate '+signed(s.step)+' and '+signed(s.second);
 return {s,terms,steps,rule};
}
function diagram(raw){
 const {s,terms,steps,rule}=model(raw),W=960,pad=24,cols=s.length>6?4:s.length,rows=Math.ceil(s.length/cols),slot=(W-2*pad)/cols,H=78+rows*152;
 const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
 function add(tag,attrs,text){const n=document.createElementNS('http://www.w3.org/2000/svg',tag);for(const [k,v] of Object.entries(attrs))n.setAttribute(k,String(v));if(text!==undefined)n.textContent=String(text);svg.appendChild(n);return n}
 for(const [k,v] of Object.entries({xmlns:'http://www.w3.org/2000/svg',viewBox:'0 0 '+W+' '+H,role:'img','aria-label':'Number sequence demonstration'}))svg.setAttribute(k,v);
 add('rect',{width:W,height:H,fill:'#fff'});
 add('text',{x:pad,y:30,'font-family':'Arial,sans-serif','font-size':22,'font-weight':700,fill:'#24343b'},'Number sequence');
 if(s.rule)add('text',{x:pad,y:58,'font-family':'Arial,sans-serif','font-size':17,fill:'#526970'},rule);
 const boxW=Math.min(130,slot*.71),font=Math.min(34,(boxW-12)/Math.max(1,...terms.map(n=>String(n).length))/.69);
 const point=i=>({x:pad+slot*(i%cols+.5),y:94+Math.floor(i/cols)*152});
 for(let i=0;i<s.length;i++){
   const {x,y}=point(i),shown=i<s.shown;
   add('text',{x,y:y-9,'font-family':'Arial,sans-serif','font-size':14,'text-anchor':'middle',fill:'#63777c'},'Term '+(i+1));
   add('rect',{x:x-boxW/2,y,width:boxW,height:62,rx:7,fill:shown?'#edf7f4':'#fff',stroke:shown?'#9ec7bf':'#9fafb3','stroke-width':1.7,...(!shown?{'stroke-dasharray':'5 4'}:{})});
   if(shown)add('text',{x,y:y+41,'font-family':'Arial,sans-serif','font-size':font,'font-weight':700,'text-anchor':'middle',fill:'#28534f','data-seq-term':i},terms[i]);
   if(i&&s.links&&i<s.shown){
     const prev=point(i-1);
     if(i%cols!==0){
       const left=prev.x+boxW/2+4,right=x-boxW/2-4,mid=(prev.x+x)/2;
       add('path',{d:'M '+left+' '+(y+30)+' L '+right+' '+(y+30)+' l -6 -5 m 6 5 l -6 5',fill:'none',stroke:'#6a8989','stroke-width':1.6});
       add('text',{x:mid,y:y+83,'font-family':'Arial,sans-serif','font-size':16,'font-weight':650,'text-anchor':'middle',fill:'#526970','data-seq-step':i},steps[i-1]);
     }else add('text',{x,y:y+86,'font-family':'Arial,sans-serif','font-size':16,'text-anchor':'middle',fill:'#526970','data-seq-step':i},'From term '+i+': '+steps[i-1]);
   }
 }
 return svg;
}
G.sequenceModel={normalise,model,diagram};
G.sequencesTool=function(){
 let state=normalise(),status='';
 const X=G.exportTools;
 const opts=(values,current)=>values.map(v=>'<option value="'+esc(v)+'"'+(String(v)===String(current)?' selected':'')+'>'+esc(v)+'</option>').join('');
 const select=(name,values,current)=>'<select class="gd-select" data-seq-setting="'+name+'">'+opts(values,current)+'</select>';
 const range=(a,b)=>Array.from({length:b-a+1},(_,i)=>a+i);
 function controls(){
   const mode=state.mode;
   return '<div class="gd-seq-settings">'+field('Rule type','<select class="gd-select" data-seq-setting="mode">'+Object.entries(MODES).map(([id,title])=>'<option value="'+id+'"'+(mode===id?' selected':'')+'>'+title+'</option>').join('')+'</select>')+
   '<div class="gd-seq-pair">'+field('First term',select('start',range(-20,50),state.start))+field('Terms',select('length',range(3,8),state.length))+'</div>'+
   (mode==='geometric'?field('Multiply by',select('factor',[2,3,4],state.factor)):
   field(mode==='constant'?'Difference':'First difference',select('step',range(-20,20),state.step))+
   (mode==='increasing'?field('Change in difference',select('change',range(-10,10),state.change)):mode==='alternating'?field('Second difference',select('second',range(-20,20),state.second)):''))+
   '<label class="gd-seq-toggle"><input type="checkbox" data-seq-setting="rule"'+(state.rule?' checked':'')+'> Show rule</label><label class="gd-seq-toggle"><input type="checkbox" data-seq-setting="links"'+(state.links?' checked':'')+'> Show links between visible terms</label>'+
   '<div class="gd-row">'+btn('Copy image','seq-copy')+btn('PNG','seq-png')+btn('SVG','seq-svg')+btn('Print / PDF','seq-print')+'</div><p class="gd-help">Exports reproduce the visible teaching diagram. Hidden terms remain blank.</p><p class="gd-help" id="seq-status" role="status">'+esc(status)+'</p></div>';
 }
 function renderStage(){
   const stage=q('#gd-stage');stage.innerHTML='<div class="gd-seq-stage"><div class="gd-seq-actions"><button class="gd-btn" data-seq-action="first"'+(state.shown===1?' disabled':'')+'>First term only</button><button class="gd-btn" data-seq-action="hide"'+(state.shown===1?' disabled':'')+'>− Term</button><button class="gd-btn gd-btn--primary" data-seq-action="next"'+(state.shown===state.length?' disabled':'')+'>+ Term</button><button class="gd-btn" data-seq-action="all"'+(state.shown===state.length?' disabled':'')+'>Show all</button><span class="gd-seq-progress">'+state.shown+' / '+state.length+' terms</span></div><div class="gd-seq-diagram"></div></div>';
   q('.gd-seq-diagram',stage).appendChild(diagram(state));
   qa('[data-seq-action]',stage).forEach(el=>el.onclick=()=>{const action=el.dataset.seqAction;state.shown=action==='first'?1:action==='hide'?Math.max(1,state.shown-1):action==='next'?Math.min(state.length,state.shown+1):state.length;renderStage()});
 }
 async function exportAction(kind){
   try{if(!X)throw Error('Export is not available.');const svg=diagram(state);
   if(kind==='copy')await X.copyPng(svg);else if(kind==='png')await X.downloadPng(svg,'number-sequence',2);else if(kind==='svg')X.downloadSvg(svg,'number-sequence');else X.printSvg(svg,{title:'',landscape:true});
   status=kind==='print'?'Print view opened.':'Export ready.';
   }catch(e){status=e?.message||'Export failed.'}
   const el=q('#seq-status');if(el)el.textContent=status;
 }
 function renderControls(){
   const root=q('#gd-controls');root.innerHTML=controls();
   qa('[data-seq-setting]',root).forEach(el=>el.onchange=()=>{const name=el.dataset.seqSetting,all=state.shown===state.length;state=normalise({...state,[name]:el.type==='checkbox'?el.checked:el.value});if(name==='length'&&all)state.shown=state.length;renderControls();renderStage()});
   for(const kind of ['copy','png','svg','print']){const el=q('#seq-'+kind,root);el.setAttribute('data-gd-direct-export',kind);el.onclick=()=>exportAction(kind)}
 }
 setPanels('','');renderControls();renderStage();
 G.lessonState.register('sequences',()=>({...state}),saved=>{state=normalise(saved);renderControls();renderStage()});
};
})(window.TT99Goodies);
