/* Tech Tinker Club - Custom Worksheets coordinate geometry engine
 * v0.2 / visual coordinates stage 2
 *
 * Adds curriculum-mapped coordinate/translation/reflection questions to the
 * hidden Custom Worksheets workspace.  It depends on custom-graphs.js for the
 * shared visual worksheet compositor, but owns its own maths models, question
 * catalogue and coordinate renderer.
 */
(function(global){
  'use strict';
  const G=global.TT99Generator;
  if(!G) return;

  const VERSION='0.2.2';
  const COORD_FAMILIES={
    coordinates_y4:{label:'coordinates & translation',strand:'Geometry',years:[4],curriculumId:'Y4.PD.01'},
    transformations_y5:{label:'reflection & translation',strand:'Geometry',years:[5],curriculumId:'Y5.PD.01'},
    coordinates_y6:{label:'four-quadrant coordinates & transformations',strand:'Geometry',years:[6],curriculumId:'Y6.PD.01/Y6.PD.02'},
    coordinates_extension:{label:'coordinate reasoning (extension)',strand:'Extension',years:[],curriculumId:'',extension:true}
  };
  const COORD_FAMILY_IDS=Object.keys(COORD_FAMILIES);
  const isCoordKind=kind=>COORD_FAMILY_IDS.includes(String(kind||''));
  const hasCoordFamily=rules=>Array.isArray(rules?.families)&&rules.families.some(isCoordKind);
  const clone=o=>JSON.parse(JSON.stringify(o));
  const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const pt=(x,y,label='',role='given')=>({x,y,label,role});
  const poly=(points,labels=[],style='given',closed=true)=>({points:points.map(p=>({x:p[0],y:p[1]})),labels,style,closed});
  const coords=points=>points.map(p=>`(${p[0]}, ${p[1]})`).join(', ');
  const translate=(points,dx,dy)=>points.map(([x,y])=>[x+dx,y+dy]);
  const reflectX=(points,k=0)=>points.map(([x,y])=>[x,2*k-y]);
  const reflectY=(points,k=0)=>points.map(([x,y])=>[2*k-x,y]);
  const rotate90=(points,cx=0,cy=0,clockwise=true)=>points.map(([x,y])=>clockwise?[cx+(y-cy),cy-(x-cx)]:[cx-(y-cy),cy+(x-cx)]);
  const inBounds=(points,xMin,xMax,yMin,yMax)=>points.every(([x,y])=>x>=xMin&&x<=xMax&&y>=yMin&&y<=yMax);
  const moveText=(dx,dy)=>{
    const parts=[];
    if(dx)parts.push(`${Math.abs(dx)} ${Math.abs(dx)===1?'unit':'units'} ${dx>0?'right':'left'}`);
    if(dy)parts.push(`${Math.abs(dy)} ${Math.abs(dy)===1?'unit':'units'} ${dy>0?'up':'down'}`);
    return parts.join(' and ');
  };

  const CATALOGUE=[
    // Year 4 - first quadrant and translation.
    {id:'cg_y4_read_coordinate',family:'coordinates_y4',title:'Read a marked coordinate',category:'read'},
    {id:'cg_y4_xy_order',family:'coordinates_y4',title:'Distinguish x-y coordinate order',category:'diagnostic'},
    {id:'cg_y4_identify_label',family:'coordinates_y4',title:'Identify a labelled point from its coordinates',category:'read'},
    {id:'cg_y4_plot_point',family:'coordinates_y4',title:'Plot a specified point',category:'construct'},
    {id:'cg_y4_draw_polygon',family:'coordinates_y4',title:'Plot coordinates and draw a polygon',category:'construct'},
    {id:'cg_y4_missing_vertex',family:'coordinates_y4',title:'Complete a polygon with a missing vertex',category:'reasoning'},
    {id:'cg_y4_translate_point',family:'coordinates_y4',title:'Translate a point left/right and up/down',category:'translation'},
    {id:'cg_y4_translate_shape',family:'coordinates_y4',title:'Translate a polygon from an instruction',category:'translation_construct'},
    {id:'cg_y4_translate_shape_to_point',family:'coordinates_y4',title:'Translate a polygon so one vertex reaches a target',category:'translation_construct'},
    {id:'cg_y4_describe_translation',family:'coordinates_y4',title:'Describe a shown translation',category:'translation_reasoning'},
    {id:'cg_y4_translated_vertices',family:'coordinates_y4',title:'Give coordinates after translating a polygon',category:'translation_reasoning'},
    {id:'cg_y4_same_displacement_endpoint',family:'coordinates_y4',title:'Find an endpoint using the same displacement',category:'translation_reasoning'},

    // Year 5 - first quadrant reflection and translation.
    {id:'cg_y5_translate_shape',family:'transformations_y5',title:'Represent a translated shape',category:'translation_construct'},
    {id:'cg_y5_describe_translation',family:'transformations_y5',title:'Describe a translation',category:'translation_reasoning'},
    {id:'cg_y5_reflect_vertical',family:'transformations_y5',title:'Reflect in a vertical line parallel to the y-axis',category:'reflection_construct'},
    {id:'cg_y5_reflect_horizontal',family:'transformations_y5',title:'Reflect in a horizontal line parallel to the x-axis',category:'reflection_construct'},
    {id:'cg_y5_reflection_coordinate_set',family:'transformations_y5',title:'Write all coordinates after an offset-line reflection',category:'reflection_reasoning'},
    {id:'cg_y5_reflected_vertex',family:'transformations_y5',title:'Find a reflected vertex coordinate',category:'reflection_reasoning'},
    {id:'cg_y5_describe_reflection',family:'transformations_y5',title:'Describe a shown reflection',category:'reflection_reasoning'},
    {id:'cg_y5_identify_transform',family:'transformations_y5',title:'Identify reflection or translation',category:'classification'},
    {id:'cg_y5_preservation',family:'transformations_y5',title:'Reason about invariance under a transformation',category:'reasoning'},

    // Year 6 - all four quadrants, missing coordinates and axes reflections.
    {id:'cg_y6_read_coordinate',family:'coordinates_y6',title:'Read a coordinate in four quadrants',category:'read'},
    {id:'cg_y6_xy_order',family:'coordinates_y6',title:'Distinguish signed x-y coordinate order',category:'diagnostic'},
    {id:'cg_y6_identify_label',family:'coordinates_y6',title:'Identify a labelled point in four quadrants',category:'read'},
    {id:'cg_y6_spot_plotting_error',family:'coordinates_y6',title:'Spot a coordinate plotting error',category:'diagnostic'},
    {id:'cg_y6_plot_point',family:'coordinates_y6',title:'Plot a point in four quadrants',category:'construct'},
    {id:'cg_y6_plot_join_identify_polygon',family:'coordinates_y6',title:'Plot, join and identify a polygon',category:'construct'},
    {id:'cg_y6_missing_rectangle',family:'coordinates_y6',title:'Predict a missing rectangle vertex',category:'shape_reasoning'},
    {id:'cg_y6_missing_parallelogram',family:'coordinates_y6',title:'Predict a missing parallelogram vertex',category:'shape_reasoning'},
    {id:'cg_y6_missing_rhombus',family:'coordinates_y6',title:'Predict a missing rhombus vertex',category:'shape_reasoning'},
    {id:'cg_y6_missing_kite',family:'coordinates_y6',title:'Predict a missing kite vertex',category:'shape_reasoning'},
    {id:'cg_y6_translate_shape',family:'coordinates_y6',title:'Translate a shape across four quadrants',category:'translation_construct'},
    {id:'cg_y6_describe_translation',family:'coordinates_y6',title:'Describe a translation in four quadrants',category:'translation_reasoning'},
    {id:'cg_y6_reflect_x_axis',family:'coordinates_y6',title:'Reflect a shape in the x-axis',category:'reflection_construct'},
    {id:'cg_y6_reflect_y_axis',family:'coordinates_y6',title:'Reflect a shape in the y-axis',category:'reflection_construct'},
    {id:'cg_y6_reflected_point',family:'coordinates_y6',title:'Find a reflected point coordinate',category:'reflection_reasoning'},
    {id:'cg_y6_reflection_sign_rule',family:'coordinates_y6',title:'Reason about sign changes under axis reflection',category:'reflection_reasoning'},
    {id:'cg_y6_complete_reflection_pattern',family:'coordinates_y6',title:'Complete a four-quadrant reflection pattern',category:'reflection_construct'},
    {id:'cg_y6_missing_component',family:'coordinates_y6',title:'Reason about a missing coordinate component',category:'shape_reasoning'},

    // Deliberately separate from the ordinary year families: useful historical/booster reasoning, not a normal statutory preset.
    {id:'cg_ext_midpoint',family:'coordinates_extension',title:'Find a midpoint from two endpoints',category:'extension_midpoint'},
    {id:'cg_ext_rectangle_centre',family:'coordinates_extension',title:'Find the centre of a rectangle',category:'extension_midpoint'},
    {id:'cg_ext_equally_spaced_line',family:'coordinates_extension',title:'Infer a point on an equally spaced coordinate line',category:'extension_pattern'},
    {id:'cg_ext_rotation_90',family:'coordinates_extension',title:'Rotate a point 90 degrees about a centre',category:'extension_rotation'}
  ];
  const TYPES_BY_FAMILY=Object.fromEntries(COORD_FAMILY_IDS.map(f=>[f,CATALOGUE.filter(x=>x.family===f).map(x=>x.id)]));

  // Register the visual curriculum families before custom-app.js reads the registry.
  for(const [id,meta] of Object.entries(COORD_FAMILIES)){
    if(!G.FAMILY_META[id])G.FAMILY_META[id]={label:meta.label,strand:meta.strand,years:meta.years.slice(),visual:true,curriculumId:meta.curriculumId,extension:!!meta.extension};
    G.FAMILY_LABELS[id]=meta.label;
    if(Array.isArray(G.FAMILY_ORDER)&&!G.FAMILY_ORDER.includes(id))G.FAMILY_ORDER.push(id);
    if(Array.isArray(G.FAMILY_COMPACT_ORDER)&&!G.FAMILY_COMPACT_ORDER.includes(id))G.FAMILY_COMPACT_ORDER.push(id);
  }

  // The old coordinate families are retained for saved-sheet compatibility, but once
  // this renderer is loaded they become explicit text-only fallbacks rather than being
  // selected alongside the visual curriculum families by Year quick-picks.
  function demoteTextFallback(id,label){
    if(!G.FAMILY_META?.[id])return;
    Object.assign(G.FAMILY_META[id],{label,strand:'Extension',years:[],extension:true,textFallback:true});
    G.FAMILY_LABELS[id]=label;
  }
  demoteTextFallback('coordinates','coordinate translations (text-only fallback)');
  demoteTextFallback('coordinate_reflection','coordinate reflections (text-only fallback)');

  function visualBase(year){
    return year===6
      ? {type:'coordinate',xMin:-6,xMax:6,yMin:-6,yMax:6,tickEvery:1,labelEvery:2,year}
      : {type:'coordinate',xMin:0,xMax:10,yMin:0,yMax:10,tickEvery:1,labelEvery:1,year};
  }
  function makeVisual(year,extra={}){return {...visualBase(year),points:[],polygons:[],answerPoints:[],answerPolygons:[],...extra};}
  function q(kind,typeId,prompt,answer,key,visual,footprint='L',extra={}){
    const meta=COORD_FAMILIES[kind];
    return {kind,coordinateTypeId:typeId,prompt,answer,key:`${kind}:${typeId}:${key}`,visual,footprint,group:typeId,
      marking:extra.marking||{mode:'exact',answer},curriculum:extra.curriculum||{family:kind,year:meta?.years?.[0]||null,id:meta?.curriculumId||''},...extra};
  }

  const Y4_POLYS=[
    {name:'square',p:[[2,2],[5,2],[5,5],[2,5]]},
    {name:'rectangle',p:[[1,3],[5,3],[5,5],[1,5]]},
    {name:'parallelogram',p:[[2,2],[6,2],[8,5],[4,5]]},
    {name:'kite',p:[[4,1],[7,4],[4,7],[2,4]]},
    {name:'rectangle',p:[[3,1],[7,1],[7,4],[3,4]]},
    {name:'square',p:[[4,3],[7,3],[7,6],[4,6]]}
  ];
  const Y4_MOVES=[[2,2],[3,-2],[-2,2],[1,-1],[-2,3],[2,-2]];

  function y4Question(typeId,i){
    const idx=i%6;
    if(typeId==='cg_y4_read_coordinate'){
      const x=[2,7,4,8,3,6][idx],y=[6,3,8,5,2,7][idx];
      return q('coordinates_y4',typeId,'Write the coordinates of point A.',`(${x}, ${y})`,idx,makeVisual(4,{points:[pt(x,y,'A')]}),'M');
    }
    if(typeId==='cg_y4_xy_order'){
      const x=[2,3,7,4,8,6][idx],y=[6,8,3,7,2,4][idx],target=idx%2?'Q':'P';
      const points=target==='P'?[pt(x,y,'P'),pt(y,x,'Q')]:[pt(y,x,'P'),pt(x,y,'Q')];
      return q('coordinates_y4',typeId,`Which labelled point is at (${x}, ${y})?`,target,idx,makeVisual(4,{points}),'M',{misconception:'coordinate_order'});
    }
    if(typeId==='cg_y4_identify_label'){
      const sets=[[[2,7,'A'],[7,2,'B'],[4,5,'C'],[8,8,'D']],[[1,6,'P'],[6,4,'Q'],[3,2,'R'],[8,5,'S']],[[2,3,'J'],[5,7,'K'],[8,2,'L'],[4,8,'M']],[[1,1,'W'],[3,6,'X'],[6,3,'Y'],[9,7,'Z']],[[2,8,'A'],[5,4,'B'],[7,7,'C'],[9,2,'D']],[[1,4,'P'],[4,1,'Q'],[6,8,'R'],[8,5,'S']]][idx];
      const target=sets[(idx+2)%sets.length];
      return q('coordinates_y4',typeId,`Which labelled point is at (${target[0]}, ${target[1]})?`,target[2],idx,makeVisual(4,{points:sets.map(v=>pt(v[0],v[1],v[2]))}),'M');
    }
    if(typeId==='cg_y4_plot_point'){
      const x=[3,8,2,6,5,7][idx],y=[7,2,5,8,3,6][idx];
      return q('coordinates_y4',typeId,`Plot point P at (${x}, ${y}).`,`P = (${x}, ${y})`,idx,makeVisual(4,{answerPoints:[pt(x,y,'P','answer')]}),'L',{marking:{mode:'construction',answer:[x,y]}});
    }
    if(typeId==='cg_y4_draw_polygon'){
      const s=Y4_POLYS[idx],labels=['A','B','C','D'];
      return q('coordinates_y4',typeId,`Plot ${coords(s.p)} and join the points in order. Name the shape.`,s.name,idx,makeVisual(4,{answerPolygons:[poly(s.p,labels,'answer')]}),'L',{marking:{mode:'construction+label',answer:s.name}});
    }
    if(typeId==='cg_y4_missing_vertex'){
      const bases=[[[2,2],[7,2],[7,5],[2,5]],[[1,4],[6,4],[6,7],[1,7]],[[3,1],[8,1],[8,4],[3,4]],[[2,5],[5,5],[5,8],[2,8]],[[4,2],[9,2],[9,6],[4,6]],[[1,1],[4,1],[4,5],[1,5]]];
      const p=bases[idx],shown=p.slice(0,3),answer=p[3];
      return q('coordinates_y4',typeId,'A, B and C are three vertices of a rectangle. What are the coordinates of D?',`(${answer[0]}, ${answer[1]})`,idx,makeVisual(4,{polygons:[poly(shown,['A','B','C'],'given',false)],points:shown.map((v,j)=>pt(v[0],v[1],['A','B','C'][j])),answerPolygons:[poly(p,['A','B','C','D'],'answer')],answerPoints:[pt(answer[0],answer[1],'D','answer')]}),'L',{marking:{mode:'exact-coordinate',answer}});
    }
    if(typeId==='cg_y4_translate_point'){
      const start=[[2,2],[7,2],[2,7],[7,7],[4,3],[6,6]][idx],mv=[[3,2],[-3,4],[4,-3],[-2,-4],[3,3],[-4,2]][idx],end=[start[0]+mv[0],start[1]+mv[1]];
      return q('coordinates_y4',typeId,`Point A is translated ${moveText(mv[0],mv[1])}. What are its new coordinates?`,`(${end[0]}, ${end[1]})`,idx,makeVisual(4,{points:[pt(...start,'A')],answerPoints:[pt(...end,"A'",'answer')]}),'M');
    }
    if(typeId==='cg_y4_translate_shape'||typeId==='cg_y4_translated_vertices'){
      const base=Y4_POLYS[idx].p,mv=Y4_MOVES[idx],moved=translate(base,mv[0],mv[1]);
      if(!inBounds(moved,0,10,0,10))return y4Question(typeId,(i+1)%6);
      const labels=base.map((_,j)=>String.fromCharCode(65+j));
      const answerLabels=labels.map(s=>`${s}'`);
      const v=makeVisual(4,{polygons:[poly(base,labels,'given')],answerPolygons:[poly(moved,answerLabels,'answer')]});
      if(typeId==='cg_y4_translate_shape')return q('coordinates_y4',typeId,`Translate the shape ${moveText(mv[0],mv[1])}. Draw it in its new position.`,'Correct translated shape',idx,v,'L',{marking:{mode:'construction',answer:moved}});
      return q('coordinates_y4',typeId,`The shape is translated ${moveText(mv[0],mv[1])}. Write the coordinates of its new vertices.`,coords(moved),idx,v,'L',{marking:{mode:'coordinate-set',answer:moved}});
    }
    if(typeId==='cg_y4_translate_shape_to_point'){
      const bases=[[[1,5],[3,7],[5,5]],[[5,2],[7,2],[6,4]],[[2,2],[5,2],[4,4]],[[5,6],[7,8],[8,6]],[[1,4],[3,6],[4,4]],[[4,1],[6,1],[5,3]]];
      const base=bases[idx],mv=[[3,-3],[-4,4],[3,3],[-3,-4],[4,2],[-2,5]][idx],moved=translate(base,mv[0],mv[1]);
      const target=moved[0],labels=['A','C','D'];
      return q('coordinates_y4',typeId,'Translate the triangle so that vertex A moves to point B. Draw the new triangle.','Correct translated triangle',idx,makeVisual(4,{polygons:[poly(base,labels,'given')],points:[pt(target[0],target[1],'B','target')],answerPolygons:[poly(moved,["A'","C'","D'"],'answer')]}),'L',{marking:{mode:'construction',answer:moved}});
    }
    if(typeId==='cg_y4_describe_translation'){
      const bases=[[[1,6],[3,8],[4,6]],[[6,2],[8,2],[7,4]],[[2,2],[4,2],[4,4],[2,4]],[[6,6],[8,6],[8,8],[6,8]],[[1,3],[3,5],[4,3]],[[5,1],[7,1],[6,3]]];
      const mv=[[4,-3],[-4,4],[3,4],[-4,-5],[4,2],[-3,5]][idx],base=bases[idx],moved=translate(base,mv[0],mv[1]);
      return q('coordinates_y4',typeId,'Shape A has been translated to shape B. Describe the translation.',moveText(mv[0],mv[1]),idx,makeVisual(4,{polygons:[poly(base,[],'given'),poly(moved,[],'image')],shapeLabels:[{x:base[0][0],y:base[0][1],text:'A'},{x:moved[0][0],y:moved[0][1],text:'B'}]}),'L');
    }
    if(typeId==='cg_y4_same_displacement_endpoint'){
      const rows=[{a:[1,2],b:[4,5],c:[5,2]},{a:[2,7],b:[5,5],c:[6,7]},{a:[1,5],b:[4,7],c:[5,2]},{a:[6,2],b:[3,5],c:[8,4]},{a:[2,2],b:[5,4],c:[4,6]},{a:[7,7],b:[4,5],c:[8,4]}],r=rows[idx],mv=[r.b[0]-r.a[0],r.b[1]-r.a[1]],d=[r.c[0]+mv[0],r.c[1]+mv[1]];
      return q('coordinates_y4',typeId,'AB and CD show the same translation. What are the coordinates of D?',`(${d[0]}, ${d[1]})`,idx,makeVisual(4,{polygons:[poly([r.a,r.b],['A','B'],'given',false)],points:[pt(...r.a,'A'),pt(...r.b,'B'),pt(...r.c,'C')],answerPolygons:[poly([r.c,d],['C','D'],'answer',false)],answerPoints:[pt(...d,'D','answer')]}),'L',{marking:{mode:'exact-coordinate',answer:d}});
    }
    return null;
  }

  const Y5_BASES=[
    [[1,2],[3,2],[2,4]],[[2,6],[4,6],[3,8]],[[1,5],[3,5],[3,7],[1,7]],
    [[6,1],[8,1],[7,3]],[[6,6],[8,6],[8,8],[6,8]],[[2,1],[4,2],[3,4],[1,3]]
  ];
  function y5Question(typeId,i){
    const idx=i%6;
    if(typeId==='cg_y5_translate_shape'||typeId==='cg_y5_describe_translation'||typeId==='cg_y5_preservation'){
      const bases=[[[1,2],[3,2],[2,4]],[[5,1],[8,1],[7,3]],[[1,6],[3,6],[3,8],[1,8]],[[6,6],[8,6],[7,8]],[[2,2],[4,3],[3,5],[1,4]],[[5,5],[7,5],[7,7],[5,7]]];
      const mv=[[4,3],[-4,4],[5,-4],[-4,-4],[4,3],[-4,2]][idx],base=bases[idx],moved=translate(base,mv[0],mv[1]);
      const v=makeVisual(5,{polygons:[poly(base,[],'given')],answerPolygons:typeId==='cg_y5_translate_shape'?[poly(moved,[],'answer')]:[],});
      if(typeId!=='cg_y5_translate_shape')v.polygons.push(poly(moved,[],'image'));
      if(typeId==='cg_y5_translate_shape')return q('transformations_y5',typeId,`Translate the shape ${moveText(mv[0],mv[1])}. Draw its image.`,'Correct translated shape',idx,v,'L',{marking:{mode:'construction',answer:moved}});
      if(typeId==='cg_y5_describe_translation')return q('transformations_y5',typeId,'Describe the translation that maps shape A to shape B.',moveText(mv[0],mv[1]),idx,{...v,shapeLabels:[{x:base[0][0],y:base[0][1],text:'A'},{x:moved[0][0],y:moved[0][1],text:'B'}]},'L');
      return q('transformations_y5',typeId,'A shape has been translated. Have its side lengths changed? Explain.','No. A translation changes position but not the shape or its side lengths.',idx,v,'L',{response:{kind:'explanation',size:'M',label:'Explain your reasoning'},marking:{mode:'rubric',answer:'No. A translation changes position but preserves shape and side lengths.',rule:'Mark correct if the pupil gives the correct conclusion and identifies the invariant property.',criteria:['States that the side lengths do not change.','Explains that a translation changes position but preserves the shape/size.'],accept:'Equivalent language such as “the shape slides without changing size” is acceptable.'}});
    }
    if(typeId==='cg_y5_reflect_vertical'||typeId==='cg_y5_reflected_vertex'||typeId==='cg_y5_describe_reflection'){
      const k=[5,4,5,5,4,6][idx];
      const base=[[[1,2],[3,2],[2,4]],[[1,5],[3,5],[2,7]],[[1,2],[4,2],[3,4]],[[1,6],[3,6],[2,8]],[[1,1],[3,2],[2,4]],[[2,5],[4,5],[3,8]]][idx];
      const moved=reflectY(base,k);
      const mirror={axis:'x',value:k,label:`x = ${k}`};
      if(typeId==='cg_y5_reflect_vertical')return q('transformations_y5',typeId,`Reflect the shape in the vertical line x = ${k}. Draw its image.`,'Correct reflected shape',idx,makeVisual(5,{polygons:[poly(base,['A','B','C'],'given')],mirrorLine:mirror,answerPolygons:[poly(moved,["A'","B'","C'"],'answer')]}),'L',{marking:{mode:'construction',answer:moved}});
      if(typeId==='cg_y5_reflected_vertex')return q('transformations_y5',typeId,`Vertex A is reflected in the line x = ${k}. What are the coordinates of A'?`,`(${moved[0][0]}, ${moved[0][1]})`,idx,makeVisual(5,{polygons:[poly(base,['A','B','C'],'given')],mirrorLine:mirror,answerPolygons:[poly(moved,["A'","B'","C'"],'answer')],answerPoints:[pt(moved[0][0],moved[0][1],"A'",'answer')]}),'L');
      return q('transformations_y5',typeId,'Shape A has been mapped to shape B. Describe the transformation.',`Reflection in the vertical line x = ${k}.`,idx,makeVisual(5,{polygons:[poly(base,[],'given'),poly(moved,[],'image')],mirrorLine:mirror,shapeLabels:[{x:base[0][0],y:base[0][1],text:'A'},{x:moved[0][0],y:moved[0][1],text:'B'}]}),'L');
    }
    if(typeId==='cg_y5_reflect_horizontal'){
      const k=[5,5,4,5,5,4][idx],base=[[[2,1],[4,1],[3,3]],[[5,1],[7,1],[6,4]],[[1,1],[3,1],[3,3],[1,3]],[[5,1],[8,1],[7,3]],[[1,2],[3,2],[2,4]],[[6,1],[8,2],[7,3]]][idx],moved=reflectX(base,k);
      return q('transformations_y5',typeId,`Reflect the shape in the horizontal line y = ${k}. Draw its image.`,'Correct reflected shape',idx,makeVisual(5,{polygons:[poly(base,[],'given')],mirrorLine:{axis:'y',value:k,label:`y = ${k}`},answerPolygons:[poly(moved,[],'answer')]}),'L',{marking:{mode:'construction',answer:moved}});
    }
    if(typeId==='cg_y5_reflection_coordinate_set'){
      const vertical=idx%2===0,k=vertical?[5,0,4,0,6,0][idx]:[0,5,0,4,0,5][idx],base=vertical?[[[1,2],[3,2],[2,5]],[[1,1],[3,1],[2,4]],[[2,2],[4,2],[3,5]]][Math.floor(idx/2)]:[[[2,1],[4,1],[3,3]],[[5,1],[7,1],[6,4]],[[1,2],[3,2],[2,4]]][Math.floor(idx/2)],moved=vertical?reflectY(base,k):reflectX(base,k),labels=['A','B','C'];
      return q('transformations_y5',typeId,`The triangle is reflected in the ${vertical?`vertical line x = ${k}`:`horizontal line y = ${k}`}. Write the coordinates of A', B' and C'.`,coords(moved),idx,makeVisual(5,{polygons:[poly(base,labels,'given')],mirrorLine:{axis:vertical?'x':'y',value:k,label:vertical?`x = ${k}`:`y = ${k}`},answerPolygons:[poly(moved,labels.map(x=>x+"'"),'answer')]}),'L',{marking:{mode:'coordinate-set',answer:moved}});
    }
    if(typeId==='cg_y5_identify_transform'){
      if(idx%2===0){
        const base=Y5_BASES[idx],mv=idx===0?[4,2]:idx===2?[4,-3]:[-4,-3],moved=translate(base,mv[0],mv[1]);
        return q('transformations_y5',typeId,'Is shape B a translation or a reflection of shape A?','Translation',idx,makeVisual(5,{polygons:[poly(base,[],'given'),poly(moved,[],'image')],shapeLabels:[{x:base[0][0],y:base[0][1],text:'A'},{x:moved[0][0],y:moved[0][1],text:'B'}]}),'M');
      }
      const k=5,base=[[[1,2],[3,2],[2,4]],[[1,5],[3,5],[2,7]],[[2,1],[4,2],[3,4],[1,3]]][Math.floor(idx/2)%3],moved=reflectY(base,k);
      return q('transformations_y5',typeId,'Is shape B a translation or a reflection of shape A?','Reflection',idx,makeVisual(5,{polygons:[poly(base,[],'given'),poly(moved,[],'image')],mirrorLine:{axis:'x',value:k,label:'mirror line'},shapeLabels:[{x:base[0][0],y:base[0][1],text:'A'},{x:moved[0][0],y:moved[0][1],text:'B'}]}),'M');
    }
    return null;
  }

  const Y6_POINTS=[[ -4,3],[3,-5],[-2,-4],[5,2],[-5,-1],[2,5]];
  function y6Question(typeId,i){
    const idx=i%6;
    if(typeId==='cg_y6_read_coordinate'){
      const p=Y6_POINTS[idx];return q('coordinates_y6',typeId,'Write the coordinates of point A.',`(${p[0]}, ${p[1]})`,idx,makeVisual(6,{points:[pt(p[0],p[1],'A')]}),'M');
    }
    if(typeId==='cg_y6_xy_order'){
      const p=Y6_POINTS[idx],swap=[p[1],p[0]],target=idx%2?'Q':'P',points=target==='P'?[pt(p[0],p[1],'P'),pt(swap[0],swap[1],'Q')]:[pt(swap[0],swap[1],'P'),pt(p[0],p[1],'Q')];
      return q('coordinates_y6',typeId,`Which labelled point is at (${p[0]}, ${p[1]})?`,target,idx,makeVisual(6,{points}),'M',{misconception:'coordinate_order'});
    }
    if(typeId==='cg_y6_identify_label'){
      const sets=[[[ -4,3,'A'],[3,-4,'B'],[-2,-5,'C'],[5,2,'D']],[[ -5,-1,'P'],[2,5,'Q'],[4,-3,'R'],[-1,4,'S']],[[ -3,5,'J'],[5,-2,'K'],[-5,-4,'L'],[2,3,'M']],[[ -4,-2,'W'],[4,4,'X'],[-1,5,'Y'],[5,-5,'Z']],[[ -5,2,'A'],[3,5,'B'],[4,-4,'C'],[-2,-3,'D']],[[ -1,-5,'P'],[5,1,'Q'],[-4,4,'R'],[2,-2,'S']]][idx];
      const target=sets[(idx+1)%sets.length];
      return q('coordinates_y6',typeId,`Which labelled point is at (${target[0]}, ${target[1]})?`,target[2],idx,makeVisual(6,{points:sets.map(v=>pt(v[0],v[1],v[2]))}),'M');
    }
    if(typeId==='cg_y6_spot_plotting_error'){
      const correct=[[-4,3],[0,2],[3,-4],[5,1]],labels=['A','B','C','D'],wrongIndex=idx%4,shown=correct.map(v=>v.slice());
      const w=shown[wrongIndex]; shown[wrongIndex]=idx%2===0?[w[1],w[0]]:[clamp(w[0]+(w[0]<5?1:-1),-6,6),w[1]];
      const listing=correct.map((v,j)=>`${labels[j]} (${v[0]}, ${v[1]})`).join(', ');
      return q('coordinates_y6',typeId,`${listing}. One point has been plotted incorrectly. Which one?`,labels[wrongIndex],idx,makeVisual(6,{points:shown.map((v,j)=>pt(v[0],v[1],labels[j])),answerPoints:[pt(correct[wrongIndex][0],correct[wrongIndex][1],labels[wrongIndex]+' correct','answer')]}),'L',{misconception:'coordinate_plotting_error'});
    }
    if(typeId==='cg_y6_plot_point'){
      const p=Y6_POINTS[(idx+2)%6];return q('coordinates_y6',typeId,`Plot point P at (${p[0]}, ${p[1]}).`,`P = (${p[0]}, ${p[1]})`,idx,makeVisual(6,{answerPoints:[pt(p[0],p[1],'P','answer')]}),'L',{marking:{mode:'construction',answer:p}});
    }
    if(typeId==='cg_y6_plot_join_identify_polygon'){
      const shapes=[{name:'rectangle',p:[[-4,-2],[2,-2],[2,2],[-4,2]]},{name:'parallelogram',p:[[-5,-2],[-1,2],[4,2],[0,-2]]},{name:'kite',p:[[-4,0],[-1,4],[3,0],[-1,-3]]},{name:'rectangle',p:[[-2,-5],[4,-5],[4,-1],[-2,-1]]},{name:'parallelogram',p:[[-4,3],[0,5],[4,1],[0,-1]]},{name:'kite',p:[[0,5],[3,1],[0,-4],[-2,1]]}],sh=shapes[idx];
      return q('coordinates_y6',typeId,`Plot ${coords(sh.p)}. Join the points in order and name the quadrilateral.`,sh.name,idx,makeVisual(6,{answerPolygons:[poly(sh.p,['A','B','C','D'],'answer')]}),'L',{marking:{mode:'construction+label',answer:sh.name}});
    }
    if(typeId==='cg_y6_missing_rectangle'){
      const sets=[[[ -5,3],[3,3],[3,-1],[-5,-1]],[[-4,5],[2,5],[2,1],[-4,1]],[[-3,2],[5,2],[5,-4],[-3,-4]],[[-5,-2],[1,-2],[1,-5],[-5,-5]],[[-2,5],[4,5],[4,-2],[-2,-2]],[[-5,1],[2,1],[2,-3],[-5,-3]]];
      const p=sets[idx],answer=p[3],shown=p.slice(0,3);
      return q('coordinates_y6',typeId,'Three vertices of a rectangle are shown. What are the coordinates of D?',`(${answer[0]}, ${answer[1]})`,idx,makeVisual(6,{polygons:[poly(shown,['A','B','C'],'given',false)],points:shown.map((v,j)=>pt(v[0],v[1],['A','B','C'][j])),answerPolygons:[poly(p,['A','B','C','D'],'answer')],answerPoints:[pt(answer[0],answer[1],'D','answer')]}),'L');
    }
    if(typeId==='cg_y6_missing_parallelogram'){
      const sets=[[[ -5,1],[-2,4],[3,2],[0,-1]],[[-4,-3],[-1,1],[4,1],[1,-3]],[[-5,4],[-1,5],[3,1],[-1,0]],[[-4,1],[0,4],[4,2],[0,-1]],[[-3,-4],[1,-1],[5,-2],[1,-5]],[[-5,-1],[-2,3],[3,4],[0,0]]];
      const p=sets[idx],shown=p.slice(0,3),answer=p[3];
      return q('coordinates_y6',typeId,'A, B and C are consecutive vertices of a parallelogram. Find the coordinates of D.',`(${answer[0]}, ${answer[1]})`,idx,makeVisual(6,{polygons:[poly(shown,['A','B','C'],'given',false)],points:shown.map((v,j)=>pt(v[0],v[1],['A','B','C'][j])),answerPolygons:[poly(p,['A','B','C','D'],'answer')],answerPoints:[pt(answer[0],answer[1],'D','answer')]}),'L');
    }
    if(typeId==='cg_y6_missing_rhombus'){
      const sets=[[[0,5],[3,1],[0,-3],[-3,1]],[[-1,5],[3,1],[-1,-3],[-5,1]],[[1,5],[5,1],[1,-3],[-3,1]],[[0,4],[4,0],[0,-4],[-4,0]],[[1,4],[4,1],[1,-2],[-2,1]],[[-1,4],[2,1],[-1,-2],[-4,1]]];
      const p=sets[idx],shown=p.slice(0,3),answer=p[3];
      return q('coordinates_y6',typeId,'A, B and C are consecutive vertices of a rhombus. What are the coordinates of D?',`(${answer[0]}, ${answer[1]})`,idx,makeVisual(6,{polygons:[poly(shown,['A','B','C'],'given',false)],points:shown.map((v,j)=>pt(v[0],v[1],['A','B','C'][j])),answerPolygons:[poly(p,['A','B','C','D'],'answer')],answerPoints:[pt(answer[0],answer[1],'D','answer')]}),'L');
    }
    if(typeId==='cg_y6_missing_kite'){
      const sets=[[[ -4,1],[-1,5],[3,1],[-1,-3]],[[-5,-1],[-2,4],[2,-1],[-2,-4]],[[-3,0],[0,5],[4,0],[0,-3]],[[-4,2],[-1,5],[2,2],[-1,-4]],[[-5,1],[-2,4],[3,1],[-2,-2]],[[-4,-1],[-1,4],[4,-1],[-1,-5]]];
      const p=sets[idx],shown=[p[0],p[1],p[3]],answer=p[2];
      return q('coordinates_y6',typeId,'A, B and D are vertices of a kite with BD as its line of symmetry. Find the coordinates of C.',`(${answer[0]}, ${answer[1]})`,idx,makeVisual(6,{polygons:[poly(shown,['A','B','D'],'given',false)],points:shown.map((v,j)=>pt(v[0],v[1],['A','B','D'][j])),answerPolygons:[poly(p,['A','B','C','D'],'answer')],answerPoints:[pt(answer[0],answer[1],'C','answer')]}),'L',{marking:{mode:'exact-coordinate',answer}});
    }
    if(typeId==='cg_y6_translate_shape'||typeId==='cg_y6_describe_translation'){
      const bases=[[[ -5,1],[-3,1],[-4,3]],[[1,-5],[3,-5],[2,-3]],[[-5,-4],[-2,-4],[-3,-2]],[[2,2],[4,2],[3,4]],[[-4,2],[-2,2],[-2,4],[-4,4]],[[1,-1],[3,-1],[3,1],[1,1]]];
      const moves=[[6,-3],[-5,7],[6,5],[-6,-6],[5,-5],[-5,4]],base=bases[idx],mv=moves[idx],moved=translate(base,mv[0],mv[1]);
      const v=makeVisual(6,{polygons:[poly(base,[],'given')],answerPolygons:typeId==='cg_y6_translate_shape'?[poly(moved,[],'answer')]:[]});
      if(typeId==='cg_y6_describe_translation')v.polygons.push(poly(moved,[],'image'));
      if(typeId==='cg_y6_translate_shape')return q('coordinates_y6',typeId,`Translate the shape ${moveText(mv[0],mv[1])}. Draw its image.`,'Correct translated shape',idx,v,'L',{marking:{mode:'construction',answer:moved}});
      return q('coordinates_y6',typeId,'Describe the translation from shape A to shape B.',moveText(mv[0],mv[1]),idx,{...v,shapeLabels:[{x:base[0][0],y:base[0][1],text:'A'},{x:moved[0][0],y:moved[0][1],text:'B'}]},'L');
    }
    if(typeId==='cg_y6_reflect_x_axis'||typeId==='cg_y6_reflect_y_axis'){
      const xAxis=typeId==='cg_y6_reflect_x_axis';
      const bases=xAxis?[[[-4,2],[-2,2],[-3,5]],[[1,1],[4,1],[3,4]],[[-5,1],[-3,1],[-4,3]],[[2,2],[5,2],[4,5]],[[-2,1],[1,1],[0,4]],[[1,2],[3,2],[2,5]]]:[[[1,2],[3,2],[2,5]],[[2,-4],[5,-4],[4,-1]],[[1,-1],[4,-1],[3,2]],[[2,1],[5,1],[4,4]],[[1,-5],[3,-5],[2,-2]],[[2,-2],[4,-2],[3,1]]];
      const base=bases[idx],moved=xAxis?reflectX(base,0):reflectY(base,0),axis=xAxis?'x':'y';
      return q('coordinates_y6',typeId,`Reflect the shape in the ${axis}-axis. Draw its image.`,'Correct reflected shape',idx,makeVisual(6,{polygons:[poly(base,[],'given')],mirrorLine:{axis:xAxis?'y':'x',value:0,label:`${axis}-axis`},answerPolygons:[poly(moved,[],'answer')]}),'L',{marking:{mode:'construction',answer:moved}});
    }
    if(typeId==='cg_y6_reflected_point'){
      const p=Y6_POINTS[idx],axis=idx%2===0?'x':'y',ans=axis==='x'?[p[0],-p[1]]:[-p[0],p[1]];
      return q('coordinates_y6',typeId,`Point A is reflected in the ${axis}-axis. What are the coordinates of A'?`,`(${ans[0]}, ${ans[1]})`,idx,makeVisual(6,{points:[pt(p[0],p[1],'A')],mirrorLine:{axis:axis==='x'?'y':'x',value:0,label:`${axis}-axis`},answerPoints:[pt(ans[0],ans[1],"A'",'answer')]}),'M');
    }
    if(typeId==='cg_y6_reflection_sign_rule'){
      const axis=idx%2===0?'y':'x',p=Y6_POINTS[idx],ans=axis==='y'?[-p[0],p[1]]:[p[0],-p[1]],changed=axis==='y'?'x-coordinate':'y-coordinate';
      return q('coordinates_y6',typeId,`A is reflected in the ${axis}-axis to A'. Which coordinate changes sign?`,changed,idx,makeVisual(6,{points:[pt(...p,'A'),pt(...ans,"A'",'target')],mirrorLine:{axis:axis==='x'?'y':'x',value:0,label:`${axis}-axis`}}),'M',{marking:{mode:'exact',answer:changed}});
    }
    if(typeId==='cg_y6_complete_reflection_pattern'){
      const bases=[[[1,1],[3,1],[2,3]],[[2,1],[5,1],[4,3]],[[1,2],[3,2],[3,4],[1,4]],[[2,1],[4,2],[3,4]],[[1,1],[4,1],[3,3]],[[2,2],[4,2],[3,5]]],base=bases[idx],rx=reflectX(base,0),ry=reflectY(base,0),rxy=reflectX(ry,0);
      return q('coordinates_y6',typeId,'Complete the reflection pattern so the shape appears in all four quadrants.','Copies reflected in both axes',idx,makeVisual(6,{polygons:[poly(base,[],'given')],mirrorLine:{axis:'x',value:0,label:'y-axis'},answerPolygons:[poly(rx,[],'answer'),poly(ry,[],'answer'),poly(rxy,[],'answer')]}),'XL',{marking:{mode:'construction',answer:[rx,ry,rxy]}});
    }
    if(typeId==='cg_y6_missing_component'){
      const sets=[{p:[[-5,3],[2,3],[2,-2],[-5,-2]],miss:'x'},{p:[[-4,5],[3,5],[3,1],[-4,1]],miss:'y'},{p:[[-3,2],[5,2],[5,-4],[-3,-4]],miss:'x'},{p:[[-5,-1],[1,-1],[1,-5],[-5,-5]],miss:'y'},{p:[[-2,5],[4,5],[4,-2],[-2,-2]],miss:'x'},{p:[[-5,1],[2,1],[2,-3],[-5,-3]],miss:'y'}][idx],p=sets.p,answer=p[3],shown=p.slice(0,3),asked=sets.miss,ans=asked==='x'?answer[0]:answer[1];
      return q('coordinates_y6',typeId,`ABCD is a rectangle. D is (${asked==='x'?'?':answer[0]}, ${asked==='y'?'?':answer[1]}). What is the missing ${asked}-coordinate?`,String(ans),idx,makeVisual(6,{polygons:[poly(shown,['A','B','C'],'given',false)],points:shown.map((v,j)=>pt(v[0],v[1],['A','B','C'][j])),answerPolygons:[poly(p,['A','B','C','D'],'answer')],answerPoints:[pt(answer[0],answer[1],'D','answer')]}),'L');
    }
    return null;
  }

  function extensionQuestion(typeId,i){
    const idx=i%6;
    if(typeId==='cg_ext_midpoint'){
      const pairs=[[[-4,2],[4,-2]],[[-5,-3],[3,5]],[[-2,4],[6,0]],[[1,-5],[5,3]],[[-6,0],[2,4]],[[-3,-5],[5,1]]],p=pairs[idx],m=[(p[0][0]+p[1][0])/2,(p[0][1]+p[1][1])/2];
      return q('coordinates_extension',typeId,'Find the midpoint M of AB.',`(${m[0]}, ${m[1]})`,idx,makeVisual(6,{polygons:[poly(p,['A','B'],'given',false)],points:[pt(...p[0],'A'),pt(...p[1],'B')],answerPoints:[pt(...m,'M','answer')]}),'M',{marking:{mode:'exact-coordinate',answer:m}});
    }
    if(typeId==='cg_ext_rectangle_centre'){
      const rects=[[[ -4,4],[4,4],[4,-2],[-4,-2]],[[-5,3],[3,3],[3,-3],[-5,-3]],[[-2,5],[6,5],[6,-1],[-2,-1]],[[-6,2],[2,2],[2,-4],[-6,-4]],[[-4,5],[2,5],[2,-3],[-4,-3]],[[-5,4],[5,4],[5,-2],[-5,-2]]],p=rects[idx],m=[(p[0][0]+p[2][0])/2,(p[0][1]+p[2][1])/2];
      return q('coordinates_extension',typeId,'ABCD is a rectangle. Find the coordinates of its centre M.',`(${m[0]}, ${m[1]})`,idx,makeVisual(6,{polygons:[poly(p,['A','B','C','D'],'given')],answerPoints:[pt(...m,'M','answer')]}),'L',{marking:{mode:'exact-coordinate',answer:m}});
    }
    if(typeId==='cg_ext_equally_spaced_line'){
      const rows=[{a:[-4,-2],b:[-1,0],c:[2,2]},{a:[-5,3],b:[-2,1],c:[1,-1]},{a:[-3,3],b:[-1,2],c:[1,1]},{a:[-3,-4],b:[0,-1],c:[3,2]},{a:[-4,-1],b:[-2,0],c:[0,1]},{a:[-3,1],b:[-1,0],c:[1,-1]}],r=rows[idx],next=[r.c[0]+(r.c[0]-r.b[0]),r.c[1]+(r.c[1]-r.b[1])];
      const all=[r.a,r.b,r.c];
      return q('coordinates_extension',typeId,'A, B and C are equally spaced on a straight line. Continue the pattern to point D. What are the coordinates of D?',`(${next[0]}, ${next[1]})`,idx,makeVisual(6,{polygons:[poly(all,['A','B','C'],'given',false)],points:all.map((v,j)=>pt(...v,['A','B','C'][j])),answerPoints:[pt(...next,'D','answer')]}),'L',{marking:{mode:'exact-coordinate',answer:next}});
    }
    if(typeId==='cg_ext_rotation_90'){
      const rows=[{p:[2,1],c:[0,0]},{p:[-3,1],c:[0,0]},{p:[2,-4],c:[0,0]},{p:[4,1],c:[1,1]},{p:[-2,3],c:[-1,1]},{p:[1,-3],c:[1,-1]}],r=rows[idx],clockwise=idx%2===0,ans=rotate90([r.p],r.c[0],r.c[1],clockwise)[0];
      return q('coordinates_extension',typeId,`Point A is rotated 90° ${clockwise?'clockwise':'anticlockwise'} about C. What are the coordinates of A'?`,`(${ans[0]}, ${ans[1]})`,idx,makeVisual(6,{points:[pt(...r.p,'A'),pt(...r.c,'C','target')],answerPoints:[pt(...ans,"A'",'answer')]}),'M',{marking:{mode:'exact-coordinate',answer:ans}});
    }
    return null;
  }

  function coordinatePool(kind,rules={}){
    if(!isCoordKind(kind))return[];
    const out=[];
    for(const typeId of TYPES_BY_FAMILY[kind]||[]){
      for(let i=0;i<6;i++){
        const item=kind==='coordinates_y4'?y4Question(typeId,i):kind==='transformations_y5'?y5Question(typeId,i):kind==='coordinates_y6'?y6Question(typeId,i):extensionQuestion(typeId,i);
        if(item)out.push(item);
      }
    }
    return out;
  }

  // --- Shared renderer registration -----------------------------------------
  function dashLine(C,x1,y1,x2,y2,o={}){
    const dx=x2-x1,dy=y2-y1,len=Math.hypot(dx,dy)||1,seg=o.segment||5,gap=o.gap||3;
    for(let d=0;d<len;d+=seg+gap){const e=Math.min(len,d+seg),a=d/len,b=e/len;C.line(x1+dx*a,y1+dy*a,x1+dx*b,y1+dy*b,o);}
  }
  function renderCoordinate(C,x,y,w,h,v,answers){
    const xMin=Number(v.xMin),xMax=Number(v.xMax),yMin=Number(v.yMin),yMax=Number(v.yMax),xSpan=xMax-xMin,ySpan=yMax-yMin;
    if(!(xSpan>0&&ySpan>0))return;
    const pad={l:30,r:18,t:11,b:27},availW=Math.max(70,w-pad.l-pad.r),availH=Math.max(70,h-pad.t-pad.b),unit=Math.min(availW/xSpan,availH/ySpan),plotW=unit*xSpan,plotH=unit*ySpan;
    const left=x+pad.l+(availW-plotW)/2,top=y+pad.t+(availH-plotH)/2,right=left+plotW,bottom=top+plotH;
    const xp=n=>left+(Number(n)-xMin)*unit,yp=n=>bottom-(Number(n)-yMin)*unit;
    const pal=global.TT99VisualPalette||{};
    const grid=pal.grid||[221,227,230],axis=pal.axis||[58,72,79],ink=pal.image||[83,128,184],muted=pal.muted||[92,105,112],teal=pal.answer||[15,118,110],image=(pal.series||[])[3]||[202,104,101],mirror=pal.mirror||[132,108,177],target=pal.target||[204,139,55];
    const tick=Number(v.tickEvery||1),labelEvery=Number(v.labelEvery||1);

    for(let xv=Math.ceil(xMin/tick)*tick;xv<=xMax+.0001;xv+=tick)C.line(xp(xv),top,xp(xv),bottom,{color:grid,width:.45});
    for(let yv=Math.ceil(yMin/tick)*tick;yv<=yMax+.0001;yv+=tick)C.line(left,yp(yv),right,yp(yv),{color:grid,width:.45});
    const xAxisY=(0>=yMin&&0<=yMax)?yp(0):bottom,yAxisX=(0>=xMin&&0<=xMax)?xp(0):left;
    C.line(left,xAxisY,right,xAxisY,{color:axis,width:1});C.line(yAxisX,top,yAxisX,bottom,{color:axis,width:1});

    const eps=.0001;
    for(let xv=Math.ceil(xMin/labelEvery)*labelEvery;xv<=xMax+eps;xv+=labelEvery){
      if(Math.abs(xv)<eps){
        // On four-quadrant grids put the origin label just to the right of the
        // y-axis so it does not crowd the -2 tick on compact answer grids.
        if(xMin<0&&xMax>0)C.text(xp(xv)+4,xAxisY+11,'0',5.9,{align:'left',color:muted});
        else C.text(xp(xv)-4,xAxisY+11,'0',5.9,{align:'right',color:muted});
        continue;
      }
      C.text(xp(xv),xAxisY+11,String(xv),5.9,{align:'center',color:muted});
    }
    for(let yv=Math.ceil(yMin/labelEvery)*labelEvery;yv<=yMax+eps;yv+=labelEvery){
      if(Math.abs(yv)<eps)continue;C.text(yAxisX-5,yp(yv)+2,String(yv),5.9,{align:'right',color:muted});
    }
    C.text(right+8,xAxisY+3,'x',6.7,{bold:true,color:axis});C.text(yAxisX-2,top-4,'y',6.7,{bold:true,align:'center',color:axis});

    if(v.mirrorLine){
      if(v.mirrorLine.axis==='x'){const xx=xp(v.mirrorLine.value);dashLine(C,xx,top,xx,bottom,{color:mirror,width:1,segment:4,gap:3});C.text(xx+4,top+8,v.mirrorLine.label||'',5.8,{color:mirror});}
      else {const yy=yp(v.mirrorLine.value);dashLine(C,left,yy,right,yy,{color:mirror,width:1,segment:4,gap:3});C.text(right-2,yy-4,v.mirrorLine.label||'',5.8,{align:'right',color:mirror});}
    }

    function drawPoint(p,answer=false){
      const xx=xp(p.x),yy=yp(p.y),col=answer?teal:(p.role==='target'?target:ink),sz=answer?5:4.5;C.rect(xx-sz/2,yy-sz/2,sz,sz,{fill:col});
      if(p.label)C.text(xx+4.5,yy-4,String(p.label),6.4,{bold:true,color:col});
    }
    function drawPolygon(pg,answer=false){
      const pts=pg.points||[];if(pts.length<2)return;const col=answer?teal:(pg.style==='image'?image:ink),width=answer?1.7:1.15,dashed=pg.style==='image';
      for(let j=0;j<pts.length-1;j++){const a=pts[j],b=pts[j+1],o={color:col,width,segment:5,gap:3};if(dashed)dashLine(C,xp(a.x),yp(a.y),xp(b.x),yp(b.y),o);else C.line(xp(a.x),yp(a.y),xp(b.x),yp(b.y),o);}
      if(pg.closed!==false&&pts.length>2){const a=pts[pts.length-1],b=pts[0],o={color:col,width,segment:5,gap:3};if(dashed)dashLine(C,xp(a.x),yp(a.y),xp(b.x),yp(b.y),o);else C.line(xp(a.x),yp(a.y),xp(b.x),yp(b.y),o);}
      pts.forEach((p,j)=>{C.rect(xp(p.x)-2,yp(p.y)-2,4,4,{fill:col});const lab=pg.labels?.[j];if(lab)C.text(xp(p.x)+4,yp(p.y)-4,String(lab),6.2,{bold:true,color:col});});
    }

    (v.polygons||[]).forEach(pg=>drawPolygon(pg,false));
    (v.points||[]).forEach(p=>drawPoint(p,false));
    if(Array.isArray(v.shapeLabels))v.shapeLabels.forEach(l=>C.text(xp(l.x)+5,yp(l.y)+10,l.text,6.7,{bold:true,color:l.text==='B'?image:ink}));
    if(answers){(v.answerPolygons||[]).forEach(pg=>drawPolygon(pg,true));(v.answerPoints||[]).forEach(p=>drawPoint(p,true));}
  }
  global.TT99VisualRenderers=global.TT99VisualRenderers||{};
  global.TT99VisualRenderers.coordinate=renderCoordinate;

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
    if(!pool.length||count<=0)return[];const chosen=[],groups=new Map(),seen=new Set();
    for(const item of pool){const key=item.group||'__all';if(!groups.has(key))groups.set(key,[]);groups.get(key).push(item);}
    const keys=shuffle([...groups.keys()],rng);for(const k of keys)groups.set(k,shuffle(groups.get(k),rng));const offsets=Object.fromEntries(keys.map(k=>[k,0]));let guard=0;
    while(chosen.length<count&&guard<count*100+1000){guard++;let progress=false;for(const k of shuffle(keys,rng)){const arr=groups.get(k);let tries=0;while(tries<arr.length){const item=arr[offsets[k]%arr.length];offsets[k]++;tries++;if(rules?.avoidExactDuplicates!==false&&seen.has(item.key))continue;chosen.push(clone(item));seen.add(item.key);progress=true;break;}if(chosen.length>=count)break;}if(!progress){seen.clear();for(const k of keys)groups.set(k,shuffle(groups.get(k),rng));}}
    return chosen.slice(0,count);
  }
  function weightedCounts(rules,rng){
    const bag=[];for(const f of rules.families){const w=Math.max(1,Number(rules.familyWeights?.[f])||1);for(let i=0;i<w;i++)bag.push(f);}const cycle=shuffle(bag,rng),counts=Object.fromEntries(rules.families.map(f=>[f,0]));for(let i=0;i<rules.questionCount;i++)counts[cycle[i%cycle.length]]++;return counts;
  }

  G.questionPool=function(kind,rules){if(isCoordKind(kind))return coordinatePool(kind,G.normalizeRules(rules));return previous.questionPool(kind,rules);};
  G.questionByKey=function(kind,rules,key){if(!isCoordKind(kind))return previous.questionByKey(kind,rules,key);const found=G.questionPool(kind,rules).find(x=>x.key===key);return found?clone(found):null;};
  G.questionPoolIndex=function(kind,rules,key){if(!isCoordKind(kind))return previous.questionPoolIndex(kind,rules,key);return G.questionPool(kind,rules).findIndex(x=>x.key===key);};
  G.questionByPoolIndex=function(kind,rules,index){if(!isCoordKind(kind))return previous.questionByPoolIndex(kind,rules,index);const pool=G.questionPool(kind,rules),n=Number(index);return Number.isInteger(n)&&n>=0&&n<pool.length?clone(pool[n]):null;};
  G.generateQuestions=function(inputRules,seed){
    const rules=G.normalizeRules(inputRules);if(rules.mode!=='family_mix'||!hasCoordFamily(rules))return previous.generateQuestions(inputRules,seed);
    const rng=rngFor(seed||'CUSTOM'),counts=weightedCounts(rules,rng);let out=[];
    for(const family of rules.families){const count=counts[family]||0;if(!count)continue;out=out.concat(balancedPick(G.questionPool(family,rules),count,rng,rules));}
    return shuffle(out,rng).map((item,idx)=>({...item,number:idx+1}));
  };
  G.replaceQuestion=function(questions,index,inputRules,seed){
    const current=questions?.[index];if(!current||!isCoordKind(current.kind))return previous.replaceQuestion(questions,index,inputRules,seed);
    const rules=G.normalizeRules(inputRules),pool=G.questionPool(current.kind,rules).filter(x=>x.coordinateTypeId===current.coordinateTypeId&&x.key!==current.key);if(!pool.length)return questions.slice();
    const used=new Set(questions.filter((_,j)=>j!==index).map(x=>x.key));let candidates=pool.filter(x=>!used.has(x.key));if(!candidates.length)candidates=pool;const rng=rngFor(String(seed||'')+':coordinate-replacement'),chosen=shuffle(candidates,rng)[0],out=questions.slice();out[index]={...clone(chosen),number:index+1};return out;
  };

  function validateVisual(v){
    if(!v||v.type!=='coordinate')return {ok:false,error:'not-coordinate'};const all=[];
    for(const p of v.points||[])all.push([p.x,p.y]);for(const p of v.answerPoints||[])all.push([p.x,p.y]);
    for(const pg of [...(v.polygons||[]),...(v.answerPolygons||[])])for(const p of pg.points||[])all.push([p.x,p.y]);
    const ok=all.every(([x,y])=>Number.isFinite(Number(x))&&Number.isFinite(Number(y))&&x>=v.xMin&&x<=v.xMax&&y>=v.yMin&&y<=v.yMax);
    return {ok,error:ok?'':'point-out-of-bounds',pointCount:all.length};
  }

  global.TT99CustomCoordinates={VERSION,COORD_FAMILIES,CATALOGUE,TYPES_BY_FAMILY,coordinatePool,renderCoordinate,validateVisual,translate,reflectX,reflectY,rotate90};
}(typeof window!=='undefined'?window:globalThis));
