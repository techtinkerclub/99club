/* Tech Tinker Club - Custom Worksheets pie chart engine
 * v0.1 / visual pie charts stage 1
 *
 * Year 6 curriculum-led visual statistics module.  This file owns the pie
 * mathematics, question catalogue and SVG/PDF pie renderer.  It relies on
 * custom-graphs.js only for the shared page compositor and renderer registry.
 */
(function(global){
  'use strict';
  const G=global.TT99Generator;
  if(!G) return;

  const VERSION='0.2.0';
  const PIE_FAMILIES={
    pie_charts_y6:{label:'pie charts — interpret & construct',strand:'Statistics',years:[6],curriculumId:'Y6.S.01'},
    pie_charts_reasoning_y6:{label:'pie charts — reasoning & problem solving',strand:'Statistics',years:[6],curriculumId:'Y6.S.01'},
    pie_charts_extension:{label:'pie-chart reasoning (extension)',strand:'Extension',years:[],curriculumId:'',extension:true}
  };
  const PIE_FAMILY_IDS=Object.keys(PIE_FAMILIES);
  const isPieKind=kind=>PIE_FAMILY_IDS.includes(String(kind||''));
  const hasPieFamily=rules=>Array.isArray(rules?.families)&&rules.families.some(isPieKind);
  const clone=o=>JSON.parse(JSON.stringify(o));
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const sum=a=>a.reduce((s,v)=>s+Number(v||0),0);
  const fmt=n=>Number.isInteger(Number(n))?String(Number(n)):String(Number(n).toFixed(1)).replace(/\.0$/,'');
  const gcd=(a,b)=>{a=Math.abs(Math.round(a));b=Math.abs(Math.round(b));while(b){const t=b;b=a%b;a=t;}return a||1;};
  const fractionLabel=(n,d)=>{const g=gcd(n,d);return `${Math.round(n/g)}/${Math.round(d/g)}`;};
  const pct=(n,d)=>100*Number(n)/Number(d);
  const angle=(n,d)=>360*Number(n)/Number(d);

  const CATALOGUE=[
    // Core Year 6: direct interpretation, linked arithmetic and construction.
    {id:'pie_identify_largest_smallest',family:'pie_charts_y6',category:'interpret'},
    {id:'pie_compare_to_half_quarter',family:'pie_charts_y6',category:'interpret'},
    {id:'pie_read_simple_fraction',family:'pie_charts_y6',category:'fraction'},
    {id:'pie_count_from_total_equal_parts',family:'pie_charts_y6',category:'count'},
    {id:'pie_count_from_total_fraction',family:'pie_charts_y6',category:'count'},
    {id:'pie_count_from_total_percentage',family:'pie_charts_y6',category:'percentage'},
    {id:'pie_count_from_sector_angle',family:'pie_charts_y6',category:'angle'},
    {id:'pie_combined_categories_count',family:'pie_charts_y6',category:'count'},
    {id:'pie_all_except_category_count',family:'pie_charts_y6',category:'count'},
    {id:'pie_difference_between_categories',family:'pie_charts_y6',category:'difference'},
    {id:'pie_total_from_known_sector',family:'pie_charts_y6',category:'reverse'},
    {id:'pie_missing_fraction_or_percentage',family:'pie_charts_y6',category:'whole'},
    {id:'pie_complete_frequency_table',family:'pie_charts_y6',category:'table'},
    {id:'pie_true_false_statements',family:'pie_charts_y6',category:'diagnostic'},
    {id:'pie_construct_from_frequency_integer_angles',family:'pie_charts_y6',category:'construct'},
    {id:'pie_complete_angles_then_construct',family:'pie_charts_y6',category:'construct'},
    {id:'pie_construct_from_percentages',family:'pie_charts_y6',category:'construct'},
    {id:'pie_identify_category_from_known_count',family:'pie_charts_y6',category:'reverse'},
    {id:'pie_missing_frequency_then_construct',family:'pie_charts_y6',category:'construct'},
    {id:'pie_missing_category_from_total',family:'pie_charts_y6',category:'whole'},
    {id:'pie_complete_partial_table_angle_frequency',family:'pie_charts_y6',category:'table'},

    // Year 6 reasoning/problem solving.  Kept separate so teachers can opt in.
    {id:'pie_compare_two_charts_counts',family:'pie_charts_reasoning_y6',category:'compare'},
    {id:'pie_compare_two_charts_misconception',family:'pie_charts_reasoning_y6',category:'diagnostic'},
    {id:'pie_enough_information_to_find_total',family:'pie_charts_reasoning_y6',category:'reasoning'},
    {id:'pie_estimate_count_from_sector',family:'pie_charts_reasoning_y6',category:'estimate'},
    {id:'pie_estimate_difference_from_sectors',family:'pie_charts_reasoning_y6',category:'estimate'},
    {id:'pie_scale_same_proportions_to_new_total',family:'pie_charts_reasoning_y6',category:'scale'},
    {id:'pie_validate_statement_with_calculation',family:'pie_charts_reasoning_y6',category:'diagnostic'},
    {id:'pie_merge_two_charts_to_combined_angles',family:'pie_charts_reasoning_y6',category:'multi_step'},
    {id:'pie_estimate_percentage_to_increment',family:'pie_charts_reasoning_y6',category:'estimate'},
    {id:'pie_equal_remaining_categories_from_known_count',family:'pie_charts_reasoning_y6',category:'reasoning'},
    {id:'pie_update_total_recalculate_sector_angle',family:'pie_charts_reasoning_y6',category:'dynamic'},

    // 11+/cross-representation structures: useful, but not default Year 6 content.
    {id:'pie_to_bar_chart',family:'pie_charts_extension',category:'cross_representation'},
    {id:'pie_percentage_context_two_charts',family:'pie_charts_extension',category:'cross_topic'},
    {id:'pie_multi_step_money_from_percentage_sector',family:'pie_charts_extension',category:'cross_topic'},
    {id:'pie_apply_external_rule_to_sector_counts',family:'pie_charts_extension',category:'cross_topic'},
    {id:'pie_fraction_arithmetic_from_sectors',family:'pie_charts_extension',category:'cross_topic'}
  ];
  const TYPES_BY_FAMILY=Object.fromEntries(PIE_FAMILY_IDS.map(f=>[f,CATALOGUE.filter(x=>x.family===f).map(x=>x.id)]));

  // Register before custom-app.js reads the catalogue.
  for(const [id,meta] of Object.entries(PIE_FAMILIES)){
    if(!G.FAMILY_META[id])G.FAMILY_META[id]={label:meta.label,strand:meta.strand,years:meta.years.slice(),visual:true,curriculumId:meta.curriculumId,extension:!!meta.extension};
    G.FAMILY_LABELS[id]=meta.label;
    if(Array.isArray(G.FAMILY_ORDER)&&!G.FAMILY_ORDER.includes(id))G.FAMILY_ORDER.push(id);
    if(Array.isArray(G.FAMILY_COMPACT_ORDER)&&!G.FAMILY_COMPACT_ORDER.includes(id))G.FAMILY_COMPACT_ORDER.push(id);
  }

  // Retain the old direct angle-calculation family for saved-sheet compatibility,
  // but move it to Extension now that a faithful visual Year 6 pie family exists.
  if(G.FAMILY_META?.pie_chart_angles){
    Object.assign(G.FAMILY_META.pie_chart_angles,{label:'pie-chart angle calculations (text-only practice)',strand:'Extension',years:[],extension:true,textFallback:true});
    G.FAMILY_LABELS.pie_chart_angles='pie-chart angle calculations (text-only practice)';
  }

  const CONTEXTS=[
    {title:'Favourite fruit',labels:['Apples','Bananas','Oranges','Pears','Grapes','Other'],unit:'pupils'},
    {title:'Travel to school',labels:['Walk','Car','Bus','Bicycle','Scooter','Other'],unit:'children'},
    {title:'Favourite books',labels:['Adventure','Mystery','Fantasy','Science','History','Other'],unit:'pupils'},
    {title:'After-school clubs',labels:['Sport','Art','Coding','Music','Chess','Drama'],unit:'pupils'},
    {title:'Lunch choices',labels:['Sandwich','Pasta','Salad','Soup','Fruit','Wrap'],unit:'children'},
    {title:'Pets',labels:['Dogs','Cats','Fish','Rabbits','Birds','Hamsters'],unit:'children'},
    {title:'Weekend activities',labels:['Sport','Gaming','Reading','Friends','Outdoors','Music'],unit:'children'},
    {title:'Favourite school subjects',labels:['Maths','English','Science','Art','Computing','PE'],unit:'pupils'},
    {title:'How pupils travel',labels:['Walk','Car','Bus','Bike','Scooter','Train'],unit:'pupils'},
    {title:'Garden wildlife',labels:['Birds','Bees','Butterflies','Beetles','Snails','Other'],unit:'sightings'}
  ];
  // A bank of mathematically useful *shape archetypes*, not just contexts.  It
  // deliberately mixes 3-6 sectors, balanced charts, dominant sectors, equal
  // pairs and long tails so repeated worksheets do not all look alike.
  const TEMPLATES=[
    [20,10,10],[18,12,10],[24,9,7],[16,14,10],
    [16,8,4,4],[16,12,8,4],[15,10,9,6],[14,11,8,7],[20,10,5,5],[12,12,8,8],
    [20,15,10,10,5],[30,20,16,8,6],[40,25,15,10,10],[18,14,12,9,7],[24,16,8,6,6],[20,10,10,10,10],
    [24,18,14,10,8,6],[30,20,15,15,10,10],[18,15,12,10,8,7],[30,18,15,12,9,6],[12,12,12,8,8,8],[28,20,16,12,8,4],
    [50,30,20,12,8],[36,24,18,12,6,4]
  ];
  const PIE_VARIANTS_PER_TYPE=16;
  const ANGLE_TEMPLATES=[[20,10,10],[16,12,8,4],[20,15,10,10,5],[30,20,16,8,6],[40,25,15,10,10],[24,16,8,6,6],[30,20,15,15,10,10],[24,18,14,10,8,6],[50,30,20,12,8]];
  const SIMPLE_FRACTION_TEMPLATES=[[2,1,1],[4,2,1,1],[5,3,2],[8,4,2,1,1],[10,5,2,2,1],[12,6,3,2,1]];
  const PERCENT_TEMPLATES=[[40,30,20,10],[50,20,15,10,5],[35,25,20,10,10],[30,25,20,15,10],[45,20,15,10,5,5]];
  function rotateArray(arr,n){if(!arr.length)return arr.slice();n=((n%arr.length)+arr.length)%arr.length;return arr.slice(n).concat(arr.slice(0,n));}
  function decorateData(data,seed=0){
    let sectors=data.sectors.slice(),mode=Math.floor(seed/Math.max(1,sectors.length))%4;
    sectors=rotateArray(sectors,seed%Math.max(1,sectors.length));if(mode===1||mode===3)sectors=sectors.slice().reverse();
    if(mode>=2&&sectors.length>=4){const t=sectors[1];sectors[1]=sectors[sectors.length-2];sectors[sectors.length-2]=t;}
    sectors=sectors.map((s,j)=>({...s,colorIndex:j}));
    return {...data,sectors,startAngle:[0,25,45,70,90,120,160,210,250,300][seed%10],colorOffset:seed%6,
      legendPosition:(seed%5===1&&sectors.length<=5)?'right':'bottom',showInternalLabels:seed%3!==1,variantSeed:seed};
  }
  function dataFromCounts(counts,ctxIndex=0,titleOverride='',variantSeed=ctxIndex){
    const total=sum(counts),ctx=CONTEXTS[((ctxIndex%CONTEXTS.length)+CONTEXTS.length)%CONTEXTS.length];
    return decorateData({title:titleOverride||ctx.title,total,unit:ctx.unit,sectors:counts.map((count,j)=>({label:ctx.labels[j]||`Category ${j+1}`,count,angle:angle(count,total),percentage:pct(count,total),fraction:fractionLabel(count,total),colorIndex:j}))},variantSeed);
  }
  function baseData(i,offset=0){const k=i+offset;return dataFromCounts(TEMPLATES[((k%TEMPLATES.length)+TEMPLATES.length)%TEMPLATES.length],k,'',k);}
  function angleData(i,offset=0){const k=i+offset;return dataFromCounts(ANGLE_TEMPLATES[((k%ANGLE_TEMPLATES.length)+ANGLE_TEMPLATES.length)%ANGLE_TEMPLATES.length],k,'',k);}
  function simpleFractionData(i,offset=0){const k=i+offset;return dataFromCounts(SIMPLE_FRACTION_TEMPLATES[((k%SIMPLE_FRACTION_TEMPLATES.length)+SIMPLE_FRACTION_TEMPLATES.length)%SIMPLE_FRACTION_TEMPLATES.length],k,'',k);}
  function percentageData(i,offset=0){const k=i+offset;return dataFromCounts(PERCENT_TEMPLATES[((k%PERCENT_TEMPLATES.length)+PERCENT_TEMPLATES.length)%PERCENT_TEMPLATES.length],k,'',k);}
  function namedData(counts,title,labels,unit='people',variantSeed=0){
    const total=sum(counts);
    return decorateData({title,total,unit,sectors:counts.map((count,j)=>({label:labels[j]||`Category ${j+1}`,count,angle:angle(count,total),percentage:pct(count,total),fraction:fractionLabel(count,total),colorIndex:j}))},variantSeed);
  }
  function equalData(i,n=4,total=40){return dataFromCounts(Array(n).fill(total/n),i,'Equal sections');}
  function annotationFor(s,mode){
    if(mode==='angle')return `${fmt(s.angle)}°`;
    if(mode==='percentage')return `${fmt(s.percentage)}%`;
    if(mode==='fraction')return s.fraction;
    if(mode==='count')return String(s.count);
    return '';
  }
  function pieSpec(data,opts={}){
    return {title:opts.title===undefined?data.title:opts.title,total:opts.total===undefined?data.total:opts.total,unit:data.unit,
      sectors:clone(data.sectors),annotationMode:opts.annotationMode||'',annotations:opts.annotations||null,
      showTotal:opts.showTotal!==false,showLegend:opts.showLegend!==false,construction:!!opts.construction,
      baseline:opts.baseline!==false,colorOffset:opts.colorOffset===undefined?(data.colorOffset||0):opts.colorOffset,
      hideLabels:!!opts.hideLabels,startAngle:opts.startAngle===undefined?(data.startAngle||0):Number(opts.startAngle),
      legendPosition:opts.legendPosition||data.legendPosition||'bottom',showInternalLabels:opts.showInternalLabels===undefined?(data.showInternalLabels!==false):!!opts.showInternalLabels};
  }
  function visual(pies,opts={}){
    return {type:'pie',title:opts.title||'',pies:Array.isArray(pies)?pies:[pies],table:opts.table||null,answerTable:opts.answerTable||null,
      statements:opts.statements||null,note:opts.note||'',sharedLegend:!!opts.sharedLegend,linkedBar:opts.linkedBar||null};
  }
  function visualSignature(vis){const p=vis?.pies?.[0];if(!p)return 'none';const angles=(p.sectors||[]).map(s=>Number(s.angle||0)),max=Math.max(0,...angles),shape=max>=190?'dominant':max>=140?'strong':max<=95?'balanced':'mixed';return `${angles.length}:${shape}:${p.legendPosition||'bottom'}:${Math.round((Number(p.startAngle)||0)/45)}`;}
  function q(family,typeId,prompt,answer,key,vis,footprint='L',extra={}){
    return {kind:family,pieTypeId:typeId,prompt,answer,key:`${family}:${typeId}:${key}`,visual:vis,footprint,group:typeId,visualSignature:visualSignature(vis),
      marking:extra.marking||{mode:'exact',answer},curriculum:extra.curriculum||'Y6.S.01',...extra};
  }

  function rowsFor(data,mode='frequency',blankIndex=-1){
    const header=mode==='angle'?['Category','Frequency','Angle']:mode==='percentage'?['Category','Percentage']:['Category','Frequency'];
    const rows=data.sectors.map((s,j)=>{
      if(mode==='angle')return [s.label,j===blankIndex?'':String(s.count),j===blankIndex?'':`${fmt(s.angle)}°`];
      if(mode==='percentage')return [s.label,j===blankIndex?'':`${fmt(s.percentage)}%`];
      return [s.label,j===blankIndex?'':String(s.count)];
    });
    return {headers:header,rows};
  }
  function answerRowsFor(data,mode='frequency'){
    const header=mode==='angle'?['Category','Frequency','Angle']:mode==='percentage'?['Category','Percentage']:['Category','Frequency'];
    const rows=data.sectors.map(s=>mode==='angle'?[s.label,String(s.count),`${fmt(s.angle)}°`]:mode==='percentage'?[s.label,`${fmt(s.percentage)}%`]:[s.label,String(s.count)]);
    return {headers:header,rows};
  }

  function makeQuestion(typeId,i,family){
    const d=baseData(i),n=d.sectors.length,a=i%n,b=(i+1)%n,c=(i+2)%n;
    const sa=d.sectors[a],sb=d.sectors[b];
    const onePie=(opts={})=>visual(pieSpec(d,opts));

    if(typeId==='pie_identify_largest_smallest'){
      const wantMax=i%2===0,idx=wantMax?d.sectors.findIndex(s=>s.count===Math.max(...d.sectors.map(x=>x.count))):d.sectors.findIndex(s=>s.count===Math.min(...d.sectors.map(x=>x.count)));
      return q(family,typeId,`Which category has the ${wantMax?'largest':'smallest'} sector?`,d.sectors[idx].label,`${i}`,onePie({showTotal:false}),'M');
    }
    if(typeId==='pie_compare_to_half_quarter'){
      const target=i%2===0?50:25,idx=i%d.sectors.length;
      const comp=Math.abs(d.sectors[idx].percentage-target)<1e-9?'exactly':d.sectors[idx].percentage>target?'more than':'less than';
      return q(family,typeId,`Is ${d.sectors[idx].label} less than, exactly, or more than ${target===50?'one half':'one quarter'} of the whole?`,`${comp} ${target===50?'one half':'one quarter'}`,`${i}`,onePie({showTotal:false}),'M');
    }
    if(typeId==='pie_read_simple_fraction'){
      const fd=simpleFractionData(i),idx=fd.sectors.findIndex(s=>['1/2','1/4','1/5','1/8','1/10'].includes(s.fraction)),k=idx>=0?idx:0;
      return q(family,typeId,`What fraction of the whole is ${fd.sectors[k].label}?`,fd.sectors[k].fraction,`${i}`,visual(pieSpec(fd,{showTotal:false})),'M');
    }
    if(typeId==='pie_count_from_total_equal_parts'){
      const e=equalData(i,4+(i%2),40+(i%2)*10),idx=i%e.sectors.length;
      return q(family,typeId,`The chart represents ${e.total} ${e.unit}. The sectors are equal. How many are represented by ${e.sectors[idx].label}?`,String(e.sectors[idx].count),`${i}`,visual(pieSpec(e,{showTotal:true})),'M');
    }
    if(typeId==='pie_count_from_total_fraction'){
      const fd=simpleFractionData(i),idx=fd.sectors.findIndex(s=>['1/2','1/4','1/5','1/8','1/10'].includes(s.fraction)),k=idx>=0?idx:0;
      return q(family,typeId,`The whole chart represents ${fd.total} ${fd.unit}. How many chose ${fd.sectors[k].label}?`,String(fd.sectors[k].count),`${i}`,visual(pieSpec(fd,{annotationMode:'fraction'})),'M');
    }
    if(typeId==='pie_count_from_total_percentage'){
      return q(family,typeId,`The whole chart represents ${d.total} ${d.unit}. How many chose ${sa.label}?`,String(sa.count),`${i}`,onePie({annotationMode:'percentage'}),'M');
    }
    if(typeId==='pie_count_from_sector_angle'){
      const ad=angleData(i),idx=i%ad.sectors.length,s=ad.sectors[idx];
      return q(family,typeId,`The whole chart represents ${ad.total} ${ad.unit}. How many are represented by the ${s.label} sector?`,String(s.count),`${i}`,visual(pieSpec(ad,{annotationMode:'angle'})),'M');
    }
    if(typeId==='pie_combined_categories_count'){
      const ans=sa.count+sb.count;return q(family,typeId,`How many ${d.unit} are in ${sa.label} and ${sb.label} altogether?`,String(ans),`${i}`,onePie(),'M');
    }
    if(typeId==='pie_all_except_category_count'){
      return q(family,typeId,`How many ${d.unit} chose something other than ${sa.label}?`,String(d.total-sa.count),`${i}`,onePie(),'M');
    }
    if(typeId==='pie_difference_between_categories'){
      return q(family,typeId,`What is the difference between ${sa.label} and ${sb.label}?`,String(Math.abs(sa.count-sb.count)),`${i}`,onePie(),'M');
    }
    if(typeId==='pie_total_from_known_sector'){
      return q(family,typeId,`${sa.count} ${d.unit} are represented by ${sa.label}. How many ${d.unit} are represented by the whole chart?`,String(d.total),`${i}`,onePie({showTotal:false,annotationMode:'fraction'}),'M');
    }
    if(typeId==='pie_missing_fraction_or_percentage'){
      const askPct=i%2===0,annotations=d.sectors.map((s,j)=>j===a?'':annotationFor(s,askPct?'percentage':'fraction'));
      return q(family,typeId,`Complete the missing ${askPct?'percentage':'fraction'} for ${sa.label}.`,askPct?`${fmt(sa.percentage)}%`:sa.fraction,`${i}`,onePie({showTotal:false,annotations}),'M');
    }
    if(typeId==='pie_complete_frequency_table'){
      const table=rowsFor(d,'frequency',a),answerTable=answerRowsFor(d,'frequency');
      return q(family,typeId,`The pie chart represents ${d.total} ${d.unit}. Complete the missing frequency in the table.`,String(sa.count),`${i}`,visual(pieSpec(d),{table,answerTable}),'L');
    }
    if(typeId==='pie_true_false_statements'){
      const true1=`${sa.label} represents ${fmt(sa.percentage)}% of the whole.`;
      const false1=`${sb.label} represents ${fmt(sb.percentage+10)}% of the whole.`;
      const true2=`${sa.label} and ${sb.label} together represent ${sa.count+sb.count} ${d.unit}.`;
      const statements=i%2===0?[true1,false1,true2]:[false1,true2,true1];
      const truths=statements.map((s,j)=>s===false1?null:j+1).filter(Boolean).join(' and ');
      return q(family,typeId,'Which statements are true?',`Statements ${truths}`,`${i}`,visual(pieSpec(d),{statements}),'L');
    }
    if(typeId==='pie_construct_from_frequency_integer_angles'){
      const ad=angleData(i),table=answerRowsFor(ad,'frequency');
      return q(family,typeId,'Use the frequency table to construct an accurate pie chart.','Completed pie chart shown.',`${i}`,visual(pieSpec(ad,{construction:true}),{table}),'XL',{marking:{mode:'construction',answer:'Sectors proportional to the frequency table.'}});
    }
    if(typeId==='pie_complete_angles_then_construct'){
      const ad=angleData(i),pupil={headers:['Category','Frequency','Angle'],rows:ad.sectors.map(s=>[s.label,String(s.count),''])},answerTable=answerRowsFor(ad,'angle');
      return q(family,typeId,'Calculate each sector angle, then construct the pie chart.','Completed angle table and pie chart shown.',`${i}`,visual(pieSpec(ad,{construction:true}),{table:pupil,answerTable}),'XL',{marking:{mode:'construction',answer:'Correct sector angles and construction.'}});
    }
    if(typeId==='pie_construct_from_percentages'){
      const pData=percentageData(i+1),table=answerRowsFor(pData,'percentage');
      return q(family,typeId,'Use the percentage table to construct an accurate pie chart.','Completed pie chart shown.',`${i}`,visual(pieSpec(pData,{construction:true}),{table}),'XL',{marking:{mode:'construction',answer:'Sectors match the stated percentages.'}});
    }
    if(typeId==='pie_identify_category_from_known_count'){
      const uniqueIndex=d.sectors.findIndex((s,j,arr)=>arr.filter(x=>x.count===s.count).length===1),k=uniqueIndex>=0?uniqueIndex:0,target=d.sectors[k];
      return q(family,typeId,`The chart represents ${d.total} ${d.unit}. Exactly ${target.count} chose one category. Which category was it?`,target.label,`${i}`,onePie({showTotal:true}),'M');
    }
    if(typeId==='pie_missing_frequency_then_construct'){
      const m=(i+2)%n,missing=d.sectors[m],known=d.total-missing.count;
      const table={headers:['Category','Frequency'],rows:d.sectors.map((s,j)=>[s.label,j===m?'':String(s.count)])};
      return q(family,typeId,`The total frequency is ${d.total}. First find the missing frequency, then construct the pie chart.`,`${missing.label} = ${missing.count}; completed chart shown.`,`${i}`,visual(pieSpec(d,{construction:true}),{table,answerTable:answerRowsFor(d,'frequency')}),'XL',{marking:{mode:'construction',answer:`Missing frequency ${missing.count}; correct pie chart.`}});
    }
    if(typeId==='pie_missing_category_from_total'){
      const known=d.sectors.filter((_,j)=>j!==a).reduce((s,x)=>s+x.count,0);
      return q(family,typeId,`The survey total is ${d.total}. The other categories total ${known}. How many ${d.unit} must be in ${sa.label}?`,String(sa.count),`${i}`,onePie({showTotal:true}),'M');
    }
    if(typeId==='pie_complete_partial_table_angle_frequency'){
      const ad=angleData(i),nn=ad.sectors.length,aa=i%nn,m=(i+1)%nn,as=ad.sectors[aa],table={headers:['Category','Frequency','Angle'],rows:ad.sectors.map((s,j)=>[s.label,j===m?'':String(s.count),j===aa?'':`${fmt(s.angle)}°`])};
      return q(family,typeId,'Complete the missing frequency and angle in the linked table.',`${ad.sectors[m].label} frequency ${ad.sectors[m].count}; ${as.label} angle ${fmt(as.angle)}°`,`${i}`,visual(pieSpec(ad),{table,answerTable:answerRowsFor(ad,'angle')}),'L');
    }

    // --- Reasoning family ---------------------------------------------------
    if(typeId==='pie_compare_two_charts_counts'){
      const d2Counts=d.sectors.map((s,j)=>Math.max(2,s.count+(j===0?(i%2?5:-3):((j+i)%2?2:-1)))),d2=dataFromCounts(d2Counts,i,d.title),label=d.sectors[0].label;
      const aCount=d.sectors[0].count,bCount=d2.sectors[0].count,who=aCount===bCount?'the same':aCount>bCount?'Survey A':'Survey B';
      return q(family,typeId,`Compare ${label}. Which survey represents more ${d.unit}, and by how many?`,aCount===bCount?'The same':`${who} by ${Math.abs(aCount-bCount)}`,`${i}`,visual([pieSpec(d,{title:`Survey A · total ${d.total}`,showTotal:false}),pieSpec(d2,{title:`Survey B · total ${d2.total}`,showTotal:false})],{sharedLegend:false}),'L');
    }
    if(typeId==='pie_compare_two_charts_misconception'){
      const pA=dataFromCounts([20,20,10,10],i,'Class A'),pB=dataFromCounts([15,5,5,5],i,'Class B');
      const label=pA.sectors[0].label;pB.sectors[0].label=label;
      return q(family,typeId,`A pupil says, “${label} has the larger sector in Class B, so more pupils chose it in Class B.” Is that correct? Explain.`,'No. Class A represents 20 pupils in that category, while Class B represents 15.',`${i}`,visual([pieSpec(pA,{title:'Class A · total 60'}),pieSpec(pB,{title:'Class B · total 30'})]),'L',{response:{kind:'explanation',size:'M',label:'Explain using the chart totals'},marking:{mode:'rubric',answer:'No. Class A represents 20 pupils and Class B represents 15.',rule:'Mark correct only if the pupil rejects the claim for the right mathematical reason. Equivalent wording is acceptable.',criteria:['States that the claim is not correct.','Uses the different totals to compare actual counts: Class A = 20 and Class B = 15.'],accept:'Any equivalent calculation or explanation showing that sector size alone cannot compare absolute numbers when the totals differ.'}});
    }
    if(typeId==='pie_enough_information_to_find_total'){
      if(i%2===0){
        const e=equalData(i,4,40),s=e.sectors[0];return q(family,typeId,`${s.count} ${e.unit} are in one of four equal sectors. Is there enough information to find the total? If so, give it.`,'Yes, 40.',`${i}`,visual(pieSpec(e,{showTotal:false})),'M',{response:{kind:'short',size:'S',label:'Answer and show how you know'},marking:{mode:'rubric',answer:'Yes, 40.',rule:'Mark correct if the pupil identifies that the total can be found and gives the correct total.',criteria:['States that there is enough information.','Gives 40 as the total.'],accept:'A supporting calculation such as 10 × 4 = 40 may be shown but is not required by the wording.'}});
      }
      const u=baseData(i),known=u.sectors[0];
      const table={headers:['Information given','Value'],rows:[[known.label,`${known.count} ${u.unit}`],['Sector fraction / angle / percentage','Not given'],['Whole-chart total','Not given']]};
      return q(family,typeId,`${known.count} ${u.unit} are known to be in ${known.label}, but its sector size and the chart total are not given. Is there enough information to determine the whole exactly?`,'No.',`${i}`,visual(pieSpec(u,{showTotal:false,showLegend:false,construction:true,baseline:false,hideLabels:true}),{table}),'M',{response:{kind:'short',size:'S',label:'Answer briefly'},marking:{mode:'rubric',answer:'No.',rule:'Mark correct if the pupil states that the total cannot be determined exactly from the information given.',criteria:['States that there is not enough information.'],accept:'If a reason is given, accept that the sector proportion/fraction/percentage/angle is also needed.'}});
    }
    if(typeId==='pie_estimate_count_from_sector'){
      const est=dataFromCounts([37,28,20,15],i,'Survey results'),idx=0,total=100;
      // Render exact geometry but hide quantitative annotations: the task is visual estimation.
      const choices=['20','30','40','50'],correctChoice=2;
      return q(family,typeId,`The chart represents ${total} people. Which is the best estimate for how many are in ${est.sectors[idx].label}?`,`C. ${choices[correctChoice]}`,`${i}`,visual(pieSpec(est,{showTotal:true})),'M',{choices,correctChoice,marking:{mode:'multiple-choice',answer:choices[correctChoice]}});
    }
    if(typeId==='pie_estimate_difference_from_sectors'){
      const est=dataFromCounts([46,29,15,10],i,'Survey results');
      const choices=['15','25','35','55'],correctChoice=2;
      return q(family,typeId,`The chart represents 200 people. Which is the best estimate for the difference between ${est.sectors[0].label} and ${est.sectors[1].label}?`,`C. ${choices[correctChoice]}`,`${i}`,visual(pieSpec(est,{showTotal:false})),'M',{choices,correctChoice,marking:{mode:'multiple-choice',answer:choices[correctChoice]}});
    }
    if(typeId==='pie_scale_same_proportions_to_new_total'){
      const newTotal=d.total*2,idx=a,ans=d.sectors[idx].count*2;
      return q(family,typeId,`A second survey has the same proportions but a total of ${newTotal}. How many would be in ${sa.label}?`,String(ans),`${i}`,onePie({showTotal:true}),'M');
    }
    if(typeId==='pie_validate_statement_with_calculation'){
      const claim=i%2===0?sa.count:sa.count+Math.max(1,Math.round(d.total/10)),correct=i%2===0;
      return q(family,typeId,`Kai says, “${sa.label} represents ${claim} ${d.unit}.” Is Kai correct? Show a calculation or proportion to justify your answer.`,correct?`Yes, ${sa.count}.`:`No, it represents ${sa.count}.`,`${i}`,onePie({annotationMode:'percentage'}),'M',{response:{kind:'working',size:'M',label:'Show your calculation / proportion'},marking:{mode:'rubric',answer:`${fmt(sa.percentage)}% of ${d.total} = ${sa.count}.`,rule:'Mark correct only when the verdict is supported by a valid calculation or equivalent proportion.',criteria:[`Calculates ${fmt(sa.percentage)}% of ${d.total} as ${sa.count}.`,`States the correct conclusion: ${correct?'Kai is correct':'Kai is not correct'}.`],accept:'Equivalent fraction/proportion methods are acceptable.'}});
    }
    if(typeId==='pie_merge_two_charts_to_combined_angles'){
      const A=dataFromCounts([15,10,25],i,'Class A'),B=dataFromCounts([12,6,12],i,'Class B');
      const combined=A.sectors.map((s,j)=>s.count+B.sectors[j].count),total=sum(combined),idx=i%3,ang=360*combined[idx]/total;
      return q(family,typeId,`Combine both classes. What angle should ${A.sectors[idx].label} have in a new pie chart for all ${total} pupils?`,`${fmt(ang)}°`,`${i}`,visual([pieSpec(A,{title:'Class A · total 50'}),pieSpec(B,{title:'Class B · total 30'})]),'L');
    }
    if(typeId==='pie_estimate_percentage_to_increment'){
      const est=namedData([44,31,25],'Sandwich choices',['Ham','Cheese','Jam'],'children',i),idx=0,rounded=Math.round(est.sectors[idx].percentage/5)*5;
      const choices=[`${rounded-10}%`,`${rounded-5}%`,`${rounded}%`,`${rounded+10}%`],correctChoice=2;
      return q(family,typeId,`Which is the best estimate for ${est.sectors[idx].label}, to the nearest 5%?`,`C. ${choices[correctChoice]}`,`${i}`,visual(pieSpec(est,{showTotal:false})),'M',{choices,correctChoice,marking:{mode:'multiple-choice',answer:choices[correctChoice]}});
    }
    if(typeId==='pie_equal_remaining_categories_from_known_count'){
      const e=namedData([20,10,10,10,10],'Travel to school',['Walk','Car','Bus','Bicycle','Scooter'],'children',i),known=e.sectors[0];
      return q(family,typeId,`${known.count} children are in ${known.label}. All the other sectors are equal. How many children are in ${e.sectors[1].label}?`,String(e.sectors[1].count),`${i}`,visual(pieSpec(e,{showTotal:false})),'M');
    }
    if(typeId==='pie_update_total_recalculate_sector_angle'){
      const variants=[{boys:14,girls:21},{boys:15,girls:24},{boys:14,girls:30},{boys:11,girls:18}],v=variants[i%variants.length];
      const boys=v.boys,girls=v.girls,newBoys=boys+1,total=boys+girls+1,ang=360*newBoys/total;
      const old=dataFromCounts([boys,girls],i,'Class members');old.unit='pupils';old.sectors[0].label='Boys';old.sectors[1].label='Girls';
      return q(family,typeId,`The chart originally represents ${boys} boys and ${girls} girls. One more boy joins the class. What angle should the boys sector have on the new pie chart?`,`${fmt(ang)}°`,`${i}`,visual(pieSpec(old,{annotationMode:'angle'})),'M');
    }

    // --- Extension/cross-topic ---------------------------------------------
    if(typeId==='pie_to_bar_chart'){
      const linked={categories:d.sectors.map(s=>s.label),values:d.sectors.map(s=>s.count),yMax:Math.ceil(Math.max(...d.sectors.map(s=>s.count))/5)*5+5};
      return q(family,typeId,`The pie chart represents ${d.total} ${d.unit}. Draw the equivalent bar chart.`,`Bar heights: ${d.sectors.map(s=>`${s.label} ${s.count}`).join(', ')}`,`${i}`,visual(pieSpec(d),{linkedBar:linked}),'XL',{curriculum:null,marking:{mode:'construction',answer:'Equivalent category frequencies shown.'}});
    }
    if(typeId==='pie_percentage_context_two_charts'){
      const A=dataFromCounts([45,30,25],i,'Group A'),B=dataFromCounts([40,35,25],i,'Group B');
      return q(family,typeId,`Group A has 80 people and Group B has 120. How many people altogether are in ${A.sectors[0].label}?`,String(.45*80+.40*120),`${i}`,visual([pieSpec(A,{title:'Group A · total 80',annotationMode:'percentage',showTotal:false}),pieSpec(B,{title:'Group B · total 120',annotationMode:'percentage',showTotal:false})]),'L',{curriculum:null});
    }
    if(typeId==='pie_multi_step_money_from_percentage_sector'){
      const m=namedData([25,35,40],'Ticket types',['Standard','Premium','VIP'],'tickets',i),prices=[6,8,10],idx=i%3,totalTickets=200,count=totalTickets*m.sectors[idx].percentage/100,revenue=count*prices[idx];
      return q(family,typeId,`${totalTickets} tickets were sold. ${m.sectors[idx].label} tickets cost £${prices[idx]} each. How much money came from that category?`,`£${fmt(revenue)}`,`${i}`,visual(pieSpec(m,{showTotal:false,annotationMode:'percentage'})),'M',{curriculum:null});
    }
    if(typeId==='pie_apply_external_rule_to_sector_counts'){
      const variants=[[10,5,5],[8,4,4],[12,6,2],[9,3,6]],counts=variants[i%variants.length];
      const sport=dataFromCounts(counts,i,'Match results');sport.unit='matches';sport.sectors[0].label='Wins';sport.sectors[1].label='Draws';sport.sectors[2].label='Losses';
      const points=counts[0]*3+counts[1];
      return q(family,typeId,`The chart represents ${sport.total} matches. A win earns 3 points, a draw 1 point and a loss 0. How many points were earned?`,String(points),`${i}`,visual(pieSpec(sport,{showTotal:true})),'M',{curriculum:null});
    }
    if(typeId==='pie_fraction_arithmetic_from_sectors'){
      const f=namedData([18,12,6],'Reading choices',['Fiction','Non-fiction','Comics'],'pupils',i),x=f.sectors[0],y=f.sectors[1];
      const num=x.count+y.count,ans=fractionLabel(num,f.total);
      return q(family,typeId,`What fraction of the whole is represented by ${x.label} and ${y.label} together?`,ans,`${i}`,visual(pieSpec(f,{showTotal:false})),'M',{curriculum:null});
    }
    return null;
  }

  function piePool(kind,rules={}){
    if(!isPieKind(kind))return[];const out=[];
    for(const typeId of TYPES_BY_FAMILY[kind]||[])for(let i=0;i<PIE_VARIANTS_PER_TYPE;i++){const item=makeQuestion(typeId,i,kind);if(item)out.push(item);}
    return out;
  }

  // --- Renderer -------------------------------------------------------------
  function drawTable(C,x,y,w,table){
    if(!table?.rows?.length)return y;const rows=[table.headers||[],...table.rows],cols=Math.max(1,table.headers?.length||table.rows[0].length),rowH=14,cw=w/cols;
    rows.forEach((row,r)=>row.forEach((cell,c)=>{C.rect(x+c*cw,y+r*rowH,cw,rowH,{fill:r===0?[242,247,249]:null,stroke:[202,213,218],width:.45});C.text(x+c*cw+3.5,y+r*rowH+9.5,String(cell===''?' ':cell),6.6,{bold:r===0,color:[48,64,72]});}));
    return y+rows.length*rowH+5;
  }
  function circlePoints(cx,cy,r,startDeg=0,endDeg=360,includeCentre=false){
    const span=endDeg-startDeg,steps=Math.max(8,Math.ceil(Math.abs(span)/7.5)),pts=includeCentre?[{x:cx,y:cy}]:[];
    for(let i=0;i<=steps;i++){const a=(startDeg+span*i/steps-90)*Math.PI/180;pts.push({x:cx+r*Math.cos(a),y:cy+r*Math.sin(a)});}return pts;
  }
  function drawPolyline(C,points,o={},close=false){
    if(!Array.isArray(points)||points.length<2)return;
    if(typeof C.polygon==='function'){C.polygon(points,o);return;}
    const requested=o.stroke||[65,76,82],stroke=Array.isArray(requested)&&requested.every(v=>Number(v)>225)?[92,103,108]:requested,width=o.width||.7;
    for(let i=1;i<points.length;i++)C.line(points[i-1].x,points[i-1].y,points[i].x,points[i].y,{color:stroke,width});
    if(close)C.line(points[points.length-1].x,points[points.length-1].y,points[0].x,points[0].y,{color:stroke,width});
  }
  function drawLegend(C,x,y,w,sectors,pie,cols=2){
    const pal=global.TT99VisualPalette||{},colors=pal.series||[[45,134,125],[225,161,65],[83,128,184],[202,104,101],[132,108,177],[105,153,103]],cw=w/cols,rowH=11;
    sectors.forEach((s,j)=>{const col=j%cols,row=Math.floor(j/cols),xx=x+col*cw,yy=y+row*rowH,color=colors[(j+(pie.colorOffset||0))%colors.length],ann=pie.annotations?pie.annotations[j]:annotationFor(s,pie.annotationMode);C.rect(xx,yy,7,7,{fill:color,stroke:[75,85,90],width:.35});C.text(xx+10,yy+6.2,`${s.label}${ann?` · ${ann}`:''}`,6.1,{color:[54,66,72]});});
    return y+Math.ceil(sectors.length/cols)*rowH;
  }
  function drawOnePie(C,x,y,w,h,pie,answers){
    const pal=global.TT99VisualPalette||{},colors=pal.series||[[45,134,125],[225,161,65],[83,128,184],[202,104,101],[132,108,177],[105,153,103]],ink=pal.ink||[39,54,61],muted=pal.muted||[92,105,112];
    const sectors=pie.sectors||[],showLegend=pie.showLegend!==false,showTotal=pie.showTotal&&pie.total!=null,rightLegend=showLegend&&pie.legendPosition==='right'&&!pie.construction;
    const legendH=showLegend&&!rightLegend?Math.ceil(sectors.length/2)*11:0,titleH=pie.title?14:3,totalH=showTotal?9:0;
    const circleToMetaGap=10,legendGap=showLegend&&!rightLegend?(showTotal?8:11):0,bottomPad=3;
    const reservedAfterCircle=circleToMetaGap+totalH+legendGap+legendH+bottomPad;
    const availableDiameter=Math.max(56,h-titleH-reservedAfterCircle-2),chartW=rightLegend?w*.60:w;
    const maxR=Math.min(chartW*.36,availableDiameter/2),r=Math.max(28,maxR),cx=rightLegend?x+chartW/2:x+w/2,cy=y+titleH+r+2;
    if(pie.title)C.text(cx,y+8,pie.title,7.1,{bold:true,align:'center',color:ink});
    const construction=pie.construction&&!answers;
    if(construction){
      const outline=circlePoints(cx,cy,r);drawPolyline(C,outline,{stroke:[65,76,82],width:.9},true);
      if(pie.baseline!==false)C.line(cx,cy,cx,cy-r,{color:[75,86,92],width:.75});C.rect(cx-1.5,cy-1.5,3,3,{fill:[80,90,96]});
    }else{
      let start=Number(pie.startAngle||0);
      sectors.forEach((s,j)=>{const end=start+Number(s.angle||0),color=colors[(j+(pie.colorOffset||0))%colors.length],pts=circlePoints(cx,cy,r,start,end,true);drawPolyline(C,pts,{fill:color,stroke:[255,255,255],width:1},true);start=end;});
      drawPolyline(C,circlePoints(cx,cy,r),{stroke:[62,73,80],width:.75},true);
      const labelSize=r>=50?6.1:5.8,annotationSize=r>=50?5.9:5.6;
      let a0=Number(pie.startAngle||0);sectors.forEach((s,j)=>{const mid=a0+Number(s.angle||0)/2,rad=(mid-90)*Math.PI/180,rr=r*(Number(s.angle)>=55?.58:.72),tx=cx+rr*Math.cos(rad),ty=cy+rr*Math.sin(rad),ann=pie.annotations?pie.annotations[j]:annotationFor(s,pie.annotationMode);if(pie.showInternalLabels!==false&&!pie.hideLabels&&Number(s.angle)>=48)C.text(tx,ty-1,s.label,labelSize,{bold:true,align:'center',color:[30,40,44]});if(ann&&Number(s.angle)>=30)C.text(tx,ty+7,ann,annotationSize,{align:'center',color:[30,40,44]});a0+=Number(s.angle||0);});
    }
    let below=cy+r+circleToMetaGap;
    if(showTotal){C.text(cx,below,`Total: ${fmt(pie.total)}${pie.unit?` ${pie.unit}`:''}`,6.3,{bold:true,align:'center',color:muted});below+=totalH;}
    if(showLegend){if(rightLegend){drawLegend(C,x+chartW+5,y+titleH+8,w-chartW-8,sectors,pie,1);}else{below+=legendGap;below=drawLegend(C,x+4,below,w-8,sectors,pie,2);}}
    return below;
  }
  function drawMiniBar(C,x,y,w,h,bar,answers){
    const pal=global.TT99VisualPalette||{},colors=pal.series||[[45,134,125],[225,161,65],[83,128,184],[202,104,101],[132,108,177],[105,153,103]],left=x+25,right=x+w-5,top=y+12,bottom=y+h-18,max=Number(bar.yMax||Math.max(...bar.values,1)),gw=(right-left)/bar.categories.length;
    C.text((left+right)/2,y+7,'Equivalent bar chart',7,{bold:true,align:'center',color:[45,60,66]});C.line(left,top,left,bottom,{color:[65,76,82],width:.7});C.line(left,bottom,right,bottom,{color:[65,76,82],width:.7});
    for(let t=0;t<=max;t+=Math.max(1,Math.ceil(max/4))){const yy=bottom-(t/max)*(bottom-top);C.line(left,yy,right,yy,{color:[227,232,234],width:.4});C.text(left-4,yy+2,String(t),5.4,{align:'right',color:[95,105,110]});}
    bar.categories.forEach((cat,j)=>{if(answers){const val=bar.values[j],bh=(val/max)*(bottom-top),bw=gw*.55,bx=left+j*gw+(gw-bw)/2;C.rect(bx,bottom-bh,bw,bh,{fill:colors[j%colors.length],stroke:[70,80,85],width:.35});}C.text(left+j*gw+gw/2,bottom+10,String(cat).slice(0,10),5.1,{align:'center',color:[70,80,85]});});
  }
  function renderPie(C,x,y,w,h,v,answers){
    let top=y;if(v.note){C.text(x,top,v.note,6.5,{color:[90,100,105]});top+=10;}
    const table=answers&&v.answerTable?v.answerTable:v.table;if(table)top=drawTable(C,x,top,w,table);
    if(v.title){C.text(x+w/2,top+7,v.title,8,{bold:true,align:'center',color:[40,55,62]});top+=11;}
    const statementH=Array.isArray(v.statements)&&v.statements.length?v.statements.length*10+4:0,availH=Math.max(70,h-(top-y)-statementH);
    if(v.linkedBar){
      drawOnePie(C,x,top,w*.48,availH,v.pies[0],answers);drawMiniBar(C,x+w*.52,top,w*.48,availH,v.linkedBar,answers);
    }else{
      const pies=v.pies||[],gap=pies.length>1?8:0,pw=(w-gap*(pies.length-1))/Math.max(1,pies.length);pies.forEach((p,j)=>drawOnePie(C,x+j*(pw+gap),top,pw,availH,p,answers));
    }
    if(statementH){let sy=y+h-statementH+7;v.statements.forEach((s,j)=>{C.text(x+3,sy,`${j+1}. ${s}`,6.2,{color:[52,64,70]});sy+=10;});}
  }
  global.TT99VisualRenderers=global.TT99VisualRenderers||{};
  global.TT99VisualRenderers.pie=renderPie;

  // --- Generator integration ------------------------------------------------
  const previous={
    generateQuestions:G.generateQuestions.bind(G),questionPool:G.questionPool.bind(G),questionByKey:G.questionByKey.bind(G),
    questionPoolIndex:G.questionPoolIndex.bind(G),questionByPoolIndex:G.questionByPoolIndex.bind(G),replaceQuestion:G.replaceQuestion.bind(G)
  };
  function hashString(str){let h=2166136261>>>0;for(let i=0;i<String(str).length;i++){h^=String(str).charCodeAt(i);h=Math.imul(h,16777619)>>>0;}return h>>>0;}
  function localRng(seed){let a=hashString(seed)||0x6d2b79f5;return function(){a|=0;a=(a+0x6D2B79F5)|0;let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};}
  function rngFor(seed){return typeof G.rngFromSeed==='function'?G.rngFromSeed(seed):localRng(seed);}
  function shuffle(arr,rng){const out=arr.slice();for(let i=out.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[out[i],out[j]]=[out[j],out[i]];}return out;}
  function balancedPick(pool,count,rng,rules){
    if(!pool.length||count<=0)return[];const chosen=[],groups=new Map(),seen=new Set();let lastSignature='';for(const item of pool){const k=item.group||'__all';if(!groups.has(k))groups.set(k,[]);groups.get(k).push(item);}const keys=shuffle([...groups.keys()],rng);for(const k of keys)groups.set(k,shuffle(groups.get(k),rng));const offsets=Object.fromEntries(keys.map(k=>[k,0]));let guard=0;
    while(chosen.length<count&&guard<count*100+1000){guard++;let progress=false;for(const k of shuffle(keys,rng)){const arr=groups.get(k);let tries=0,fallback=null;while(tries<arr.length){const item=arr[offsets[k]%arr.length];offsets[k]++;tries++;if(rules?.avoidExactDuplicates!==false&&seen.has(item.key))continue;if(item.visualSignature&&item.visualSignature===lastSignature){fallback=fallback||item;continue;}chosen.push(clone(item));seen.add(item.key);lastSignature=item.visualSignature||'';progress=true;fallback=null;break;}if(!progress&&fallback){chosen.push(clone(fallback));seen.add(fallback.key);lastSignature=fallback.visualSignature||'';progress=true;}if(chosen.length>=count)break;}if(!progress){seen.clear();lastSignature='';for(const k of keys)groups.set(k,shuffle(groups.get(k),rng));}}
    return chosen.slice(0,count);
  }
  function weightedCounts(rules,rng){const bag=[];for(const f of rules.families){const w=Math.max(1,Number(rules.familyWeights?.[f])||1);for(let i=0;i<w;i++)bag.push(f);}const cycle=shuffle(bag,rng),counts=Object.fromEntries(rules.families.map(f=>[f,0]));for(let i=0;i<rules.questionCount;i++)counts[cycle[i%cycle.length]]++;return counts;}

  G.questionPool=function(kind,rules){if(isPieKind(kind))return piePool(kind,G.normalizeRules(rules));return previous.questionPool(kind,rules);};
  G.questionByKey=function(kind,rules,key){if(!isPieKind(kind))return previous.questionByKey(kind,rules,key);const found=G.questionPool(kind,rules).find(x=>x.key===key);return found?clone(found):null;};
  G.questionPoolIndex=function(kind,rules,key){if(!isPieKind(kind))return previous.questionPoolIndex(kind,rules,key);return G.questionPool(kind,rules).findIndex(x=>x.key===key);};
  G.questionByPoolIndex=function(kind,rules,index){if(!isPieKind(kind))return previous.questionByPoolIndex(kind,rules,index);const pool=G.questionPool(kind,rules),n=Number(index);return Number.isInteger(n)&&n>=0&&n<pool.length?clone(pool[n]):null;};
  G.generateQuestions=function(inputRules,seed){
    const rules=G.normalizeRules(inputRules);if(rules.mode!=='family_mix'||!hasPieFamily(rules))return previous.generateQuestions(inputRules,seed);
    const rng=rngFor(seed||'CUSTOM'),counts=weightedCounts(rules,rng);let out=[];for(const family of rules.families){const count=counts[family]||0;if(!count)continue;out=out.concat(balancedPick(G.questionPool(family,rules),count,rng,rules));}
    return shuffle(out,rng).map((item,idx)=>({...item,number:idx+1}));
  };
  G.replaceQuestion=function(questions,index,inputRules,seed){
    const current=questions?.[index];if(!current||!isPieKind(current.kind))return previous.replaceQuestion(questions,index,inputRules,seed);
    const rules=G.normalizeRules(inputRules),pool=G.questionPool(current.kind,rules).filter(x=>x.pieTypeId===current.pieTypeId&&x.key!==current.key);if(!pool.length)return questions.slice();const used=new Set(questions.filter((_,j)=>j!==index).map(x=>x.key));let candidates=pool.filter(x=>!used.has(x.key));if(!candidates.length)candidates=pool;const rng=rngFor(String(seed||'')+':pie-replacement'),chosen=shuffle(candidates,rng)[0],out=questions.slice();out[index]={...clone(chosen),number:index+1};return out;
  };

  function validateVisual(v){
    if(!v||v.type!=='pie'||!Array.isArray(v.pies)||!v.pies.length)return {ok:false,error:'not-pie'};
    for(const pie of v.pies){if(!Array.isArray(pie.sectors)||pie.sectors.length<2)return {ok:false,error:'too-few-sectors'};const totalAngle=sum(pie.sectors.map(s=>s.angle));if(Math.abs(totalAngle-360)>1e-6)return {ok:false,error:`angles-sum-${totalAngle}`};if(pie.sectors.some(s=>!(Number(s.angle)>0)))return {ok:false,error:'nonpositive-sector'};}
    return {ok:true,error:'',pieCount:v.pies.length,sectorCount:v.pies.reduce((a,p)=>a+p.sectors.length,0)};
  }

  global.TT99CustomPieCharts={VERSION,PIE_FAMILIES,CATALOGUE,TYPES_BY_FAMILY,piePool,renderPie,validateVisual,dataFromCounts};
}(typeof window!=='undefined'?window:globalThis));
