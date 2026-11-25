(function(G){
'use strict';
if(!G)return;
const {q,qa,esc,clamp,num,field,btn}=G;

const ABACUS_MODES=['show','add','subtract','make10','bond','double','near','missing','skip'];
function abacusSettings(model={}){
 const rows=[3,4,5,6].includes(Number(model.rows))?Number(model.rows):5,kind=model.kind||'western';
 if(!['western','suanpan','soroban'].includes(kind))throw Error('Historical calculators need their own paper template. Choose Western abacus, suanpan or soroban for document publishing.');
 return {rows,kind,colourScheme:['classic','place','sea','berry','forest'].includes(model.colourScheme)?model.colourScheme:'classic',showTotal:model.showTotal!==false,showRowCounts:!!model.showRowCounts,showRowLabels:model.showRowLabels!==false};
}
  function beadX(index,count){return index<count?4+index*4.5:55+index*4.5}
  function beadGeometry(device,digit,upper,lower,part,j){
    if(device==='western')return {position:beadX(j,digit),active:j<digit};
    if(device==='suanpan'){
      const active=part==='upper'?j<upper:j<lower;
      return {active,position:part==='upper'?(active?35-j*11:9+j*11):(active?46+j*8:60+j*8)};
    }
    const active=part==='upper'?digit>=5:j<digit%5;
    return {active,position:part==='upper'?(active?36:12):(active?44+j*8.5:67+j*8.5)};
  }

  function abacusTaskTitle(mode){
    return ({
      show:'Show a number',add:'Addition',subtract:'Subtraction',make10:'Make 10',bond:'Number bonds',
      double:'Doubles',near:'Near doubles',missing:'Missing number',skip:'Skip counting'
    })[mode]||'Abacus';
  }

  function generateAbacusTask(mode,settings,rng=Math.random){
    const {rows,kind}=settings,capacity=()=>10**rows-1,randomInt=(min,max)=>min+Math.min(max-min,Math.floor(rng()*(max-min+1)));
    const cap=Math.min(capacity(),rows===3?999:9999),instrument=kind==='suanpan'?'suanpan':kind==='soroban'?'soroban':'abacus';
    if(mode==='show'){
      const target=randomInt(1,cap);
      return{mode,start:0,target,prompt:'Build '+target+' on the '+instrument+' by moving the beads. When you are happy with it, press Check.',requiresAnswer:false};
    }
    if(mode==='add'){
      let a=randomInt(1,Math.max(1,cap-1)),b=randomInt(1,Math.max(1,cap-a));
      if(cap>=12&&rng()<.65){
        const low=Math.max(1,10-(a%10));
        if(low<=cap-a)b=randomInt(low,Math.max(low,cap-a));
      }
      return{mode,start:a,target:a+b,a,b,prompt:'The '+instrument+' starts at '+a+'. Add '+b+' by moving the beads. Stop when it shows the answer, then press Check.',requiresAnswer:false};
    }
    if(mode==='subtract'){
      const a=randomInt(2,cap),b=randomInt(1,a);
      return{mode,start:a,target:a-b,a,b,prompt:'The '+instrument+' starts at '+a+'. Subtract '+b+' by moving the beads. Stop when it shows the answer, then press Check.',requiresAnswer:false};
    }
    if(mode==='make10'){
      const a=randomInt(1,9),answer=10-a;
      return{mode,start:a,target:10,a,answer,requiresAnswer:true,prompt:'The '+instrument+' starts at '+a+'. How many more are needed to make 10? Move the beads to 10 and enter the missing number.'};
    }
    if(mode==='bond'){
      const bondTotal=cap>=20&&rng()<.5?20:10;
      const a=randomInt(1,bondTotal-1),answer=bondTotal-a;
      return{mode,start:a,target:bondTotal,a,answer,requiresAnswer:true,prompt:'Complete the number bond '+a+' + ? = '+bondTotal+'. Move the '+instrument+' to '+bondTotal+' and enter the missing number.'};
    }
    if(mode==='double'){
      const a=randomInt(1,Math.max(1,Math.floor(cap/2)));
      return{mode,start:a,target:a*2,a,prompt:'The '+instrument+' starts at '+a+'. Double it by adding another '+a+' with the beads, then press Check.',requiresAnswer:false};
    }
    if(mode==='near'){
      let a=randomInt(2,Math.max(2,Math.floor(cap/2))),b=a+(rng()<.5?-1:1);
      b=Math.max(1,b);
      while(a+b>cap&&a>2){a--;b=Math.max(1,a-1)}
      return{mode,start:a,target:a+b,a,b,prompt:'Use a near-double strategy to work out '+a+' + '+b+'. Show the final answer on the '+instrument+', then press Check.',requiresAnswer:false};
    }
    if(mode==='missing'){
      const target=randomInt(5,cap),a=randomInt(0,target-1),answer=target-a;
      return{mode,start:a,target,a,answer,requiresAnswer:true,finalTarget:target,prompt:'Solve '+a+' + ? = '+target+'. Enter the missing number and move the '+instrument+' from '+a+' to '+target+'.'};
    }
    if(mode==='skip'){
      const possible=[2,5,10].filter(s=>s<=cap),step=possible[randomInt(0,possible.length-1)];
      const maxStart=Math.max(0,cap-step),start=Math.floor(randomInt(0,maxStart)/step)*step,target=start+step;
      return{mode,start,target,step,answer:target,requiresAnswer:true,prompt:'Count on in '+step+'s from '+start+'. Enter the next number and show it on the '+instrument+'.'};
    }
    return null;
  }

function abacusPaper(model,teacher=false){
 const {rows,kind,colourScheme,showTotal,showRowCounts,showRowLabels}=abacusSettings(model),X=G.exportTools,task=model.task||null;
 const arr=(a,max)=>Array.from({length:rows},(_,i)=>Math.max(0,Math.min(max,Math.round(Number(a?.[i])||0))));
 const counts=arr(model.counts,10),suanUpper=arr(model.suanUpper,2),suanLower=arr(model.suanLower,5);
 const normal=v=>Math.max(0,Math.min(10**rows-1,Math.round(Number(v)||0))),placeShort=i=>['1s','10s','100s','1k','10k','100k'][rows-i-1];
 const total=()=>counts.reduce((sum,digit,i)=>sum+(kind==='suanpan'?5*suanUpper[i]+suanLower[i]:digit)*10**(rows-i-1),0);
  function svgEl(name,attrs={},text=''){
    const el=document.createElementNS('http://www.w3.org/2000/svg',name);
    Object.entries(attrs).forEach(([k,v])=>el.setAttribute(k,String(v)));
    if(text!==''&&text!=null)el.textContent=String(text);
    return el;
  }
  function frameSvg({value=null,template=false,pupil=false}={}){
    const width=900,height=540,left=80,right=820,top=118,rodH=324;
    const live=value===null,ds=live?counts:Array.from(String(normal(value)).padStart(rows,'0'),Number);
    const palette={classic:['#8b5b30','#f0d7ad','#725039','#d88a51','#3e9487','#4b3826'],place:['#65728e','#f3e6c9','#6d6a73','#c9928c','#6e98b8','#41495a'],sea:['#446f7c','#dceeed','#4e6b71','#d7a27a','#3f8796','#314f58'],berry:['#765266','#f0dfe3','#694b59','#d59a6f','#955d76','#5d4050'],forest:['#58705b','#e4ecd8','#5e6650','#d79661','#63866b','#465644']};
    const [frame,board,rail,inactive,active,ink]=palette[colourScheme]||palette.classic;
    const svg=svgEl('svg',{xmlns:'http://www.w3.org/2000/svg',viewBox:'0 0 '+width+' '+height,role:'img','aria-label':template?'Abacus template to complete':kind==='western'?'Western base-ten abacus':kind==='suanpan'?'Chinese suanpan':'Japanese soroban'});
    const add=(tag,attrs,txt)=>svg.appendChild(svgEl(tag,attrs,txt));
    add('rect',{x:0,y:0,width,height,fill:'#fff'});
    add('rect',{x:40,y:36,width:820,height:457,rx:18,fill:template?'#fff':board,stroke:frame,'stroke-width':10,'data-ab-export-frame':'1'});
    add('rect',{x:62,y:60,width:776,height:414,rx:8,fill:template?'#fff':board});
    function bead(cx,cy,rx,ry,on,row){
      const placeColours=['#6e98b8','#7ca58a','#b1849a','#c29a5c','#9589b7','#a8ad73'];
      const col=on?(colourScheme==='place'?placeColours[row%6]:active):inactive;
      add('ellipse',{cx,cy,rx,ry,fill:template?'#fff':col,stroke:template?'#75878b':frame,'stroke-width':template?1.8:1.6,'data-ab-paper-bead':'1'});
      if(!template)add('ellipse',{cx:cx-rx*.28,cy:cy-ry*.35,rx:rx*.32,ry:ry*.23,fill:'#fff','fill-opacity':.45});
    }
    if(kind==='western'){
      for(let row=0;row<rows;row++){
        const y=112+(row+.5)*348/rows,digit=ds[row]||0;
        add('line',{x1:152,y1:y,x2:752,y2:y,stroke:rail,'stroke-width':4,'stroke-linecap':'round'});
        if(showRowLabels||pupil)add('text',{x:130,y:y+6,'text-anchor':'end','font-family':'Arial,sans-serif','font-size':23,'font-weight':700,fill:ink},placeShort(row));
        for(let j=0;j<10;j++){
          const g=beadGeometry(kind,digit,0,0,'unit',j),bx=152+600*(template?4+j*(92/9):g.position)/100;
          bead(bx,y,11.5,13,g.active,row);
        }
        if(showRowCounts&&!pupil&&!template)add('text',{x:782,y:y+6,'text-anchor':'middle','font-family':'Arial,sans-serif','font-size':20,'font-weight':700,fill:ink},String(digit));
      }
    }else{
      add('rect',{x:62,y:top+rodH*.40-5,width:776,height:10,rx:3,fill:frame});
      for(let col=0;col<rows;col++){
        const x=left+(right-left)*(col+.5)/rows,digit=ds[col]||0;
        const upper=kind==='suanpan'&&live?(suanUpper[col]||0):Math.floor(digit/5),lower=kind==='suanpan'&&live?(suanLower[col]||0):digit%5;
        add('line',{x1:x,y1:top-10,x2:x,y2:top+rodH+10,stroke:rail,'stroke-width':4,'stroke-linecap':'round'});
        if(showRowLabels||pupil)add('text',{x,y:94,'text-anchor':'middle','font-family':'Arial,sans-serif','font-size':22,'font-weight':700,fill:ink},placeShort(col));
        const specs=[...Array.from({length:kind==='suanpan'?2:1},(_,j)=>({part:'upper',j})),...Array.from({length:kind==='suanpan'?5:4},(_,j)=>({part:'lower',j}))];
        specs.forEach(({part,j})=>{
          const g=beadGeometry(kind,digit,upper,lower,part,j);
          // Fixed outline slots nearest the beam represent countable beads on paper.
          const pos=template?(part==='upper'?35-j*11:46+j*8.5):g.position;
          bead(x,top+rodH*pos/100,rows>=6?22:26,10.8,g.active,col);
        });
        if(showRowCounts&&!pupil&&!template)add('text',{x,y:462,'text-anchor':'middle','font-family':'Arial,sans-serif','font-size':20,'font-weight':700,fill:ink},String(kind==='suanpan'?upper*5+lower:digit));
      }
    }
    if(showTotal&&!pupil&&!template)add('text',{x:width/2,y:527,'text-anchor':'middle','font-family':'Arial,sans-serif','font-size':19,'font-weight':700,fill:ink},'Number shown: '+(live?total():normal(value)).toLocaleString('en-GB'));
    return svg;
  }
  function paperTaskPrompt(t){
    const label=kind==='western'?'abacus':kind;
    const actions={show:'Show '+t.target+' on the '+label+'.',add:'Start at '+t.start+'. Add '+t.b+'.',subtract:'Start at '+t.start+'. Subtract '+t.b+'.',make10:'Start at '+t.start+'. How many more are needed to make 10?',bond:'Complete '+t.a+' + ? = '+t.target+'.',double:'Double '+t.start+'.',near:'Use a near-double strategy to work out '+t.a+' + '+t.b+'.',missing:'Solve '+t.a+' + ? = '+t.target+'.',skip:'Count on in '+t.step+'s from '+t.start+'.'};
    const missing=['make10','bond','missing'].includes(t.mode);
    const instruction=kind==='western'?'Shade beads from the left to show the final total. Exchange ten beads for one in the next place.':'Shade beads nearest the middle bar to show the final total.';
    const action=t.mode==='skip'?'Count on one step of '+t.step+' from '+t.start+'.':(actions[t.mode]||'Complete the calculation.');
    return action+' '+instruction+(missing?' Write the missing number in the box.':' Write the final number in the box.');
  }
  function paperTaskDiagram(t,teacher){
    const showStart=t.mode!=='show'&&!(teacher&&X.isAnswerDiagramLayout?.()),stacked=showStart&&X.isDocumentCardLayout?.(),W=showStart&&!stacked?1840:900,H=stacked?1180:590;
    const out=svgEl('svg',{xmlns:'http://www.w3.org/2000/svg',viewBox:'0 0 '+W+' '+H,role:'img','aria-label':teacher?'Completed abacus solution':'Abacus practice diagrams'});
    const addFrame=(value,template,x,label,y=0)=>{
      out.appendChild(svgEl('text',{x:x+450,y:y+34,'text-anchor':'middle','font-family':'Arial,sans-serif','font-size':26,'font-weight':700,fill:'#52666d'},label));
      const nested=svgEl('svg',{x,y:y+42,width:900,height:540,viewBox:'0 0 900 540'});
      [...frameSvg({value,template,pupil:true}).childNodes].forEach(n=>nested.appendChild(n.cloneNode(true)));out.appendChild(nested);
    };
    if(showStart)addFrame(t.start,false,0,'Start');
    addFrame(teacher?t.target:0,!teacher,showStart&&!stacked?940:0,teacher?'Final total':'Shade to show the final total',stacked?590:0);
    return out;
  }
  function exportSvg(teacher=false){
    if(task&&X?.composeWorksheetCardSvg){
      const missing=['make10','bond','missing'].includes(task.mode);
      return X.composeWorksheetCardSvg(paperTaskDiagram(task,teacher),{
        title:abacusTaskTitle(task.mode)+(teacher?' · Teacher answer key':''),
        prompt:paperTaskPrompt(task),
        responseLabel:missing?'Missing number (not the final total)':'Final number',
        responseLines:1,responseMode:'box',paperStyle:'plain',
        answer:task.requiresAnswer?String(task.answer):String(task.target),
        showAnswer:teacher,brand:'99 Club Studio'
      });
    }
    return frameSvg();
  }

 return exportSvg(teacher);
}
G.abacusPaperModel={settings:abacusSettings,generate:generateAbacusTask,render:abacusPaper};

const HISTORY_NAMES={reckoning:'Reckoning table',rods:'Chinese counting rods',napier:"Napier’s bones",slide:'Slide rule',pascaline:'Pascaline'};
function historyPaperTypes(kind){return kind==='pascaline'?[{id:'history-add',label:'Addition'},{id:'history-subtract',label:'Subtraction'}]:[{id:'history-task',label:kind==='napier'||kind==='slide'?'Multiplication':'Represent a number'}]}
function historyPaperData(model,type,rng=Math.random){
 const kind=model.kind,settings={kind},r=(a,b)=>a+Math.floor(rng()*(b-a+1));
 const d={kind,reckoning:[0,0,0,0],rodDigits:[0,0,0,0],napierNumber:'12',napierMultiplier:2,slideA:1,slideB:1,slideIndex:'left',pascalDigits:[0,0,0,0],pascalOperation:'add',...model};
 let task;
 if(kind==='reckoning'||kind==='rods'){const target=r(102,kind==='reckoning'?999:9999);task={target,answer:target,prompt:'Represent '+target+' using '+HISTORY_NAMES[kind]+'.'};}
 else if(kind==='napier'){d.napierNumber=String(r(12,987));d.napierMultiplier=r(2,9);const target=Number(d.napierNumber)*d.napierMultiplier;task={target,answer:target,prompt:'Use row '+d.napierMultiplier+' to work out '+d.napierNumber+' × '+d.napierMultiplier+'.'};}
 else if(kind==='slide'){const a=r(10,90)/10,b=r(2,9),target=Math.round(a*b*100)/100;task={a,b,target,answer:target,index:target>10?'right':'left',prompt:'Use the C and D scales to calculate '+a+' × '+b+'. Mark the correct index and cursor positions, then give the product.'};}
 else{const operation=type==='history-subtract'?'subtract':'add',start=r(25,95),amount=r(6,24),target=operation==='add'?start+amount:start-amount;task={start,amount,operation,target,answer:target,prompt:'The Pascaline starts at '+start+'. '+(operation==='add'?'Add ':'Subtract ')+amount+'. Write the result in the final windows.'};}
 return {historical:true,type,settings,device:d,task};
}
function historyDiagram(data,teacher=false){
 const d=data.device,c=data.task,k=d.kind,W=960;
 const H=k==='napier'?560:k==='slide'?300:k==='pascaline'&&c?400:270;
 const el=(tag,attrs={},value)=>{const n=document.createElementNS('http://www.w3.org/2000/svg',tag);for(const [key,v] of Object.entries(attrs))n.setAttribute(key,String(v));if(value!==undefined)n.textContent=String(value);return n};
 const svg=el('svg',{xmlns:'http://www.w3.org/2000/svg',viewBox:'0 0 '+W+' '+H,role:'img','aria-label':HISTORY_NAMES[k]});
 const add=(tag,attrs,value)=>svg.appendChild(el(tag,attrs,value));
 const text=(x,y,value,size=22,extra={})=>add('text',{x,y,'text-anchor':'middle','font-family':'Arial,sans-serif','font-size':size,'font-weight':600,fill:'#24343b',...extra},value);
 const rect=(x,y,width,height,fill='#fff')=>add('rect',{x,y,width,height,rx:5,fill,stroke:'#84999e','stroke-width':1.5});
 const line=(x1,y1,x2,y2,extra={})=>add('line',{x1,y1,x2,y2,stroke:'#344a50','stroke-width':2,...extra});
 const digits=v=>String(Math.max(0,Math.round(v))).padStart(4,'0').slice(-4).split('').map(Number);
 add('rect',{width:W,height:H,fill:'#fff'});text(W/2,30,HISTORY_NAMES[k],26);
 if(k==='reckoning'||k==='rods'){
   const values=c?(teacher?digits(c.target):[0,0,0,0]):k==='reckoning'?d.reckoning:d.rodDigits;
   for(let i=0;i<4;i++){
     const x=40+i*220,cx=x+110;rect(x,48,220,204);text(cx,78,['Thousands','Hundreds','Tens','Ones'][i]);
     const v=values[i]||0;
     if(k==='reckoning'){for(let j=0;j<v;j++)add('circle',{cx:cx+(j%3-1)*36,cy:111+Math.floor(j/3)*40,r:14,fill:'#c8e3dc',stroke:'#426d68','stroke-width':2});}
     else if(v){
       const vertical=i%2===0,five=v>=5,ones=v%5;
       if(vertical){if(five)line(cx-39,105,cx+39,105,{'stroke-width':6});for(let j=0;j<ones;j++)line(cx-30+j*20,five?119:102,cx-30+j*20,205,{'stroke-width':6});}
       else{if(five)line(cx-45,105,cx-45,205,{'stroke-width':6});for(let j=0;j<ones;j++)line(five?cx-30:cx-45,115+j*22,cx+45,115+j*22,{'stroke-width':6});}
     }
   }
 }else if(k==='napier'){
   const ds=String(d.napierNumber).split('').map(Number),cell=Math.min(105,Math.floor(780/ds.length)),x0=(W-cell*ds.length)/2;
   ds.forEach((v,i)=>{const x=x0+i*cell;rect(x,44,cell,45,'#eef5f3');text(x+cell/2,74,v,25);
     for(let row=1;row<=9;row++){const y=89+(row-1)*47,prod=v*row;rect(x,y,cell,47,row===d.napierMultiplier?'#fff3cf':'#fff');line(x,y+47,x+cell,y);text(x+cell*.24,y+18,Math.floor(prod/10),20);text(x+cell*.76,y+38,prod%10,20);}
   });for(let row=1;row<=9;row++)text(x0-24,120+(row-1)*47,row,20);
 }else if(k==='pascaline'){
   const windows=(values,y,label)=>{text(45,y+20,label,20,{'text-anchor':'start'});values.forEach((v,i)=>{const x=258+i*130;rect(x,y,110,82,'#f0f5f4');text(x+55,y+55,v==null?'':v,39);text(x+55,y+105,['1000','100','10','1'][i],20);});};
   if(c){windows(digits(c.start),52,'Start');text(W/2,200,(c.operation==='add'?'ADD ':'SUBTRACT ')+c.amount,25);windows(teacher?digits(c.target):[null,null,null,null],232,'Result');}
   else windows(d.pascalDigits,75,'Result');
 }else if(k==='slide'){
   const x0=120,len=720,yC=105,yD=190,log=v=>Math.log10(v)*len;
   const a=c?(teacher?c.a:1):d.slideA,b=c?(teacher?c.b:1):d.slideB,index=c?(teacher?c.index:'left'):d.slideIndex;
   const offset=log(a)-(index==='right'?len:0);
   for(const [tag,y,shift] of [['C',yC,offset],['D',yD,0]]){
     text(48,y+5,tag,24);rect(x0,y-43,len,70,'#f4f7f5');
     for(let i=10;i<=100;i++){const v=i/10,x=x0+log(v)+shift;if(x<x0||x>x0+len)continue;const major=i%10===0;line(x,y-12,x,y+(major?15:2));if(major)text(x,y-19,v,19);}
   }
   if(!c||teacher){const cx=x0+offset+log(b);line(cx,56,cx,226,{stroke:'#aa6d25','stroke-width':3});}
   if(c&&teacher)text(W/2,267,'C='+ (c.index==='right'?'10':'1')+' aligned with D='+c.a+'; cursor at C='+c.b+'; product '+c.target,21);
 }
 return svg;
}
function historyPaper(data,teacher=false){const svg=historyDiagram(data,teacher);if(!data.task)return svg;const c=data.task,k=data.device.kind;
 const prompt=c.prompt.replace(/, then press Check\.?/gi,'.').replace(/using the numbered input dials\./gi,'using the instrument.').replace(/, then press Check when the result windows show your answer\./gi,'. Write the result in the final windows.');
 return G.exportTools.composeWorksheetCardSvg(svg,{title:HISTORY_NAMES[k],prompt,responseLabel:'Answer / working',responseMode:['reckoning','rods','pascaline'].includes(k)?'none':'box',paperStyle:'plain',answer:String(c.answer),showAnswer:teacher,diagramMaxHeight:850});
}
function captureHistory(model){const kind=model.kind,task=model.historyChallenge?{...model.historyChallenge}:null;return {historical:true,type:task?(kind==='pascaline'?'history-'+task.operation:'history-task'):null,settings:{kind},device:{kind,reckoning:model.reckoning,rodDigits:model.rodDigits,napierNumber:model.napierNumber,napierMultiplier:model.napierMultiplier,slideA:model.slideA,slideB:model.slideB,slideIndex:model.slideIndex,pascalDigits:model.pascalDigits,pascalOperation:model.pascalOperation},task};}

if(G.publishing)G.publishing.register('abacus',{
 label:'Abacus',
 title:item=>item.data.historical?HISTORY_NAMES[item.data.device.kind]:item.kind==='challenge'?abacusTaskTitle(item.data.task.mode):'Abacus diagram',
 signature:item=>item.historical?JSON.stringify([item.settings.kind,item.type,item.task.prompt]):JSON.stringify([item.settings.kind,item.settings.rows,item.task.mode,item.task.start,item.task.target,item.task.answer,item.task.b,item.task.step]),
 recipe:(model,type)=>({type,settings:HISTORY_NAMES[model.kind]?{kind:model.kind}:abacusSettings(model)}),
 types:model=>{if(HISTORY_NAMES[model.kind])return historyPaperTypes(model.kind);abacusSettings(model);return ABACUS_MODES.map(id=>({id,label:abacusTaskTitle(id)}))},
 generate(recipe,rng){if(HISTORY_NAMES[recipe.settings.kind]){const ids=historyPaperTypes(recipe.settings.kind).map(t=>t.id),type=recipe.type==='all'?ids[Math.floor(rng()*ids.length)]:recipe.type;if(!ids.includes(type))throw Error('Unsupported historical instrument question.');return historyPaperData(recipe.settings,type,rng)}const settings=abacusSettings(recipe.settings),type=recipe.type==='all'?ABACUS_MODES[Math.min(ABACUS_MODES.length-1,Math.floor(rng()*ABACUS_MODES.length))]:recipe.type;if(!ABACUS_MODES.includes(type))throw Error('Unsupported abacus question.');return {type,settings,task:generateAbacusTask(type,settings,rng)}},
 capture(model){if(HISTORY_NAMES[model.kind]){const d=captureHistory(model);return [G.publishing.record('abacus',d.task?'challenge':'diagram',d,d.task?{type:d.type,settings:d.settings}:null)]}const settings=abacusSettings(model);if(model.task){const task={...model.task};return [G.publishing.record('abacus','challenge',{type:task.mode,settings,task},{type:task.mode,settings})]}return [G.publishing.record('abacus','diagram',{...settings,counts:model.counts,suanUpper:model.suanUpper,suanLower:model.suanLower})]},
 render(item,teacher){if(item.data.historical)return historyPaper(item.data,teacher);return item.kind==='diagram'?abacusPaper(item.data):abacusPaper({...item.data.settings,task:item.data.task},teacher)},
 answerSummary:item=>{const t=item.data.task;if(item.data.historical)return String(t.answer);return ['make10','bond','missing'].includes(t.mode)?'Missing number: '+t.answer+'; final abacus total: '+t.target:'Final abacus total: '+t.target},
 answerGraphic:item=>item.data.historical?historyDiagram(item.data,true):G.exportTools.withAnswerDiagram(()=>abacusPaper({...item.data.settings,task:item.data.task},true)),
 answerNote:item=>{if(!item.data.historical)return '';const k=item.data.device.kind,t=item.data.task;if(k==='reckoning')return 'Accept any counter arrangement with the correct place-value total; if standard digits are required, use at most nine counters in each column.';if(k==='rods')return 'Use the correct rod numeral in each place, alternating rod direction. Empty places represent zero.';if(k==='napier')return 'Use the selected row and add the diagonal groups, carrying as required.';if(k==='slide')return 'Use the '+(t.index==='right'?'right-hand C=10':'left-hand C=1')+' index. Read the D scale with the correct decimal place.';return 'The result windows must show the correct total after '+(t.operation==='add'?'addition':'subtraction')+'; leading zeros are optional.'}
});

function abacusTool(){
  const X=G.exportTools,embedded=new URLSearchParams(location.search).get('embed')==='1';
  let rows=5,counts=Array(5).fill(0),kind='western',showTotal=true,showRowCounts=false,showRowLabels=true;
  let workflow='setup',playMode='free',task=null,taskContext='play',status='',answerInput='',revealed=false,exportStatus='';
  let drag=null;

  const MODES=[
    ['free','Free play'],
    ['show','Show number'],
    ['add','Addition'],
    ['subtract','Subtraction'],
    ['make10','Make 10'],
    ['bond','Number bonds'],
    ['double','Doubles'],
    ['near','Near doubles'],
    ['missing','Missing number'],
    ['skip','Skip counting']
  ];
  const CHALLENGE_MODES=MODES.filter(([id])=>id!=='free');

  const DEVICE_OPTIONS=[
    ['western','Western abacus'],
    ['suanpan','Chinese suanpan'],
    ['soroban','Japanese soroban'],
    ['reckoning','Reckoning board'],
    ['rods','Chinese counting rods'],
    ['napier',"Napier's Bones"],
    ['slide','Slide rule'],
    ['pascaline','Pascaline']
  ];
  let historyHelpOpen=false;
  let reckoning=[0,1,2,6];
  let rodDigits=[0,3,7,2];
  let napierNumber='467',napierMultiplier=3;
  let slideA=2,slideB=3,slideIndex='left';
  let pascalDigits=[0,0,2,8],pascalOperation='add',pascalMessage='ADD mode · tap a numbered dial hole to add that amount.',pascalCarryFlash=[];
  let suanUpper=Array(5).fill(0),suanLower=Array(5).fill(0);
  let colourScheme='classic';
  let historyChallenge=null,historyAnswer='',historyStatus='',historyRevealed=false;
  let historyDrag=null;
  const COLOUR_SCHEMES=[['classic','Honey wood'],['place','Pastel places'],['sea','Ocean'],['berry','Berry'],['forest','Meadow']];

  let challengeSetup=null;
  function rememberChallengeSetup(){
    if(challengeSetup)return;
    challengeSetup={kind,rows,counts:counts.slice(),suanUpper:suanUpper.slice(),suanLower:suanLower.slice(),reckoning:reckoning.slice(),rodDigits:rodDigits.slice(),napierNumber,napierMultiplier,slideA,slideB,slideIndex,pascalDigits:pascalDigits.slice(),pascalOperation,pascalMessage,showTotal,showRowCounts,showRowLabels,colourScheme};
  }
  function restoreChallengeSetup(){
    const s=challengeSetup;challengeSetup=null;if(!s)return;
    ({kind,rows,counts,suanUpper,suanLower,reckoning,rodDigits,napierNumber,napierMultiplier,slideA,slideB,slideIndex,pascalDigits,pascalOperation,pascalMessage,showTotal,showRowCounts,showRowLabels,colourScheme}=s);
    pascalCarryFlash=[];
  }
  function exitChallenge(){
    restoreChallengeSetup();task=null;historyChallenge=null;taskContext='play';workflow='setup';playMode='free';
    status='';answerInput='';revealed=false;historyAnswer='';historyStatus='';historyRevealed=false;renderAll();
  }
  function historicalValue(){
    if(kind==='reckoning')return reckoning.reduce((sum,n,i)=>sum+n*[1000,100,10,1][i],0);
    if(kind==='rods')return Number(rodDigits.join(''));
    if(kind==='napier')return (+napierNumber||0)*napierMultiplier;
    if(kind==='slide')return Math.round(slideA*slideB*100)/100;
    if(kind==='pascaline')return Number(pascalDigits.join(''));
    return total();
  }
  function setHistoricalNumber(value){
    const digits=String(Math.max(0,Math.round(value))).padStart(4,'0').slice(-4).split('').map(Number);
    if(kind==='reckoning')reckoning=digits.slice();
    if(kind==='rods')rodDigits=digits.slice();
    if(kind==='pascaline')pascalDigits=digits.slice();
  }
  function newHistoricalChallenge(operationChoice='random'){
    rememberChallengeSetup();
    historyAnswer='';historyStatus='';historyRevealed=false;
    if(kind==='reckoning'){
      const target=randomInt(24,879);
      reckoning=[0,0,0,0];
      historyChallenge={target,answer:target,requiresAnswer:false,prompt:'Build '+target+' on the reckoning board. Put counters in the correct place-value columns, then press Check.'};
    }else if(kind==='rods'){
      const target=randomInt(102,9876);
      rodDigits=[0,0,0,0];
      historyChallenge={target,answer:target,requiresAnswer:false,prompt:'Show '+target+' with Chinese counting rods. Set each place-value column, then press Check.'};
    }else if(kind==='napier'){
      napierNumber=String(randomInt(12,987));napierMultiplier=randomInt(2,9);
      historyChallenge={target:(+napierNumber)*napierMultiplier,answer:(+napierNumber)*napierMultiplier,requiresAnswer:true,prompt:'Use row '+napierMultiplier+' of the rods to work out '+napierNumber+' × '+napierMultiplier+'. Enter the product.'};
    }else if(kind==='slide'){
      const pairs=[[2,2],[2,3],[2,4],[2.5,2],[3,2],[3,3],[4,2],[1.5,4],[1.2,5],[2.4,3],[4,3],[6,2],[7,2],[7,6],[8,7],[9,4]];
      const [a,b]=pairs[randomInt(0,pairs.length-1)],target=Math.round(a*b*100)/100,useRight=target>10;
      slideA=1;slideB=1;slideIndex='left';
      historyChallenge={a,b,target,answer:target,index:useRight?'right':'left',requiresAnswer:true,requiresInstrument:true,prompt:useRight
        ?'Work out '+a+' × '+b+'. Because the product is beyond 10, use the right-hand C=10 index: slide C=10 above D='+a+', move the cursor to C='+b+', then enter the value represented on D.'
        :'Work out '+a+' × '+b+'. FIRST MOVE: use the LEFT end of C. Put C=1 directly over D='+a+'. THEN move the cursor to C='+b+'. Read D and enter the product.'};
    }else if(kind==='pascaline'){
      const operation=['add','subtract'].includes(operationChoice)?operationChoice:Math.random()<.5?'add':'subtract';
      let start,amount,target;
      if(operation==='add'){
        if(Math.random()<.72){
          const tens=randomInt(1,6),ones=randomInt(6,9);
          start=tens*10+ones;
          amount=randomInt(1,2)*10+randomInt(Math.max(1,10-ones),9);
        }else{
          start=randomInt(12,75);amount=randomInt(6,24);
        }
        target=start+amount;
      }else{
        if(Math.random()<.72){
          const tens=randomInt(2,9),ones=randomInt(0,5);
          start=tens*10+ones;
          const subTens=randomInt(0,Math.max(0,tens-1)),subOnes=randomInt(ones+1,9);
          amount=subTens*10+subOnes;
          if(amount===0||amount>=start)amount=Math.min(start-1,10+subOnes);
        }else{
          start=randomInt(25,95);amount=randomInt(5,Math.min(24,start-1));
        }
        target=start-amount;
      }
      pascalOperation=operation;
      setHistoricalNumber(start);
      pascalMessage='Challenge loaded · '+(operation==='add'?'add ':'subtract ')+amount+' using the input dials.';
      pascalCarryFlash=[];
      historyChallenge={start,amount,operation,operationScope:['add','subtract'].includes(operationChoice)?operationChoice:'random',target,answer:target,requiresAnswer:false,prompt:'The Pascaline starts at '+start+'. '+(operation==='add'?'Add ':'Subtract ')+amount+' using the numbered input dials. Enter each place value, watch for '+(operation==='add'?'carrying':'borrowing')+', then press Check when the result windows show your answer.'};
    }
    renderAll();
  }
  function checkHistoricalChallenge(){
    if(!historyChallenge||historyRevealed)return;
    const answerOk=!historyChallenge.requiresAnswer||String(historyAnswer).trim()!==''&&Math.abs(Number(historyAnswer)-Number(historyChallenge.answer))<0.011;
    const deviceOk=historyChallenge.requiresInstrument&&kind==='slide'
      ?Math.abs(slideA-historyChallenge.a)<=0.11&&Math.abs(slideB-historyChallenge.b)<=0.11&&slideIndex===(historyChallenge.index||((historyChallenge.a*historyChallenge.b)>10?'right':'left'))
      :historyChallenge.requiresAnswer?true:historicalValue()===historyChallenge.target;
    historyStatus=deviceOk&&answerOk?'Correct ✓':historyChallenge.requiresInstrument&&!deviceOk?'Not yet — check which C index (1 or 10) you need, then align the slide and cursor.':historyChallenge.requiresAnswer?'Not quite — check the instrument and your entered answer.':'Not yet — keep working on the device.';
    if(deviceOk&&answerOk)historyRevealed=true;
    renderStage();
  }
  function revealHistoricalChallenge(){
    if(!historyChallenge)return;
    historyRevealed=true;historyStatus='Answer shown';
    if(historyChallenge.requiresAnswer)historyAnswer=String(historyChallenge.answer);
    if(kind==='slide'&&historyChallenge.a){slideA=historyChallenge.a;slideB=historyChallenge.b;slideIndex=historyChallenge.index||((slideA*slideB)<=10?'left':'right');}
    else if(!historyChallenge.requiresAnswer)setHistoricalNumber(historyChallenge.target);
    renderStage();
  }
  function historyChallengeBanner(){
    if(!historyChallenge)return '';
    const input=historyChallenge.requiresAnswer?'<label class="gd-ab-answer">Answer <input type="text" inputmode="none" data-ab-history-answer value="'+esc(historyAnswer)+'"'+(historyRevealed?' disabled':'')+'></label>':'';
    return '<section class="gd-ab-task gd-history-task gd-native-challenge"><div class="gd-ab-task-head"><div><span>CHALLENGE</span><strong>'+esc(historyChallenge.prompt)+'</strong></div><em>'+esc(historyStatus)+'</em></div>'+input+'<div class="gd-ab-task-actions"><button type="button" data-ab-history-check'+(historyRevealed?' disabled':'')+'>Check</button><button type="button" data-ab-history-another>Another</button>'+(historyRevealed?'':'<button type="button" data-ab-history-reveal>Reveal answer</button>')+'<button type="button" data-ab-history-end>Exit challenge</button></div></section>';
  }

  function isAbacusKind(){return kind==='western'||kind==='suanpan'||kind==='soroban'}
  function suanRodValue(i){return (suanUpper[i]||0)*5+(suanLower[i]||0)}
  function syncSuanFromCounts(){
    suanUpper=Array.from({length:rows},(_,i)=>Math.floor((counts[i]||0)/5));
    suanLower=Array.from({length:rows},(_,i)=>(counts[i]||0)%5);
  }
  function changeDevice(next){
    restoreChallengeSetup();
    const previousValue=total();
    kind=DEVICE_OPTIONS.some(([id])=>id===next)?next:'western';
    task=null;historyChallenge=null;workflow='setup';historyHelpOpen=false;
    counts=Array(rows).fill(0);
    setTotal(Math.min(previousValue,capacity()),false);
    renderAll();
  }
  function deviceHelp(){
    const data={
      western:{
        title:'Western abacus',
        history:'Counting boards and bead frames have very old roots across several cultures. This is a modern Western school-style base-ten counting frame rather than a reconstruction of one single ancient object.',
        intro:'A base-ten counting frame. Each horizontal row has ten beads and represents a place value; beads count when moved to the left.',
        steps:['Move beads left to count them.','Read the rows as thousands, hundreds, tens and ones.','For addition, move more beads left. Ten beads in one row can be exchanged for one bead in the next place-value row.','For subtraction, move beads back and exchange 1 higher-place bead for 10 lower-place beads when needed.'],
        example:'Example: show 247, then add 36. Add 3 tens, then 6 ones. Regroup 10 ones as 1 ten. The result is 283.'
      },
      suanpan:{
        title:'Chinese suanpan',
        history:'The Chinese suanpan uses more beads on each rod than the modern Japanese soroban. A common traditional form has two upper beads and five lower beads, giving extra working capacity on each rod.',
        intro:'Each vertical rod is one place value. Each upper bead touching the beam is worth 5 and each lower bead touching the beam is worth 1.',
        steps:['Only beads moved towards the central beam count.','There are two 5-beads above the beam and five 1-beads below it.','For ordinary decimal work, regroup when a rod reaches 10 even though the physical rod can hold more.','The extra beads make some historical calculation methods possible and show why the later soroban could be simplified.'],
        example:'Example: to show 8, move one upper bead to the beam for 5 and three lower beads to the beam for 3 more. To show 13 on one rod in free play, use two upper beads and three lower beads.'
      },
      soroban:{
        title:'Japanese soroban',
        history:'The soroban developed in Japan from earlier East Asian abaci. The one-upper-bead and four-lower-bead form shown here is the familiar modern Japanese arrangement.',
        intro:'Each vertical rod is a place value. The upper bead is worth 5 and each lower bead is worth 1 when touching the middle beam.',
        steps:['Only beads touching the beam count.','Use the lower beads for 1–4 and the upper bead plus lower beads for 5–9.','Read rods from left to right by place value.','When a column passes 9, clear it and carry 1 to the rod on the left.'],
        example:'Example: 347 uses 3 lower beads in hundreds, 4 lower beads in tens, and the 5-bead plus 2 lower beads in ones.'
      },
      reckoning:{
        title:'Reckoning board',
        history:'Counter boards and reckoning tables were used in Europe for trade and arithmetic for centuries. Our M–C–X–I layout makes the place values explicit for pupils.',
        intro:'A reckoning board uses loose counters on place-value columns. It is a physical ancestor of modern place-value boards.',
        steps:['Place counters in M, C, X and I for thousands, hundreds, tens and ones.','Each counter is worth the value of its column.','Exchange 10 counters in one column for 1 counter in the column to its left.','Reverse the exchange when subtracting.'],
        example:'Example: 126 is 1 hundred, 2 tens and 6 ones. Add 85, regroup the ones and tens, and the result is 211.'
      },
      rods:{
        title:'Chinese counting rods',
        history:'Counting-board arithmetic with rods was used in ancient China, and surviving mathematical texts describe using rods for arithmetic, multiplication, division and other calculations.',
        intro:'Counting rods represented decimal place value with small rods. Adjacent places alternate orientation so digits stay distinct.',
        steps:['Each box is a decimal place. An empty box represents zero.','Use + and − to change a digit from 0 to 9.','Read the four places together as one number.','For arithmetic, work column by column and regroup 10 into 1 of the next place.'],
        example:'Example: 372 + 48. Ones make 10, so write 0 and carry 1 ten. Tens then make 12, so carry 1 hundred. Result: 420.'
      },
      napier:{
        title:"Napier's Bones",
        history:'Scottish mathematician John Napier published his calculating rods in Rabdology in 1617. They became a widely used aid for multiplication and later a teaching tool.',
        intro:'Napier’s rods turn multiplication into reading small products and adding along diagonals.',
        steps:['Choose the rods for the digits of the number.','Choose a multiplier row from 1 to 9.','Read the two-digit products in that row.','Add the diagonals from right to left, carrying when needed.'],
        example:'Example: 467 × 3 uses the row 12 | 18 | 21. Adding along the diagonals gives 1401.'
      },
      slide:{
        title:'Slide rule',
        history:'The slide rule grew from 17th-century logarithmic scales associated with Edmund Gunter and William Oughtred, and became a standard calculating instrument for nearly three centuries.',
        intro:'A slide rule multiplies and divides by adding or subtracting logarithmic distances.',
        steps:['To multiply a × b, align C=1 above D=a.','Find b on the C scale and move the glass cursor to it.','Read the significant digits directly below on D. The scale does not tell you where the decimal point belongs.','If the answer runs off the right end, use the C=10 index instead. Use estimation to place the decimal and get the full answer.'],
        example:'Example 1: for 2 × 3, align C=1 with D=2, then read D=6 under C=3. Example 2: for 7 × 2, the answer runs past 10, so align the right-hand C=10 with D=7; under C=2, D reads 1.4, which means 14.'
      },
      pascaline:{
        title:'Pascaline',
        history:'Blaise Pascal built mechanical adding machines in France from the 1640s. A number was entered with a stylus in a toothed input wheel and the mechanism carried automatically between places. Historical Pascalines performed subtraction using complementary-number methods. Our SUBTRACT mode turns the classroom model backwards so pupils can see borrowing directly; it is a teaching aid rather than a literal reconstruction of Pascal’s subtraction procedure.',
        intro:'Use ADD or SUBTRACT, then tap numbered holes on the place-value dials. The result windows update automatically and show carrying or borrowing between places.',
        steps:['Choose ADD or SUBTRACT on the machine.','Read the result in the four windows: Thousands, Hundreds, Tens and Ones.','Tap a numbered hole on a dial. In ADD mode, 5 on Ones adds 5 and 3 on Tens adds 30. In SUBTRACT mode, the same inputs subtract those amounts.','When a place crosses 9→0 in ADD mode the next place carries. When subtraction needs a value from the next place, the machine shows a borrow.','For a multi-digit amount, enter each place separately.'],
        example:'Addition: start at 28, ADD 15 by tapping 1 on Tens then 5 on Ones; the result is 43. Subtraction: start at 42, choose SUBTRACT, tap 1 on Tens then 5 on Ones; the Ones place borrows and the result is 27.'
      }
    }[kind];
    return data||data.western;
  }
  function themeSwitcher(){
    return '<div class="gd-ab-palette" role="group" aria-label="Colour scheme"><span class="gd-ab-palette-title">Colour</span>'+COLOUR_SCHEMES.map(([id,label])=>'<button type="button" class="gd-ab-palette-choice gd-ab-palette-choice--'+id+(colourScheme===id?' is-active':'')+'" data-ab-stage-theme="'+id+'" aria-label="Colour scheme: '+esc(label)+'" aria-pressed="'+(colourScheme===id)+'" title="'+esc(label)+'"><span class="gd-ab-palette-dot" aria-hidden="true"></span><span class="gd-ab-palette-label">'+esc(label)+'</span></button>').join('')+'</div>';
  }
  function deviceSwitcher(){
    return '<label class="gd-ab-device-switcher"><span>Device</span><select data-ab-stage-kind aria-label="Choose calculating device">'+DEVICE_OPTIONS.map(([id,label])=>'<option value="'+id+'"'+(kind===id?' selected':'')+'>'+esc(label)+'</option>').join('')+'</select></label>';
  }
  function deviceToolbar(){
    return '<div class="gd-ab-device-toolbar">'+deviceSwitcher()+themeSwitcher()+helpButton()+'</div>';
  }
  function helpButton(){
    return '<button class="gd-history-help-btn" type="button" data-ab-help-open aria-label="How to use this device">? <span>How to use</span></button>';
  }
  function openDeviceHelp(){
    const h=deviceHelp();
    if(embedded&&window.parent!==window){
      window.parent.postMessage({type:'tt99-board-help',help:{title:h.title,intro:h.intro,steps:h.steps,example:h.example,history:h.history||''}},location.origin);
      return;
    }
    historyHelpOpen=true;renderStage();
  }
  function helpOverlay(){
    if(!historyHelpOpen)return '';
    const h=deviceHelp();
    return '<aside class="gd-history-guide" data-ab-help-overlay aria-label="'+esc(h.title)+' instructions"><div class="gd-history-guide__head"><div><span>How to use</span><h3>'+esc(h.title)+'</h3></div><button class="gd-history-help__close" type="button" data-ab-help-close aria-label="Close instructions">×</button></div><p class="gd-history-guide__intro">'+esc(h.intro)+'</p><ol>'+h.steps.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ol><div class="gd-history-example"><strong>Worked example</strong><p>'+esc(h.example)+'</p></div><details class="gd-history-context"><summary>History</summary><p>'+esc(h.history||'')+'</p></details></aside>';
  }
  function rodDigitSvg(d,vertical){
    d=clamp(Math.round(d),0,9);
    if(!d)return '<span class="gd-rod-zero" aria-label="Empty place"></span>';
    const five=d>=5,ones=d%5,parts=[];
    const line=(x1,y1,x2,y2)=>'<line x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'" />';
    if(vertical){
      if(five)parts.push(line(8,6,46,6));
      for(let i=0;i<ones;i++){const x=12+i*8;parts.push(line(x,five?14:7,x,49))}
    }else{
      if(five)parts.push(line(6,8,6,46));
      for(let i=0;i<ones;i++){const y=12+i*8;parts.push(line(five?14:7,y,49,y))}
    }
    return '<svg viewBox="0 0 56 56" aria-hidden="true">'+parts.join('')+'</svg>';
  }
  function napierCell(d,row){
    const p=d*row,t=Math.floor(p/10),o=p%10;
    return '<div class="gd-napier-cell'+(row===napierMultiplier?' is-selected':'')+'"><span>'+t+'</span><i></i><b>'+o+'</b></div>';
  }
  function napierBone(d,index){
    return '<div class="gd-napier-bone"><div class="gd-napier-head"><strong>'+d+'</strong>'+(!historyChallenge?'<button type="button" class="gd-napier-remove" data-ab-napier-remove="'+index+'" aria-label="Remove rod '+d+'">×</button>':'')+'</div>'+Array.from({length:9},(_,i)=>napierCell(+d,i+1)).join('')+'</div>';
  }
  function slidePos(v){return Math.log10(v)*100}
  function setSlideFromFactors(a,b){
    slideA=clamp(Number(a)||1,1,9.9);
    slideB=clamp(Number(b)||1,1,9.9);
    slideIndex=slideA*slideB>10?'right':'left';
  }
  function slideOffset(){return slidePos(slideA)-(slideIndex==='right'?100:0)}
  function slideCursorPos(){return clamp(slideOffset()+slidePos(slideB),0,100)}
  function slideTicks(){
    let out='';
    for(let n=10;n<=100;n++){
      const v=n/10;if(v>10)break;
      const p=slidePos(v),major=n%10===0,mid=!major&&n%5===0;
      out+='<span class="gd-slide-tick'+(major?' is-major':mid?' is-mid':'')+'" style="left:'+p+'%"><i></i>'+(major?'<b>'+Math.round(v)+'</b>':'')+'</span>';
    }
    return out;
  }
  function historicalControls(){
    const common=field('Colour scheme','<select class="gd-select" id="ab-theme">'+COLOUR_SCHEMES.map(([id,label])=>'<option value="'+id+'"'+(colourScheme===id?' selected':'')+'>'+label+'</option>').join('')+'</select>')+
      '<div class="gd-row"><button class="gd-btn gd-btn--primary" id="ab-history-challenge" type="button">New challenge</button>'+(kind==='pascaline'?'<button class="gd-btn" data-ab-history-operation="add" type="button">Addition</button><button class="gd-btn" data-ab-history-operation="subtract" type="button">Subtraction</button>':'')+(historyChallenge?'<button class="gd-btn" id="ab-history-end-control" type="button">End challenge</button>':'')+'</div>';
    if(kind==='reckoning')return common+'<div class="gd-row"><button class="gd-btn gd-btn--primary" id="ab-h-example" type="button">Show 126</button><button class="gd-btn" id="ab-h-regroup" type="button">Regroup 10 → 1</button><button class="gd-btn" id="ab-h-clear" type="button">Clear</button></div><p class="gd-help">Add and remove counters directly on the board.</p>';
    if(kind==='rods')return common+'<div class="gd-row"><button class="gd-btn gd-btn--primary" id="ab-h-example" type="button">Show 372</button><button class="gd-btn" id="ab-h-clear" type="button">Clear</button></div><p class="gd-help">Use + and − under each place to change the rod numeral.</p>';
    if(kind==='napier')return common+field('Number','<input class="gd-input" id="ab-napier-number" inputmode="numeric" maxlength="5" value="'+esc(napierNumber)+'"'+(historyChallenge?' disabled':'')+'>')+field('Multiply by','<select class="gd-select" id="ab-napier-mult"'+(historyChallenge?' disabled':'')+'>'+Array.from({length:9},(_,i)=>'<option value="'+(i+1)+'"'+(i+1===napierMultiplier?' selected':'')+'>'+(i+1)+'</option>').join('')+'</select>')+'<p class="gd-help">Choose a number and multiplier, then read the selected row and add its diagonals.</p>';
    if(kind==='slide')return common+field('First factor','<input id="ab-slide-a" type="range" min="1" max="9.9" step="0.1" value="'+slideA+'"><strong id="ab-slide-a-v">'+slideA+'</strong>')+field('Second factor','<input id="ab-slide-b" type="range" min="1" max="9.9" step="0.1" value="'+slideB+'"><strong id="ab-slide-b-v">'+slideB+'</strong>')+'<p class="gd-help">Drag the C scale and glass cursor directly. Because multiplication can be reversed, the rule automatically uses the factor order that keeps more of the scale visible.</p>';
    if(kind==='pascaline')return common+'<div class="gd-row"><button class="gd-btn gd-btn--primary" id="ab-h-example" type="button">Worked start</button><button class="gd-btn" id="ab-h-clear" type="button">Reset machine</button></div><p class="gd-help">Choose ADD or SUBTRACT on the machine, then use the numbered place-value dials. Carrying and borrowing happen automatically.</p>';
    return '';
  }
  function renderHistoricalStage(){
    let body='';
    if(kind==='reckoning'){
      const cols=[['M','Thousands',1000],['C','Hundreds',100],['X','Tens',10],['I','Ones',1]];
      const value=reckoning.reduce((s,n,i)=>s+n*cols[i][2],0);
      body='<div class="gd-reckoning"><div class="gd-reckoning-title">RECKONING TABLE</div><div class="gd-reckoning-grid">'+cols.map((c,i)=>'<div class="gd-reckoning-col" data-ab-rb-col="'+i+'"><div class="gd-reckoning-heading"><b>'+c[0]+'</b><span>'+c[1]+'</span></div><div class="gd-reckoning-space">'+Array.from({length:reckoning[i]},(_,j)=>'<button type="button" class="gd-reckoning-counter" data-ab-rb-remove="'+i+'" aria-label="Remove '+c[1]+' counter"></button>').join('')+'<button type="button" class="gd-reckoning-add" data-ab-rb-add="'+i+'">+ counter</button></div></div>').join('')+'</div><div class="gd-history-readout">Value <strong>'+(historyChallenge&&!historyRevealed?'?':value.toLocaleString('en-GB'))+'</strong></div></div>';
    }else if(kind==='rods'){
      body='<div class="gd-counting-rods"><div class="gd-rods-grid">'+rodDigits.map((d,i)=>'<div class="gd-rods-cell"><span>'+['Thousands','Hundreds','Tens','Ones'][i]+'</span><button type="button" class="gd-rods-mat" data-ab-rod-cycle="'+i+'" aria-label="Increase '+['Thousands','Hundreds','Tens','Ones'][i]+' digit">'+rodDigitSvg(d,i%2===0)+'</button><div class="gd-rods-stepper"><button type="button" data-ab-rod-dec="'+i+'">−</button><b>'+d+'</b><button type="button" data-ab-rod-inc="'+i+'">+</button></div></div>').join('')+'</div><div class="gd-history-readout">Number <strong>'+(historyChallenge&&!historyRevealed?'?':Number(rodDigits.join('')).toLocaleString('en-GB'))+'</strong></div></div>';
    }else if(kind==='napier'){
      const product=(+napierNumber||0)*napierMultiplier;
      body='<div class="gd-napier"><div class="gd-napier-title"><strong>NAPIER\'S BONES</strong><span>Multiplication rods</span></div><div class="gd-napier-working"><div class="gd-napier-row-index"><span>×</span>'+Array.from({length:9},(_,i)=>'<button type="button" data-ab-napier-row="'+(i+1)+'"'+(historyChallenge?' disabled':'')+' class="'+(napierMultiplier===i+1?'is-selected':'')+'">'+(i+1)+'</button>').join('')+'</div><div class="gd-napier-bones">'+napierNumber.split('').map((d,i)=>napierBone(d,i)).join('')+'</div></div>'+(historyChallenge?'':'<div class="gd-napier-tray" aria-label="Choose a rod">'+Array.from({length:10},(_,i)=>'<button type="button" data-ab-napier-add="'+i+'">'+i+'</button>').join('')+'<button type="button" data-ab-napier-clear>Clear</button></div>')+'<div class="gd-napier-footer"><span class="gd-napier-highlight">Use row <strong>'+napierMultiplier+'</strong></span><span class="gd-history-readout">'+esc(napierNumber)+' × '+napierMultiplier+' = <strong>'+(historyChallenge&&!historyRevealed?'?':product.toLocaleString('en-GB'))+'</strong></span></div></div>';
    }else if(kind==='slide'){
      const shift=slideOffset(),cursor=slideCursorPos(),scaleReading=Math.round(Math.pow(10,cursor/100)*100)/100,targetA=historyChallenge?.a??slideA,targetB=historyChallenge?.b??slideB,targetProduct=Math.round(targetA*targetB*1000)/1000,targetIndex=(historyChallenge?.index??(targetA*targetB<=10?'left':'right')),targetIndexLabel=targetIndex==='right'?'10':'1',targetD=slidePos(targetA);
      body='<div class="gd-slide-rule">'+(historyChallenge?'<div class="gd-slide-coach '+(targetIndex==='right'?'is-right':'is-left')+'"><span>FIRST MOVE</span><strong>'+(targetIndex==='right'?'RIGHT end · C=10 → D='+targetA:'LEFT end · C=1 → D='+targetA)+'</strong><small>Then move the cursor to C='+targetB+'</small></div>':'')+'<div class="gd-slide-shell"><div class="gd-slide-brand"><strong>TEACHING SLIDE RULE</strong><span>C / D logarithmic scales</span></div><div class="gd-slide-body"><div class="gd-slide-stock"><div class="gd-slide-stock-edge"></div><span class="gd-slide-row-tag gd-slide-row-tag--c">C</span><div class="gd-slide-channel" data-ab-slide-track aria-label="Drag the C scale"><div class="gd-slide-scale gd-slide-c" data-ab-slide-c style="transform:translateX('+shift+'%)"><span class="gd-slide-index gd-slide-index--left'+(historyChallenge&&targetIndex==='left'?' is-target':'')+'"><small>LEFT</small><b>1</b></span><span class="gd-slide-index gd-slide-index--right'+(historyChallenge&&targetIndex==='right'?' is-target':'')+'"><small>RIGHT</small><b>10</b></span>'+slideTicks()+'</div></div><span class="gd-slide-row-tag gd-slide-row-tag--d">D</span><div class="gd-slide-scale gd-slide-d">'+slideTicks()+'</div>'+(historyChallenge?'<span class="gd-slide-target" style="left:'+targetD+'%" aria-hidden="true"><em>ALIGN</em><i></i><b>'+targetA+'</b></span>':'')+'</div><div class="gd-slide-cursor" data-ab-slide-cursor style="left:'+cursor+'%"><span class="gd-slide-glass"></span><i></i><b></b></div></div></div><div class="gd-slide-steps"><span>1 · Move '+(targetIndex==='right'?'RIGHT C=10':'LEFT C=1')+' to D='+targetA+'</span><span>2 · Find C='+targetB+'</span><span>3 · Read D, then place the decimal by estimation</span><button type="button" class="gd-slide-reset" data-ab-slide-reset>Reset</button></div><div class="gd-slide-reading">D under cursor ≈ <strong>'+scaleReading.toLocaleString('en-GB',{maximumFractionDigits:2})+'</strong></div><div class="gd-history-readout">'+targetA+' × '+targetB+' ≈ <strong>'+(historyChallenge&&!historyRevealed?'?':targetProduct.toLocaleString('en-GB',{maximumFractionDigits:3}))+'</strong></div></div>';
    }else if(kind==='pascaline'){
      const value=Number(pascalDigits.join('')),wheels=pascalDigits.map((d,i)=>pascalDial(i,d)).join('');
      body='<div class="gd-pascaline gd-pascaline--'+pascalOperation+'"><div class="gd-pascaline-plate"><div class="gd-pascaline-head"><div><strong>PASCALINE</strong><span>Mechanical calculator · classroom model</span></div><div class="gd-pascaline-result"><small>RESULT</small><b>'+pascalDigits.join('')+'</b></div></div><div class="gd-pascaline-mode" role="group" aria-label="Pascaline operation"><button type="button" data-ab-pa-mode="add" class="'+(pascalOperation==='add'?'is-active':'')+'"'+(historyChallenge?' disabled':'')+'>+ ADD</button><button type="button" data-ab-pa-mode="subtract" class="'+(pascalOperation==='subtract'?'is-active':'')+'"'+(historyChallenge?' disabled':'')+'>− SUBTRACT</button></div><div class="gd-pascaline-rule"><span>Touch a number on a dial to '+(pascalOperation==='add'?'add':'subtract')+' that many of its place value</span></div><div class="gd-pascaline-wheels">'+wheels+'</div><div class="gd-pascaline-status" role="status">'+esc(pascalMessage)+'</div><div class="gd-pascaline-actions">'+(historyChallenge?'<button type="button" data-ab-pa-restart>Restart '+historyChallenge.start+'</button>':'<button type="button" data-ab-pa-example>Start '+(pascalOperation==='add'?'28':'42')+'</button>')+'<button type="button" data-ab-pa-reset>Reset to 0</button></div><div class="gd-pascaline-gears" aria-hidden="true">'+Array.from({length:7},(_,i)=>'<i style="--i:'+i+'">✺</i>').join('')+'</div></div><div class="gd-history-readout">Value <strong>'+value.toLocaleString('en-GB')+'</strong></div></div>';
    }
    q('#gd-stage').innerHTML=historyChallengeBanner()+'<div class="gd-history-stage gd-history-theme--'+colourScheme+'">'+deviceToolbar()+'<div class="gd-history-main"><div class="gd-history-device">'+body+'</div>'+helpOverlay()+'</div></div>';
    bindHistoricalStage();
  }
  function pascalPlaceValue(index){return [1000,100,10,1][index]||1}
  function pascalPlaceName(index){return ['Thousands','Hundreds','Tens','Ones'][index]||'place'}
  function pascalApply(index,amount){
    amount=clamp(Math.round(Number(amount)||0),0,9);
    const placeValue=pascalPlaceValue(index),change=amount*placeValue,before=Number(pascalDigits.join(''));
    if(amount===0){pascalMessage='0 changes nothing · choose 1–9 on a dial.';pascalCarryFlash=[];renderHistoricalStage();return}
    if(pascalOperation==='subtract'&&change>before){
      pascalCarryFlash=[];
      pascalMessage='Cannot subtract '+change.toLocaleString('en-GB')+' from '+before.toLocaleString('en-GB')+' without going below 0.';
      renderHistoricalStage();return;
    }
    if(pascalOperation==='add'&&before+change>9999){
      pascalCarryFlash=[];
      pascalMessage='The four-digit machine can display up to 9,999. Reset it before adding beyond that limit.';
      renderHistoricalStage();return;
    }
    const delta=pascalOperation==='add'?1:-1,transfers=[];
    for(let step=0;step<amount;step++){
      const moved=pascalStep(index,delta);
      moved.forEach(x=>{if(x>=0&&!transfers.includes(x))transfers.push(x)});
    }
    const after=Number(pascalDigits.join(''));
    pascalCarryFlash=transfers;
    if(pascalOperation==='add'){
      pascalMessage='Added '+change.toLocaleString('en-GB')+' ('+amount+' × '+placeValue.toLocaleString('en-GB')+') · '+before.toLocaleString('en-GB')+' → '+after.toLocaleString('en-GB')+(transfers.length?' · CARRY to '+transfers.map(pascalPlaceName).join(', '):'');
    }else{
      pascalMessage='Subtracted '+change.toLocaleString('en-GB')+' ('+amount+' × '+placeValue.toLocaleString('en-GB')+') · '+before.toLocaleString('en-GB')+' → '+after.toLocaleString('en-GB')+(transfers.length?' · BORROW from '+transfers.map(pascalPlaceName).join(', '):'');
    }
  }
  function pascalDial(index,digit){
    const placeValue=pascalPlaceValue(index),holes=Array.from({length:10},(_,n)=>{
      const angle=n*36;
      return '<button type="button" class="gd-pascaline-hole gd-pascaline-hole--'+n+'" data-ab-pa-input="'+index+':'+n+'" style="--pa-angle:'+angle+'deg;--pa-counter:'+(-angle)+'deg" aria-label="'+(pascalOperation==='add'?'Add ':'Subtract ')+(n*placeValue).toLocaleString('en-GB')+' using the '+pascalPlaceName(index)+' dial"><span>'+n+'</span></button>';
    }).join('');
    return '<div class="gd-pascaline-wheel-wrap'+(pascalCarryFlash.includes(index)?(pascalOperation==='add'?' is-carry':' is-borrow'):'')+'"><span class="gd-pascaline-place">'+pascalPlaceName(index)+'</span><div class="gd-pascaline-window" aria-label="'+pascalPlaceName(index)+' result digit">'+digit+'</div><div class="gd-pascaline-dial" data-ab-pa-wheel="'+index+'" aria-label="'+pascalPlaceName(index)+' input dial">'+holes+'<span class="gd-pascaline-hub"><i></i><b>'+(pascalOperation==='add'?'+':'−')+'</b></span></div></div>';
  }
  function pascalStep(index,delta){
    const carried=[];
    for(let i=index;i>=0;i--){
      pascalDigits[i]+=delta;
      if(pascalDigits[i]>=0&&pascalDigits[i]<=9)break;
      if(pascalDigits[i]>9){
        pascalDigits[i]=0;delta=1;
        if(i>0)carried.push(i-1);
      }else{
        pascalDigits[i]=9;delta=-1;
        if(i>0)carried.push(i-1);
      }
    }
    return carried;
  }
  function bindHistoricalStage(){
    qa('[data-ab-stage-theme]').forEach(stageTheme=>stageTheme.onclick=()=>{const next=stageTheme.dataset.abStageTheme;colourScheme=COLOUR_SCHEMES.some(([id])=>id===next)?next:'classic';renderAll()});
    const answer=q('[data-ab-history-answer]');if(answer)answer.oninput=()=>{historyAnswer=answer.value;historyStatus=''};
    const check=q('[data-ab-history-check]');if(check)check.onclick=checkHistoricalChallenge;
    const another=q('[data-ab-history-another]');if(another)another.onclick=()=>newHistoricalChallenge(historyChallenge?.operationScope||'random');
    const reveal=q('[data-ab-history-reveal]');if(reveal)reveal.onclick=revealHistoricalChallenge;
    const end=q('[data-ab-history-end]');if(end)end.onclick=exitChallenge;
    const stageKind=q('[data-ab-stage-kind]');if(stageKind)stageKind.onchange=()=>{changeDevice(stageKind.value)};
    const open=q('[data-ab-help-open]');if(open)open.onclick=openDeviceHelp;
    const close=q('[data-ab-help-close]');if(close)close.onclick=()=>{historyHelpOpen=false;renderHistoricalStage()};
    qa('[data-ab-rb-add]').forEach(b=>b.onclick=()=>{reckoning[+b.dataset.abRbAdd]++;renderHistoricalStage()});
    qa('[data-ab-rb-remove]').forEach(b=>{
      b.onclick=()=>{if(b.dataset.abDragged==='1'){b.dataset.abDragged='';return}const i=+b.dataset.abRbRemove;reckoning[i]=Math.max(0,reckoning[i]-1);renderHistoricalStage()};
      b.onpointerdown=e=>{if(e.button!==0)return;historyDrag={type:'counter',source:+b.dataset.abRbRemove,pointerId:e.pointerId,startX:e.clientX,startY:e.clientY,moved:false,el:b};b.classList.add('is-dragging');try{b.setPointerCapture(e.pointerId)}catch(_){}};
      b.onpointermove=e=>{if(!historyDrag||historyDrag.el!==b)return;const dx=e.clientX-historyDrag.startX,dy=e.clientY-historyDrag.startY;if(Math.hypot(dx,dy)>6)historyDrag.moved=true;b.style.transform='translate('+dx+'px,'+dy+'px) scale(1.08)'};
      b.onpointerup=e=>{if(!historyDrag||historyDrag.el!==b)return;const d=historyDrag;historyDrag=null;b.classList.remove('is-dragging');b.style.transform='';if(d.moved){b.dataset.abDragged='1';const hit=document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-ab-rb-col]');if(hit){const dest=+hit.dataset.abRbCol;if(dest!==d.source){reckoning[d.source]=Math.max(0,reckoning[d.source]-1);reckoning[dest]++;renderHistoricalStage();}}}};
      b.onpointercancel=()=>{historyDrag=null;b.classList.remove('is-dragging');b.style.transform=''};
    });
    qa('[data-ab-rod-cycle]').forEach(b=>b.onclick=()=>{const i=+b.dataset.abRodCycle;rodDigits[i]=(rodDigits[i]+1)%10;renderHistoricalStage()});
    qa('[data-ab-rod-dec]').forEach(b=>b.onclick=()=>{const i=+b.dataset.abRodDec;rodDigits[i]=(rodDigits[i]+9)%10;renderHistoricalStage()});
    qa('[data-ab-rod-inc]').forEach(b=>b.onclick=()=>{const i=+b.dataset.abRodInc;rodDigits[i]=(rodDigits[i]+1)%10;renderHistoricalStage()});
    qa('[data-ab-napier-row]').forEach(b=>b.onclick=()=>{if(historyChallenge)return;napierMultiplier=+b.dataset.abNapierRow;renderAll()});
    qa('[data-ab-napier-add]').forEach(b=>b.onclick=()=>{if(historyChallenge||napierNumber.length>=5)return;napierNumber=(napierNumber==='0'?'':napierNumber)+b.dataset.abNapierAdd;renderAll()});
    qa('[data-ab-napier-remove]').forEach(b=>b.onclick=()=>{if(historyChallenge)return;const i=+b.dataset.abNapierRemove;napierNumber=napierNumber.slice(0,i)+napierNumber.slice(i+1);if(!napierNumber)napierNumber='0';renderAll()});
    const napierClear=q('[data-ab-napier-clear]');if(napierClear)napierClear.onclick=()=>{napierNumber='0';renderAll()};
    qa('[data-ab-pa-input]').forEach(b=>b.onclick=e=>{
      e.stopPropagation();
      const [idx,amount]=String(b.dataset.abPaInput).split(':').map(Number);
      pascalApply(idx,amount);renderHistoricalStage();
    });
    qa('[data-ab-pa-mode]').forEach(b=>b.onclick=()=>{
      if(historyChallenge)return;
      pascalOperation=b.dataset.abPaMode==='subtract'?'subtract':'add';
      pascalCarryFlash=[];
      pascalMessage=(pascalOperation==='add'?'ADD':'SUBTRACT')+' mode · tap a numbered dial hole to '+pascalOperation+' that amount.';
      renderHistoricalStage();
    });
    const paExample=q('[data-ab-pa-example]');if(paExample)paExample.onclick=()=>{
      if(pascalOperation==='add'){
        pascalDigits=[0,0,2,8];pascalMessage='Start at 28 · ADD 15: tap 1 on Tens, then 5 on Ones.';
      }else{
        pascalDigits=[0,0,4,2];pascalMessage='Start at 42 · SUBTRACT 15: tap 1 on Tens, then 5 on Ones.';
      }
      pascalCarryFlash=[];renderHistoricalStage();
    };
    const paRestart=q('[data-ab-pa-restart]');if(paRestart)paRestart.onclick=()=>{setHistoricalNumber(historyChallenge?.start||0);pascalOperation=historyChallenge?.operation||pascalOperation;pascalCarryFlash=[];pascalMessage='Challenge restarted at '+(historyChallenge?.start||0)+' · '+(pascalOperation==='add'?'ADD':'SUBTRACT')+' '+(historyChallenge?.amount||'')+'.';renderHistoricalStage()};
    const paReset=q('[data-ab-pa-reset]');if(paReset)paReset.onclick=()=>{pascalDigits=[0,0,0,0];pascalCarryFlash=[];pascalMessage='Reset to 0.';renderHistoricalStage()};
    qa('[data-ab-pa-wheel]').forEach(w=>{
      w.onpointerdown=e=>{if(e.button!==0||e.target.closest('[data-ab-pa-input]'))return;historyDrag={type:'wheel',index:+w.dataset.abPaWheel,pointerId:e.pointerId,startY:e.clientY};try{w.setPointerCapture(e.pointerId)}catch(_){}};
      w.onpointerup=e=>{if(!historyDrag||historyDrag.type!=='wheel'||historyDrag.index!==+w.dataset.abPaWheel)return;const dy=e.clientY-historyDrag.startY,idx=historyDrag.index;historyDrag=null;if(dy<-18){pascalApply(idx,1);renderHistoricalStage()}};
      w.onpointercancel=()=>{historyDrag=null};
    });
    const slide=q('[data-ab-slide-c]'),slideTrack=q('[data-ab-slide-track]');
    if(slide&&slideTrack){
      const commitSlide=()=>{
        if(!historyDrag||historyDrag.type!=='slide')return;
        const shift=clamp(historyDrag.currentShift??historyDrag.startShift,-95,95);
        slideIndex=shift<0?'right':'left';
        slideA=Math.round(Math.pow(10,(shift+(slideIndex==='right'?100:0))/100)*10)/10;
        historyDrag=null;renderAll();
      };
      slideTrack.onpointerdown=e=>{
        if(e.button!==0)return;
        const body=slide.closest('.gd-slide-body'),rect=body.getBoundingClientRect();
        historyDrag={type:'slide',pointerId:e.pointerId,startX:e.clientX,startShift:slideOffset(),currentShift:slideOffset(),width:rect.width,el:slideTrack};
        slide.classList.add('is-dragging');
        try{slideTrack.setPointerCapture(e.pointerId)}catch(_){}
        e.preventDefault();
      };
      slideTrack.onpointermove=e=>{
        if(!historyDrag||historyDrag.type!=='slide'||historyDrag.el!==slideTrack)return;
        const shift=clamp(historyDrag.startShift+(e.clientX-historyDrag.startX)/Math.max(1,historyDrag.width)*100,-95,95);
        historyDrag.currentShift=shift;
        slide.style.transform='translateX('+shift+'%)';
        e.preventDefault();
      };
      slideTrack.onpointerup=e=>{if(historyDrag?.type==='slide')commitSlide()};
      slideTrack.onpointercancel=()=>{if(historyDrag?.type==='slide')commitSlide()};
    }
    const cursor=q('[data-ab-slide-cursor]');if(cursor){
      const commitCursor=()=>{
        if(!historyDrag||historyDrag.type!=='cursor')return;
        const pct=clamp(historyDrag.currentPct??historyDrag.startPct,0,100),relative=clamp(pct-slideOffset(),0,100);
        slideB=Math.round(Math.pow(10,relative/100)*10)/10;
        historyDrag=null;renderAll();
      };
      cursor.onpointerdown=e=>{
        if(e.button!==0)return;
        const body=cursor.closest('.gd-slide-body'),rect=body.getBoundingClientRect(),startPct=slideCursorPos();
        historyDrag={type:'cursor',pointerId:e.pointerId,left:rect.left,width:rect.width,startPct,currentPct:startPct,el:cursor};
        cursor.classList.add('is-dragging');
        try{cursor.setPointerCapture(e.pointerId)}catch(_){}
        e.preventDefault();e.stopPropagation();
      };
      cursor.onpointermove=e=>{
        if(!historyDrag||historyDrag.type!=='cursor'||historyDrag.el!==cursor)return;
        const pct=clamp((e.clientX-historyDrag.left)/Math.max(1,historyDrag.width)*100,0,100);
        historyDrag.currentPct=pct;cursor.style.left=pct+'%';e.preventDefault();
      };
      cursor.onpointerup=()=>{if(historyDrag?.type==='cursor')commitCursor()};
      cursor.onpointercancel=()=>{if(historyDrag?.type==='cursor')commitCursor()};
    }
    const resetSlide=q('[data-ab-slide-reset]');if(resetSlide)resetSlide.onclick=()=>{slideA=1;slideB=1;slideIndex='left';renderAll()};
  }

  // The right-hand column is ones. Each column is a decimal digit (0–9).
  function capacity(){return Math.pow(10,rows)-1}
  function total(){return kind==='suanpan'?Array.from({length:rows},(_,i)=>suanRodValue(i)*Math.pow(10,rows-i-1)).reduce((a,b)=>a+b,0):counts.reduce((sum,digit,i)=>sum+digit*Math.pow(10,rows-i-1),0)}
  function normal(v){return clamp(Math.round(num(v,0)),0,capacity())}
  function setRows(next){
    const previous=total();
    rows=[3,4,5,6].includes(Number(next))?Number(next):5;
    counts=Array(rows).fill(0);suanUpper=Array(rows).fill(0);suanLower=Array(rows).fill(0);
    setTotal(previous,false);
  }
  function setTotal(value,render=true){
    counts=Array.from(String(normal(value)).padStart(rows,'0'),digit=>Number(digit));
    if(kind==='suanpan')syncSuanFromCounts();
    if(render)renderStage();
  }
  function placeLabel(i){return ['Ones','Tens','Hundreds','Thousands','Ten thousands','Hundred thousands'][rows-i-1]}
  function placeShort(i){return ['1s','10s','100s','1k','10k','100k'][rows-i-1]}
  function abBeadY(i,part,j){return beadGeometry(kind,counts[i]||0,suanUpper[i]||0,suanLower[i]||0,part,j).position}
  function abBeadActive(i,part,j){return beadGeometry(kind,counts[i]||0,suanUpper[i]||0,suanLower[i]||0,part,j).active}
  function randomInt(min,max){return Math.floor(Math.random()*(max-min+1))+min}
  function taskSolved(){
    if(!task)return false;
    const valueOk=total()===task.target;
    const answerOk=!task.requiresAnswer||String(answerInput).trim()!==''&&Number(answerInput)===Number(task.answer);
    return valueOk&&answerOk;
  }
  function taskTitle(mode=playMode){return abacusTaskTitle(mode)}
  function generatedTask(mode){return generateAbacusTask(mode,{rows,kind})}
  function newTask(mode=playMode,context=workflow==='challenge'?'challenge':'play',custom=null){
    if(context==='challenge')rememberChallengeSetup();else if(challengeSetup)restoreChallengeSetup();
    playMode=mode;taskContext=context==='challenge'?'challenge':'play';status='';answerInput='';revealed=false;
    if(mode==='free'){task=null;taskContext='play';renderAll();return}
    task=custom||generatedTask(mode);
    if(task.mode==='missing')task.target=task.finalTarget;
    setTotal(task.start,false);
    workflow=taskContext==='challenge'?'challenge':'play';
    renderAll();
  }
  function randomChallenge(surface='panel'){
    const [mode]=CHALLENGE_MODES[randomInt(0,CHALLENGE_MODES.length-1)];
    newTask(mode,'challenge');
    if(surface==='frame'){
      workflow='play';
      renderAll();
    }
  }
  function checkTask(){
    if(!task||revealed||status==='Correct ✓')return;
    if(taskSolved())status='Correct ✓';
    else if(total()!==task.target)status='Not yet — the '+(kind==='suanpan'?'suanpan':kind==='soroban'?'soroban':'abacus')+' shows '+total()+'.';
    else status='The beads are right. Enter the missing number too.';
    syncStage();
  }
  function revealTask(){
    if(!task)return;
    revealed=true;setTotal(task.target,false);
    if(task.requiresAnswer)answerInput=String(task.answer);
    status='Answer shown';
    renderStage();
  }
  function setRowCount(i,value){
    if(!Number.isInteger(i)||i<0||i>=rows)return;
    counts[i]=clamp(Math.round(num(value,0)),0,kind==='western'?10:9);
    status='';revealed=false;syncStage();
  }
  function setSuanPart(i,part,value,render=true){
    if(part==='upper')suanUpper[i]=clamp(Math.round(value),0,2);
    else suanLower[i]=clamp(Math.round(value),0,5);
    status='';revealed=false;
    counts[i]=Math.min(9,suanRodValue(i));
    if(render)syncStage();
  }
  function clickBead(i,part,j){
    const digit=counts[i]||0;
    if(kind==='western')return setRowCount(i,j<digit?j:j+1);
    if(kind==='suanpan'){
      const current=part==='upper'?(suanUpper[i]||0):(suanLower[i]||0);
      return setSuanPart(i,part,j<current?j:j+1);
    }
    if(part==='upper')return setRowCount(i,digit>=5?digit-5:digit+5);
    const low=digit%5;
    setRowCount(i,(digit>=5?5:0)+(j<low?j:j+1));
  }
  function frameControls(){
    return '<div class="gd-row gd-ab-stage-actions"><button class="gd-btn" type="button" data-ab-stage="clear">Clear beads</button></div>';
  }
  function taskBanner(){
    if(!task)return '';
    const context=taskContext==='challenge'?'CHALLENGE':'PLAY';
    const answer=task.requiresAnswer?'<label class="gd-ab-answer">Answer <input type="text" inputmode="none" data-ab-answer value="'+esc(answerInput)+'"'+(revealed||status==='Correct ✓'?' disabled':'')+'></label>':'';
    const reveal=taskContext==='challenge'?'<button type="button" data-ab-reveal'+(revealed||status==='Correct ✓'?' hidden':'')+'>Reveal answer</button>':'';
    const skipNext=task.mode==='skip'&&workflow==='play'?'<button type="button" data-ab-skip-next>Next '+task.step+'</button>':'';
    return '<section class="gd-ab-task'+(taskContext==='challenge'?' gd-native-challenge':'')+'" data-ab-task="'+task.mode+'">'+
      '<div class="gd-ab-task-head"><div><span>'+context+'</span><strong>'+esc(task.prompt)+'</strong></div><em data-ab-status>'+esc(status)+'</em></div>'+
      answer+
      '<div class="gd-ab-task-actions"><button type="button" data-ab-check'+(revealed||status==='Correct ✓'?' disabled':'')+'>Check</button>'+skipNext+'<button type="button" data-ab-another>Another</button>'+reveal+(taskContext==='challenge'?'<button type="button" data-ab-exit>Exit challenge</button>':'')+'</div>'+
    '</section>';
  }
  function beadMarkup(i,part,j){
    const active=abBeadActive(i,part,j);
    const label=(part==='upper'?'Five bead ':part==='lower'?'One bead ':'Bead ')+(j+1);
    return '<button type="button" class="gd-ab-bead'+(active?' is-active':'')+'" data-ab-bead="'+i+':'+part+':'+j+'" style="--ab-'+(kind==='western'?'x':'y')+':'+abBeadY(i,part,j)+'" aria-pressed="'+active+'" aria-label="'+esc(placeLabel(i)+' · '+label+(active?' active':' inactive'))+'"><span aria-hidden="true"></span></button>';
  }
  function columnMarkup(i){
    const digit=counts[i]||0;
    const beads=kind==='western'
      ?Array.from({length:10},(_,j)=>beadMarkup(i,'unit',j)).join('')
      :kind==='suanpan'
        ?Array.from({length:2},(_,j)=>beadMarkup(i,'upper',j)).join('')+Array.from({length:5},(_,j)=>beadMarkup(i,'lower',j)).join('')
        :beadMarkup(i,'upper',0)+Array.from({length:4},(_,j)=>beadMarkup(i,'lower',j)).join('');
    return '<div class="gd-ab-col" data-ab-col="'+i+'">'+
      '<div class="gd-ab-col-label'+(showRowLabels?'':' is-hidden')+'"><span>'+esc(placeLabel(i))+'</span><abbr title="'+esc(placeLabel(i))+'">'+esc(placeShort(i))+'</abbr></div>'+
      '<div class="gd-ab-rod" aria-label="'+esc(placeLabel(i)+', digit '+digit)+'">'+
      '<span class="gd-ab-rail" aria-hidden="true"></span>'+
      ((kind==='soroban'||kind==='suanpan')?'<span class="gd-ab-divider" aria-hidden="true"></span>':'')+
      beads+'</div>'+
      '<div class="gd-ab-digit"'+(showRowCounts?'':' hidden')+' data-ab-col-count="'+i+'">'+digit+'</div>'+
    '</div>';
  }
  function renderStage(){
    if(!isAbacusKind()){renderHistoricalStage();return}
    const hideTotal=!!task&&taskContext==='challenge'&&!revealed&&status!=='Correct ✓';
    q('#gd-stage').innerHTML=taskBanner()+
      '<div hidden aria-hidden="true">'+['copy','png','svg','print',...(task?['key-copy','key-print']:[])].map(type=>'<button type="button" data-gd-direct-export="'+type+'">'+type+'</button>').join('')+'</div>'+
      '<div class="gd-ab-workspace gd-history-theme--'+colourScheme+'">'+deviceToolbar()+
        '<div class="gd-ab-main"><div class="gd-ab-device-column">'+
          '<div class="gd-ab-frame gd-ab-frame--'+kind+'" data-ab-frame>'+
            '<div class="gd-ab-type-label">'+(kind==='western'?'WESTERN · BASE TEN':kind==='suanpan'?'CHINESE · SUANPAN · 2+5':'JAPANESE · SOROBAN · 1+4')+'</div>'+
            '<div class="gd-ab-columns" style="--ab-cols:'+rows+'">'+Array.from({length:rows},(_,i)=>columnMarkup(i)).join('')+'</div>'+
          '</div>'+
          frameControls()+
          '<div class="gd-ab-summary"'+(showTotal?'':' hidden')+'><span>Number shown</span><strong data-ab-total>'+(hideTotal?'?':total().toLocaleString('en-GB'))+'</strong></div>'+
          '<p class="gd-object-hint" data-ab-hint>'+(task?'Move the beads, then check your answer.':kind==='soroban'?'Move beads towards the middle bar to count them.':kind==='suanpan'?'Move the 5-beads and 1-beads towards the middle beam. Regroup at ten for decimal work.':'Move beads left to count them. Each horizontal row has a place value.')+'</p>'+
        '</div>'+helpOverlay()+'</div>'+
      '</div>';
    bindStage();
  }
  function syncStage(){
    qa('[data-ab-col]').forEach(colEl=>{
      const i=Number(colEl.dataset.abCol),digit=kind==='suanpan'?suanRodValue(i):(counts[i]||0);
      qa('[data-ab-bead]',colEl).forEach(bead=>{
        const [,part,jText]=String(bead.dataset.abBead).split(':'),j=Number(jText),active=abBeadActive(i,part,j);
        bead.classList.toggle('is-active',active);
        bead.setAttribute('aria-pressed',String(active));
        bead.style.setProperty(kind==='western'?'--ab-x':'--ab-y',String(abBeadY(i,part,j)));
      });
      const count=q('[data-ab-col-count="'+i+'"]',colEl);if(count)count.textContent=String(digit);
      const rod=q('.gd-ab-rod',colEl);if(rod)rod.setAttribute('aria-label',placeLabel(i)+', digit '+digit);
    });
    const hideTotal=!!task&&taskContext==='challenge'&&!revealed&&status!=='Correct ✓';
    const totalEl=q('[data-ab-total]');if(totalEl)totalEl.textContent=hideTotal?'?':total().toLocaleString('en-GB');
    const statusEl=q('[data-ab-status]');if(statusEl)statusEl.textContent=status;
    const input=q('[data-ab-answer]');if(input){if(document.activeElement!==input)input.value=answerInput;input.disabled=revealed||status==='Correct ✓'}
    const reveal=q('[data-ab-reveal]');if(reveal)reveal.hidden=!!revealed||status==='Correct ✓';
    const check=q('[data-ab-check]');if(check)check.disabled=revealed||status==='Correct ✓';
  }
  function setupControls(){
    const selector=field('Device','<select class="gd-select" id="ab-kind">'+DEVICE_OPTIONS.map(([id,label])=>'<option value="'+id+'"'+(kind===id?' selected':'')+'>'+label+'</option>').join('')+'</select>');
    if(!isAbacusKind())return selector+historicalControls()+'<p class="gd-help">Use the ? How to use button on the device for calculation instructions and a worked example.</p>';
    return selector+
      field('Colour scheme','<select class="gd-select" id="ab-theme">'+COLOUR_SCHEMES.map(([id,label])=>'<option value="'+id+'"'+(colourScheme===id?' selected':'')+'>'+label+'</option>').join('')+'</select>')+
      field('Place values','<select class="gd-select" id="ab-rows">'+[3,4,5,6].map(n=>'<option value="'+n+'"'+(rows===n?' selected':'')+'>'+n+' places</option>').join('')+'</select>')+
      field('Set number','<div class="gd-row"><input class="gd-input" id="ab-set-number" type="number" min="0" max="'+capacity()+'" value="'+total()+'"><button class="gd-btn gd-btn--primary" id="ab-set" type="button">Set</button></div>')+
      '<div class="gd-row">'+btn('Random','ab-random')+btn('Clear','ab-clear')+'</div>'+
      '<label class="gd-row gd-ab-check"><input id="ab-show-total" type="checkbox"'+(showTotal?' checked':'')+'> Show number</label>'+
      '<label class="gd-row gd-ab-check"><input id="ab-row-counts" type="checkbox"'+(showRowCounts?' checked':'')+'> Show column digits</label>'+
      '<label class="gd-row gd-ab-check"><input id="ab-row-labels" type="checkbox"'+(showRowLabels?' checked':'')+'> Show place values</label>'+
      '<p class="gd-help">'+(kind==='western'?'Ten beads per horizontal place-value row. Slide them left to count; ten can be regrouped as one in the next place.':kind==='suanpan'?'Suanpan: two upper 5-beads and five lower 1-beads per rod. Beads count when moved towards the beam.':'Soroban: upper bead is 5; four lower beads are 1 each. Beads count when moved towards the middle bar.')+'</p>';
  }
  function modeButtons(attr){
    return '<div class="gd-ab-mode-grid">'+MODES.map(([id,label])=>'<button class="gd-btn'+(playMode===id?' gd-btn--primary':'')+'" type="button" '+attr+'="'+id+'">'+label+'</button>').join('')+'</div>';
  }
  function playControls(){
    let extra='';
    if(playMode==='show')extra=field('Target number','<div class="gd-row"><input class="gd-input" id="ab-custom-target" type="number" min="0" max="'+capacity()+'" value="'+(task?.mode==='show'?task.target:Math.min(12,capacity()))+'"><button class="gd-btn" id="ab-custom-show" type="button">Set task</button></div>');
    if(playMode==='add')extra='<div class="gd-row gd-ab-pair">'+field('Start','<input class="gd-input" id="ab-a" type="number" min="0" max="'+capacity()+'" value="'+(task?.a??7)+'">')+field('Add','<input class="gd-input" id="ab-b" type="number" min="0" max="'+capacity()+'" value="'+(task?.b??5)+'">')+'</div><button class="gd-btn" id="ab-custom-add" type="button">Set addition</button>';
    if(playMode==='subtract')extra='<div class="gd-row gd-ab-pair">'+field('Start','<input class="gd-input" id="ab-a" type="number" min="0" max="'+capacity()+'" value="'+(task?.a??12)+'">')+field('Subtract','<input class="gd-input" id="ab-b" type="number" min="0" max="'+capacity()+'" value="'+(task?.b??5)+'">')+'</div><button class="gd-btn" id="ab-custom-subtract" type="button">Set subtraction</button>';
    return modeButtons('data-ab-play-mode')+extra+(playMode==='free'?'<p class="gd-help">Free play keeps the frame completely open for teacher or pupil modelling.</p>':'<div class="gd-row"><button class="gd-btn" id="ab-new-task" type="button">New task</button></div>');
  }
  function challengeControls(){
    return (G.challengeKit?.nativeRandomHtml('ab',[{label:'Represent',ids:['show','missing']},{label:'Calculate',ids:['add','subtract','double','near']},{label:'Number patterns',ids:['make10','bond','skip']}])||'')+'<div class="gd-ab-mode-grid">'+CHALLENGE_MODES.map(([id,label])=>'<button class="gd-btn'+(task?.mode===id?' gd-btn--primary':'')+'" type="button" data-ab-challenge-mode="'+id+'">'+label+'</button>').join('')+'</div>'+

      '<p class="gd-help">Challenges hide the total until the pupil checks or reveals the answer.</p>';
  }
  function exportControls(){
    return '<div class="nl-panel-title"><div><strong>Paper export</strong><span>Clean abacus or current challenge.</span></div></div>'+
      '<div class="nl-export-grid"><button class="gd-btn gd-btn--primary" id="ab-copy" type="button">Copy image</button><button class="gd-btn" id="ab-png" type="button">PNG</button><button class="gd-btn" id="ab-svg" type="button">SVG</button><button class="gd-btn" id="ab-print" type="button">Print / PDF</button></div>'+
      (task?'<div class="nl-export-grid"><button class="gd-btn" id="ab-key-copy" type="button">Copy answer key</button><button class="gd-btn" id="ab-key-print" type="button">Print answer key</button></div>':'')+'<p class="gd-help" id="ab-export-status" role="status">'+esc(exportStatus)+'</p>';
  }
  function controlsHtml(){
    if(!isAbacusKind())return '<button type="button" data-ab-random-challenge hidden aria-hidden="true" tabindex="-1">Challenge</button>'+setupControls();
    return '<button type="button" data-ab-random-challenge hidden aria-hidden="true" tabindex="-1">Challenge</button>'+
      '<div class="gd-row gd-ab-workflow" role="tablist" aria-label="Abacus workflow">'+
        [['setup','Setup'],['play','Teach / play'],['challenge','Challenge'],['export','Export']].map(([id,label])=>'<button class="gd-btn'+(workflow===id?' gd-btn--primary':'')+'" type="button" data-ab-workflow="'+id+'">'+label+'</button>').join('')+
      '</div>'+
      (workflow==='setup'?setupControls():workflow==='play'?playControls():workflow==='challenge'?challengeControls():exportControls());
  }
  function renderControls(){q('#gd-controls').innerHTML=controlsHtml();bindControls()}
  function renderAll(){renderControls();renderStage()}

  function bindStage(){
    qa('[data-ab-stage-theme]').forEach(stageTheme=>stageTheme.onclick=()=>{const next=stageTheme.dataset.abStageTheme;colourScheme=COLOUR_SCHEMES.some(([id])=>id===next)?next:'classic';renderAll()});
    const stageKind=q('[data-ab-stage-kind]');if(stageKind)stageKind.onchange=()=>{changeDevice(stageKind.value)};
    const helpOpen=q('[data-ab-help-open]');if(helpOpen)helpOpen.onclick=openDeviceHelp;
    const helpClose=q('[data-ab-help-close]');if(helpClose)helpClose.onclick=()=>{historyHelpOpen=false;renderStage()};
    qa('[data-ab-bead]').forEach(bead=>{
      bead.onclick=e=>{
        e.stopPropagation();
        if(bead.dataset.abDragged==='1'){bead.dataset.abDragged='';return}
        const [i,part,j]=String(bead.dataset.abBead).split(':');
        clickBead(Number(i),part,Number(j));
      };
      bead.onpointerdown=e=>{
        if(e.button!==0)return;
        const [i,part,j]=String(bead.dataset.abBead).split(':'),col=Number(i);
        drag={col,part,index:Number(j),startY:e.clientY,startX:e.clientX,initial:counts[col]||0,initialUpper:suanUpper[col]||0,initialLower:suanLower[col]||0,moved:false};
        try{bead.setPointerCapture(e.pointerId)}catch(_){}
      };
      bead.onpointermove=e=>{
        if(!drag)return;
        const delta=kind==='western'?e.clientX-drag.startX:e.clientY-drag.startY;
        if(Math.abs(delta)<10)return;
        drag.moved=true;
        const d=drag;
        if(kind==='western')setRowCount(d.col,d.initial-Math.round(delta/23));
        else if(kind==='suanpan'){
          if(d.part==='upper')setSuanPart(d.col,'upper',d.initialUpper+Math.round(delta/24));
          else setSuanPart(d.col,'lower',d.initialLower-Math.round(delta/24));
        }
        else if(d.part==='upper')setRowCount(d.col,d.initial%5+(delta>0?5:0));
        else setRowCount(d.col,(d.initial>=5?5:0)+clamp(d.initial%5-Math.round(delta/23),0,4));
      };
      bead.onpointerup=()=>{
        if(!drag)return;
        const moved=drag.moved;drag=null;
        if(moved)bead.dataset.abDragged='1';
      };
      bead.onpointercancel=()=>{drag=null};
    });
    qa('[data-ab-stage]').forEach(button=>button.onclick=e=>{
      e.stopPropagation();
      if(button.dataset.abStage==='clear')setTotal(0);
    });
    const answer=q('[data-ab-answer]');if(answer){
      answer.oninput=e=>{answerInput=e.target.value;status='';const st=q('[data-ab-status]');if(st)st.textContent=''};
      answer.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();checkTask()}};
    }
    const check=q('[data-ab-check]');if(check)check.onclick=checkTask;
    const another=q('[data-ab-another]');if(another)another.onclick=()=>newTask(task?.mode||playMode,taskContext);
    const exitTask=q('[data-ab-exit]');if(exitTask)exitTask.onclick=exitChallenge;
    const reveal=q('[data-ab-reveal]');if(reveal)reveal.onclick=()=>{if(!taskSolved())revealTask()};
    const skip=q('[data-ab-skip-next]');if(skip)skip.onclick=()=>{
      if(!task||task.mode!=='skip')return;
      setTotal(task.target,false);
      const nextStart=task.target,nextTarget=Math.min(capacity(),nextStart+task.step);
      status=nextTarget===nextStart?'Reached the end of this frame.':'Next: '+nextStart+' → '+nextTarget;
      task.start=nextStart;task.target=nextTarget;task.answer=nextTarget;
      task.prompt='Keep counting in '+task.step+'s. What comes after '+nextStart+'?';
      renderStage();
    };
    qa('[data-gd-direct-export]').forEach(button=>button.onclick=e=>{e.stopPropagation();exportAction(button.dataset.gdDirectExport)});
  }
  function bindControls(){
    qa('[data-ab-workflow]').forEach(button=>button.onclick=()=>{
      const next=button.dataset.abWorkflow,previous=workflow;
      if(challengeSetup&&['setup','play'].includes(next)){exitChallenge();return}
      workflow=next;
      if(next!=='challenge'||taskContext!=='challenge'){status='';revealed=false}
      if(next==='challenge'&&taskContext!=='challenge'){task=null;taskContext='challenge';answerInput=''}
      else if(next==='play'&&previous==='challenge'){task=null;taskContext='play';answerInput='';playMode='free'}
      else if(next==='setup'){taskContext='play'}
      renderAll();
    });
    const kindEl=q('#ab-kind');if(kindEl)kindEl.onchange=()=>{changeDevice(kindEl.value)};
    if(!isAbacusKind()){
      const theme=q('#ab-theme');if(theme)theme.onchange=()=>{colourScheme=COLOUR_SCHEMES.some(([id])=>id===theme.value)?theme.value:'classic';renderAll()};
      const challengeButton=q('#ab-history-challenge');if(challengeButton)challengeButton.onclick=()=>newHistoricalChallenge();
      qa('[data-ab-history-operation]').forEach(button=>button.onclick=()=>newHistoricalChallenge(button.dataset.abHistoryOperation));
      const endControl=q('#ab-history-end-control');if(endControl)endControl.onclick=exitChallenge;
      const hiddenChallenge=q('[data-ab-random-challenge]');if(hiddenChallenge)hiddenChallenge.onclick=newHistoricalChallenge;
      const ex=q('#ab-h-example');if(ex)ex.onclick=()=>{
        if(kind==='reckoning')reckoning=[0,1,2,6];
        if(kind==='rods')rodDigits=[0,3,7,2];
        if(kind==='pascaline'){pascalDigits=pascalOperation==='add'?[0,0,2,8]:[0,0,4,2];pascalCarryFlash=[];pascalMessage=pascalOperation==='add'?'Start at 28 · ADD 15: tap 1 on Tens, then 5 on Ones.':'Start at 42 · SUBTRACT 15: tap 1 on Tens, then 5 on Ones.';}
        renderAll();
      };
      const clearH=q('#ab-h-clear');if(clearH)clearH.onclick=()=>{
        if(kind==='reckoning')reckoning=[0,0,0,0];
        if(kind==='rods')rodDigits=[0,0,0,0];
        if(kind==='pascaline'){pascalDigits=[0,0,0,0];pascalCarryFlash=[];pascalMessage='Reset to 0.';}
        renderAll();
      };
      const regroup=q('#ab-h-regroup');if(regroup)regroup.onclick=()=>{for(let i=3;i>0;i--){const carry=Math.floor(reckoning[i]/10);reckoning[i]%=10;reckoning[i-1]+=carry}renderAll()};
      const nn=q('#ab-napier-number');if(nn)nn.oninput=()=>{napierNumber=(nn.value.replace(/\D/g,'').slice(0,5)||'0');nn.value=napierNumber;renderStage()};
      const nm=q('#ab-napier-mult');if(nm)nm.onchange=()=>{napierMultiplier=clamp(Math.round(num(nm.value,3)),1,9);renderStage()};
      const sa=q('#ab-slide-a');if(sa)sa.oninput=()=>{setSlideFromFactors(sa.value,slideB);renderAll()};
      const sb=q('#ab-slide-b');if(sb)sb.oninput=()=>{setSlideFromFactors(slideA,sb.value);renderAll()};
      return;
    }
    const theme=q('#ab-theme');if(theme)theme.onchange=()=>{colourScheme=COLOUR_SCHEMES.some(([id])=>id===theme.value)?theme.value:'classic';renderAll()};
    const rowsEl=q('#ab-rows');if(rowsEl)rowsEl.onchange=()=>{setRows(rowsEl.value);task=null;renderAll()};
    const set=q('#ab-set');if(set)set.onclick=()=>{setTotal(q('#ab-set-number')?.value);task=null;renderControls()};
    const random=q('#ab-random');if(random)random.onclick=()=>{setTotal(randomInt(0,capacity()));task=null;renderControls()};
    const clear=q('#ab-clear');if(clear)clear.onclick=()=>{setTotal(0);task=null;renderControls()};
    const totalToggle=q('#ab-show-total');if(totalToggle)totalToggle.onchange=()=>{showTotal=totalToggle.checked;renderStage()};
    const rowCounts=q('#ab-row-counts');if(rowCounts)rowCounts.onchange=()=>{showRowCounts=rowCounts.checked;renderStage()};
    const rowLabels=q('#ab-row-labels');if(rowLabels)rowLabels.onchange=()=>{showRowLabels=rowLabels.checked;renderStage()};
    qa('[data-ab-play-mode]').forEach(button=>button.onclick=()=>{workflow='play';newTask(button.dataset.abPlayMode,'play')});
    qa('[data-ab-challenge-mode]').forEach(button=>button.onclick=()=>newTask(button.dataset.abChallengeMode,'challenge'));
    const randomChallengeButton=q('#ab-random-challenge');if(randomChallengeButton)randomChallengeButton.onclick=randomChallenge;
    const hiddenRandom=q('[data-ab-random-challenge]');if(hiddenRandom)hiddenRandom.onclick=()=>randomChallenge('frame');
    const fresh=q('#ab-new-task');if(fresh)fresh.onclick=()=>newTask(playMode,'play');
    const customShow=q('#ab-custom-show');if(customShow)customShow.onclick=()=>{
      const target=normal(q('#ab-custom-target')?.value);
      newTask('show','play',{mode:'show',start:0,target,prompt:'Show '+target+' on the '+instrument+'.',requiresAnswer:false});
    };
    const customAdd=q('#ab-custom-add');if(customAdd)customAdd.onclick=()=>{
      const a=normal(q('#ab-a')?.value),b=Math.max(0,Math.round(num(q('#ab-b')?.value,0)));
      if(a+b>capacity()){status='That addition is too large for this frame.';renderStage();return}
      newTask('add','play',{mode:'add',start:a,target:a+b,a,b,prompt:'Start at '+a+'. Add '+b+'.',requiresAnswer:false});
    };
    const customSub=q('#ab-custom-subtract');if(customSub)customSub.onclick=()=>{
      const a=normal(q('#ab-a')?.value),b=clamp(Math.round(num(q('#ab-b')?.value,0)),0,a);
      newTask('subtract','play',{mode:'subtract',start:a,target:a-b,a,b,prompt:'Start at '+a+'. Subtract '+b+'.',requiresAnswer:false});
    };
    const copy=q('#ab-copy');if(copy)copy.onclick=()=>exportAction('copy');
    const png=q('#ab-png');if(png)png.onclick=()=>exportAction('png');
    const svg=q('#ab-svg');if(svg)svg.onclick=()=>exportAction('svg');
    const print=q('#ab-print');if(print)print.onclick=()=>exportAction('print');
    const keyCopy=q('#ab-key-copy');if(keyCopy)keyCopy.onclick=()=>exportAction('key-copy');
    const keyPrint=q('#ab-key-print');if(keyPrint)keyPrint.onclick=()=>exportAction('key-print');
  }

  function exportSvg(teacher=false){return abacusPaper({rows,counts,kind,showTotal,showRowCounts,showRowLabels,suanUpper,suanLower,colourScheme,task},teacher)}
  async function exportAction(kind){
    if(!X)return;
    const teacher=kind==='key-copy'||kind==='key-print';if(teacher&&!task)return;
    try{
      const svg=exportSvg(teacher),filename=task?'abacus-'+task.mode:'abacus-frame';
      if(kind==='copy'||kind==='key-copy'){await X.copyPng(svg);exportStatus=teacher?'Teacher key copied.':'Image copied.'}
      else if(kind==='png'){await X.downloadPng(svg,filename,2);exportStatus='PNG downloaded.'}
      else if(kind==='svg'){X.downloadSvg(svg,filename);exportStatus='SVG downloaded.'}
      else if(kind==='print'||kind==='key-print'){X.printSvg(svg,{title:task?'':'Abacus',landscape:!!task&&task.mode!=='show'});exportStatus='Print view opened.'}
    }catch(err){exportStatus=err?.message||'Export failed.'}
    const out=q('#ab-export-status');if(out)out.textContent=exportStatus;
  }

  renderAll();
  G.lessonState?.register('abacus',()=>({rows,counts,kind,showTotal,showRowCounts,showRowLabels,workflow,playMode,task,taskContext,status,answerInput,revealed,reckoning,rodDigits,napierNumber,napierMultiplier,slideA,slideB,slideIndex,pascalDigits,pascalOperation,pascalMessage,suanUpper,suanLower,colourScheme,historyChallenge,historyAnswer,historyStatus,historyRevealed,challengeSetup}),saved=>{
    if(Object.prototype.hasOwnProperty.call(saved,'rows'))rows=saved.rows;
    if(Object.prototype.hasOwnProperty.call(saved,'counts'))counts=saved.counts;
    if(Object.prototype.hasOwnProperty.call(saved,'kind'))kind=saved.kind;
    if(Object.prototype.hasOwnProperty.call(saved,'showTotal'))showTotal=saved.showTotal;
    if(Object.prototype.hasOwnProperty.call(saved,'showRowCounts'))showRowCounts=saved.showRowCounts;
    if(Object.prototype.hasOwnProperty.call(saved,'showRowLabels'))showRowLabels=saved.showRowLabels;
    if(Object.prototype.hasOwnProperty.call(saved,'workflow'))workflow=saved.workflow;
    if(Object.prototype.hasOwnProperty.call(saved,'playMode'))playMode=saved.playMode;
    if(Object.prototype.hasOwnProperty.call(saved,'task'))task=saved.task;
    if(Object.prototype.hasOwnProperty.call(saved,'taskContext'))taskContext=saved.taskContext;
    if(Object.prototype.hasOwnProperty.call(saved,'status'))status=saved.status;
    if(Object.prototype.hasOwnProperty.call(saved,'answerInput'))answerInput=saved.answerInput;
    if(Object.prototype.hasOwnProperty.call(saved,'revealed'))revealed=saved.revealed;
    if(Object.prototype.hasOwnProperty.call(saved,'reckoning'))reckoning=saved.reckoning;
    if(Object.prototype.hasOwnProperty.call(saved,'rodDigits'))rodDigits=saved.rodDigits;
    if(Object.prototype.hasOwnProperty.call(saved,'napierNumber'))napierNumber=saved.napierNumber;
    if(Object.prototype.hasOwnProperty.call(saved,'napierMultiplier'))napierMultiplier=saved.napierMultiplier;
    if(Object.prototype.hasOwnProperty.call(saved,'slideA'))slideA=saved.slideA;
    if(Object.prototype.hasOwnProperty.call(saved,'slideB'))slideB=saved.slideB;
    if(Object.prototype.hasOwnProperty.call(saved,'slideIndex'))slideIndex=saved.slideIndex;
    if(Object.prototype.hasOwnProperty.call(saved,'pascalDigits'))pascalDigits=saved.pascalDigits;
    if(Object.prototype.hasOwnProperty.call(saved,'pascalOperation'))pascalOperation=saved.pascalOperation;
    if(Object.prototype.hasOwnProperty.call(saved,'pascalMessage'))pascalMessage=saved.pascalMessage;
    if(Object.prototype.hasOwnProperty.call(saved,'suanUpper'))suanUpper=saved.suanUpper;
    if(Object.prototype.hasOwnProperty.call(saved,'suanLower'))suanLower=saved.suanLower;
    if(Object.prototype.hasOwnProperty.call(saved,'colourScheme'))colourScheme=saved.colourScheme;
    if(Object.prototype.hasOwnProperty.call(saved,'historyChallenge'))historyChallenge=saved.historyChallenge;
    if(Object.prototype.hasOwnProperty.call(saved,'historyAnswer'))historyAnswer=saved.historyAnswer;
    if(Object.prototype.hasOwnProperty.call(saved,'historyStatus'))historyStatus=saved.historyStatus;
    if(Object.prototype.hasOwnProperty.call(saved,'historyRevealed'))historyRevealed=saved.historyRevealed;
    challengeSetup=saved.challengeSetup||null;historyHelpOpen=false;historyDrag=null;drag=null;pascalCarryFlash=[];renderAll();
  });
}

G.abacusTool=abacusTool;
})(window.TT99Goodies);
