/* Tech Tinker Club - Custom Worksheets angles & turns engine
 * v0.1 / Angles Stage 1
 *
 * Research-led visual module covering the primary progression from turns in
 * Years 1-2 through right-angle recognition, angle classification, degree
 * work, line/point facts and Year 6 deductive geometry. It deliberately keeps
 * KS3-only transversal/bearing/circle-theorem/trigonometry material out of the
 * ordinary Custom Worksheet catalogue.
 *
 * The renderer uses uniform scaling so genuine measure-with-a-protractor
 * questions preserve the requested angle in preview and PDF. Reasoning items
 * may instead be explicitly flagged "Not to scale".
 */
(function(global){
  'use strict';
  const G=global.TT99Generator;
  if(!G) return;

  const VERSION='0.1.5';
  const ANGLE_FAMILIES={
    angles_turns_y1_2:{label:'turns & orientation',strand:'Geometry',years:[1,2],curriculumId:'Y1/Y2 Position & direction'},
    angles_right_y3:{label:'right angles & turns',strand:'Geometry',years:[3],curriculumId:'Y3.G.01 / 3G-1'},
    angles_compare_y4:{label:'identify, compare & order angles',strand:'Geometry',years:[4],curriculumId:'Y4.G.02'},
    angles_degrees_y5:{label:'degrees: classify, estimate, measure & draw',strand:'Geometry',years:[5],curriculumId:'Y5 Geometry - angles'},
    angles_lines_points_y5_6:{label:'angles on lines & around points',strand:'Geometry',years:[5,6],curriculumId:'Y5/Y6 Geometry - angle facts'},
    angles_triangles_y6:{label:'angles in triangles',strand:'Geometry',years:[6],curriculumId:'Y6.G.02 / 6G-1'},
    angles_quads_polygons_y6:{label:'angles in quadrilaterals & polygons',strand:'Geometry',years:[6],curriculumId:'Y6.G.02 / 6G-1'},
    angles_reasoning_y5_6:{label:'angle reasoning & problem solving',strand:'Geometry',years:[5,6],curriculumId:'Y5/Y6 Geometry reasoning'}
  };
  const ANGLE_FAMILY_IDS=Object.keys(ANGLE_FAMILIES);
  const isAngleKind=kind=>ANGLE_FAMILY_IDS.includes(String(kind||''));
  const hasAngleFamily=rules=>Array.isArray(rules?.families)&&rules.families.some(isAngleKind);
  const clone=o=>JSON.parse(JSON.stringify(o));
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const fmt=n=>Number.isInteger(Number(n))?String(Number(n)):String(Number(n).toFixed(1)).replace(/\.0$/,'');
  const letter=i=>String.fromCharCode(65+Number(i||0));
  function hashString(str){let h=2166136261>>>0;for(let i=0;i<String(str).length;i++){h^=String(str).charCodeAt(i);h=Math.imul(h,16777619)>>>0;}return h>>>0;}
  function localRng(seed){let a=hashString(seed)||0x6d2b79f5;return function(){a|=0;a=(a+0x6D2B79F5)|0;let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};}
  function rngFor(seed){return typeof G.rngFromSeed==='function'?G.rngFromSeed(seed):localRng(seed);}
  function shuffle(arr,rng){const out=arr.slice();for(let i=out.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[out[i],out[j]]=[out[j],out[i]];}return out;}

  const CATALOGUE=[];
  function cat(family,year,ids){for(const id of ids)CATALOGUE.push({id,family,year});}
  cat('angles_turns_y1_2',1,[
    'ang_y1_identify_turn_from_start_end','ang_y1_apply_turn_to_object','ang_y1_match_turn_fraction','ang_y1_sequence_turns','ang_y1_same_final_orientation'
  ]);
  cat('angles_turns_y1_2',2,[
    'ang_y2_clockwise_anticlockwise','ang_y2_turn_as_right_angle_units','ang_y2_apply_named_turn_direction','ang_y2_describe_turn_between_orientations',
    'ang_y2_move_then_turn_sequence','ang_y2_spot_wrong_turn_instruction','ang_y2_third_person_left_right_frame','ang_y2_select_equivalent_turn_descriptions',
    'ang_y2_choose_route_instruction_to_target','ang_y2_rotation_pattern_continue'
  ]);
  cat('angles_right_y3',3,[
    'ang_y3_angle_as_turn_or_shape_property','ang_y3_identify_right_angle_rays','ang_y3_mark_right_angles_shape','ang_y3_count_right_angles',
    'ang_y3_compare_to_right_angle','ang_y3_right_angles_in_turn','ang_y3_turn_from_right_angle_count','ang_y3_follow_turn_map','ang_y3_write_turn_instruction',
    'ang_y3_arm_length_invariance','ang_y3_identify_perpendicular_from_right_angle','ang_y3_identify_parallel_perpendicular_horizontal_vertical',
    'ang_y3_acute_obtuse_language_bridge','ang_y3_sort_shapes_by_right_angle_property','ang_y3_join_four_right_angles_at_point','ang_y3_select_shapes_exact_right_angle_count'
  ]);
  cat('angles_compare_y4',4,[
    'ang_y4_classify_acute_right_obtuse','ang_y4_classify_angles_in_shapes','ang_y4_compare_pair','ang_y4_order_angle_set','ang_y4_largest_smallest_in_polygon',
    'ang_y4_compare_same_class_close','ang_y4_match_angle_description','ang_y4_direction_facing_angle_type','ang_y4_longer_arms_bigger_diagnostic',
    'ang_y4_count_types_in_picture','ang_y4_select_shapes_exact_angle_type_count','ang_y4_closest_to_right_angle','ang_y4_ordering_error_spot',
    'ang_y4_odd_one_out_angle_justify','ang_y4_possible_impossible_triangle_angle_types','ang_y4_double_acute_counterexample','ang_y4_combined_angle_line_property_statements'
  ]);
  cat('angles_degrees_y5',5,[
    'ang_y5_classify_degree_value','ang_y5_classify_visual_reflex','ang_y5_largest_smallest_degree_free','ang_y5_estimate_angle','ang_y5_choose_best_estimate',
    'ang_y5_estimate_using_benchmark','ang_y5_degrees_compass_turn','ang_y5_degrees_clock_turn','ang_y5_remaining_full_turn','ang_y5_measure_angle_actual_size',
    'ang_y5_measure_rotated_angle_actual_size','ang_y5_read_protractor_scale','ang_y5_protractor_wrong_scale','ang_y5_protractor_baseline_error',
    'ang_y5_draw_given_angle_actual_size','ang_y5_arc_position_invariance','ang_y5_numeric_angle_boundary_reasoning','ang_y5_measure_angle_inside_shape_actual_size'
  ]);
  cat('angles_lines_points_y5_6',5,[
    'ang_y5_straight_line_one_missing','ang_y5_straight_line_multiple_adjacent','ang_y5_around_point_one_missing','ang_y5_around_point_multiple','ang_y5_multiples_of_90'
  ]);
  cat('angles_lines_points_y5_6',6,[
    'ang_y6_vertically_opposite_direct','ang_y6_vertical_plus_straight','ang_y6_three_lines_at_point','ang_y6_point_straight_multi_rule',
    'ang_y6_vertically_opposite_not_vertical','ang_y6_not_all_opposite_equal','ang_y6_line_axis_right_angle_given','ang_y6_straight_line_error_spot'
  ]);
  cat('angles_triangles_y6',6,[
    'ang_y6_triangle_one_missing','ang_y6_triangle_missing_with_right_angle','ang_y6_equilateral_angle','ang_y6_isosceles_base_angle','ang_y6_isosceles_two_unknowns',
    'ang_y6_triangle_exterior_adjacent','ang_y6_composite_triangles_shared_vertex','ang_y6_triangle_with_reflex_compound','ang_y6_triangle_measurements_impossible','ang_y6_isosceles_wrong_equal_pair'
  ]);
  cat('angles_quads_polygons_y6',6,[
    'ang_y6_quadrilateral_one_missing','ang_y6_rectangle_square_missing','ang_y6_parallelogram_missing','ang_y6_rhombus_missing','ang_y6_kite_missing',
    'ang_y6_three_right_angles_impossible','ang_y6_polygon_interior_sum_by_triangulation','ang_y6_regular_polygon_one_interior','ang_y6_irregular_polygon_missing',
    'ang_y6_polygon_triangle_count','ang_y6_polygon_n_times_180_error','ang_y6_polygon_sides_triangles_sum_table'
  ]);
  cat('angles_reasoning_y5_6',5,['ang_y5_mystery_angle_constraints','ang_y5_all_turn_solutions_clock_compass']);
  cat('angles_reasoning_y5_6',6,[
    'ang_y6_equilateral_inside_rectangle','ang_y6_identical_parallelograms_rhombus','ang_y6_not_to_scale_choose_facts','ang_y6_enough_information',
    'ang_y6_algebraic_missing_angle','ang_y6_clock_face_angle_constraint','ang_y6_digit_card_angle_constraint'
  ]);
  const HELD_BACK_TYPES=new Set([
    'ang_y6_composite_triangles_shared_vertex',
    'ang_y5_mystery_angle_constraints',
    'ang_y6_equilateral_inside_rectangle',
    'ang_y6_identical_parallelograms_rhombus',
    'ang_y5_protractor_baseline_error',
    'ang_y6_point_straight_multi_rule'
  ]);
  for(let j=CATALOGUE.length-1;j>=0;j--)if(HELD_BACK_TYPES.has(CATALOGUE[j].id))CATALOGUE.splice(j,1);
  const TYPES_BY_FAMILY=Object.fromEntries(ANGLE_FAMILY_IDS.map(f=>[f,CATALOGUE.filter(x=>x.family===f).map(x=>x.id)]));

  for(const [id,meta] of Object.entries(ANGLE_FAMILIES)){
    if(!G.FAMILY_META[id])G.FAMILY_META[id]={label:meta.label,strand:meta.strand,years:meta.years.slice(),visual:true,curriculumId:meta.curriculumId};
    G.FAMILY_LABELS[id]=meta.label;
    if(Array.isArray(G.FAMILY_ORDER)&&!G.FAMILY_ORDER.includes(id))G.FAMILY_ORDER.push(id);
    if(Array.isArray(G.FAMILY_COMPACT_ORDER)&&!G.FAMILY_COMPACT_ORDER.includes(id))G.FAMILY_COMPACT_ORDER.push(id);
  }
  function demoteTextFallback(id,label){if(!G.FAMILY_META?.[id])return;Object.assign(G.FAMILY_META[id],{label,strand:'Extension',years:[],extension:true,textFallback:true});G.FAMILY_LABELS[id]=label;}
  demoteTextFallback('angle_facts','angle facts (text-only fallback)');
  demoteTextFallback('angle_sums','triangle/quadrilateral angle sums (text-only fallback)');
  demoteTextFallback('angle_relationships','line/point angle relationships (text-only fallback)');
  demoteTextFallback('angle_classification','angle classification (text-only fallback)');

  function scene(elements=[],opts={}){return {type:'angle',viewW:Number(opts.viewW)||100,viewH:Number(opts.viewH)||72,elements,answerElements:opts.answerElements||[],title:opts.title||'',caption:opts.caption||'',notToScale:!!opts.notToScale,physical:!!opts.physical,table:opts.table||null,visualClass:opts.visualClass||''};}
  const line=(x1,y1,x2,y2,role='ink',width=1)=>({kind:'line',x1,y1,x2,y2,role,width});
  const text=(x,y,value,opts={})=>({kind:'text',x,y,text:String(value),...opts});
  const poly=(points,opts={})=>({kind:'polygon',points:points.map(p=>({x:p[0],y:p[1]})),...opts});
  const angle=(cx,cy,start,span,opts={})=>({kind:'angle',cx,cy,start,span,length:opts.length||20,radius:opts.radius||9,label:opts.label||'',right:!!opts.right,role:opts.role||'ink',showArc:opts.showArc!==false,labelOffset:opts.labelOffset==null?8:Number(opts.labelOffset),labelSize:opts.labelSize||6.1});
  const turn=(cx,cy,start,quarters,clockwise,opts={})=>({kind:'turn',cx,cy,start,quarters,clockwise,label:opts.label||'',showEnd:opts.showEnd!==false});
  const orient=(cx,cy,dir,opts={})=>({kind:'orientation',cx,cy,dir,label:opts.label||'',role:opts.role||'ink'});
  const grid=(x,y,w,h,step=10)=>({kind:'grid',x,y,w,h,step});
  const rightMark=(cx,cy,start,size=6)=>({kind:'right',cx,cy,start,size});
  const protractor=(cx,cy,r,deg,opts={})=>({kind:'protractor',cx,cy,r,deg,wrongBaseline:!!opts.wrongBaseline});
  const dial=(cx,cy,r,fromMark,toMark,opts={})=>({kind:'dial',cx,cy,r,fromMark,toMark,showNumbers:opts.showNumbers!==false,role:opts.role||'ink'});
  const mark=(x1,y1,x2,y2,count=1)=>({kind:'sideMark',x1,y1,x2,y2,count});

  function mcq(correct,distractors,seed){
    const answer=String(correct),arr=[answer,...distractors.map(String)].filter((v,j,a)=>a.indexOf(v)===j).slice(0,4);
    const choices=shuffle(arr,rngFor(seed)),correctChoice=choices.indexOf(answer);
    return {choices,correctChoice,answer:`${letter(correctChoice)}. ${answer}`,marking:{mode:'multiple-choice',answer}};
  }
  function q(family,typeId,prompt,answer,key,visual,footprint='M',extra={}){
    const row=CATALOGUE.find(x=>x.id===typeId),year=row?.year||null;
    return {kind:family,angleTypeId:typeId,prompt,answer,key:`${family}:${typeId}:${key}`,visual,footprint,group:typeId,
      marking:extra.marking||{mode:'exact',answer},curriculum:extra.curriculum||{family,year,id:ANGLE_FAMILIES[family]?.curriculumId||''},...extra};
  }
  function qmc(family,typeId,prompt,correct,distractors,key,visual,footprint='M'){
    const m=mcq(correct,distractors,`${typeId}:${key}`);return q(family,typeId,prompt,m.answer,key,visual,footprint,m);
  }

  const DIRS=['right','up','left','down'];
  const DIR_ANGLE={right:0,up:90,left:180,down:270};
  function dirAfter(dir,quarters,clockwise){const idx=DIRS.indexOf(dir),step=clockwise?-quarters:quarters;return DIRS[(idx+step%4+8)%4];}
  function turnName(q){return ['no turn','quarter turn','half turn','three-quarter turn','full turn'][q]||`${q} right-angle turns`;}
  function turnVisual(startDir,quarters,clockwise,showEnd=true){const start=DIR_ANGLE[startDir];return scene([turn(50,39,start,quarters,clockwise,{showEnd})],{viewH:82,visualClass:'turn'});}
  function orientationCard(d,label='Start'){return scene([orient(50,36,d,{label})]);}
  function startEndOrientationScene(startDir,endDir){
    return scene([
      orient(30,36,startDir,{label:'Start'}),
      orient(70,36,endDir,{label:'End',role:'image'})
    ]);
  }
  function angleCards(values,opts={}){
    const pos=[[23,27],[73,27],[23,57],[73,57]],els=[];
    values.slice(0,4).forEach((v,j)=>{
      const p=pos[j],start=opts.starts?.[j]??(j*27-20);
      els.push(text(p[0],p[1]-18,letter(j),{align:'center',size:6.6,bold:true,role:'ink'}));
      els.push(angle(p[0],p[1],start,v,{length:14,radius:5.7,right:v===90,label:''}));
    });
    return scene(els,{caption:opts.caption||''});
  }
  function singleAngle(deg,opts={}){return scene([angle(50,43,opts.start??0,deg,{length:opts.length||30,radius:opts.radius||12,right:deg===90,label:opts.label||''})],{notToScale:!!opts.notToScale,physical:!!opts.physical,answerElements:opts.answerElements||[]});}
  const SHAPES={
    square:{name:'square',points:[[27,18],[67,18],[67,58],[27,58]],right:4,acute:0,obtuse:0},
    rectangle:{name:'rectangle',points:[[18,24],[76,24],[76,55],[18,55]],right:4,acute:0,obtuse:0},
    rightTriangle:{name:'right-angled triangle',points:[[24,57],[24,20],[78,57]],right:1,acute:2,obtuse:0},
    acuteTriangle:{name:'acute triangle',points:[[18,56],[50,16],[80,56]],right:0,acute:3,obtuse:0},
    obtuseTriangle:{name:'obtuse triangle',points:[[18,55],[42,22],[82,55]],right:0,acute:2,obtuse:1},
    parallelogram:{name:'parallelogram',points:[[20,55],[35,20],[78,20],[63,55]],right:0,acute:2,obtuse:2},
    rhombus:{name:'rhombus',points:[[50,13],[78,39],[50,65],[22,39]],right:0,acute:2,obtuse:2},
    trapezium:{name:'trapezium',points:[[18,55],[31,22],[72,22],[82,55]],right:0,acute:2,obtuse:2},
    kite:{name:'kite',points:[[48,14],[75,37],[48,60],[30,37]],right:0,acute:2,obtuse:2}
  };
  function shapeScene(names,opts={}){
    const list=(Array.isArray(names)?names:[names]).map(n=>typeof n==='string'?SHAPES[n]:n),els=[];
    if(list.length===1){els.push(poly(list[0].points,{role:'ink',fillRole:opts.fillRole||'pale'}));if(opts.label)els.push(text(50,68,opts.label,{align:'center',size:6.5,bold:true}));}
    else{
      const slots=[[5,4,40,29],[55,4,40,29],[5,38,40,29],[55,38,40,29]];
      list.slice(0,4).forEach((sh,j)=>{const [sx,sy,sw,shh]=slots[j],xs=sh.points.map(p=>p[0]),ys=sh.points.map(p=>p[1]),minx=Math.min(...xs),maxx=Math.max(...xs),miny=Math.min(...ys),maxy=Math.max(...ys),mapped=sh.points.map(([x,y])=>[sx+6+(x-minx)/(maxx-minx||1)*(sw-12),sy+4+(y-miny)/(maxy-miny||1)*(shh-10)]);els.push(poly(mapped,{role:'ink',fillRole:j%2?'paleBlue':'pale'}));els.push(text(sx+sw/2,sy+shh-1,letter(j),{align:'center',size:6.4,bold:true}));});
    }
    return scene(els,{notToScale:!!opts.notToScale,answerElements:opts.answerElements||[]});
  }
  function pointFromAngle(cx,cy,deg,len){
    const rad=Number(deg)*Math.PI/180;
    return [cx+Number(len)*Math.cos(rad),cy-Number(len)*Math.sin(rad)];
  }
  function rightAngleShapeScene(){
    const sh=SHAPES.rightTriangle;return scene([poly(sh.points,{role:'ink',fillRole:'pale'}),rightMark(24,57,90,7)]);
  }
  function lineScene(kind,vals={},opts={}){
    const els=[];
    if(kind==='straight'){
      const a=Number(vals.a??35);
      els.push(line(12,50,88,50));
      els.push(angle(50,50,0,a,{length:29,radius:9,label:vals.aLabel===false?'':`${fmt(a)}°`,labelOffset:10}));
      if(vals.bLabel)els.push(angle(50,50,a,180-a,{length:29,radius:15,label:vals.bLabel,role:'target',labelOffset:10}));
      if(Array.isArray(vals.endLabels)&&vals.endLabels.length>=2){
        els.push(text(10,59,String(vals.endLabels[0]),{size:6.2,bold:true,align:'center'}));
        els.push(text(90,59,String(vals.endLabels[1]),{size:6.2,bold:true,align:'center'}));
      }
    }else if(kind==='straight3'){
      const a=Number(vals.a??35),b=Number(vals.b??55),c=Math.max(1,180-a-b);
      els.push(line(10,52,90,52));
      els.push(angle(50,52,0,a,{length:30,radius:9,label:`${fmt(a)}°`,labelOffset:9}));
      els.push(angle(50,52,a,b,{length:30,radius:14,label:`${fmt(b)}°`,labelOffset:9}));
      els.push(angle(50,52,a+b,c,{length:30,radius:19,label:vals.cLabel||'x',role:'target',labelOffset:9}));
    }else if(kind==='point'){
      const spans=vals.spans||[80,110,70,100],starts=[];let acc=0;
      for(const sp of spans){starts.push(acc);acc+=sp;}
      starts.forEach(st=>{const pp=pointFromAngle(50,42,st,33);els.push(line(50,42,pp[0],pp[1]));});
      let st=0;spans.forEach((sp,j)=>{
        els.push(angle(50,42,st,sp,{length:0.001,radius:10+j*3.5,label:j===vals.unknownIndex?'x':`${fmt(sp)}°`,role:j===vals.unknownIndex?'target':'ink',labelOffset:8}));
        st+=sp;
      });
    }else if(kind==='cross'){
      const rot=Number(opts.rot||0),a=Number(vals.a??65);
      const r1=rot*Math.PI/180,r2=(rot+a)*Math.PI/180;
      const dx=38*Math.cos(r1),dy=38*Math.sin(r1),dx2=38*Math.cos(r2),dy2=38*Math.sin(r2);
      els.push(line(50-dx,40+dy,50+dx,40-dy),line(50-dx2,40+dy2,50+dx2,40-dy2));
      els.push(angle(50,40,rot,a,{length:0.001,radius:10,label:`${fmt(a)}°`,labelOffset:9}));
      const target=vals.target||'vertical';
      if(target==='adjacent'){
        els.push(angle(50,40,rot+a,180-a,{length:0.001,radius:16,label:vals.bLabel||'x',role:'target',labelOffset:9}));
      }else{
        els.push(angle(50,40,rot+180,a,{length:0.001,radius:16,label:vals.bLabel||'x',role:'target',labelOffset:9}));
      }
    }else if(kind==='rightAxis'){
      const a=Number(vals.a??35),ray=pointFromAngle(50,62,a,32);
      els.push(line(50,62,50,10),line(50,62,90,62),line(50,62,ray[0],ray[1]),rightMark(50,62,0,7));
      els.push(angle(50,62,0,a,{length:0.001,radius:10,label:''}));
      els.push(angle(50,62,a,90-a,{length:0.001,radius:17,label:'',role:'target'}));
      const la=pointFromAngle(50,62,a/2,22),lb=pointFromAngle(50,62,a+(90-a)/2,29);
      els.push(text(la[0],la[1],`${fmt(a)}°`,{size:6.1,bold:true,align:'center'}),text(lb[0],lb[1],vals.bLabel||'x',{size:7,bold:true,align:'center',role:'target'}));
    }
    return scene(els,{notToScale:opts.notToScale!==false,viewH:(kind==='point'||kind==='straight3'||kind==='cross')?82:76,visualClass:`line-${kind}`});
  }
  function triangleScene(labels={},opts={}){
    const p=opts.right?[[15,64],[15,14],[86,64]]:[[14,64],[50,11],[87,64]];
    const els=[poly(p,{role:'ink',fillRole:'pale'})];
    if(opts.right)els.push(rightMark(15,64,0,7));
    if(opts.equilateral){
      els.push(mark(p[0][0],p[0][1],p[1][0],p[1][1],1),
               mark(p[1][0],p[1][1],p[2][0],p[2][1],1),
               mark(p[2][0],p[2][1],p[0][0],p[0][1],1));
    }else if(opts.equalSides){
      els.push(mark(p[0][0],p[0][1],p[1][0],p[1][1],1),
               mark(p[1][0],p[1][1],p[2][0],p[2][1],1));
    }
    const loc=opts.right?[[28,55],[27,29],[70,55]]:[[28,54],[50,29],[72,54]];
    ['a','b','c'].forEach((k,j)=>{
      if(labels[k]!=null)els.push(text(loc[j][0],loc[j][1],String(labels[k]),{
        size:/[xy?]/i.test(String(labels[k]))?7.2:6.2,bold:true,role:/[xy?]/i.test(String(labels[k]))?'target':'ink'
      }));
    });
    return scene(els,{notToScale:opts.notToScale!==false,answerElements:opts.answerElements||[],viewH:82,visualClass:'triangle'});
  }
  function quadrilateralScene(kind='parallelogram',labels={},opts={}){
    const p=kind==='irregular'?[[17,56],[29,19],[70,14],[86,50]]:(SHAPES[kind]?.points||SHAPES.parallelogram.points);
    const els=[poly(p,{role:'ink',fillRole:'paleBlue'})];
    const cx=p.reduce((a,v)=>a+v[0],0)/p.length,cy=p.reduce((a,v)=>a+v[1],0)/p.length;
    const loc=p.map(([x,y])=>[x+(cx-x)*.23,y+(cy-y)*.23]);
    if(kind==='rectangle'||kind==='square')els.push(rightMark(p[0][0],p[0][1],0,5));
    if(kind==='rhombus'){
      for(let j=0;j<4;j++){const a=p[j],b=p[(j+1)%4];els.push(mark(a[0],a[1],b[0],b[1],1));}
    }
    if(kind==='kite'){
      els.push(mark(p[0][0],p[0][1],p[1][0],p[1][1],1),
               mark(p[0][0],p[0][1],p[3][0],p[3][1],1),
               mark(p[2][0],p[2][1],p[1][0],p[1][1],2),
               mark(p[2][0],p[2][1],p[3][0],p[3][1],2));
    }
    ['a','b','c','d'].forEach((k,j)=>{
      if(labels[k]!=null)els.push(text(loc[j][0],loc[j][1],String(labels[k]),{
        size:6.1,bold:true,role:/[xy?]/i.test(String(labels[k]))?'target':'ink'
      }));
    });
    return scene(els,{notToScale:opts.notToScale!==false,answerElements:opts.answerElements||[]});
  }
  function regularPolygonPoints(n,cx=50,cy=38,r=27){return Array.from({length:n},(_,j)=>{const a=(-90+j*360/n)*Math.PI/180;return [cx+r*Math.cos(a),cy+r*Math.sin(a)];});}
  function polygonScene(n,labels=[],opts={}){const pts=regularPolygonPoints(n),els=[poly(pts,{role:'ink',fillRole:'pale'})];labels.forEach((v,j)=>{if(v==null)return;const p=pts[j%pts.length],cx=50,cy=38,x=p[0]+(cx-p[0])*.25,y=p[1]+(cy-p[1])*.25;els.push(text(x,y,String(v),{size:5.9,bold:true,align:'center',role:String(v).includes('x')?'target':'ink'}));});if(opts.triangulate)for(let j=2;j<n-1;j++)els.push(line(pts[0][0],pts[0][1],pts[j][0],pts[j][1],'muted',.7));return scene(els,{notToScale:opts.notToScale!==false});}
  function protractorScene(deg,opts={}){return scene([protractor(50,63,43,deg,{wrongBaseline:opts.wrongBaseline})],{physical:false,viewH:82,visualClass:'protractor'});}

  function turnQuestion(typeId,i,family){
    const start=DIRS[i%4],qtr=1+(i%3),cw=i%2===0,end=dirAfter(start,qtr,cw);
    if(typeId==='ang_y1_identify_turn_from_start_end')return qmc(family,typeId,'What turn takes the arrow from Start to End?',turnName(qtr),['quarter turn','half turn','three-quarter turn'].filter(x=>x!==turnName(qtr)),i,turnVisual(start,qtr,cw,true),'M');
    if(typeId==='ang_y1_apply_turn_to_object')return qmc(family,typeId,`The arrow starts facing ${start}. After a ${turnName(qtr)} ${cw?'clockwise':'anticlockwise'}, which way will it face?`,end,DIRS.filter(x=>x!==end).slice(0,3),i,orientationCard(start),'M');
    if(typeId==='ang_y1_match_turn_fraction')return qmc(family,typeId,'Which fraction of a full turn is shown?',qtr===1?'one quarter':qtr===2?'one half':'three quarters',['one quarter','one half','three quarters'].filter(x=>x!==(qtr===1?'one quarter':qtr===2?'one half':'three quarters')).concat(['one whole']),i,turnVisual(start,qtr,cw,true),'M');
    if(typeId==='ang_y1_sequence_turns'){const q1=1+(i%2),q2=1,end2=dirAfter(dirAfter(start,q1,true),q2,false);return qmc(family,typeId,`Start facing ${start}. Turn ${turnName(q1)} clockwise, then a quarter turn anticlockwise. Which way are you facing?`,end2,DIRS.filter(x=>x!==end2).slice(0,3),i,orientationCard(start),'M');}
    if(typeId==='ang_y1_same_final_orientation'){const target=dirAfter(start,2,true);return qmc(family,typeId,`Which instruction would also finish facing ${target}?`,'half turn anticlockwise',['quarter turn clockwise','quarter turn anticlockwise','full turn'],i,orientationCard(start),'M');}
    if(typeId==='ang_y2_clockwise_anticlockwise')return qmc(family,typeId,'In which direction is the turn shown?',cw?'clockwise':'anticlockwise',[cw?'anticlockwise':'clockwise','straight ahead','full turn'],i,turnVisual(start,qtr,cw,true),'M');
    if(typeId==='ang_y2_turn_as_right_angle_units')return qmc(family,typeId,`${turnName(qtr)} is how many right-angle turns?`,String(qtr),['1','2','3','4'].filter(x=>x!==String(qtr)),i,turnVisual(start,qtr,cw,true),'M');
    if(typeId==='ang_y2_apply_named_turn_direction')return qmc(family,typeId,`Start facing ${start}. Make a ${turnName(qtr)} ${cw?'clockwise':'anticlockwise'}. Which way will you face?`,end,DIRS.filter(x=>x!==end).slice(0,3),i,orientationCard(start),'M');
    if(typeId==='ang_y2_describe_turn_between_orientations')return qmc(family,typeId,'Which description matches the turn shown?',`${turnName(qtr)} ${cw?'clockwise':'anticlockwise'}`,[`${turnName(qtr)} ${cw?'anticlockwise':'clockwise'}`,`${turnName(4-qtr)} ${cw?'clockwise':'anticlockwise'}`,'full turn clockwise'],i,turnVisual(start,qtr,cw,true),'M');
    if(typeId==='ang_y2_move_then_turn_sequence'){const els=[grid(18,10,64,48,12),orient(28,48,start,{label:'Start'}),text(76,18,'Target',{size:6,bold:true,role:'target'})];return qmc(family,typeId,`Move forward two squares, then make a quarter turn ${cw?'clockwise':'anticlockwise'}. Which way will you face?`,dirAfter(start,1,cw),DIRS.filter(x=>x!==dirAfter(start,1,cw)).slice(0,3),i,orientationCard(start),'M');}
    if(typeId==='ang_y2_spot_wrong_turn_instruction'){const qx=i%2===0?1:3,cwx=i%4<2,startx=DIRS[i%4],correct=`${turnName(qx)} ${cwx?'clockwise':'anticlockwise'}`,equiv=`${turnName(4-qx)} ${cwx?'anticlockwise':'clockwise'}`,wrong=`${turnName(qx)} ${cwx?'anticlockwise':'clockwise'}`;return qmc(family,typeId,'Which instruction would NOT finish at the End shown?',wrong,[correct,equiv,`full turn then ${correct}`],i,turnVisual(startx,qx,cwx,true),'M');}
    if(typeId==='ang_y2_third_person_left_right_frame'){const facing=['up','right','down','left'][i%4],ans={up:'left',right:'up',down:'right',left:'down'}[facing];return qmc(family,typeId,`A child is facing ${facing}. Which direction is to the child's LEFT?`,ans,DIRS.filter(x=>x!==ans).slice(0,3),i,orientationCard(facing,"Child's facing"),'M');}
    if(typeId==='ang_y2_select_equivalent_turn_descriptions'){const target=dirAfter(start,1,true);return qmc(family,typeId,`Which different turn also ends facing ${target}?`,'three-quarter turn anticlockwise',['quarter turn anticlockwise','half turn clockwise','full turn anticlockwise'],i,orientationCard(start),'M');}
    if(typeId==='ang_y2_choose_route_instruction_to_target'){const ansDir=dirAfter(start,1,cw),ans=`quarter turn ${cw?'clockwise':'anticlockwise'}, then forward`,starts={right:[28,34],left:[72,34],down:[50,18],up:[50,54]},targets={right:[72,34],left:[28,34],down:[50,58],up:[50,14]},sp=starts[ansDir],tp=targets[ansDir],sx=sp[0],sy=sp[1],tx=tp[0],ty=tp[1],labelY=ansDir==='down'?sy-7:sy+14;return qmc(family,typeId,'Which instruction turns the arrow so that moving forward takes it towards the target?',ans,[`quarter turn ${cw?'anticlockwise':'clockwise'}, then forward`,'half turn, then forward','forward, then full turn'],i,scene([grid(12,4,76,64,12),orient(sx,sy,start,{label:''}),text(sx,labelY,'Start',{size:6,bold:true,align:'center'}),text(tx,ty,'Target',{size:6.2,bold:true,role:'target',align:'center'})]),'L');}
    if(typeId==='ang_y2_rotation_pattern_continue'){const dirs=[start,dirAfter(start,1,true),dirAfter(start,2,true)],next=dirAfter(start,3,true);return qmc(family,typeId,'The arrow turns one quarter turn clockwise each time. Which direction comes next?',next,DIRS.filter(x=>x!==next).slice(0,3),i,scene(dirs.map((d,j)=>orient(20+j*30,38,d,{label:String(j+1)}))),'M');}
    return null;
  }
  function irregularPentagonScene(labels=[]){
    const pts=[[16,55],[25,18],[64,13],[87,38],[60,62]],els=[poly(pts,{role:'ink',fillRole:'pale'})];
    const cx=50,cy=39;
    labels.forEach((v,j)=>{
      if(v==null)return;
      const pp=pts[j],x=pp[0]+(cx-pp[0])*.24,y=pp[1]+(cy-pp[1])*.24;
      els.push(text(x,y,String(v),{size:5.9,bold:true,align:'center',role:/[xy?]/i.test(String(v))?'target':'ink'}));
    });
    return scene(els,{notToScale:true});
  }

  function y3Question(typeId,i,family){
    const vals=[35,90,120,70],starts=[10,37,100,145];
    if(typeId==='ang_y3_angle_as_turn_or_shape_property')return qmc(family,typeId,'Which statement is true?','An angle can describe a turn and also a corner of a shape.',['Angles only describe turns.','Angles only belong inside triangles.','An angle changes when its arms are made longer.'],i,scene([angle(25,38,0,90,{right:true,label:''}),text(25,62,'turn',{align:'center',size:6,bold:true}),poly([[60,55],[75,20],[90,55]],{fillRole:'pale'}),text(75,64,'corner of a shape',{align:'center',size:6,bold:true})]),'L');
    if(typeId==='ang_y3_identify_right_angle_rays')return qmc(family,typeId,'Which labelled angle is a right angle?',letter(1),['A','C','D'],i,angleCards(vals,{starts}),'L');
    if(typeId==='ang_y3_mark_right_angles_shape')return q(family,typeId,'Mark all the right angles in this rectangle.','4 right angles',i,scene([poly(SHAPES.rectangle.points,{fillRole:'pale'})],{answerElements:[[0,1,2,3].map(j=>{const p=SHAPES.rectangle.points[j];return rightMark(p[0],p[1],[0,90,180,270][j],5);})].flat()}),'L',{marking:{mode:'construction',answer:'All four corners marked.'}});
    if(typeId==='ang_y3_count_right_angles')return qmc(family,typeId,'How many right angles are in this shape?','4',['0','1','2'],i,shapeScene('square'),'M');
    if(typeId==='ang_y3_compare_to_right_angle'){const d=[55,90,125,75][i%4],ans=d<90?'less than a right angle':d===90?'equal to a right angle':'greater than a right angle';return qmc(family,typeId,'Compared with a right angle, this angle is...',ans,['less than a right angle','equal to a right angle','greater than a right angle'].filter(x=>x!==ans).concat(['a full turn']),i,singleAngle(d,{start:20+i*17}),'M');}
    if(typeId==='ang_y3_right_angles_in_turn'){const qtr=1+(i%4);return qmc(family,typeId,`${turnName(qtr)} contains how many right-angle turns?`,String(qtr),['1','2','3','4'].filter(x=>x!==String(qtr)),i,turnVisual('right',qtr,true,true),'M');}
    if(typeId==='ang_y3_turn_from_right_angle_count'){const qtr=1+(i%4);return qmc(family,typeId,`${qtr} right-angle turn${qtr===1?' makes':'s make'} which turn?`,turnName(qtr),['quarter turn','half turn','three-quarter turn','full turn'].filter(x=>x!==turnName(qtr)),i,turnVisual('right',qtr,true,true),'M');}
    if(typeId==='ang_y3_follow_turn_map'){const start=DIRS[i%4],end=dirAfter(start,2,true);return qmc(family,typeId,`Start facing ${start}. Make two right-angle turns clockwise. Which way will you face?`,end,DIRS.filter(x=>x!==end).slice(0,3),i,scene([grid(18,10,64,48,12),orient(35,45,start,{label:'Start'})]),'L');}
    if(typeId==='ang_y3_write_turn_instruction'){const start=DIRS[i%4],qtr=1+(i%3),cw=i%2===0,end=dirAfter(start,qtr,cw);return q(family,typeId,`Write one turn instruction that changes the arrow from ${start} to ${end}.`,`${turnName(qtr)} ${cw?'clockwise':'anticlockwise'} (or an equivalent full-turn description)`,i,startEndOrientationScene(start,end),'M',{response:{kind:'short',size:'S',label:'Write one valid turn instruction'},marking:{mode:'rubric',answer:'Any equivalent valid turn instruction.',rule:'Mark correct if the instruction produces the stated final orientation.',criteria:['Gives a direction and turn size that maps the start orientation to the end orientation.'],accept:'Equivalent clockwise/anticlockwise descriptions that end in the same orientation are acceptable.'}});}
    if(typeId==='ang_y3_arm_length_invariance')return qmc(family,typeId,'The two angles have the same opening but different arm lengths. Which is larger?','They are the same size.',['A is larger.','B is larger.','It is impossible to tell.'],i,scene([angle(28,42,0,60,{length:16,label:'A'}),angle(72,42,0,60,{length:28,label:'B'})]),'L');
    if(typeId==='ang_y3_identify_perpendicular_from_right_angle')return qmc(family,typeId,'Which pair of lines is perpendicular?','A and B',['A and C','B and C','None of them'],i,scene([line(20,55,80,55),line(45,15,45,60),line(15,20,75,35),text(82,56,'A',{size:6,bold:true}),text(46,13,'B',{size:6,bold:true}),text(77,34,'C',{size:6,bold:true}),rightMark(45,55,0,6)]),'L');
    if(typeId==='ang_y3_identify_parallel_perpendicular_horizontal_vertical')return qmc(family,typeId,'Which statement is true about the labelled lines?','A is parallel to B.',['A is perpendicular to B.','C is horizontal.','A and C are parallel.'],i,scene([line(15,20,85,20),line(15,45,85,45),line(48,8,48,63),text(87,22,'A',{size:6}),text(87,47,'B',{size:6}),text(50,9,'C',{size:6})]),'L');
    if(typeId==='ang_y3_acute_obtuse_language_bridge'){const d=i%2?60:120,ans=d<90?'acute':'obtuse';return qmc(family,typeId,`This angle is ${d<90?'smaller':'larger'} than a right angle. Which word describes it?`,ans,[ans==='acute'?'obtuse':'acute','right','straight'],i,singleAngle(d,{start:i*25}),'M');}
    if(typeId==='ang_y3_sort_shapes_by_right_angle_property')return qmc(family,typeId,'Which labelled shape belongs in the group “has at least one right angle”?','B',['A','C','D'],i,shapeScene(['acuteTriangle','rightTriangle','parallelogram','kite']),'L');
    if(typeId==='ang_y3_join_four_right_angles_at_point')return qmc(family,typeId,'Four right angles meet at one point. What turn do they make altogether?','a full turn',['a quarter turn','a half turn','a three-quarter turn'],i,scene([line(50,8,50,64),line(14,36,86,36),rightMark(50,36,0,6),rightMark(50,36,90,6),rightMark(50,36,180,6),rightMark(50,36,270,6)]),'M');
    if(typeId==='ang_y3_select_shapes_exact_right_angle_count')return qmc(family,typeId,'Which shape has exactly one right angle?','B',['A','C','D'],i,shapeScene(['acuteTriangle','rightTriangle','square','parallelogram']),'L');
    return null;
  }

  function y4Question(typeId,i,family){
    const d=[35,65,90,115,140][i%5],cls=d<90?'acute':d===90?'right':'obtuse';
    if(typeId==='ang_y4_classify_acute_right_obtuse')return qmc(family,typeId,'Classify the angle.',cls,['acute','right','obtuse'].filter(x=>x!==cls).concat(['reflex']),i,singleAngle(d,{start:i*23-30}),'M');
    if(typeId==='ang_y4_classify_angles_in_shapes'){const isRight=i%2===1,ans=isRight?'right':'acute',els=isRight?[poly(SHAPES.rightTriangle.points,{fillRole:'pale'}),rightMark(24,57,0,7)]:[poly(SHAPES.parallelogram.points,{fillRole:'pale'}),angle(20,55,0,67,{length:0.001,radius:8,label:'',role:'target'})];return qmc(family,typeId,'What type of angle is highlighted?',ans,['acute','right','obtuse'].filter(x=>x!==ans).concat(['straight']),i,scene(els,{notToScale:true}),'M');}
    if(typeId==='ang_y4_compare_pair'){const a=50+i*3,b=100+i*4;return qmc(family,typeId,'Which labelled angle is greater?','B',['A','They are equal','Cannot tell'],i,scene([angle(28,42,0,a,{length:20,label:'A'}),angle(72,42,15,b,{length:20,label:'B'})]),'M');}
    if(typeId==='ang_y4_order_angle_set'){const vals=[35,80,110,145],order='A, B, C, D';return qmc(family,typeId,'Which order lists the angles from smallest to largest?',order,['D, C, B, A','A, C, B, D','B, A, C, D'],i,angleCards(vals),'L');}
    if(typeId==='ang_y4_largest_smallest_in_polygon'){const pp=[[15,55],[25,18],[65,22],[88,55]],labs=[[21,49],[30,26],[62,30],[79,50]],ans=i%2?'D':'C';const els=[poly(pp,{fillRole:'pale'})];labs.forEach((v,j)=>els.push(text(v[0],v[1],letter(j),{size:6.4,bold:true,role:'target'})));return qmc(family,typeId,`Which labelled angle is ${i%2?'smallest':'largest'}?`,ans,['A','B','C','D'].filter(x=>x!==ans),i,scene(els),'L');}
    if(typeId==='ang_y4_compare_same_class_close'){const a=i%2?62:112,b=i%2?68:119;return qmc(family,typeId,'Both angles are the same type. Which is slightly larger?','B',['A','They are equal','Cannot be compared'],i,scene([angle(30,43,0,a,{length:22,label:'A'}),angle(72,43,0,b,{length:22,label:'B'})]),'M');}
    if(typeId==='ang_y4_match_angle_description')return qmc(family,typeId,'Which labelled angle is obtuse?','C',['A','B','D'],i,angleCards([45,90,125,70]),'L');
    if(typeId==='ang_y4_direction_facing_angle_type'){const qtr=i%2?1:2,ans=qtr===1?'right':'straight';return qmc(family,typeId,`A person turns from ${DIRS[i%4]} to ${dirAfter(DIRS[i%4],qtr,true)} by the shortest clockwise turn. What type of angle is turned through?`,ans,[ans==='right'?'acute':'right','obtuse','reflex'],i,turnVisual(DIRS[i%4],qtr,true,true),'M');}
    if(typeId==='ang_y4_longer_arms_bigger_diagnostic')return qmc(family,typeId,'Mia says angle B is larger because its arms are longer. Is Mia correct?','No - arm length does not change angle size.',['Yes - longer arms mean a bigger angle.','Only if the angle is acute.','Only if both arms are longer.'],i,scene([angle(30,42,0,70,{length:16,label:'A'}),angle(72,42,0,70,{length:28,label:'B'})]),'L');
    if(typeId==='ang_y4_count_types_in_picture')return qmc(family,typeId,'How many acute angles are shown?','2',['0','1','3'],i,angleCards([40,90,125,70]),'L');
    if(typeId==='ang_y4_select_shapes_exact_angle_type_count')return qmc(family,typeId,'Which shape has exactly two acute angles and one right angle?','B',['A','C','D'],i,shapeScene(['acuteTriangle','rightTriangle','square','parallelogram']),'L');
    if(typeId==='ang_y4_closest_to_right_angle'){const vals=[55,82,104,135];return qmc(family,typeId,'Which angle is closest to a right angle?','B',['A','C','D'],i,angleCards(vals),'L');}
    if(typeId==='ang_y4_ordering_error_spot')return qmc(family,typeId,'These angles should run from smallest to largest. Which adjacent pair needs swapping?','C and D',['A and B','B and C','A and D'],i,angleCards([40,70,125,95]),'L');
    if(typeId==='ang_y4_odd_one_out_angle_justify')return q(family,typeId,'Choose an odd one out and give a mathematical reason.','Example: B is the only right angle.',i,angleCards([50,90,120,70]),'L',{response:{kind:'explanation',size:'M',label:'Choose one and give your mathematical reason'},marking:{mode:'rubric',answer:'Example: B is the only right angle.',rule:'Mark correct if the chosen angle is genuinely unique within the set and the stated mathematical reason matches that choice.',criteria:['Identifies one angle as the odd one out.','Gives a true angle property that distinguishes it from the other three.'],accept:'More than one answer may be valid if the pupil gives a mathematically correct distinguishing reason.'}});
    if(typeId==='ang_y4_possible_impossible_triangle_angle_types')return qmc(family,typeId,'Which set of angle types could make a triangle?','two acute and one obtuse',['two obtuse and one acute','two right and one acute','three obtuse'],i,shapeScene('acuteTriangle'),'M');
    if(typeId==='ang_y4_double_acute_counterexample')return qmc(family,typeId,'A pupil says, “Double any acute angle and the result is obtuse.” Which angle disproves the claim?','30°',['50°','60°','70°'],i,singleAngle(30,{start:20}),'M');
    if(typeId==='ang_y4_combined_angle_line_property_statements')return qmc(family,typeId,'Which statement is true?','AB is perpendicular to AD.',['AB is parallel to AD.','AB is perpendicular to AC.','AD is horizontal.'],i,scene([line(22,54,82,54),line(22,54,22,14),line(22,54,66,25),rightMark(22,54,0,6),text(17,62,'A',{size:6.4,bold:true}),text(85,58,'B',{size:6.4,bold:true}),text(69,24,'C',{size:6.4,bold:true}),text(18,12,'D',{size:6.4,bold:true})]),'L');
    return null;
  }

  function y5DegreesQuestion(typeId,i,family){
    const values=[35,90,125,180,225,310],d=values[i%values.length],classify=v=>v<90?'acute':v===90?'right':v<180?'obtuse':v===180?'straight':'reflex';
    if(typeId==='ang_y5_classify_degree_value')return qmc(family,typeId,`Classify ${d}°.` ,classify(d),['acute','right','obtuse','straight','reflex'].filter(x=>x!==classify(d)).slice(0,3),i,singleAngle(clamp(d,20,320),{start:10}),'M');
    if(typeId==='ang_y5_classify_visual_reflex'){const v=[55,95,215,300][i%4],ans=classify(v);return qmc(family,typeId,'Classify the marked angle.',ans,['acute','obtuse','right','reflex'].filter(x=>x!==ans).slice(0,3),i,singleAngle(v,{start:20}),'M');}
    if(typeId==='ang_y5_largest_smallest_degree_free')return qmc(family,typeId,`Which labelled angle is ${i%2?'smallest':'largest'}?`,i%2?'A':'D',['A','B','C','D'].filter(x=>x!==(i%2?'A':'D')),i,angleCards([35,80,125,165]),'L');
    if(typeId==='ang_y5_estimate_angle'||typeId==='ang_y5_choose_best_estimate'){const actual=[37,64,118,152][i%4],best=Math.round(actual/10)*10,vis=singleAngle(actual,{start:17+i*11});return qmc(family,typeId,'Which is the best estimate for this angle?',`${best}°`,[`${best-20}°`,`${best+20}°`,`${best+40}°`],i,vis,'M');}
    if(typeId==='ang_y5_estimate_using_benchmark'){const actual=[48,83,102,136][i%4],best=Math.round(actual/10)*10;const ref=scene([angle(28,48,0,90,{length:24,right:true,label:'',role:'muted'}),text(28,18,'90°',{size:6.6,bold:true,align:'center',role:'muted'}),text(28,67,'reference',{size:5.8,align:'center',role:'muted'}),angle(72,48,0,actual,{length:24,radius:10,label:'',role:'target'}),text(72,18,'TARGET',{size:6.2,bold:true,align:'center',role:'target'})],{viewH:78,visualClass:'benchmark'});return qmc(family,typeId,'Using 90° as a benchmark, which is the best estimate?',`${best}°`,[`${best-20}°`,`${best+20}°`,`${best+50}°`],i,ref,'L');}
    if(typeId==='ang_y5_degrees_compass_turn'){const qtr=1+(i%3),ans=qtr*90;return qmc(family,typeId,`How many degrees are in this ${turnName(qtr)}?`,`${ans}°`,[`${Math.max(0,ans-90)}°`,`${ans+45}°`,`${Math.min(360,ans+90)}°`],i,turnVisual('right',qtr,true,true),'M');}
    if(typeId==='ang_y5_degrees_clock_turn'){const steps=[2,3,5,8][i%4],ans=steps*30;return qmc(family,typeId,`A clock hand moves ${steps} hour marks clockwise. How many degrees does it turn?`,`${ans}°`,[`${steps*15}°`,`${Math.min(360,ans+30)}°`,`${Math.max(30,ans-30)}°`],i,scene([dial(50,39,27,12,((steps)%12)||12)]),'M');}
    if(typeId==='ang_y5_remaining_full_turn'){const known=[70,125,210,285][i%4],ans=360-known;return q(family,typeId,`A pointer has turned ${known}°. How many more degrees are needed to complete a full turn?`,`${ans}°`,i,scene([angle(50,42,0,known,{length:26,radius:12,label:`${known}°`,role:'target'})]),'M');}
    if(typeId==='ang_y5_measure_angle_actual_size'||typeId==='ang_y5_measure_rotated_angle_actual_size'){const actual=[42,67,113,148][i%4],start=typeId.includes('rotated')?[35,80,145,215][i%4]:0,lo=actual-2,hi=actual+2;return q(family,typeId,'Measure angle x accurately with a protractor.',`${actual}° (accept ${lo}°-${hi}°)`,i,singleAngle(actual,{start,physical:true,label:'x',answerElements:[text(54,28,`${actual}°`,{size:7,bold:true,role:'answer'})]}),'L',{marking:{mode:'measure-angle',answer:actual,toleranceDeg:2,acceptedRange:[lo,hi]}});}
    if(typeId==='ang_y5_read_protractor_scale'){const actual=[30,50,120,140][i%4];return qmc(family,typeId,'What angle does the protractor show?',`${actual}°`,[`${180-actual}°`,`${actual+10}°`,`${Math.max(0,actual-10)}°`],i,protractorScene(actual),'L');}
    if(typeId==='ang_y5_protractor_wrong_scale'){const actual=[40,60,130,150][i%4],wrong=180-actual;return qmc(family,typeId,`A pupil reads the angle as ${wrong}°. What is the correct reading?`,`${actual}°`,[`${wrong}°`,`${actual+10}°`,`${Math.max(0,actual-10)}°`],i,protractorScene(actual),'L');}
    if(typeId==='ang_y5_protractor_baseline_error')return qmc(family,typeId,'Why is this protractor set-up unreliable?','The centre/baseline is not aligned with the angle.',['The protractor is too large.','The angle must be horizontal.','Only reflex angles can be measured.'],i,protractorScene(70,{wrongBaseline:true}),'L');
    if(typeId==='ang_y5_draw_given_angle_actual_size'){const actual=[35,65,105,145][i%4],lo=actual-2,hi=actual+2,answerElements=[angle(28,50,0,actual,{length:45,radius:11,label:`${actual}°`,role:'answer'})];return q(family,typeId,`Use a protractor to draw an angle of ${actual}° from the starting ray.`,`A ${actual}° angle (accept ${lo}°-${hi}°)`,i,scene([line(28,50,82,50),text(28,59,'vertex',{size:6,role:'muted'})],{physical:true,answerElements}),'L',{marking:{mode:'construction',answer:actual,toleranceDeg:2,acceptedRange:[lo,hi]}});}
    if(typeId==='ang_y5_arc_position_invariance')return qmc(family,typeId,'Two diagrams show the same rays but different-sized angle arcs. Which angle is larger?','They are the same size.',['A is larger.','B is larger.','The bigger arc means the bigger angle.'],i,scene([angle(28,44,0,75,{length:22,radius:5,label:'A'}),angle(72,44,0,75,{length:22,radius:13,label:'B'})]),'L');
    if(typeId==='ang_y5_numeric_angle_boundary_reasoning'){const ask=i%2===0?'largest possible whole-number acute angle':'smallest possible whole-number obtuse angle',ans=i%2===0?'89°':'91°';return qmc(family,typeId,`What is the ${ask}?`,ans,i%2===0?['90°','88°','91°']:['90°','89°','92°'],i,scene([text(50,34,i%2===0?'Acute angles':'Obtuse angles',{align:'center',size:7,bold:true}),text(50,47,i%2===0?'are less than 90°':'are greater than 90° and less than 180°',{align:'center',size:6.2,role:'muted'})]),'M');}
    if(typeId==='ang_y5_measure_angle_inside_shape_actual_size'){const actual=[48,72,108,134][i%4],lo=actual-2,hi=actual+2;return q(family,typeId,'Measure the marked angle A accurately with a protractor.',`${actual}° (accept ${lo}°-${hi}°)`,i,scene([poly([[15,58],[50,58],[50+32*Math.cos(actual*Math.PI/180),58-32*Math.sin(actual*Math.PI/180)],[82,18]],{fillRole:'pale'}),angle(50,58,0,actual,{length:28,radius:9,label:'A',role:'target'})],{physical:true,answerElements:[text(50,30,`${actual}°`,{align:'center',size:7,bold:true,role:'answer'})]}),'L',{marking:{mode:'measure-angle',answer:actual,toleranceDeg:2,acceptedRange:[lo,hi]}});}
    return null;
  }

  function linePointQuestion(typeId,i,family){
    if(typeId==='ang_y5_straight_line_one_missing'){const a=[35,60,75,115][i%4],ans=180-a;return q(family,typeId,`PQ is a straight line. One angle is ${a}°. Find x.`,`${ans}°`,i,lineScene('straight',{a,bLabel:'x',endLabels:['P','Q']}),'M');}
    if(typeId==='ang_y5_straight_line_multiple_adjacent'){const a=[30,40,55,65][i%4],b=[45,70,35,50][i%4],ans=180-a-b;return q(family,typeId,`Three adjacent angles lie on a straight line. Two are ${a}° and ${b}°. Find x.`,`${ans}°`,i,lineScene('straight3',{a,b,cLabel:'x'}),'L');}
    if(typeId==='ang_y5_around_point_one_missing'){const spans=[80,110,70,100],idx=i%4,ans=spans[idx],shown=spans.slice();shown[idx]=ans;return q(family,typeId,'Angles around a point total 360°. Find x.',`${ans}°`,i,lineScene('point',{spans:shown,unknownIndex:idx}),'L');}
    if(typeId==='ang_y5_around_point_multiple'){const a=70+i*5,b=110,ans=(360-a-b)/2;return q(family,typeId,`Angles around a point are ${a}°, ${b}°, x and x. Find x.`,`${fmt(ans)}°`,i,lineScene('point',{spans:[a,b,ans,ans],unknownIndex:2}),'L');}
    if(typeId==='ang_y5_multiples_of_90'){const qtr=1+(i%4);return qmc(family,typeId,`${qtr} right-angle turn${qtr===1?'':'s'} equal...`,`${qtr*90}°`,['90°','180°','270°','360°'].filter(x=>x!==`${qtr*90}°`),i,turnVisual('right',qtr,true,true),'M');}
    if(typeId==='ang_y6_vertically_opposite_direct'){const a=[45,65,115,135][i%4];return q(family,typeId,`Two straight lines cross. One angle is ${a}°. What is the vertically opposite angle x?`,`${a}°`,i,lineScene('cross',{a,bLabel:'x'},{rot:i*19}),'M');}
    if(typeId==='ang_y6_vertical_plus_straight'){const a=[40,55,70,125][i%4],ans=180-a;return q(family,typeId,`Two straight lines cross. One angle is ${a}°. Find the adjacent angle x.`,`${ans}°`,i,lineScene('cross',{a,bLabel:'x',target:'adjacent'},{rot:i*17}),'L');}
    if(typeId==='ang_y6_three_lines_at_point'){const a=35+i*5,b=55+i*5,ans=180-a-b;return q(family,typeId,`Three lines meet. Two adjacent angles on one side are ${a}° and ${b}°. Find the third angle x on that straight line.`,`${ans}°`,i,lineScene('straight3',{a,b,cLabel:'x'}),'L');}
    if(typeId==='ang_y6_point_straight_multi_rule'){const a=45+i*5,b=70,ans=180-a-b;return q(family,typeId,`Use the straight-line and around-a-point facts. The marked angles are ${a}° and ${b}°. Find x.`,`${ans}°`,i,lineScene('straight3',{a,b,cLabel:'x'}),'L');}
    if(typeId==='ang_y6_vertically_opposite_not_vertical')return qmc(family,typeId,'Which labelled angle is vertically opposite A?','C',['B','D','None'],i,scene([line(15,55,85,18),line(18,15,82,58),text(31,28,'A',{size:6,bold:true}),text(65,27,'B',{size:6,bold:true}),text(68,48,'C',{size:6,bold:true}),text(32,49,'D',{size:6,bold:true})],{notToScale:true}),'L');
    if(typeId==='ang_y6_not_all_opposite_equal')return qmc(family,typeId,'Do opposite-looking angles have to be equal if the arms are not two complete straight lines?','No.',['Yes, always.','Only if both are acute.','Only if the picture looks symmetrical.'],i,scene([line(15,55,52,35),line(52,35,85,18),line(20,15,52,35),line(52,35,78,60),text(50,68,'Not all arms form straight lines',{align:'center',size:6,role:'muted'})],{notToScale:true}),'L');
    if(typeId==='ang_y6_line_axis_right_angle_given'){const a=[25,35,48,62][i%4],ans=90-a;return q(family,typeId,`The vertical and horizontal lines are perpendicular. One part of the right angle is ${a}°. Find x.`,`${ans}°`,i,lineScene('rightAxis',{a,bLabel:'x'}),'M');}
    if(typeId==='ang_y6_straight_line_error_spot'){const a=65+i*5,wrong=180+a,correct=180-a;return qmc(family,typeId,`A pupil says x = 180 + ${a} = ${wrong}. What should x be?`,`${correct}°`,[`${wrong}°`,`${a}°`,`${360-a}°`],i,lineScene('straight',{a,bLabel:'x'}),'L');}
    return null;
  }

  function triangleQuestion(typeId,i,family){
    if(typeId==='ang_y6_triangle_one_missing'){const a=40+i*5,b=55+i*5,c=180-a-b;return q(family,typeId,`A triangle has angles ${a}°, ${b}° and x. Find x.`,`${c}°`,i,triangleScene({a:`${a}°`,b:`${b}°`,c:'x'}),'M');}
    if(typeId==='ang_y6_triangle_missing_with_right_angle'){const a=25+i*10,c=90-a;return q(family,typeId,`This is a right-angled triangle. Another angle is ${a}°. Find x.`,`${c}°`,i,triangleScene({a:'90°',b:`${a}°`,c:'x'},{right:true}),'M');}
    if(typeId==='ang_y6_equilateral_angle')return qmc(family,typeId,'What is the size of each angle in an equilateral triangle?','60°',['45°','90°','120°'],i,triangleScene({a:'?',b:'?',c:'?'},{equilateral:true}),'M');
    if(typeId==='ang_y6_isosceles_base_angle'){const apex=[40,50,70,80][i%4],base=(180-apex)/2;return q(family,typeId,`The equal sides meet at an angle of ${apex}°. Find each base angle.`,`${base}°`,i,triangleScene({a:'x',b:`${apex}°`,c:'x'},{equalSides:true}),'M');}
    if(typeId==='ang_y6_isosceles_two_unknowns'){const base=[50,55,65,70][i%4],apex=180-2*base;return q(family,typeId,'The triangle is isosceles. Find x and y.',`x = ${base}°, y = ${apex}°`,i,triangleScene({a:'x',b:'y',c:'x'},{equalSides:true}),'L');}
    if(typeId==='ang_y6_triangle_exterior_adjacent'){const a=45+i*5,b=60,interior=180-a-b,exterior=180-interior;return q(family,typeId,`Two interior angles are ${a}° and ${b}°. Find the exterior angle x at the third vertex.`,`${exterior}°`,i,scene([poly([[18,55],[55,15],[78,55]],{fillRole:'pale'}),line(78,55,94,55),text(28,49,`${a}°`,{size:6}),text(53,27,`${b}°`,{size:6}),text(82,49,'x',{size:7,bold:true,role:'target'})],{notToScale:true}),'L');}
    if(typeId==='ang_y6_composite_triangles_shared_vertex'){const a=40+i*5,b=55,c=180-a-b,d=35,ans=180-c-d;return q(family,typeId,`Two triangles share a vertex. In the first, two angles are ${a}° and ${b}°. The shared angle is used in the second triangle with ${d}°. Find x.`,`${ans}°`,i,scene([poly([[12,58],[44,15],[50,58]],{fillRole:'pale'}),poly([[50,58],[58,20],[88,58]],{fillRole:'paleBlue'}),text(22,51,`${a}°`,{size:5.8}),text(40,26,`${b}°`,{size:5.8}),text(63,30,`${d}°`,{size:5.8}),text(78,52,'x',{size:7,bold:true,role:'target'})],{notToScale:true}),'L');}
    if(typeId==='ang_y6_triangle_with_reflex_compound'){const a=50,b=60,c=70,ref=360-c;return q(family,typeId,`A triangle angle at a point is ${c}°. What is the reflex angle around the same point?`,`${ref}°`,i,scene([angle(50,43,0,c,{length:25,radius:8,label:`${c}°`}),angle(50,43,c,360-c,{length:25,radius:16,label:'x',role:'target'})],{notToScale:true}), 'M');}
    if(typeId==='ang_y6_triangle_measurements_impossible')return qmc(family,typeId,'Which set of three angles cannot be the interior angles of a triangle?','70°, 70°, 50°',['40°, 60°, 80°','90°, 45°, 45°','30°, 70°, 80°'],i,triangleScene({a:'?',b:'?',c:'?'},{notToScale:true}),'M');
    if(typeId==='ang_y6_isosceles_wrong_equal_pair')return qmc(family,typeId,'The two marked sides are equal. Which pair of angles must therefore be equal?','A and C',['A and B','B and C','All three'],i,scene([poly([[18,58],[50,14],[83,58]],{fillRole:'pale'}),mark(18,58,50,14),mark(50,14,83,58),text(25,52,'A',{size:6,bold:true}),text(50,26,'B',{size:6,bold:true}),text(76,52,'C',{size:6,bold:true})],{notToScale:true}),'M');
    return null;
  }

  function quadPolyQuestion(typeId,i,family){
    if(typeId==='ang_y6_quadrilateral_one_missing'){const a=70+i*5,b=85,c=110,ans=360-a-b-c;return q(family,typeId,`A quadrilateral has angles ${a}°, ${b}°, ${c}° and x. Find x.`,`${ans}°`,i,quadrilateralScene('irregular',{a:`${a}°`,b:`${b}°`,c:`${c}°`,d:'x'}),'L');}
    if(typeId==='ang_y6_rectangle_square_missing'){const a=[25,35,50,65][i%4],ans=90-a;return q(family,typeId,`A diagonal splits a right angle in a rectangle. One part is ${a}°. Find x.`,`${ans}°`,i,scene([poly(SHAPES.rectangle.points,{fillRole:'pale'}),line(18,55,76,24),rightMark(18,55,0,5),text(29,50,`${a}°`,{size:6}),text(23,39,'x',{size:7,bold:true,role:'target'})],{notToScale:true}),'L');}
    if(typeId==='ang_y6_parallelogram_missing'){const a=[65,70,110,120][i%4],ans=180-a;return q(family,typeId,`Adjacent angles in a parallelogram sum to 180°. One is ${a}°. Find x.`,`${ans}°`,i,quadrilateralScene('parallelogram',{a:`${a}°`,b:'x'}),'M');}
    if(typeId==='ang_y6_rhombus_missing'){const a=[50,70,110,130][i%4],ans=180-a;return q(family,typeId,`A rhombus has one interior angle of ${a}°. Find the adjacent angle x.`,`${ans}°`,i,quadrilateralScene('rhombus',{a:`${a}°`,b:'x'}),'M');}
    if(typeId==='ang_y6_kite_missing'){const a=70,b=100,c=70,ans=360-a-b-c;return q(family,typeId,`In this kite, the equal opposite angles are ${a}°. Another angle is ${b}°. Find x.`,`${ans}°`,i,quadrilateralScene('kite',{a:`${b}°`,b:`${a}°`,c:'x',d:`${c}°`}),'L');}
    if(typeId==='ang_y6_three_right_angles_impossible')return qmc(family,typeId,'Can a quadrilateral have exactly three right angles and one non-right angle?','No - the fourth angle must also be 90°.',['Yes, if the fourth is acute.','Yes, if the fourth is obtuse.','Only for a kite.'],i,quadrilateralScene('rectangle',{a:'90°',b:'90°',c:'90°',d:'?'}),'L');
    if(typeId==='ang_y6_polygon_interior_sum_by_triangulation'){const n=5+i%3,sum=(n-2)*180;return q(family,typeId,`Split this ${n}-sided polygon into triangles from one vertex. What is its interior angle sum?`,`${sum}°`,i,polygonScene(n,[],{triangulate:true}),'L');}
    if(typeId==='ang_y6_regular_polygon_one_interior'){const n=[5,6,8,10][i%4],ans=(n-2)*180/n;return q(family,typeId,`This is a regular ${n}-gon. Find one interior angle.`,`${fmt(ans)}°`,i,polygonScene(n,['x'],{notToScale:true}),'L');}
    if(typeId==='ang_y6_irregular_polygon_missing'){const n=5,vals=[90,110,120,130],ans=(n-2)*180-vals.reduce((a,b)=>a+b,0);return q(family,typeId,`An irregular pentagon has four angles of ${vals.join('°, ')}°. Find x.`,`${ans}°`,i,irregularPentagonScene([`${vals[0]}°`,`${vals[1]}°`,`${vals[2]}°`,`${vals[3]}°`,'x']),'L');}
    if(typeId==='ang_y6_polygon_triangle_count'){const n=5+i%4,ans=n-2;return qmc(family,typeId,`How many triangles are formed when this ${n}-gon is triangulated from one vertex?`,String(ans),[String(Math.max(1,ans-1)),String(ans+1),String(n)],i,polygonScene(n,[],{triangulate:true}),'L');}
    if(typeId==='ang_y6_polygon_n_times_180_error'){const n=6,correct=(n-2)*180;return qmc(family,typeId,`A pupil says the interior angle sum of a hexagon is 6 × 180° = 1080°. What is the correct sum?`,`${correct}°`,['1080°','540°','360°'],i,polygonScene(6,[],{triangulate:true}),'L');}
    if(typeId==='ang_y6_polygon_sides_triangles_sum_table'){const n=5+i%3,tri=n-2,sum=tri*180;const table={headers:['Sides','Triangles from one vertex','Interior sum'],rows:[[String(n),String(tri),'?']]};return q(family,typeId,'Complete the missing interior angle sum in the table.',`${sum}°`,i,scene([text(50,20,`${n}-sided polygon`,{align:'center',size:7,bold:true})],{table}),'L');}
    return null;
  }

  function reasoningQuestion(typeId,i,family){
    if(typeId==='ang_y5_mystery_angle_constraints'){const target=[70,110,150,250][i%4],cls=target<90?'acute':target<180?'obtuse':'reflex';return qmc(family,typeId,`A mystery angle is ${cls} and is closest to ${Math.round(target/10)*10}°. Which could it be?`,`${target}°`,[`${Math.max(10,target-40)}°`,`${target+30}°`,`${target+70>350?target-70:target+70}°`],i,singleAngle(target,{notToScale:true}),'M');}
    if(typeId==='ang_y5_all_turn_solutions_clock_compass')return q(family,typeId,'Give two different turns that make an arrow facing right finish facing up.','Example: quarter turn anticlockwise; three-quarter turn clockwise.',i,orientationCard('right'),'M',{response:{kind:'short',size:'M',label:'Write two different valid turns'},marking:{mode:'rubric',answer:'Example: quarter turn anticlockwise; three-quarter turn clockwise.',rule:'Mark correct if two different descriptions both produce the required final orientation.',criteria:['First turn description is valid.','Second turn description is different and also valid.'],accept:'Any two mathematically equivalent valid turn descriptions are acceptable.'}});
    if(typeId==='ang_y6_equilateral_inside_rectangle'){const given=[10,12,15,18][i%4],ans=30-given;return q(family,typeId,`An equilateral triangle sits inside a rectangle. The angle between its lower side and the rectangle base is ${given}°. Find x at the left corner.`,`${ans}°`,i,scene([poly([[15,15],[86,15],[86,60],[15,60]],{fillRole:'none'}),poly([[15,60],[48,18],[78,55]],{fillRole:'pale'}),rightMark(15,60,0,6),text(67,57,`${given}°`,{size:6}),text(20,48,'x',{size:7,bold:true,role:'target'})],{notToScale:true}),'L');}
    if(typeId==='ang_y6_identical_parallelograms_rhombus'){const a=[65,70,115,120][i%4],ans=180-a;return q(family,typeId,`A rhombus and identical parallelograms meet. One marked parallelogram angle is ${a}°. Find the adjacent equal-supplement angle x.`,`${ans}°`,i,scene([poly([[15,50],[27,20],[55,20],[43,50]],{fillRole:'pale'}),poly([[43,50],[55,20],[83,20],[71,50]],{fillRole:'paleBlue'}),poly([[43,50],[57,34],[71,50],[57,64]],{fillRole:'paleAmber'}),text(31,45,`${a}°`,{size:6}),text(68,45,'x',{size:7,bold:true,role:'target'})],{notToScale:true}),'L');}
    if(typeId==='ang_y6_not_to_scale_choose_facts')return qmc(family,typeId,'The diagram is not to scale. Which information should you trust to calculate the angle?','The stated angle values and geometric markings.',['How wide the angle looks.','The apparent side lengths.','The size of the printed arc.'],i,triangleScene({a:'50°',b:'x',c:'70°'},{notToScale:true}),'L');
    if(typeId==='ang_y6_enough_information')return qmc(family,typeId,'Only one angle of an ordinary triangle is given. Is there enough information to find both remaining angles exactly?','No.',['Yes, always.','Yes, because triangles sum to 180°.','Yes, if the diagram looks symmetrical.'],i,triangleScene({a:'70°',b:'x',c:'y'},{notToScale:true}),'M');
    if(typeId==='ang_y6_algebraic_missing_angle'){const x=35+i*5,a=x,b=x+20,c=180-a-b;return q(family,typeId,`A triangle has angles x°, (x + 20)° and ${c}°. Find x.`,`${x}°`,i,triangleScene({a:'x°',b:'(x+20)°',c:`${c}°`},{notToScale:true}),'L');}
    if(typeId==='ang_y6_clock_face_angle_constraint'){const steps=[2,3,4,5][i%4],ans=steps*30;return qmc(family,typeId,`Two clock marks are ${steps} spaces apart. What is the smaller angle between them?`,`${ans}°`,[`${steps*15}°`,`${ans+30}°`,`${360-ans}°`],i,scene([dial(50,39,27,12,((steps)%12)||12)]),'M');}
    if(typeId==='ang_y6_digit_card_angle_constraint'){const a=[45,65,75,85][i%4],b=180-a;return qmc(family,typeId,`Two adjacent angles on a straight line total 180°. One is ${a}°. Which value completes the other angle?`,`${b}°`,[`${180+a}°`,`${90-a>0?90-a:a}°`,`${360-a}°`],i,lineScene('straight',{a,bLabel:'?'}),'M');}
    return null;
  }

  function makeQuestion(typeId,i,family){
    if(family==='angles_turns_y1_2')return turnQuestion(typeId,i,family);
    if(family==='angles_right_y3')return y3Question(typeId,i,family);
    if(family==='angles_compare_y4')return y4Question(typeId,i,family);
    if(family==='angles_degrees_y5')return y5DegreesQuestion(typeId,i,family);
    if(family==='angles_lines_points_y5_6')return linePointQuestion(typeId,i,family);
    if(family==='angles_triangles_y6')return triangleQuestion(typeId,i,family);
    if(family==='angles_quads_polygons_y6')return quadPolyQuestion(typeId,i,family);
    if(family==='angles_reasoning_y5_6')return reasoningQuestion(typeId,i,family);
    return null;
  }

  function anglePool(kind,rules={}){
    if(!isAngleKind(kind))return[];const year=Number(rules.curriculumYear)||0,out=[];
    const rows=CATALOGUE.filter(x=>x.family===kind&&(!year||x.year===year));
    for(const row of rows)for(let i=0;i<4;i++){const item=makeQuestion(row.id,i,kind);if(item)out.push(item);}
    return out;
  }

  // --- Renderer -------------------------------------------------------------
  function roleColor(role){const pal=global.TT99VisualPalette||{},map={ink:pal.ink||[39,54,61],muted:pal.muted||[92,105,112],target:pal.target||[204,139,55],answer:pal.answer||[15,118,110],image:pal.image||[83,128,184]};return map[role]||map.ink;}
  function fillColor(role){const pal=global.TT99VisualPalette||{},s=pal.series||[[45,134,125],[225,161,65],[83,128,184]];if(role==='paleBlue')return s[2].map(v=>Math.round(v*.22+255*.78));if(role==='paleAmber')return s[1].map(v=>Math.round(v*.22+255*.78));if(role==='none')return null;return s[0].map(v=>Math.round(v*.18+255*.82));}
  function renderAngle(C,x,y,w,h,v,answers){
    let top=y;if(v.title){C.text(x+w/2,top+8,v.title,8,{bold:true,align:'center',color:roleColor('ink')});top+=12;}
    if(v.table?.rows?.length){const rows=[v.table.headers||[],...v.table.rows],cols=Math.max(1,v.table.headers?.length||v.table.rows[0].length),rh=14,cw=w/cols;rows.forEach((row,r)=>row.forEach((cell,c)=>{C.rect(x+c*cw,top+r*rh,cw,rh,{fill:r===0?[242,247,249]:null,stroke:[204,214,218],width:.4});C.text(x+c*cw+3,top+r*rh+9.5,String(cell),6.4,{bold:r===0,color:roleColor('ink')});}));top+=rows.length*rh+4;}
    const captionH=v.caption?10:0,ntsH=v.notToScale?9:0,availH=Math.max(52,h-(top-y)-captionH-ntsH),vw=Number(v.viewW)||100,vh=Number(v.viewH)||72,scale=Math.min((w-6)/vw,(availH-4)/vh),ox=x+(w-vw*scale)/2,oy=top+(availH-vh*scale)/2;
    const X=n=>ox+Number(n)*scale,Y=n=>oy+Number(n)*scale,S=n=>Number(n)*scale;
    function pointAt(cx,cy,deg,len){const r=deg*Math.PI/180;return {x:cx+len*Math.cos(r),y:cy-len*Math.sin(r)};}
    function drawArc(cx,cy,start,span,r,role='ink',width=.8){const steps=Math.max(5,Math.ceil(Math.abs(span)/12));let prev=pointAt(cx,cy,start,r);for(let j=1;j<=steps;j++){const p=pointAt(cx,cy,start+span*j/steps,r);C.line(X(prev.x),Y(prev.y),X(p.x),Y(p.y),{color:roleColor(role),width});prev=p;}}
    function drawArrowHead(p,ang,role='ink',size=3){const a=ang*Math.PI/180,p1={x:p.x-size*Math.cos(a-.55),y:p.y+size*Math.sin(a-.55)},p2={x:p.x-size*Math.cos(a+.55),y:p.y+size*Math.sin(a+.55)};C.polygon?.([{x:X(p.x),y:Y(p.y)},{x:X(p1.x),y:Y(p1.y)},{x:X(p2.x),y:Y(p2.y)}],{fill:roleColor(role),stroke:roleColor(role),width:.4});}
    function draw(el){
      if(!el)return;const role=el.role||'ink';
      if(el.kind==='line'){C.line(X(el.x1),Y(el.y1),X(el.x2),Y(el.y2),{color:roleColor(role),width:el.width||.8});return;}
      if(el.kind==='text'){C.text(X(el.x),Y(el.y),el.text,S(el.size||6.3),{bold:!!el.bold,align:el.align||'left',color:roleColor(role)});return;}
      if(el.kind==='polygon'){const pts=(el.points||[]).map(p=>({x:X(p.x),y:Y(p.y)}));C.polygon?.(pts,{fill:fillColor(el.fillRole),stroke:roleColor(role),width:el.width||.9});if(!C.polygon&&pts.length>1)for(let j=0;j<pts.length;j++){const a=pts[j],b=pts[(j+1)%pts.length];C.line(a.x,a.y,b.x,b.y,{color:roleColor(role),width:el.width||.9});}return;}
      if(el.kind==='right'){const p1=pointAt(el.cx,el.cy,el.start,el.size),p3=pointAt(el.cx,el.cy,el.start+90,el.size),u1=pointAt(p1.x,p1.y,el.start+90,el.size),pts=[p1,u1,p3];C.line(X(pts[0].x),Y(pts[0].y),X(pts[1].x),Y(pts[1].y),{color:roleColor(role),width:.75});C.line(X(pts[1].x),Y(pts[1].y),X(pts[2].x),Y(pts[2].y),{color:roleColor(role),width:.75});return;}
      if(el.kind==='angle'){const p1=pointAt(el.cx,el.cy,el.start,el.length),p2=pointAt(el.cx,el.cy,el.start+el.span,el.length);C.line(X(el.cx),Y(el.cy),X(p1.x),Y(p1.y),{color:roleColor(role),width:1});C.line(X(el.cx),Y(el.cy),X(p2.x),Y(p2.y),{color:roleColor(role),width:1});if(el.right&&Math.abs(Math.abs(el.span)-90)<.001)draw({kind:'right',cx:el.cx,cy:el.cy,start:el.start,size:Math.min(6,el.radius*.65),role});else if(el.showArc!==false)drawArc(el.cx,el.cy,el.start,el.span,el.radius,role,.85);if(el.label){const mid=el.start+el.span/2,off=Number(el.labelOffset==null?8:el.labelOffset),p=pointAt(el.cx,el.cy,mid,el.radius+off);C.text(X(p.x),Y(p.y)+S(.8),el.label,S(el.labelSize||6.1),{bold:true,align:'center',color:roleColor(role)});}return;}
      if(el.kind==='orientation'){const a=DIR_ANGLE[el.dir]??0,p=pointAt(el.cx,el.cy,a,26);C.line(X(el.cx),Y(el.cy),X(p.x),Y(p.y),{color:roleColor(role),width:1.5});drawArrowHead(p,a,role,4.2);C.rect(X(el.cx)-S(2),Y(el.cy)-S(2),S(4),S(4),{fill:roleColor(role)});if(el.label)C.text(X(el.cx),Y(el.cy+33),el.label,S(6.2),{align:'center',bold:true,color:roleColor(role)});return;}
      if(el.kind==='turn'){const start=Number(el.start)||0,q=Math.max(1,Number(el.quarters)||1),span=(el.clockwise?-1:1)*q*90,end=start+span,p1=pointAt(el.cx,el.cy,start,28),p2=pointAt(el.cx,el.cy,end,28);C.line(X(el.cx),Y(el.cy),X(p1.x),Y(p1.y),{color:roleColor('ink'),width:1.35});drawArrowHead(p1,start,'ink',3.8);if(el.showEnd){C.line(X(el.cx),Y(el.cy),X(p2.x),Y(p2.y),{color:roleColor('image'),width:1.45});drawArrowHead(p2,end,'image',3.8);}drawArc(el.cx,el.cy,start,span,16,'target',1.25);const endArc=pointAt(el.cx,el.cy,end,16);drawArrowHead(endArc,end+(el.clockwise?-90:90),'target',3.2);const l1=pointAt(el.cx,el.cy,start,37),l2=pointAt(el.cx,el.cy,end,37);C.text(X(l1.x),Y(l1.y)+S(1.5),'START',S(5.2),{align:'center',bold:true,color:roleColor('ink')});if(el.showEnd)C.text(X(l2.x),Y(l2.y)+S(1.5),'END',S(5.2),{align:'center',bold:true,color:roleColor('image')});return;}
      if(el.kind==='grid'){for(let xx=el.x;xx<=el.x+el.w+.001;xx+=el.step)C.line(X(xx),Y(el.y),X(xx),Y(el.y+el.h),{color:[224,230,232],width:.4});for(let yy=el.y;yy<=el.y+el.h+.001;yy+=el.step)C.line(X(el.x),Y(yy),X(el.x+el.w),Y(yy),{color:[224,230,232],width:.4});return;}
      if(el.kind==='sideMark'){const mx=(el.x1+el.x2)/2,my=(el.y1+el.y2)/2,dx=el.x2-el.x1,dy=el.y2-el.y1,len=Math.hypot(dx,dy)||1,nx=-dy/len,ny=dx/len;for(let j=0;j<(el.count||1);j++){const off=(j-(el.count-1)/2)*2.5;C.line(X(mx+dx/len*off-nx*3),Y(my+dy/len*off-ny*3),X(mx+dx/len*off+nx*3),Y(my+dy/len*off+ny*3),{color:roleColor(role),width:.7});}return;}
      if(el.kind==='protractor'){const cx=el.cx+(el.wrongBaseline?5:0),cy=el.cy+(el.wrongBaseline?-3:0),r=el.r;drawArc(cx,cy,0,180,r,'ink',1);drawArc(cx,cy,0,180,r-7,'muted',.45);C.line(X(cx-r),Y(cy),X(cx+r),Y(cy),{color:roleColor('ink'),width:.9});for(let d=0;d<=180;d++){const major=d%10===0,mid=d%5===0,len=major?5.7:mid?3.8:2.1,outer=pointAt(cx,cy,d,r),inner=pointAt(cx,cy,d,r-len);C.line(X(outer.x),Y(outer.y),X(inner.x),Y(inner.y),{color:roleColor(major?'ink':'muted'),width:major?.7:mid?.5:.28});if(major){const outerVal=180-d,innerVal=d;if(d===90){const lp=pointAt(cx,cy,d,r-11.5);C.text(X(lp.x),Y(lp.y)+S(1.1),'90',S(4.2),{align:'center',bold:true,color:roleColor('ink')});}else{const rot=d-90,lp1=pointAt(cx,cy,d,r-10.3),lp2=pointAt(cx,cy,d,r-16.6);C.text(X(lp1.x),Y(lp1.y)+S(1.1),String(outerVal),S(3.25),{align:'center',bold:true,rotate:rot,color:roleColor('ink')});C.text(X(lp2.x),Y(lp2.y)+S(1.1),String(innerVal),S(3.1),{align:'center',rotate:rot,color:roleColor('muted')});}}}const rp=pointAt(cx,cy,el.deg,r-4);C.line(X(cx),Y(cy),X(rp.x),Y(rp.y),{color:roleColor('target'),width:1.35});C.rect(X(cx)-S(1.6),Y(cy)-S(1.6),S(3.2),S(3.2),{fill:roleColor('ink')});return;}
      if(el.kind==='dial'){const cx=el.cx,cy=el.cy,r=el.r;drawArc(cx,cy,0,360,r,'muted',.75);for(let m=1;m<=12;m++){const d=90-m*30,outer=pointAt(cx,cy,d,r),inner=pointAt(cx,cy,d,r-3.2);C.line(X(outer.x),Y(outer.y),X(inner.x),Y(inner.y),{color:roleColor('muted'),width:.65});if(el.showNumbers){const lp=pointAt(cx,cy,d,r-7.5);C.text(X(lp.x),Y(lp.y)+S(1.5),String(m),S(4.3),{align:'center',color:roleColor('muted')});}}const markDeg=m=>90-(Number(m)%12)*30,a1=markDeg(el.fromMark),a2=markDeg(el.toMark),p1=pointAt(cx,cy,a1,r-8),p2=pointAt(cx,cy,a2,r-8);C.line(X(cx),Y(cy),X(p1.x),Y(p1.y),{color:roleColor('ink'),width:1.15});C.line(X(cx),Y(cy),X(p2.x),Y(p2.y),{color:roleColor('target'),width:1.25});C.rect(X(cx)-S(1.5),Y(cy)-S(1.5),S(3),S(3),{fill:roleColor('ink')});return;}
    }
    (v.elements||[]).forEach(draw);if(answers)(v.answerElements||[]).flat(Infinity).forEach(draw);
    if(v.notToScale)C.text(x+w-3,top+availH+7,'Not to scale',6,{align:'right',color:roleColor('muted')});
    if(v.caption)C.text(x+w/2,top+availH+7+(v.notToScale?8:0),v.caption,6.2,{align:'center',color:roleColor('muted')});
  }
  global.TT99VisualRenderers=global.TT99VisualRenderers||{};
  global.TT99VisualRenderers.angle=renderAngle;

  // --- Generator integration ------------------------------------------------
  const previous={generateQuestions:G.generateQuestions.bind(G),questionPool:G.questionPool.bind(G),questionByKey:G.questionByKey.bind(G),questionPoolIndex:G.questionPoolIndex.bind(G),questionByPoolIndex:G.questionByPoolIndex.bind(G),replaceQuestion:G.replaceQuestion.bind(G)};
  function balancedPick(pool,count,rng,rules){if(!pool.length||count<=0)return[];const chosen=[],groups=new Map(),seen=new Set();for(const item of pool){const k=item.group||'__all';if(!groups.has(k))groups.set(k,[]);groups.get(k).push(item);}const keys=shuffle([...groups.keys()],rng);for(const k of keys)groups.set(k,shuffle(groups.get(k),rng));const offsets=Object.fromEntries(keys.map(k=>[k,0]));let guard=0;while(chosen.length<count&&guard<count*100+1000){guard++;let progress=false;for(const k of shuffle(keys,rng)){const arr=groups.get(k);let tries=0;while(tries<arr.length){const item=arr[offsets[k]%arr.length];offsets[k]++;tries++;if(rules?.avoidExactDuplicates!==false&&seen.has(item.key))continue;chosen.push(clone(item));seen.add(item.key);progress=true;break;}if(chosen.length>=count)break;}if(!progress){seen.clear();for(const k of keys)groups.set(k,shuffle(groups.get(k),rng));}}return chosen.slice(0,count);}
  function weightedCounts(rules,rng){const bag=[];for(const f of rules.families){const w=Math.max(1,Number(rules.familyWeights?.[f])||1);for(let i=0;i<w;i++)bag.push(f);}const cycle=shuffle(bag,rng),counts=Object.fromEntries(rules.families.map(f=>[f,0]));for(let i=0;i<rules.questionCount;i++)counts[cycle[i%cycle.length]]++;return counts;}
  G.questionPool=function(kind,rules){if(isAngleKind(kind))return anglePool(kind,G.normalizeRules(rules));return previous.questionPool(kind,rules);};
  G.questionByKey=function(kind,rules,key){if(!isAngleKind(kind))return previous.questionByKey(kind,rules,key);const found=G.questionPool(kind,rules).find(x=>x.key===key);return found?clone(found):null;};
  G.questionPoolIndex=function(kind,rules,key){if(!isAngleKind(kind))return previous.questionPoolIndex(kind,rules,key);return G.questionPool(kind,rules).findIndex(x=>x.key===key);};
  G.questionByPoolIndex=function(kind,rules,index){if(!isAngleKind(kind))return previous.questionByPoolIndex(kind,rules,index);const pool=G.questionPool(kind,rules),n=Number(index);return Number.isInteger(n)&&n>=0&&n<pool.length?clone(pool[n]):null;};
  G.generateQuestions=function(inputRules,seed){const rules=G.normalizeRules(inputRules);if(rules.mode!=='family_mix'||!hasAngleFamily(rules))return previous.generateQuestions(inputRules,seed);const rng=rngFor(seed||'CUSTOM'),counts=weightedCounts(rules,rng);let out=[];for(const family of rules.families){const count=counts[family]||0;if(!count)continue;out=out.concat(balancedPick(G.questionPool(family,rules),count,rng,rules));}return shuffle(out,rng).map((item,idx)=>({...item,number:idx+1}));};
  G.replaceQuestion=function(questions,index,inputRules,seed){const current=questions?.[index];if(!current||!isAngleKind(current.kind))return previous.replaceQuestion(questions,index,inputRules,seed);const rules=G.normalizeRules(inputRules),pool=G.questionPool(current.kind,rules).filter(x=>x.angleTypeId===current.angleTypeId&&x.key!==current.key);if(!pool.length)return questions.slice();const used=new Set(questions.filter((_,j)=>j!==index).map(x=>x.key));let candidates=pool.filter(x=>!used.has(x.key));if(!candidates.length)candidates=pool;const rng=rngFor(String(seed||'')+':angle-replacement'),chosen=shuffle(candidates,rng)[0],out=questions.slice();out[index]={...clone(chosen),number:index+1};return out;};

  function validateVisual(v){
    if(!v||v.type!=='angle')return {ok:false,error:'not-angle'};const all=[...(v.elements||[]),...(v.answerElements||[]).flat(Infinity)];
    for(const el of all){if(!el||typeof el!=='object')continue;if(el.kind==='angle'&&(!Number.isFinite(Number(el.span))||Math.abs(Number(el.span))>360||Math.abs(Number(el.span))<.001))return {ok:false,error:'invalid-angle-span'};for(const k of ['x','y','x1','y1','x2','y2','cx','cy'])if(el[k]!=null&&!Number.isFinite(Number(el[k])))return {ok:false,error:`invalid-${k}`};}
    return {ok:true,error:'',elementCount:all.length,physical:!!v.physical};
  }

  global.TT99CustomAngles={VERSION,ANGLE_FAMILIES,CATALOGUE,TYPES_BY_FAMILY,anglePool,renderAngle,validateVisual};
}(typeof window!=='undefined'?window:globalThis));
