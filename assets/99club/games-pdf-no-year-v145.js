/* 99 Club Studio · Games PDF topic-only metadata v1.45 */
(function(global){
'use strict';
const PDF=global.TT99GamesPDF;if(!PDF||PDF.__noYearV145)return;
const baseBuild=PDF.buildDocument.bind(PDF),baseFilename=PDF.filename.bind(PDF);
function escapeRx(s){return String(s).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');}
function stripInternalYear(doc,settings){
  const min=Number(settings?.minYear),max=Number(settings?.maxYear);
  if(!Number.isFinite(min)||!Number.isFinite(max))return doc;
  const label=min===max?`Year ${min}`:`Years ${min}-${max}`,rx=escapeRx(label);
  for(const entry of doc?.pages||[]){
    const cmds=Array.isArray(entry)?entry:entry?.cmds;if(!Array.isArray(cmds))continue;
    for(let i=0;i<cmds.length;i++){
      const cmd=cmds[i];if(typeof cmd!=='string'||!/(Pupil sheet|Teacher answers|Worked examples)/.test(cmd)||!cmd.includes(label))continue;
      cmds[i]=cmd.replace(new RegExp(` · ${rx}(?= ·|\\))`,'g'),'').replace(new RegExp(`${rx} · `,'g'),'');
    }
  }
  return doc;
}
PDF.buildDocument=function(opts={}){return stripInternalYear(baseBuild(opts),opts.settings||{});};
PDF.filename=function(settings,kind){const name=baseFilename(settings,kind);return String(name).replace(/-y\d+(?:-\d+)?-(?=[a-z])/i,'-');};
PDF.__noYearV145=true;
})(typeof globalThis!=='undefined'?globalThis:this);
