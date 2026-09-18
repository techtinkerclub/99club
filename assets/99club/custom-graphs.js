/* Tech Tinker Club - Custom Worksheets graphical statistics engine
 * v0.1 / Custom Worksheets visual stage 1
 *
 * Isolated from the public 99 Club app. This module is loaded only by the
 * hidden Custom Worksheets page. It augments TT99Generator with three
 * curriculum-facing families (bar charts, time graphs, line graphs) and
 * wraps the Custom PDF/preview layout only when a generated sheet actually
 * contains a visual question. Text-only 99 Club behaviour remains untouched.
 */
(function(global){
  'use strict';
  const G=global.TT99Generator;
  const P=global.TT99SimplePDF;
  const L=global.TT99PDFLayout;
  if(!G) return;

  const VERSION='0.1.7';
  // Shared restrained palette for all generated visual questions. Colour is used
  // as a secondary cue only: labels, position, line style and geometry remain
  // sufficient for greyscale printing.
  const VISUAL_PALETTE={
    series:[[45,134,125],[225,161,65],[83,128,184],[202,104,101],[132,108,177],[105,153,103]],
    ink:[39,54,61],muted:[92,105,112],grid:[223,229,232],axis:[58,72,79],
    answer:[15,118,110],target:[204,139,55],mirror:[132,108,177],image:[83,128,184]
  };
  global.TT99VisualPalette=global.TT99VisualPalette||VISUAL_PALETTE;
  const BAR_CATALOGUE=[{"id":"bc_construct_raw_to_chart","title":"Raw observations to bar chart","category":"construction"},{"id":"bc_construct_table_to_chart","title":"Frequency table to bar chart","category":"construction"},{"id":"bc_complete_explicit_missing_bar","title":"Complete an explicitly given missing bar","category":"completion"},{"id":"bc_complete_from_total_relationships","title":"Complete bars from total and relationships","category":"completion_reasoning"},{"id":"bc_complete_multi_representation","title":"Complete linked bar chart and another representation","category":"translation"},{"id":"bc_read_value","title":"Read a value","category":"interpretation"},{"id":"bc_identify_extreme","title":"Identify greatest or least","category":"interpretation"},{"id":"bc_identify_equal_categories","title":"Identify equal categories","category":"interpretation"},{"id":"bc_total_frequency","title":"Find the total","category":"calculation_from_chart"},{"id":"bc_compare_difference","title":"Find a difference","category":"calculation_from_chart"},{"id":"bc_range","title":"Calculate the range","category":"calculation_from_chart"},{"id":"bc_reasoning_multiplicative_claim","title":"Test a multiplicative claim","category":"reasoning"},{"id":"bc_compare_two_datasets","title":"Compare two datasets","category":"comparison"},{"id":"bc_fraction_of_total","title":"Fraction of the total","category":"cross_topic_fraction"},{"id":"bc_percentage_of_total","title":"Percentage of the total","category":"cross_topic_percentage"},{"id":"bc_error_analysis","title":"Spot errors or misleading features","category":"reasoning_error_analysis"},{"id":"bc_apply_external_rule","title":"Apply an external rule to chart data","category":"cross_topic_multi_step"},{"id":"bc_downstream_multi_step","title":"Use a chart value in a further calculation","category":"cross_topic_multi_step"},{"id":"bc_choose_or_complete_scale","title":"Choose or complete a sensible scale","category":"construction"},{"id":"bc_complete_labels_title","title":"Complete missing chart labels","category":"chart_conventions"},{"id":"bc_complete_chart_and_table_bidirectional","title":"Complete a chart and table from each other","category":"completion_translation"},{"id":"bc_construct_from_relational_clues","title":"Construct a complete chart from mixed numerical clues","category":"construction_reasoning"},{"id":"bc_collect_own_data_and_chart","title":"Collect own data and present it as a bar chart","category":"open_ended_investigation"},{"id":"bc_filter_categories_by_condition","title":"Find categories meeting a condition","category":"interpretation_condition"},{"id":"bc_decompose_group_total","title":"Find an unknown part from a chart total","category":"reverse_reasoning"},{"id":"bc_read_and_round","title":"Read and round a chart value","category":"interpretation_estimation"},{"id":"bc_top_n_total","title":"Find the total of the greatest or smallest N categories","category":"selection_and_calculation"},{"id":"bc_difference_to_reference_value","title":"Find the difference to a target or capacity","category":"application"},{"id":"bc_sum_categories_by_condition","title":"Sum categories selected by an ordered condition","category":"selection_and_calculation"},{"id":"bc_update_chart_with_new_data","title":"Update a chart after new data is added","category":"completion_dynamic"},{"id":"bc_estimate_combined_values","title":"Estimate a combined value","category":"interpretation_estimation"},{"id":"bc_reasoning_proportion_claim","title":"Test a fraction or proportion claim","category":"reasoning"},{"id":"bc_paired_series_exact_difference_category","title":"Find the category where two series differ by an exact amount","category":"multi_series_reasoning"},{"id":"bc_paired_series_greatest_difference","title":"Find the greatest difference between paired series","category":"multi_series_reasoning"},{"id":"bc_paired_series_relation_filter","title":"Find categories where one series exceeds the other","category":"multi_series_interpretation"},{"id":"bc_paired_series_combined_category_total","title":"Combine two series within each category","category":"multi_series_calculation"},{"id":"bc_paired_series_aggregate_difference","title":"Compare totals of two series across all categories","category":"multi_series_calculation"},{"id":"bc_paired_series_ratio_category","title":"Find a category satisfying a ratio between two series","category":"multi_series_reasoning"},{"id":"bc_interpret_ordered_trend","title":"Describe a trend in ordered bar data","category":"qualitative_reasoning"},{"id":"bc_overlap_inclusion_exclusion","title":"Infer overlap from two bar totals and a known overall total","category":"set_reasoning"},{"id":"bc_grouped_data_limitations","title":"Explain what grouped bar data cannot determine","category":"statistical_reasoning"},{"id":"bc_weighted_total_from_frequency_bars","title":"Find the weighted total represented by a frequency bar chart","category":"frequency_distribution_calculation"},{"id":"bc_mean_of_bar_values","title":"Calculate the mean of values shown by bars","category":"cross_topic_mean"},{"id":"bc_mode_of_bar_values","title":"Find the modal bar value and its category or categories","category":"cross_topic_mode"},{"id":"bc_infer_scale_from_total_and_relative_bars","title":"Infer an unlabeled scale from the total and relative bar heights","category":"reverse_scale_reasoning"},{"id":"bc_translate_category_to_pie_sector","title":"Convert a bar-chart category to an equivalent pie-chart sector","category":"cross_representation"}];
  const LINE_CATALOGUE=[{"id":"lg_range_high_low","title":"Difference between highest and lowest values","category":"comparison"},{"id":"lg_compare_difference_two_points","title":"Difference between two specified points","category":"comparison"},{"id":"lg_interpolate_between_points","title":"Estimate an intermediate value","category":"interpolation"},{"id":"lg_read_approx_value_at_x","title":"Read a value at a specified x-position","category":"interpretation"},{"id":"lg_reverse_lookup_x_for_value","title":"Find the x-position for a given approximate value","category":"interpretation_reverse"},{"id":"lg_apply_text_change_to_graph_value","title":"Apply a stated change to a graph value","category":"application"},{"id":"lg_duration_between_y_levels","title":"Find time/distance interval between two y-values","category":"difference_in_x"},{"id":"lg_first_reach_or_cross_threshold","title":"Find when a threshold is first reached or crossed","category":"threshold"},{"id":"lg_find_x_of_extreme","title":"Find when the graph is highest or lowest","category":"extreme"},{"id":"lg_two_series_compare_at_x","title":"Compare two lines at the same x-position","category":"two_series_comparison"},{"id":"lg_two_series_inverse_total","title":"Infer x from a combined total on two lines","category":"two_series_reverse_problem"},{"id":"lg_round_change_between_points","title":"Calculate a change and round the answer","category":"comparison_estimation"},{"id":"lg_proportion_target_reverse_lookup","title":"Convert a fraction/percentage target then locate it on the graph","category":"cross_topic_fraction_percentage"},{"id":"lg_percentage_of_initial_at_x","title":"Read a value then express it as a percentage of the initial total","category":"cross_topic_percentage"},{"id":"lg_duration_above_or_below_threshold","title":"Find how long a value stays above/below a threshold","category":"threshold_duration"},{"id":"lg_identify_stationary_interval","title":"Identify a flat/stationary interval","category":"graph_feature"},{"id":"lg_difference_between_event_defined_points","title":"Find a change between graph-defined events","category":"event_based_comparison"},{"id":"lg_find_other_x_same_y","title":"Find another x-position with the same y-value","category":"reverse_lookup"},{"id":"lg_explain_compare_interval_changes","title":"Explain a comparison between changes over two intervals","category":"reasoning"},{"id":"lg_greatest_change_interval","title":"Find the interval with the greatest increase or decrease","category":"change_over_interval"},{"id":"lg_count_intervals_with_exact_change","title":"Count intervals with a specified change","category":"change_over_interval"},{"id":"lg_multi_series_compare_interval_changes","title":"Compare changes in two series over the same interval","category":"multi_series_change"},{"id":"lg_multi_series_sum_interval_changes","title":"Sum changes across several series over one interval","category":"multi_series_change"},{"id":"lg_find_x_for_series_difference","title":"Find where the difference between two lines equals a target","category":"multi_series_reverse_lookup"},{"id":"lg_multi_series_conditional_lookup","title":"Use a relationship between two lines to locate x, then read/compare another series","category":"multi_series_reasoning"},{"id":"lg_multiplicative_reference_reverse_lookup","title":"Transform a graph reference value multiplicatively, then locate it","category":"cross_topic_multiplicative_reasoning"},{"id":"lg_count_x_positions_by_condition","title":"Count plotted positions satisfying a condition","category":"condition_count"},{"id":"lg_sum_series_at_x","title":"Add several series at one x-position","category":"multi_series_sum"},{"id":"lg_match_segment_rate_description","title":"Match graph segments to rate/change descriptions","category":"rate_of_change_reasoning"}];
  const ELIGIBLE={"bar_charts":{"3":["bc_construct_raw_to_chart","bc_construct_table_to_chart","bc_complete_explicit_missing_bar","bc_complete_from_total_relationships","bc_complete_multi_representation","bc_read_value","bc_identify_extreme","bc_identify_equal_categories","bc_total_frequency","bc_compare_difference","bc_compare_two_datasets","bc_choose_or_complete_scale","bc_complete_labels_title","bc_complete_chart_and_table_bidirectional","bc_collect_own_data_and_chart","bc_filter_categories_by_condition","bc_difference_to_reference_value","bc_update_chart_with_new_data"],"4":["bc_construct_raw_to_chart","bc_construct_table_to_chart","bc_complete_explicit_missing_bar","bc_complete_from_total_relationships","bc_complete_multi_representation","bc_read_value","bc_identify_extreme","bc_identify_equal_categories","bc_total_frequency","bc_compare_difference","bc_range","bc_reasoning_multiplicative_claim","bc_compare_two_datasets","bc_choose_or_complete_scale","bc_complete_labels_title","bc_complete_chart_and_table_bidirectional","bc_collect_own_data_and_chart","bc_filter_categories_by_condition","bc_decompose_group_total","bc_top_n_total","bc_difference_to_reference_value","bc_sum_categories_by_condition","bc_update_chart_with_new_data","bc_estimate_combined_values","bc_paired_series_exact_difference_category","bc_paired_series_greatest_difference","bc_paired_series_relation_filter","bc_paired_series_combined_category_total","bc_paired_series_aggregate_difference","bc_interpret_ordered_trend"]},"time_graphs":{"4":["lg_range_high_low","lg_compare_difference_two_points","lg_read_approx_value_at_x","lg_reverse_lookup_x_for_value","lg_apply_text_change_to_graph_value","lg_duration_between_y_levels","lg_first_reach_or_cross_threshold","lg_find_x_of_extreme","lg_identify_stationary_interval","lg_difference_between_event_defined_points","lg_greatest_change_interval"]},"line_graphs":{"5":["lg_range_high_low","lg_compare_difference_two_points","lg_interpolate_between_points","lg_read_approx_value_at_x","lg_reverse_lookup_x_for_value","lg_apply_text_change_to_graph_value","lg_duration_between_y_levels","lg_first_reach_or_cross_threshold","lg_find_x_of_extreme","lg_two_series_compare_at_x","lg_round_change_between_points","lg_duration_above_or_below_threshold","lg_identify_stationary_interval","lg_difference_between_event_defined_points","lg_find_other_x_same_y","lg_explain_compare_interval_changes","lg_greatest_change_interval","lg_find_x_for_series_difference","lg_count_x_positions_by_condition","lg_sum_series_at_x"],"6":["lg_range_high_low","lg_compare_difference_two_points","lg_interpolate_between_points","lg_read_approx_value_at_x","lg_reverse_lookup_x_for_value","lg_apply_text_change_to_graph_value","lg_duration_between_y_levels","lg_first_reach_or_cross_threshold","lg_find_x_of_extreme","lg_two_series_compare_at_x","lg_two_series_inverse_total","lg_round_change_between_points","lg_duration_above_or_below_threshold","lg_identify_stationary_interval","lg_difference_between_event_defined_points","lg_find_other_x_same_y","lg_explain_compare_interval_changes","lg_greatest_change_interval","lg_count_intervals_with_exact_change","lg_multi_series_compare_interval_changes","lg_multi_series_sum_interval_changes","lg_find_x_for_series_difference","lg_multiplicative_reference_reverse_lookup","lg_count_x_positions_by_condition","lg_sum_series_at_x","lg_match_segment_rate_description"]}};


  const GRAPH_FAMILIES={
    bar_charts:{label:'bar charts',strand:'Statistics',years:[3,4],representation:'bar_chart'},
    time_graphs:{label:'time graphs',strand:'Statistics',years:[4],representation:'line_graph'},
    line_graphs:{label:'line graphs',strand:'Statistics',years:[5,6],representation:'line_graph'}
  };
  const GRAPH_FAMILY_IDS=Object.keys(GRAPH_FAMILIES);
  const hasGraphFamily=rules=>Array.isArray(rules?.families)&&rules.families.some(f=>GRAPH_FAMILY_IDS.includes(f));
  const isGraphKind=kind=>GRAPH_FAMILY_IDS.includes(String(kind||''));
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const sum=a=>a.reduce((s,v)=>s+Number(v||0),0);
  const fmt=n=>Number.isInteger(Number(n))?String(Number(n)):String(Number(n).toFixed(1)).replace(/\.0$/,'');
  const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const clone=o=>JSON.parse(JSON.stringify(o));
  function hashString(str){let h=2166136261>>>0;for(let i=0;i<String(str).length;i++){h^=String(str).charCodeAt(i);h=Math.imul(h,16777619)>>>0;}return h>>>0;}
  function localRng(seed){let a=hashString(seed)||0x6d2b79f5;return function(){a|=0;a=(a+0x6D2B79F5)|0;let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};}
  function rngFor(seed){return typeof G.rngFromSeed==='function'?G.rngFromSeed(seed):localRng(seed);}
  function shuffle(arr,rng){const out=arr.slice();for(let i=out.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[out[i],out[j]]=[out[j],out[i]];}return out;}
  function pick(arr,rng){return arr[Math.floor(rng()*arr.length)%arr.length];}
  function letters(n){return Array.from({length:n},(_,i)=>String.fromCharCode(65+i));}

  // Mutate the exported registries before custom-app.js reads them. The generator's
  // internal FAMILY_ORDER/FAMILY_META objects are the same array/object references,
  // so normalizeRules will preserve these newly registered families.
  for(const [id,meta] of Object.entries(GRAPH_FAMILIES)){
    if(!G.FAMILY_META[id])G.FAMILY_META[id]={label:meta.label,strand:meta.strand,years:meta.years.slice(),visual:true};
    G.FAMILY_LABELS[id]=meta.label;
    if(Array.isArray(G.FAMILY_ORDER)&&!G.FAMILY_ORDER.includes(id))G.FAMILY_ORDER.push(id);
    if(Array.isArray(G.FAMILY_COMPACT_ORDER)&&!G.FAMILY_COMPACT_ORDER.includes(id))G.FAMILY_COMPACT_ORDER.push(id);
  }

  function q(kind,typeId,prompt,answer,key,visual,footprint='L',extra={}){
    return {kind,graphTypeId:typeId,prompt,answer,key:`${kind}:${typeId}:${key}`,visual,footprint,group:typeId,
      marking:extra.marking||{mode:'exact',answer},curriculum:extra.curriculum||null,...extra};
  }

  const BAR_CONTEXTS=[
    {title:'Favourite fruit',categories:['Apples','Bananas','Oranges','Pears'],yLabel:'Children',unit:'children'},
    {title:'Books borrowed',categories:['Monday','Tuesday','Wednesday','Thursday','Friday'],yLabel:'Books',unit:'books'},
    {title:'After-school clubs',categories:['Art','Chess','Coding','Sport'],yLabel:'Pupils',unit:'pupils'},
    {title:'Birds counted',categories:['Robins','Sparrows','Blackbirds','Finches'],yLabel:'Sightings',unit:'birds'},
    {title:'Recycling collected',categories:['Paper','Glass','Plastic','Metal'],yLabel:'Items',unit:'items'}
  ];
  function barData(i,year,opts={}){
    const c=clone(BAR_CONTEXTS[i%BAR_CONTEXTS.length]);
    const base=year<=3?[3,5,4,2,6]:[4,7,5,3,6];
    const step=year<=3?[2,5,10][i%3]:[5,10,20][i%3];
    let values=c.categories.map((_,j)=>(base[j%base.length]+((i+j)%2))*step);
    if(opts.equal&&values.length>=3)values[2]=values[1];
    if(opts.uniqueMax){values=values.map((v,j)=>v+j*step);values[values.length-2]+=3*step;}
    const ymax=Math.ceil((Math.max(...values)+step)/step)*step;
    return {...c,values,step,yMin:0,yMax:ymax};
  }
  function barVisual(d,opts={}){
    const series=opts.series||[{name:opts.seriesName||d.yLabel,values:d.values}];
    return {type:'bar',title:opts.title===undefined?d.title:opts.title,categories:d.categories,series,
      yLabel:opts.yLabel===undefined?d.yLabel:opts.yLabel,yMin:opts.yMin??d.yMin??0,yMax:opts.yMax??d.yMax,
      yStep:opts.yStep??d.step,hiddenBars:opts.hiddenBars||[],hideAllBars:!!opts.hideAllBars,
      showYLabels:opts.showYLabels!==false,showTitle:opts.showTitle!==false,showYLabel:opts.showYLabel!==false,
      table:opts.table||null,rawData:opts.rawData||null,threshold:opts.threshold??null,
      answerReveal:opts.answerReveal!==false,ordered:!!opts.ordered,signed:!!opts.signed,
      note:opts.note||'',orientation:opts.orientation||'vertical'};
  }

  function makeBarQuestion(typeId,i,year){
    const rng=rngFor(`bar:${typeId}:${year}:${i}`),d=barData(i,year,{uniqueMax:true});
    const n=d.categories.length,a=i%n,b=(i+2)%n;
    if(typeId==='bc_read_value')return q('bar_charts',typeId,`How many ${d.unit} does the bar for ${d.categories[a]} show?`,`${d.values[a]}`,`${i}`,barVisual(d),'M');
    if(typeId==='bc_identify_extreme'){
      const wantMax=i%2===0,idx=wantMax?d.values.indexOf(Math.max(...d.values)):d.values.indexOf(Math.min(...d.values));
      return q('bar_charts',typeId,`Which category has the ${wantMax?'greatest':'smallest'} value?`,d.categories[idx],`${i}`,barVisual(d),'M');
    }
    if(typeId==='bc_identify_equal_categories'){
      const e=barData(i,year,{equal:true});
      return q('bar_charts',typeId,'Which two categories have the same value?',`${e.categories[1]} and ${e.categories[2]}`,`${i}`,barVisual(e),'M');
    }
    if(typeId==='bc_total_frequency')return q('bar_charts',typeId,'How many are shown altogether?',`${sum(d.values)}`,`${i}`,barVisual(d),'M');
    if(typeId==='bc_compare_difference'){
      const hi=Math.max(d.values[a],d.values[b]),lo=Math.min(d.values[a],d.values[b]);
      return q('bar_charts',typeId,`What is the difference between ${d.categories[a]} and ${d.categories[b]}?`,`${hi-lo}`,`${i}`,barVisual(d),'M');
    }
    if(typeId==='bc_range')return q('bar_charts',typeId,'What is the difference between the greatest and smallest values?',`${Math.max(...d.values)-Math.min(...d.values)}`,`${i}`,barVisual(d),'M');
    if(typeId==='bc_construct_table_to_chart'){
      const table={headers:['Category',d.yLabel],rows:d.categories.map((c,j)=>[c,String(d.values[j])])};
      return q('bar_charts',typeId,'Use the table to complete the bar chart.','Completed chart shown.',`${i}`,barVisual(d,{hideAllBars:true,table}),'XL',{marking:{mode:'construction',answer:'Bars at the values shown in the table.'}});
    }
    if(typeId==='bc_construct_raw_to_chart'){
      const rd={...d,values:d.categories.map((_,j)=>[4,6,5,3,7][j]),step:1,yMin:0,yMax:8};
      const raw=[];rd.categories.forEach((c,j)=>{for(let k=0;k<rd.values[j];k++)raw.push(c);});
      return q('bar_charts',typeId,'Count the observations and draw a bar chart.','Completed chart shown.',`${i}`,barVisual(rd,{hideAllBars:true,rawData:shuffle(raw,rng)}),'XL',{marking:{mode:'construction',answer:'Correct frequency bars from the observations.'}});
    }
    if(typeId==='bc_complete_explicit_missing_bar'){
      const m=(i+1)%n,table={headers:['Category','Value'],rows:[[d.categories[m],String(d.values[m])]]};
      return q('bar_charts',typeId,`The ${d.categories[m]} bar is missing. Use the information shown to draw it.`,`${d.values[m]}`,`${i}`,barVisual(d,{hiddenBars:[m],table}),'L',{marking:{mode:'construction',answer:`Missing bar = ${d.values[m]}`}});
    }
    if(typeId==='bc_complete_from_total_relationships'){
      const m=(i+1)%n,total=sum(d.values),known=total-d.values[m];
      return q('bar_charts',typeId,`The total is ${total}. The shown bars total ${known}. What value should the missing ${d.categories[m]} bar have?`,`${d.values[m]}`,`${i}`,barVisual(d,{hiddenBars:[m]}),'L');
    }
    if(typeId==='bc_complete_multi_representation'){
      const m=(i+2)%n,table={headers:['Category','Value'],rows:d.categories.map((c,j)=>[c,j===m?String(d.values[j]):'shown on chart'])};
      return q('bar_charts',typeId,`Use the table and chart together to complete the missing ${d.categories[m]} bar.`,`${d.values[m]}`,`${i}`,barVisual(d,{hiddenBars:[m],table}),'L');
    }
    if(typeId==='bc_choose_or_complete_scale'){
      const table={headers:['Category',d.yLabel],rows:d.categories.map((c,j)=>[c,String(d.values[j])])};
      return q('bar_charts',typeId,'Choose a sensible equal scale for the vertical axis, then draw the bars.',`Suggested interval: ${d.step}`,`${i}`,barVisual(d,{hideAllBars:true,showYLabels:false,table}),'XL',{response:false,marking:{mode:'rubric',answer:`Any sensible uniform scale that fits the data; suggested ${d.step} per major division.`,rule:'Mark correct if the scale is uniform, sensible for the supplied data and all bars are plotted consistently.',criteria:['Equal intervals are used on the vertical axis.','The chosen scale includes every data value.','Bar heights match the table values.'],accept:`Different sensible intervals are acceptable; ${d.step} per major division is one valid choice.`}});
    }
    if(typeId==='bc_complete_labels_title'){
      return q('bar_charts',typeId,'What label should be written on the vertical axis?',d.yLabel,`${i}`,barVisual(d,{showYLabel:false}),'M');
    }
    if(typeId==='bc_complete_chart_and_table_bidirectional'){
      const m=(i+1)%n,table={headers:['Category','Value'],rows:d.categories.map((c,j)=>[c,j===m?'___':String(d.values[j])])};
      return q('bar_charts',typeId,`Use the chart to complete the missing value in the table for ${d.categories[m]}.`,`${d.values[m]}`,`${i}`,barVisual(d,{table}),'L');
    }
    if(typeId==='bc_filter_categories_by_condition'){
      const sorted=[...d.values].sort((x,y)=>x-y),threshold=sorted[Math.floor(sorted.length/2)],names=d.categories.filter((_,j)=>d.values[j]>=threshold);
      return q('bar_charts',typeId,`Which categories have a value of at least ${threshold}?`,names.join(', '),`${i}`,barVisual(d,{threshold}),'L',{marking:{mode:'set',answer:names}});
    }
    if(typeId==='bc_difference_to_reference_value'){
      const idx=a,target=Math.ceil((Math.max(...d.values)+d.step)/d.step)*d.step;
      return q('bar_charts',typeId,`${d.categories[idx]} has ${d.values[idx]}. How many more are needed to reach ${target}?`,`${target-d.values[idx]}`,`${i}`,barVisual(d,{threshold:target,yMax:target+d.step}),'L');
    }
    if(typeId==='bc_update_chart_with_new_data'){
      const idx=a,add=d.step,newValue=d.values[idx]+add,updated=clone(d);updated.values[idx]=newValue;updated.yMax=Math.max(d.yMax,newValue+d.step);
      const vis=barVisual(d,{note:`${add} more ${d.unit} are added to ${d.categories[idx]}.`});vis.answerSeries=barVisual(updated).series;
      return q('bar_charts',typeId,`${add} more ${d.unit} are added to ${d.categories[idx]}. What should its new bar value be?`,`${newValue}`,`${i}`,vis,'L');
    }
    if(typeId==='bc_compare_two_datasets'){
      const s1=d.values,s2=s1.map((v,j)=>Math.max(d.step,v+(j%2===0?d.step:-d.step)));
      const t1=sum(s1),t2=sum(s2),ans=t1===t2?'They are equal':t1>t2?`Group A by ${t1-t2}`:`Group B by ${t2-t1}`;
      return q('bar_charts',typeId,'Compare the totals for Group A and Group B. Which is greater, and by how much?',ans,`${i}`,barVisual(d,{series:[{name:'Group A',values:s1},{name:'Group B',values:s2}],yMax:Math.max(...s1,...s2)+d.step}),'L');
    }
    if(typeId==='bc_reasoning_multiplicative_claim'){
      const low=Math.min(...d.values),li=d.values.indexOf(low),hi=Math.max(...d.values),hii=d.values.indexOf(hi),twice=hi===2*low;
      return q('bar_charts',typeId,`${d.categories[hii]} has twice as many as ${d.categories[li]}. Is this statement correct? Explain.`,twice?'Yes.':'No.',`${i}`,barVisual(d),'L',{response:{kind:'explanation',size:'M',label:'Explain using values from the chart'},marking:{mode:'rubric',answer:`Compare ${hi} with twice ${low} (${2*low}).`,rule:'Mark correct only when the conclusion is supported by the chart values. Equivalent wording is acceptable.',criteria:[`States the correct conclusion: ${twice?'yes':'no'}.`,`Compares ${hi} with 2 × ${low} = ${2*low}.`]}});
    }
    if(typeId==='bc_decompose_group_total'){
      const idx=a,groupTotal=d.values[idx]+2*d.step,known=d.values[idx];
      return q('bar_charts',typeId,`${d.categories[idx]} has a total of ${groupTotal}. The chart shows ${known} in one part. How many are in the other part?`,`${groupTotal-known}`,`${i}`,barVisual(d),'M');
    }
    if(typeId==='bc_top_n_total'){
      const top=[...d.values].sort((x,y)=>y-x).slice(0,2);
      return q('bar_charts',typeId,'What is the total of the two greatest bars?',`${sum(top)}`,`${i}`,barVisual(d),'M');
    }
    if(typeId==='bc_sum_categories_by_condition'){
      const od={...d,categories:['Mon','Tue','Wed','Thu','Fri'],values:[2,4,3,6,5].map(v=>v*d.step),title:'Items collected each day',yLabel:'Items',unit:'items',yMax:7*d.step};
      return q('bar_charts',typeId,'How many items were collected from Wednesday to Friday altogether?',`${sum(od.values.slice(2))}`,`${i}`,barVisual(od,{ordered:true}),'M');
    }
    if(typeId==='bc_estimate_combined_values'){
      const ed={...d,values:d.values.map((v,j)=>v+(j%2?d.step/2:0)),yMax:d.yMax+d.step};
      const ans=ed.values[a]+ed.values[b];
      const best=Math.round(ans/d.step)*d.step,choices=[best-d.step,best,best+d.step,best+2*d.step].map(fmt),correctChoice=1;
      return q('bar_charts',typeId,`Which is the best estimate for the combined value of ${ed.categories[a]} and ${ed.categories[b]}?`,`B. ${choices[correctChoice]}`,`${i}`,barVisual(ed),'L',{choices,correctChoice,marking:{mode:'multiple-choice',answer:choices[correctChoice]}});
    }
    if(typeId.startsWith('bc_paired_series_')){
      const cats=d.categories,step=d.step,A=[4,7,5,6,3].slice(0,n).map(v=>v*step),B=[5,4,6,3,5].slice(0,n).map(v=>v*step);
      const vis=barVisual(d,{series:[{name:'Group A',values:A},{name:'Group B',values:B}],yMax:Math.max(...A,...B)+step});
      const diffs=A.map((v,j)=>Math.abs(v-B[j]));
      if(typeId==='bc_paired_series_exact_difference_category'){
        const idx=diffs.findIndex(v=>v===step)||0;return q('bar_charts',typeId,`At which category do Group A and Group B differ by ${step}?`,cats[idx],`${i}`,vis,'L');
      }
      if(typeId==='bc_paired_series_greatest_difference'){
        const m=Math.max(...diffs),idx=diffs.indexOf(m);return q('bar_charts',typeId,'At which category is the difference between the two groups greatest?',cats[idx],`${i}`,vis,'L');
      }
      if(typeId==='bc_paired_series_relation_filter'){
        const names=cats.filter((_,j)=>A[j]>B[j]);return q('bar_charts',typeId,'At which categories is Group A greater than Group B?',names.join(', '),`${i}`,vis,'L',{marking:{mode:'set',answer:names}});
      }
      if(typeId==='bc_paired_series_combined_category_total'){
        const idx=a;return q('bar_charts',typeId,`What is the combined total for ${cats[idx]}?`,`${A[idx]+B[idx]}`,`${i}`,vis,'L');
      }
      if(typeId==='bc_paired_series_aggregate_difference'){
        return q('bar_charts',typeId,'What is the difference between the overall totals for Group A and Group B?',`${Math.abs(sum(A)-sum(B))}`,`${i}`,vis,'L');
      }
    }
    if(typeId==='bc_interpret_ordered_trend'){
      const td={...d,categories:['Jan','Feb','Mar','Apr','May'],values:[2,3,5,6,8].map(v=>v*d.step),title:'Monthly total',yMax:9*d.step};
      return q('bar_charts',typeId,'Describe the overall trend from January to May.','The values increase overall.',`${i}`,barVisual(td,{ordered:true}),'M',{response:{kind:'short',size:'S',label:'Describe the trend'},marking:{mode:'rubric',answer:'The values increase overall.',rule:'Mark correct if the pupil identifies the overall direction of change. Equivalent wording is acceptable.',criteria:['States that the values increase/rise overall from January to May.']}});
    }
    return null;
  }

  function lineVisual(opts){
    return {type:'line',title:opts.title||'',xLabel:opts.xLabel||'Time',yLabel:opts.yLabel||'Value',
      xValues:opts.xValues||opts.series?.[0]?.values?.map((_,i)=>i)||[],xLabels:opts.xLabels||null,xTicks:opts.xTicks||null,xTickLabels:opts.xTickLabels||null,
      series:opts.series||[],yMin:opts.yMin??0,yMax:opts.yMax??100,yStep:opts.yStep??10,joinPoints:opts.joinPoints!==false,
      threshold:opts.threshold??null,segmentLabels:opts.segmentLabels||null,note:opts.note||'',showLegend:opts.showLegend!==false};
  }
  const TIME_LABELS=['9am','10am','11am','12pm','1pm','2pm','3pm'];
  function singleLineData(i,year){
    const variants=[
      {title:'Temperature during the day',yLabel:'Temperature (°C)',xLabel:'Time',xLabels:TIME_LABELS,values:[10,14,18,22,20,16,12],yMin:0,yMax:25,yStep:5,unit:'°C'},
      {title:'Visitors in a park',yLabel:'Visitors',xLabel:'Time',xLabels:TIME_LABELS,values:[80,120,180,240,200,150,100],yMin:0,yMax:250,yStep:50,unit:'visitors'},
      {title:'Water level',yLabel:'Water level (cm)',xLabel:'Time',xLabels:TIME_LABELS,values:[20,28,36,42,36,28,20],yMin:0,yMax:45,yStep:5,unit:'cm'},
      {title:'Plant height',yLabel:'Height (cm)',xLabel:'Week',xLabels:['1','2','3','4','5','6','7'],values:[8,11,15,18,22,25,29],yMin:0,yMax:30,yStep:5,unit:'cm'}
    ];
    const d=clone(variants[i%variants.length]);d.xValues=d.values.map((_,j)=>j);return d;
  }
  function makeLineQuestion(kind,typeId,i,year){
    const d=singleLineData(i,year),n=d.values.length,a=1+(i%(n-3)),b=a+2;
    const vis=()=>lineVisual({title:d.title,yLabel:d.yLabel,xLabel:d.xLabel,xValues:d.xValues,xLabels:d.xLabels,series:[{name:d.yLabel,values:d.values}],yMin:d.yMin,yMax:d.yMax,yStep:d.yStep,showLegend:false});
    if(typeId==='lg_read_approx_value_at_x')return q(kind,typeId,`What value does the graph show at ${d.xLabels[a]}?`,`${d.values[a]}${d.unit==='visitors'?'':` ${d.unit}`}`,`${i}`,vis(),'M');
    if(typeId==='lg_compare_difference_two_points')return q(kind,typeId,`What is the difference between the values at ${d.xLabels[a]} and ${d.xLabels[b]}?`,`${Math.abs(d.values[b]-d.values[a])}`,`${i}`,vis(),'M');
    if(typeId==='lg_range_high_low')return q(kind,typeId,'What is the difference between the highest and lowest values shown?',`${Math.max(...d.values)-Math.min(...d.values)}`,`${i}`,vis(),'M');
    if(typeId==='lg_find_x_of_extreme'){
      const idx=d.values.indexOf(Math.max(...d.values));return q(kind,typeId,'When is the graph at its highest value?',d.xLabels[idx],`${i}`,vis(),'M');
    }
    if(typeId==='lg_reverse_lookup_x_for_value'){
      const idx=d.values.findIndex((value,j)=>d.values.indexOf(value)===j&&d.values.lastIndexOf(value)===j),safeIdx=idx>=0?idx:d.values.indexOf(Math.max(...d.values)),target=d.values[safeIdx];return q(kind,typeId,`At what time/position is the value ${target}?`,d.xLabels[safeIdx],`${i}`,vis(),'M');
    }
    if(typeId==='lg_apply_text_change_to_graph_value'){
      const delta=d.yStep,answer=d.values[a]-delta;return q(kind,typeId,`At ${d.xLabels[a]} the graph shows ${d.values[a]}. Later the value was ${delta} lower. What was the later value?`,`${answer}`,`${i}`,vis(),'M');
    }
    if(typeId==='lg_duration_between_y_levels'){
      const dd={title:'Height of a balloon',yLabel:'Height (m)',xLabel:'Minutes',xValues:[0,1,2,3,4,5,6],xLabels:['0','1','2','3','4','5','6'],values:[0,15,30,45,60,70,75],yMin:0,yMax:80,yStep:10};
      return q(kind,typeId,'How long did it take the balloon to rise from 30 m to 60 m?','2 minutes',`${i}`,lineVisual({...dd,series:[{name:'Height',values:dd.values}],showLegend:false}),'M');
    }
    if(typeId==='lg_first_reach_or_cross_threshold'){
      const dd={title:'Population of a town',yLabel:'Population (thousands)',xLabel:'Year',xValues:[2000,2005,2010,2015,2020],xLabels:['2000','2005','2010','2015','2020'],values:[260,310,360,410,470],yMin:200,yMax:500,yStep:50};
      return q(kind,typeId,'In which year did the population first reach or exceed 400,000?','2015',`${i}`,lineVisual({...dd,series:[{name:'Population',values:dd.values}],threshold:400,showLegend:false}),'L');
    }
    if(typeId==='lg_interpolate_between_points'){
      const x=[0,2,4,6],vals=[12,16,22,28];
      const choices=['16 °C','19 °C','22 °C','25 °C'],correctChoice=1;
      return q(kind,typeId,'Between 2 and 4 minutes the temperature rose steadily. Which is the best estimate for the temperature at 3 minutes?',`B. ${choices[correctChoice]}`,`${i}`,lineVisual({title:'Water temperature',xLabel:'Minutes',yLabel:'Temperature (°C)',xValues:x,xLabels:x.map(String),xTicks:[0,1,2,3,4,5,6],xTickLabels:['0','1','2','3','4','5','6'],series:[{name:'Temperature',values:vals}],yMin:10,yMax:30,yStep:5,showLegend:false}),'L',{choices,correctChoice,marking:{mode:'multiple-choice',answer:choices[correctChoice]}});
    }
    if(typeId==='lg_round_change_between_points'){
      const dd={...d,values:[12.4,14.1,16.8,19.7,22.6,25.3,27.8],yMin:10,yMax:30,yStep:5,title:'Plant height',yLabel:'Height (cm)',xLabel:'Week',xLabels:['1','2','3','4','5','6','7']};
      const ans=Math.round(dd.values[5]-dd.values[1]);return q(kind,typeId,'How much did the plant grow from week 2 to week 6? Give your answer to the nearest centimetre.',`${ans} cm`,`${i}`,lineVisual({...dd,xValues:dd.values.map((_,j)=>j),series:[{name:'Height',values:dd.values}],showLegend:false}),'L');
    }
    if(typeId==='lg_identify_stationary_interval'){
      const vals=[0,2,4,4,6,8,10],labels=['9:00','9:30','10:00','10:30','11:00','11:30','12:00'];
      return q(kind,typeId,'During which 30-minute interval was the walker stationary?','10:00-10:30',`${i}`,lineVisual({title:'Distance walked',xLabel:'Time',yLabel:'Distance (km)',xValues:vals.map((_,j)=>j),xLabels:labels,series:[{name:'Distance',values:vals}],yMin:0,yMax:10,yStep:2,showLegend:false}),'M');
    }
    if(typeId==='lg_difference_between_event_defined_points'){
      const vals=[0,2,4,4,6,8,8,10],labels=['9:00','9:20','9:40','10:00','10:20','10:40','11:00','11:20'];
      return q(kind,typeId,'Two flat sections show breaks. How far was travelled between the end of the first break and the start of the second break?','4 km',`${i}`,lineVisual({title:'Distance walked with two breaks',xLabel:'Time',yLabel:'Distance (km)',xValues:vals.map((_,j)=>j),xLabels:labels,series:[{name:'Distance',values:vals}],yMin:0,yMax:10,yStep:2,showLegend:false}),'L');
    }
    if(typeId==='lg_find_other_x_same_y'){
      const vals=[20,28,36,42,36,28,20];
      return q(kind,typeId,'The value at 11am occurs again later. At what time is the value the same?','1pm',`${i}`,lineVisual({title:'Water level',xLabel:'Time',yLabel:'Water level (cm)',xValues:vals.map((_,j)=>j),xLabels:TIME_LABELS,series:[{name:'Level',values:vals}],yMin:15,yMax:45,yStep:5,showLegend:false}),'M');
    }
    if(typeId==='lg_duration_above_or_below_threshold'){
      const vals=[85,76,68,60,53,47,42,38],xs=[0,5,10,15,20,25,30,35];
      const choices=['5 minutes','10 minutes','15 minutes','25 minutes'],correctChoice=2;
      return q(kind,typeId,'Which is the best estimate for how long the drink was above 60 °C?',`C. ${choices[correctChoice]}`,`${i}`,lineVisual({title:'Cooling drink',xLabel:'Minutes',yLabel:'Temperature (°C)',xValues:xs,xLabels:xs.map(String),series:[{name:'Temperature',values:vals}],yMin:35,yMax:90,yStep:10,threshold:60,showLegend:false}),'L',{choices,correctChoice,marking:{mode:'multiple-choice',answer:choices[correctChoice]}});
    }
    if(typeId==='lg_greatest_change_interval'){
      const vals=[5,9,18,21,25,27],labs=['W1','W2','W3','W4','W5','W6'],changes=vals.slice(1).map((v,j)=>v-vals[j]),m=Math.max(...changes),idx=changes.indexOf(m);
      return q(kind,typeId,'During which interval did the value increase the most?',`${labs[idx]} to ${labs[idx+1]}`,`${i}`,lineVisual({title:'Points over six weeks',xLabel:'Week',yLabel:'Points',xValues:vals.map((_,j)=>j),xLabels:labs,series:[{name:'Points',values:vals}],yMin:0,yMax:30,yStep:5,showLegend:false}),'M');
    }
    if(typeId==='lg_explain_compare_interval_changes'){
      const vals=[0,18,30,45];
      return q(kind,typeId,'Sam says, “The cyclist travelled farther in the first hour than in the second hour.” Is Sam correct? Explain using values from the graph.','Yes: 18 km in the first hour and 12 km in the second.',`${i}`,lineVisual({title:'Distance cycled',xLabel:'Time',yLabel:'Distance (km)',xValues:[0,1,2,3],xLabels:['0h','1h','2h','3h'],series:[{name:'Distance',values:vals}],yMin:0,yMax:50,yStep:10,showLegend:false}),'L',{response:{kind:'explanation',size:'M',label:'Explain using values from the graph'},marking:{mode:'rubric',answer:'Yes: 18 km in the first hour and 12 km in the second.',rule:'Mark correct only when the conclusion is supported by both interval values. Equivalent wording is acceptable.',criteria:['States that Sam is correct.','Uses 18 km for the first hour and 12 km for the second hour (or equivalent differences from the graph).']}});
    }
    if(typeId==='lg_count_x_positions_by_condition'){
      const vals=[12,18,9,15,21,14,7],labs=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],lo=10,hi=20,count=vals.filter(v=>v>=lo&&v<=hi).length;
      return q(kind,typeId,`How many days had a temperature from ${lo} °C to ${hi} °C inclusive?`,`${count}`,`${i}`,lineVisual({title:'Daily temperatures',xLabel:'Day',yLabel:'Temperature (°C)',xValues:vals.map((_,j)=>j),xLabels:labs,series:[{name:'Temperature',values:vals}],yMin:0,yMax:25,yStep:5,joinPoints:false,showLegend:false}),'L');
    }
    if(typeId==='lg_two_series_compare_at_x'||typeId==='lg_find_x_for_series_difference'||typeId==='lg_sum_series_at_x'||typeId==='lg_two_series_inverse_total'||typeId==='lg_multi_series_compare_interval_changes'||typeId==='lg_multi_series_sum_interval_changes'||typeId==='lg_count_intervals_with_exact_change'||typeId==='lg_multiplicative_reference_reverse_lookup'){
      const labs=['W1','W2','W3','W4','W5','W6'],xs=[0,1,2,3,4,5],A=[4,8,11,15,18,22],B=[3,7,12,14,20,23],C=[2,5,9,13,17,21];
      const mvis=lineVisual({title:'Team points',xLabel:'Week',yLabel:'Points',xValues:xs,xLabels:labs,series:[{name:'Team A',values:A},{name:'Team B',values:B},{name:'Team C',values:C}],yMin:0,yMax:25,yStep:5});
      if(typeId==='lg_two_series_compare_at_x'){const idx=4;return q(kind,typeId,`At ${labs[idx]}, what is the difference between Team A and Team B?`,`${Math.abs(A[idx]-B[idx])}`,`${i}`,mvis,'L');}
      if(typeId==='lg_find_x_for_series_difference'){const dif=A.map((v,j)=>Math.abs(v-B[j])),target=Math.max(...dif),idx=dif.indexOf(target);return q(kind,typeId,`At which week is the difference between Team A and Team B ${target} point${target===1?'':'s'}?`,labs[idx],`${i}`,mvis,'L');}
      if(typeId==='lg_sum_series_at_x'){const idx=3;return q(kind,typeId,`What is the total of all three teams at ${labs[idx]}?`,`${A[idx]+B[idx]+C[idx]}`,`${i}`,mvis,'L');}
      if(typeId==='lg_two_series_inverse_total'){const totals=A.map((v,j)=>v+B[j]),idx=2,target=totals[idx];return q(kind,typeId,`At which week do Team A and Team B have a combined total of ${target}?`,labs[idx],`${i}`,mvis,'L');}
      if(typeId==='lg_multi_series_compare_interval_changes'){const j=3,da=A[j+1]-A[j],db=B[j+1]-B[j];return q(kind,typeId,`From ${labs[j]} to ${labs[j+1]}, how many more points did Team B gain than Team A?`,`${db-da}`,`${i}`,mvis,'L');}
      if(typeId==='lg_multi_series_sum_interval_changes'){const j=2,ans=(A[j+1]-A[j])+(B[j+1]-B[j])+(C[j+1]-C[j]);return q(kind,typeId,`How many points did the three teams gain altogether from ${labs[j]} to ${labs[j+1]}?`,`${ans}`,`${i}`,mvis,'L');}
      if(typeId==='lg_count_intervals_with_exact_change'){const changes=A.slice(1).map((v,j)=>v-A[j]),target=4,count=changes.filter(v=>v===target).length;return q(kind,typeId,`In how many weeks did Team A gain exactly ${target} points from the previous week?`,`${count}`,`${i}`,mvis,'L');}
      if(typeId==='lg_multiplicative_reference_reverse_lookup'){const idx=0,target=A[idx]*2,match=A.indexOf(target);return q(kind,typeId,`Team A had ${A[idx]} points at ${labs[idx]}. At which week did it first have twice that many points?`,match>=0?labs[match]:'No week shown',`${i}`,mvis,'L');}
    }
    if(typeId==='lg_match_segment_rate_description'){
      const xs=[0,10,20,30,40],vals=[0,4,4,10,14],labs=['0','10','20','30','40'];
      return q(kind,typeId,'Which labelled section shows no change in distance?','B-C',`${i}`,lineVisual({title:'Bike ride',xLabel:'Minutes',yLabel:'Distance (km)',xValues:xs,xLabels:labs,series:[{name:'Distance',values:vals}],yMin:0,yMax:15,yStep:5,segmentLabels:['A-B','B-C','C-D','D-E'],showLegend:false}),'L');
    }
    return null;
  }

  const IMPLEMENTED_BAR=new Set([
    'bc_construct_raw_to_chart','bc_construct_table_to_chart','bc_complete_explicit_missing_bar','bc_complete_from_total_relationships','bc_complete_multi_representation',
    'bc_read_value','bc_identify_extreme','bc_identify_equal_categories','bc_total_frequency','bc_compare_difference','bc_range','bc_reasoning_multiplicative_claim',
    'bc_compare_two_datasets','bc_choose_or_complete_scale','bc_complete_labels_title','bc_complete_chart_and_table_bidirectional','bc_filter_categories_by_condition',
    'bc_decompose_group_total','bc_top_n_total','bc_difference_to_reference_value','bc_sum_categories_by_condition','bc_update_chart_with_new_data','bc_estimate_combined_values',
    'bc_paired_series_exact_difference_category','bc_paired_series_greatest_difference','bc_paired_series_relation_filter','bc_paired_series_combined_category_total',
    'bc_paired_series_aggregate_difference','bc_interpret_ordered_trend'
  ]);
  const IMPLEMENTED_LINE=new Set([
    'lg_range_high_low','lg_compare_difference_two_points','lg_interpolate_between_points','lg_read_approx_value_at_x','lg_reverse_lookup_x_for_value',
    'lg_apply_text_change_to_graph_value','lg_duration_between_y_levels','lg_first_reach_or_cross_threshold','lg_find_x_of_extreme','lg_two_series_compare_at_x',
    'lg_two_series_inverse_total','lg_round_change_between_points','lg_duration_above_or_below_threshold','lg_identify_stationary_interval','lg_difference_between_event_defined_points',
    'lg_find_other_x_same_y','lg_explain_compare_interval_changes','lg_greatest_change_interval','lg_count_intervals_with_exact_change','lg_multi_series_compare_interval_changes',
    'lg_multi_series_sum_interval_changes','lg_find_x_for_series_difference','lg_multiplicative_reference_reverse_lookup','lg_count_x_positions_by_condition','lg_sum_series_at_x','lg_match_segment_rate_description'
  ]);

  function allowedTypes(kind,year){
    year=Number(year)||({bar_charts:4,time_graphs:4,line_graphs:5}[kind]);
    const ids=ELIGIBLE[kind]?.[String(year)]||[];
    const implemented=kind==='bar_charts'?IMPLEMENTED_BAR:IMPLEMENTED_LINE;
    return ids.filter(id=>implemented.has(id));
  }
  function graphPool(kind,rules={}){
    const year=Number(rules.curriculumYear)||({bar_charts:4,time_graphs:4,line_graphs:5}[kind]);
    const types=allowedTypes(kind,year),out=[];
    for(const typeId of types){
      for(let i=0;i<4;i++){
        const item=kind==='bar_charts'?makeBarQuestion(typeId,i,year):makeLineQuestion(kind,typeId,i,year);
        if(item)out.push(item);
      }
    }
    return out;
  }

  // --- Generator integration -------------------------------------------------
  const original={
    generateQuestions:G.generateQuestions.bind(G),
    questionPool:G.questionPool.bind(G),
    questionByKey:G.questionByKey.bind(G),
    questionPoolIndex:G.questionPoolIndex.bind(G),
    questionByPoolIndex:G.questionByPoolIndex.bind(G),
    replaceQuestion:G.replaceQuestion.bind(G)
  };
  function balancedPick(pool,count,rng,rules){
    if(!pool.length||count<=0)return[];
    const chosen=[],groups=new Map();
    for(const item of pool){const key=item.group||'__all';if(!groups.has(key))groups.set(key,[]);groups.get(key).push(item);}
    let keys=shuffle([...groups.keys()],rng);for(const k of keys)groups.set(k,shuffle(groups.get(k),rng));
    const offsets=Object.fromEntries(keys.map(k=>[k,0]));let guard=0,seen=new Set();
    while(chosen.length<count&&guard<count*100+1000){guard++;let progress=false;for(const k of shuffle(keys,rng)){
      const arr=groups.get(k);if(!arr.length)continue;let tries=0;while(tries<arr.length){const item=arr[offsets[k]%arr.length];offsets[k]++;tries++;
        if(rules?.avoidExactDuplicates!==false&&seen.has(item.key))continue;chosen.push(clone(item));seen.add(item.key);progress=true;break;}
      if(chosen.length>=count)break;
    }if(!progress){seen.clear();for(const k of keys)groups.set(k,shuffle(groups.get(k),rng));}}
    return chosen.slice(0,count);
  }
  function weightedCounts(rules,rng){
    const bag=[];for(const f of rules.families){const w=Math.max(1,Number(rules.familyWeights?.[f])||1);for(let i=0;i<w;i++)bag.push(f);}
    const cycle=shuffle(bag,rng),counts=Object.fromEntries(rules.families.map(f=>[f,0]));
    for(let i=0;i<rules.questionCount;i++)counts[cycle[i%cycle.length]]++;
    return counts;
  }
  G.questionPool=function(kind,rules){if(isGraphKind(kind))return graphPool(kind,G.normalizeRules(rules));return original.questionPool(kind,rules);};
  G.questionByKey=function(kind,rules,key){if(!isGraphKind(kind))return original.questionByKey(kind,rules,key);const found=G.questionPool(kind,rules).find(x=>x.key===key);return found?clone(found):null;};
  G.questionPoolIndex=function(kind,rules,key){if(!isGraphKind(kind))return original.questionPoolIndex(kind,rules,key);return G.questionPool(kind,rules).findIndex(x=>x.key===key);};
  G.questionByPoolIndex=function(kind,rules,index){if(!isGraphKind(kind))return original.questionByPoolIndex(kind,rules,index);const pool=G.questionPool(kind,rules),i=Number(index);return Number.isInteger(i)&&i>=0&&i<pool.length?clone(pool[i]):null;};
  G.generateQuestions=function(inputRules,seed){
    const rules=G.normalizeRules(inputRules);
    if(rules.mode!=='family_mix'||!hasGraphFamily(rules))return original.generateQuestions(inputRules,seed);
    const rng=rngFor(seed||'CUSTOM'),counts=weightedCounts(rules,rng);let out=[];
    for(const family of rules.families){const count=counts[family]||0;if(!count)continue;const pool=G.questionPool(family,rules);out=out.concat(balancedPick(pool,count,rng,rules));}
    return shuffle(out,rng).map((item,idx)=>({...item,number:idx+1}));
  };
  G.replaceQuestion=function(questions,index,inputRules,seed){
    const current=questions?.[index];if(!current||!isGraphKind(current.kind))return original.replaceQuestion(questions,index,inputRules,seed);
    const rules=G.normalizeRules(inputRules),pool=G.questionPool(current.kind,rules).filter(x=>x.graphTypeId===current.graphTypeId&&x.key!==current.key);
    if(!pool.length)return questions.slice();const used=new Set(questions.filter((_,j)=>j!==index).map(x=>x.key));let candidates=pool.filter(x=>!used.has(x.key));if(!candidates.length)candidates=pool;
    const rng=rngFor(String(seed||'')+':graph-replacement'),chosen=shuffle(candidates,rng)[0],out=questions.slice();out[index]={...clone(chosen),number:index+1};return out;
  };

  // --- Shared visual layout --------------------------------------------------
  function footprintHeight(item,answers,orientation){
    const landscape=orientation==='landscape';
    const responseBonus=answers?0:responseHeight(item,orientation),teacherBonus=answers?markingGuidanceHeight(item,orientation):0;
    if(!item?.visual)return (answers?(landscape?27:31):(landscape?30:34))+responseBonus+teacherBonus;
    const fp=item.footprint||'L',v=item.visual;
    const map=landscape
      ? (answers?{M:112,L:145,XL:255}:{M:135,L:175,XL:335})
      : (answers?{M:145,L:190,XL:355}:{M:190,L:260,XL:545});

    // Most visual families have compact fixed-size tables, so retain the established
    // 34 pt allowance for them. Pie-chart tables vary much more (and may switch to an
    // answer table), therefore reserve the height actually consumed by the pie renderer.
    const activeTable=answers&&v.answerTable?v.answerTable:v.table;
    const pieTableRows=v.type==='pie'&&activeTable?.rows?.length
      ? activeTable.rows.length+(activeTable.headers?.length?1:0)
      :0;
    const tableBonus=v.type==='pie'
      ? (pieTableRows?pieTableRows*14+5:0)
      : (v.table||v.rawData?34:0);
    // Multiple-choice visual questions reserve their own answer-option rows so the
    // graph/diagram itself never has to shrink to make room for choices.
    const choiceRows=Array.isArray(item?.choices)&&item.choices.length?Math.ceil(item.choices.length/2):0;
    const choiceBonus=choiceRows?choiceRows*14+5:0;

    if(v.type==='angle'){
      const els=[...(v.elements||[]),...(v.answerElements||[]).flat(Infinity)],hasProtractor=els.some(e=>e?.kind==='protractor'),multiAngle=els.filter(e=>e?.kind==='angle').length>=3||els.filter(e=>e?.kind==='line').length>=4,turnLike=String(v.visualClass||'')==='turn';
      const base=(map[fp]||map.L),protect=hasProtractor?(landscape?90:125):multiAngle?(landscape?34:52):turnLike?(landscape?24:34):(landscape?20:30);
      return base+protect+tableBonus+choiceBonus+responseBonus+teacherBonus;
    }
    if(v.type!=='pie')return (map[fp]||map.L)+tableBonus+choiceBonus+responseBonus+teacherBonus;

    // Pie charts need a protected drawing area. Without this, M footprints and
    // statement/table questions can compress the circle until labels and sectors are
    // technically present but too small to read. Keep the extra space local to pies.
    const pies=Array.isArray(v.pies)?v.pies:[],maxSectors=Math.max(0,...pies.map(p=>p?.sectors?.length||0));
    const statementBonus=Array.isArray(v.statements)&&v.statements.length?v.statements.length*10+4:0;
    const breathingRoom=fp==='XL'?0:(fp==='M'?(landscape?38:35):(landscape?34:25));
    const sectorBonus=maxSectors>=5?(landscape?10:12):0;
    const multiPieBonus=pies.length>1?(landscape?10:12):0;
    const answerBonus=answers&&fp!=='XL'?(fp==='M'?(landscape?20:24):(landscape?14:16)):0;
    return (map[fp]||map.L)+tableBonus+statementBonus+breathingRoom+sectorBonus+multiPieBonus+answerBonus+choiceBonus+responseBonus+teacherBonus;
  }
  function packQuestions(questions,answers,orientation,firstCapacity,nextCapacity){
    const pages=[];let page=[],used=0,cap=firstCapacity;
    for(const item of questions){const h=footprintHeight(item,answers,orientation);if(page.length&&used+h>cap){pages.push(page);page=[];used=0;cap=nextCapacity;}page.push(item);used+=h;}
    if(page.length||!pages.length)pages.push(page);return pages;
  }
  function wrapLines(text,maxWidth,size,bold=false){
    const words=String(text||'').split(/\s+/).filter(Boolean),lines=[];let line='';
    const width=t=>P?.estimateTextWidth?P.estimateTextWidth(t,size,bold):t.length*size*.53;
    for(const word of words){const test=line?`${line} ${word}`:word;if(!line||width(test)<=maxWidth)line=test;else{lines.push(line);line=word;}}
    if(line)lines.push(line);return lines;
  }

  // --- Response-space and marking contract ---------------------------------
  // Custom Worksheet questions may explicitly provide `response`, but the
  // compositor also recognises common explanation/working verbs so future
  // modules cannot accidentally ask for reasoning and leave only a tiny line.
  // `response:false` is an explicit opt-out for construction tasks where the
  // diagram itself is the pupil response area.
  function responseSpec(item){
    if(!item||item.response===false)return null;
    if(item.response&&typeof item.response==='object')return {...item.response};
    if(Array.isArray(item.choices)&&item.choices.length)return null;
    const prompt=String(item.prompt||'');
    if(/show\s+(?:your\s+)?(?:working|method|calculation)|show\s+a\s+(?:calculation|proportion)/i.test(prompt))return {kind:'working',size:'M',label:'Show your working / reasoning'};
    if(/\b(?:explain|justify|give\s+(?:a|your)\s+(?:mathematical\s+)?reason|how do you know)\b/i.test(prompt))return {kind:'explanation',size:'M',label:'Explain your reasoning'};
    if(/\bdescribe\b/i.test(prompt))return {kind:'short',size:'S',label:'Write your answer'};
    if(item.marking?.mode==='rubric')return {kind:'reasoning',size:'S',label:'Write your reasoning'};
    return null;
  }
  function responseHeight(item,orientation){
    const r=responseSpec(item);if(!r)return 0;const landscape=orientation==='landscape',size=String(r.size||'M').toUpperCase();
    const map=landscape?{S:34,M:49,L:70}:{S:38,M:56,L:82};return map[size]||map.M;
  }
  function markingGuidanceLines(item,maxWidth){
    const m=item?.marking||{},out=[];
    if(m.mode==='rubric'){
      const criteria=Array.isArray(m.criteria)?m.criteria.filter(Boolean):[];
      if(m.rule)out.push(...wrapLines(String(m.rule),maxWidth,6.4,true));
      else out.push('Mark correct when the required mathematical idea(s) are clear. Equivalent wording is acceptable.');
      if(criteria.length)for(const c of criteria)out.push(...wrapLines(`- ${c}`,maxWidth,6.35,false));
      else if(m.answer)out.push(...wrapLines(`• ${m.answer}`,maxWidth,6.35,false));
      if(m.accept)out.push(...wrapLines(`Accept: ${m.accept}`,maxWidth,6.25,false));
    }else if(m.mode==='measure-angle'||Number.isFinite(Number(m.toleranceDeg))){
      const tol=Number(m.toleranceDeg),range=Array.isArray(m.acceptedRange)?m.acceptedRange:null;
      const text=range&&range.length>=2?`Accept ${range[0]}°–${range[1]}° (±${tol}°).`:`Accept answers within ±${tol}° of ${m.answer}.`;
      out.push(text);
    }else if(m.guidance){out.push(...wrapLines(String(m.guidance),maxWidth,6.35,false));}
    return out;
  }
  function markingGuidanceHeight(item,orientation){
    const maxWidth=orientation==='landscape'?730:485,lines=markingGuidanceLines(item,maxWidth);return lines.length?26+lines.length*8:0;
  }
  function drawResponseFrame(C,item,x,y,w,h){
    const r=responseSpec(item);if(!r||h<=0)return;
    const ink=[74,88,94],line=[190,202,207],rule=[226,232,234],fill=[250,252,252],label=String(r.label||'Show your reasoning');
    C.rect(x,y+3,w,Math.max(18,h-7),{fill,stroke:line,width:.55});C.text(x+7,y+14,label,6.4,{bold:true,color:ink});
    if(r.kind!=='working'){
      const usable=Math.max(0,h-24),rows=Math.max(1,Math.floor(usable/13));
      for(let j=0;j<rows;j++){const yy=y+24+j*13;if(yy<y+h-6)C.line(x+7,yy,x+w-7,yy,{color:rule,width:.35});}
    }
  }
  function drawMarkingGuidance(C,item,x,y,w,h){
    const lines=markingGuidanceLines(item,w-14);if(!lines.length||h<=0)return;
    C.rect(x,y+2,w,Math.max(16,h-4),{fill:[244,249,248],stroke:[187,211,207],width:.5});C.text(x+7,y+12,'Marking guide',6.4,{bold:true,color:[15,118,110]});
    let yy=y+22;for(const line of lines){if(yy>y+h-5)break;C.text(x+7,yy,line,6.25,{color:[56,73,78]});yy+=8;}
  }
  function displayYear(value){const v=String(value||'').trim();if(!v)return'';return/^year\b/i.test(v)?v:`Year ${v}`;}
  function displayClass(value){const v=String(value||'').trim();if(!v)return'';return/^class\b/i.test(v)?v:`Class ${v}`;}
  function formatDate(iso){if(!iso)return'';const p=String(iso).split('-').map(Number);if(p.length!==3||!p.every(Number.isFinite))return String(iso);return `${p[2]} ${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][p[1]-1]} ${p[0]}`;}
  function metaText(s){return[displayYear(s.yearGroup),displayClass(s.className),String(s.teacherName||'').trim(),formatDate(s.worksheetDate)].filter(Boolean).join(' · ');}

  function drawTable(C,x,y,w,table){
    if(!table?.rows?.length)return y;const cols=table.headers?.length||table.rows[0].length,cw=w/cols,rowH=15,rows=[table.headers||Array(cols).fill(''),...table.rows];
    rows.forEach((row,r)=>{row.forEach((cell,c)=>{C.rect(x+c*cw,y+r*rowH,cw,rowH,{fill:r===0?[241,247,246]:null,stroke:[205,215,218],width:.45});C.text(x+c*cw+4,y+r*rowH+10,String(cell),7.2,{bold:r===0,color:[45,61,67]});});});
    return y+rows.length*rowH+6;
  }
  function drawRawData(C,x,y,w,raw){
    const text=`Observations: ${raw.join(', ')}`,lines=wrapLines(text,w,7.2,false);for(const line of lines.slice(0,3)){C.text(x,y,line,7.2,{color:[70,83,88]});y+=10;}return y+4;
  }
  function renderBar(C,x,y,w,h,v,answers){
    let top=y;if(v.table)top=drawTable(C,x,top,w,v.table);if(v.rawData)top=drawRawData(C,x,top,w,v.rawData);if(v.note){C.text(x,top,v.note,7.2,{color:[90,93,98]});top+=12;}
    const gh=Math.max(68,h-(top-y)),left=x+50,right=x+w-10,plotTop=top+14,plotBottom=y+h-28,plotH=Math.max(40,plotBottom-plotTop),plotW=Math.max(80,right-left);
    const yMin=Number(v.yMin??0),yMax=Number(v.yMax??100),step=Number(v.yStep||10),yp=val=>plotBottom-(Number(val)-yMin)/(yMax-yMin||1)*plotH;
    C.text((left+right)/2,top+7,v.showTitle===false?'':v.title,8.4,{bold:true,align:'center',color:[35,55,60]});
    for(let t=Math.ceil(yMin/step)*step;t<=yMax+.0001;t+=step){const yy=yp(t);C.line(left,yy,right,yy,{color:[224,230,232],width:.45});if(v.showYLabels!==false)C.text(left-5,yy+2,fmt(t),6.6,{align:'right',color:[90,102,108]});}
    const zero=clamp(yp(0),plotTop,plotBottom);C.line(left,zero,right,zero,{color:[70,80,85],width:.7});C.line(left,plotTop,left,plotBottom,{color:[70,80,85],width:.7});
    if(v.threshold!=null&&Number(v.threshold)<=yMax){const ty=yp(v.threshold);C.line(left,ty,right,ty,{color:[160,100,80],width:.9});}
    const cats=v.categories||[],series=answers&&v.answerSeries?v.answerSeries:v.series||[],groupW=plotW/Math.max(1,cats.length),usable=groupW*.68,barW=usable/Math.max(1,series.length);
    const fills=(global.TT99VisualPalette||VISUAL_PALETTE).series;
    cats.forEach((cat,j)=>{
      series.forEach((s,k)=>{const hidden=!answers&&(v.hideAllBars||v.hiddenBars?.includes(j));if(hidden)return;const val=Number(s.values[j]||0),yy=yp(val),bx=left+j*groupW+(groupW-usable)/2+k*barW+1,bw=Math.max(3,barW-2),bt=Math.min(zero,yy),bh=Math.max(1,Math.abs(zero-yy)),fill=series.length===1?fills[j%fills.length]:fills[k%fills.length];C.rect(bx,bt,bw,bh,{fill,stroke:[60,78,82],width:.4});});
      C.text(left+j*groupW+groupW/2,plotBottom+12,String(cat),6.5,{align:'center',color:[60,72,78]});
    });
    if(v.showYLabel!==false&&v.yLabel)C.text(x+9,(plotTop+plotBottom)/2,v.yLabel,6.7,{bold:true,align:'center',rotate:-90,color:[75,88,92]});
    if(series.length>1){let lx=right-95;series.forEach((s,k)=>{C.rect(lx,top+1+k*10,7,7,{fill:fills[k%fills.length]});C.text(lx+10,top+7+k*10,s.name,6.5,{color:[55,65,70]});});}
  }
  function renderLine(C,x,y,w,h,v,answers){
    if(v.note){C.text(x,y,v.note,7.2,{color:[90,93,98]});y+=12;h-=12;}
    const left=x+52,right=x+w-10,plotTop=y+21,plotBottom=y+h-29,plotH=Math.max(45,plotBottom-plotTop),plotW=Math.max(80,right-left);
    const xs=v.xValues||[],xMin=Math.min(...xs),xMax=Math.max(...xs),xp=val=>left+(Number(val)-xMin)/(xMax-xMin||1)*plotW;
    const yMin=Number(v.yMin??0),yMax=Number(v.yMax??100),step=Number(v.yStep||10),yp=val=>plotBottom-(Number(val)-yMin)/(yMax-yMin||1)*plotH;
    C.text((left+right)/2,y+9,v.title,8.4,{bold:true,align:'center',color:[35,55,60]});
    for(let t=Math.ceil(yMin/step)*step;t<=yMax+.0001;t+=step){const yy=yp(t);C.line(left,yy,right,yy,{color:[224,230,232],width:.45});C.text(left-5,yy+2,fmt(t),6.4,{align:'right',color:[90,102,108]});}
    C.line(left,plotTop,left,plotBottom,{color:[70,80,85],width:.7});C.line(left,plotBottom,right,plotBottom,{color:[70,80,85],width:.7});
    const ticks=v.xTicks||xs,tickLabels=v.xTickLabels||v.xLabels||ticks.map(fmt);ticks.forEach((tv,j)=>{const xx=xp(tv);C.line(xx,plotBottom,xx,plotBottom+3,{color:[70,80,85],width:.45});C.text(xx,plotBottom+13,String(tickLabels[j]??tv),6.2,{align:'center',color:[70,82,87]});});
    if(v.threshold!=null){const yy=yp(v.threshold);C.line(left,yy,right,yy,{color:[170,96,75],width:.9});C.text(right,yy-3,fmt(v.threshold),6.2,{align:'right',color:[150,75,60]});}
    const colors=(global.TT99VisualPalette||VISUAL_PALETTE).series;
    (v.series||[]).forEach((s,k)=>{
      let prev=null;s.values.forEach((val,j)=>{const pt={x:xp(xs[j]),y:yp(val)};if(v.joinPoints!==false&&prev)C.line(prev.x,prev.y,pt.x,pt.y,{color:colors[k%colors.length],width:k===0?1.5:1.2});C.rect(pt.x-2,pt.y-2,4,4,{fill:colors[k%colors.length]});prev=pt;});
    });
    if(v.segmentLabels&&v.segmentLabels.length){v.segmentLabels.forEach((lab,j)=>{if(j>=xs.length-1)return;const xx=(xp(xs[j])+xp(xs[j+1]))/2,yy=Math.min(yp(v.series[0].values[j]),yp(v.series[0].values[j+1]))-5;C.text(xx,yy,lab,6.2,{bold:true,align:'center',color:[72,82,87]});});}
    C.text(x+9,(plotTop+plotBottom)/2,v.yLabel,6.7,{bold:true,align:'center',rotate:-90,color:[75,88,92]});C.text((left+right)/2,plotBottom+24,v.xLabel,6.7,{bold:true,align:'center',color:[75,88,92]});
    if(v.showLegend!==false&&(v.series||[]).length>1){let lx=right-100;(v.series||[]).forEach((s,k)=>{C.rect(lx,y+2+k*10,7,7,{fill:colors[k%colors.length]});C.text(lx+10,y+8+k*10,s.name,6.4,{color:[55,65,70]});});}
  }
  function renderGraph(C,x,y,w,h,v,answers){if(v.type==='bar')renderBar(C,x,y,w,h,v,answers);else if(v.type==='line')renderLine(C,x,y,w,h,v,answers);else if(global.TT99VisualRenderers&&typeof global.TT99VisualRenderers[v.type]==='function')global.TT99VisualRenderers[v.type](C,x,y,w,h,v,answers);}

  class SvgCanvas{
    constructor(width,height,images={}){this.width=width;this.height=height;this.images=images;this.e=[];this.r=[];}
    text(x,y,text,size=10,o={}){const fill=o.color?`rgb(${o.color.join(',')})`:'#000',anchor=o.align==='center'?'middle':o.align==='right'?'end':'start',rot=Number(o.rotate)||0,transform=rot?` transform="rotate(${rot} ${x.toFixed(2)} ${y.toFixed(2)})"`:'';this.e.push(`<text x="${x.toFixed(2)}" y="${y.toFixed(2)}" font-family="Helvetica,Arial,sans-serif" font-size="${size}" font-weight="${o.bold?700:400}" text-anchor="${anchor}" fill="${fill}"${transform}>${esc(text)}</text>`);}
    line(x1,y1,x2,y2,o={}){this.e.push(`<line x1="${x1.toFixed(2)}" y1="${y1.toFixed(2)}" x2="${x2.toFixed(2)}" y2="${y2.toFixed(2)}" stroke="${o.color?`rgb(${o.color.join(',')})`:'#000'}" stroke-width="${o.width||.7}"/>`);}
    rect(x,y,w,h,o={}){const fill=o.fill?`rgb(${o.fill.join(',')})`:'none',stroke=o.stroke?`rgb(${o.stroke.join(',')})`:'none';this.e.push(`<rect x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${Math.max(0,w).toFixed(2)}" height="${Math.max(0,h).toFixed(2)}" fill="${fill}" stroke="${stroke}" stroke-width="${o.width||.7}"/>`);}
    polygon(points,o={}){if(!Array.isArray(points)||points.length<2)return;const fill=o.fill?`rgb(${o.fill.join(',')})`:'none',stroke=o.stroke?`rgb(${o.stroke.join(',')})`:'none',pts=points.map(p=>`${Number(p.x).toFixed(2)},${Number(p.y).toFixed(2)}`).join(' ');this.e.push(`<polygon points="${pts}" fill="${fill}" stroke="${stroke}" stroke-width="${o.width||.7}"/>`);}
    image(x,y,w,h,name){const href=this.images[name];if(href)this.e.push(`<image x="${x}" y="${y}" width="${w}" height="${h}" href="${esc(href)}" preserveAspectRatio="xMidYMid meet"/>`);}
    replaceButton(x,y,w,h,index,number){const cx=x+w-8,cy=y+12;this.r.push(`<g class="tt99-svg-row-review"><rect class="tt99-svg-row-hit" x="${x}" y="${y}" width="${w}" height="${h}" fill="#fff" fill-opacity="0"/><g class="tt99-svg-replace" data-replace="${index}" role="button" tabindex="0" aria-label="Replace question ${number}"><circle cx="${cx}" cy="${cy}" r="6"/><text x="${cx}" y="${cy+3.2}" text-anchor="middle">↻</text></g></g>`);}
    svg(cls=''){return `<svg class="tt99-paper tt99-paper-svg tt99-visual-paper ${cls}" viewBox="0 0 ${this.width} ${this.height}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Worksheet preview"><rect width="100%" height="100%" fill="#fff"/>${this.e.join('')}${this.r.join('')}</svg>`;}
  }
  function pdfNum(v){return Number(v).toFixed(2).replace(/\.00$/,'');}
  function pdfRgb(c){return c.map(v=>Math.max(0,Math.min(255,Number(v)))/255).map(pdfNum).join(' ');}
  function PdfCanvas(page){return {
    text:(x,topY,text,size=10,o={})=>{
      const rot=Number(o.rotate)||0;if(!rot)return page.text(x,topY,text,size,o);
      if(!Array.isArray(page.c))return page.text(x,topY,text,size,o);
      const font=o.bold?'F2':'F1',width=P?.estimateTextWidth?P.estimateTextWidth(text,size,!!o.bold):String(text).length*size*.53;
      const alignShift=o.align==='center'?-width/2:o.align==='right'?-width:0;
      const rad=(-rot)*Math.PI/180,a=Math.cos(rad),b=Math.sin(rad),c=-Math.sin(rad),d=Math.cos(rad);
      const e=x+a*alignShift,f=page.height-topY+b*alignShift;
      const escaped=String(text==null?'':text).replace(/\\/g,'\\\\').replace(/\(/g,'\\(').replace(/\)/g,'\\)');
      page.c.push(`BT /${font} ${pdfNum(size)} Tf ${o.color?pdfRgb(o.color)+' rg ':''}${pdfNum(a)} ${pdfNum(b)} ${pdfNum(c)} ${pdfNum(d)} ${pdfNum(e)} ${pdfNum(f)} Tm (${escaped}) Tj ET`);return width;
    },line:(...a)=>page.line(...a),rect:(...a)=>page.rect(...a),image:(...a)=>page.image(...a),replaceButton:()=>{},
    polygon:(points,o={})=>{
      if(!Array.isArray(points)||points.length<2||!Array.isArray(page.c))return;
      const p0=points[0],parts=[];
      if(o.fill)parts.push(`${pdfRgb(o.fill)} rg`);
      if(o.stroke)parts.push(`${pdfRgb(o.stroke)} RG`);
      parts.push(`${pdfNum(o.width||.7)} w`,`${pdfNum(p0.x)} ${pdfNum(page.height-p0.y)} m`);
      for(const p of points.slice(1))parts.push(`${pdfNum(p.x)} ${pdfNum(page.height-p.y)} l`);
      parts.push('h',o.fill&&o.stroke?'B':o.fill?'f':'S');
      page.c.push(parts.join(' '));
    }
  };}


  function drawWrapped(C,text,x,y,maxWidth,size,lineHeight,o={}){const lines=wrapLines(text,maxWidth,size,!!o.bold);for(const line of lines){C.text(x,y,line,size,o);y+=lineHeight;}return y;}
  function drawQr(C,x,y,size,matrix){if(!Array.isArray(matrix)||!matrix.length)return;const n=matrix.length,q=4,total=n+q*2,m=size/total;C.rect(x,y,size,size,{fill:[255,255,255]});for(let r=0;r<n;r++)for(let c=0;c<n;c++)if(matrix[r][c])C.rect(x+(q+c)*m,y+(q+r)*m,m+.05,m+.05,{fill:[0,0,0]});}
  function drawPageChrome(C,info){
    const {W,H,rules,sheet,school,answers,pageNo,pageCount,first,qrMatrix}=info,margin=W>700?34:36,right=W-margin,ink=[31,41,55],muted=[95,105,120],teal=[15,118,110],line=[202,211,215],pale=[241,247,246];
    let identityX=margin;if(school.logoDataUrl){C.image(margin,15,34,34,'logo');identityX+=43;}
    if(school.schoolName)C.text(identityX,30,school.schoolName,10.3,{bold:true,color:ink});const meta=metaText(school);if(meta)C.text(identityX,45,meta,7.4,{color:muted});
    const title=String(rules.worksheetTitle||'Maths Practice').toUpperCase();C.text(W/2,30,answers?'ANSWER KEY':title,answers?16:13,{bold:true,align:'center',color:answers?ink:teal});if(answers)C.text(W/2,45,title,7.2,{bold:true,align:'center',color:teal});
    C.text(right,30,`Page ${pageNo} of ${pageCount}`,7.2,{align:'right',color:muted});C.line(margin,61,right,61,{color:line,width:.6});
    let contentTop=76;
    if(first&&!answers){C.text(margin,82,'Name',9.5,{bold:true,color:ink});C.line(margin+34,84,280,84,{color:muted,width:.6});C.text(right-105,82,'Score',9.5,{bold:true,color:ink});C.line(right-68,84,right-25,84,{color:muted,width:.6});C.text(right-20,82,`/ ${rules.questionCount}`,9.5,{align:'right',color:muted});
      C.rect(margin,96,right-margin,27,{fill:pale,stroke:[222,232,230],width:.5});drawWrapped(C,G.instructionText(rules),margin+9,112,right-margin-18,8.5,9.2,{color:ink});contentTop=137;
    }else if(first&&answers&&qrMatrix){C.rect(margin,72,right-margin,54,{fill:pale,stroke:[222,232,230],width:.5});C.text(margin+9,88,'Teacher answer copy',9.6,{bold:true,color:ink});C.text(margin+9,103,`Sheet ${sheet.code}`,7.3,{color:muted});C.text(margin+9,116,'QR recreates the exact reviewed sheet.',7.2,{color:ink});drawQr(C,right-48,75,45,qrMatrix);contentTop=138;}
    return {contentTop,margin,right,footerY:H-31};
  }
  function drawQuestionChoices(C,item,x,y,w,answers){
    const choices=Array.isArray(item?.choices)?item.choices:[];if(!choices.length)return 0;
    const rows=Math.ceil(choices.length/2),rowH=14,colW=w/2,ink=[46,59,66],muted=[95,105,112],teal=[15,118,110];
    choices.forEach((choice,j)=>{const row=Math.floor(j/2),col=j%2,xx=x+col*colW,yy=y+row*rowH,isCorrect=answers&&Number(item.correctChoice)===j,label=`${String.fromCharCode(65+j)}. ${choice}`;C.text(xx,yy+9,label,7,{bold:isCorrect,color:isCorrect?teal:ink});if(isCorrect)C.rect(xx-9,yy+3,5,5,{fill:teal});});
    return rows*rowH+5;
  }
  function drawQuestionBlock(C,item,index,x,y,w,h,answers,orientation='portrait'){
    const ink=[31,41,55],muted=[95,105,120],teal=[15,118,110],line=[224,230,232];
    C.line(x,y+h-1,x+w,y+h-1,{color:line,width:.45});C.text(x,y+13,`${item.number}.`,8.5,{bold:true,color:muted});
    const promptX=x+23,promptW=w-31,promptLines=wrapLines(item.prompt,promptW,8.5,false),maxPrompt=item.visual?3:3;let py=y+13;for(const ln of promptLines.slice(0,maxPrompt)){C.text(promptX,py,ln,8.5,{color:ink});py+=10;}
    const responseArea=answers?0:responseHeight(item,orientation),teacherArea=answers?markingGuidanceHeight(item,orientation):0;
    if(item.visual){
      const choiceRows=Array.isArray(item.choices)&&item.choices.length?Math.ceil(item.choices.length/2):0,choiceArea=choiceRows?choiceRows*14+5:0;
      const answerLineArea=answers?22:((choiceArea||responseArea)?4:20),graphTop=py+2,graphH=Math.max(55,h-(graphTop-y)-answerLineArea-choiceArea-responseArea-teacherArea-4);
      renderGraph(C,promptX,graphTop,promptW,graphH,item.visual,answers);
      const responseTop=y+h-responseArea;
      const teacherTop=y+h-teacherArea;
      if(choiceArea){const cy=answers?teacherTop-answerLineArea-choiceArea:responseTop-answerLineArea-choiceArea;drawQuestionChoices(C,item,promptX,cy,promptW,answers);}
      if(!answers&&responseArea)drawResponseFrame(C,item,promptX,responseTop,promptW,responseArea);
      if(answers){
        const answerText=`Answer: ${String(item.answer)}`,answerLines=wrapLines(answerText,promptW,7.2,true).slice(0,3);let ay=teacherTop-7-(answerLines.length-1)*8;for(const lineText of answerLines){C.text(promptX,ay,lineText,7.2,{bold:true,color:teal});ay+=8;}
        if(teacherArea)drawMarkingGuidance(C,item,promptX,teacherTop,promptW,teacherArea);
      }else if(!choiceArea&&!responseArea)C.line(x+w-125,y+h-8,x+w-5,y+h-8,{color:[125,132,138],width:.55});
    }
    else{
      if(answers&&teacherArea){C.text(promptX,py+1,`Answer: ${String(item.answer)}`,7.2,{bold:true,color:teal});drawMarkingGuidance(C,item,promptX,y+h-teacherArea,promptW,teacherArea);}
      else if(answers)C.text(x+w-5,y+13,String(item.answer),8.5,{bold:true,align:'right',color:teal});
      else if(responseArea)drawResponseFrame(C,item,promptX,y+h-responseArea,promptW,responseArea);
      else C.line(x+w-125,y+15,x+w-5,y+15,{color:[125,132,138],width:.55});
    }
    C.replaceButton?.(x,y,w,h,index,item.number);
  }
  function buildLayoutForSheet(sheet,rules,school,answers,orientation,qrMatrix,teacherNote=''){
    const W=orientation==='landscape'?P.LANDSCAPE_W:P.PAGE_W,H=orientation==='landscape'?P.LANDSCAPE_H:P.PAGE_H,firstTop=answers&&qrMatrix?138:answers?76:137,nextTop=76,footer=H-42,reserve=answers&&String(teacherNote||'').trim()?25:0;
    const firstCap=footer-reserve-firstTop,nextCap=footer-reserve-nextTop,pages=packQuestions(sheet.questions,answers,orientation,firstCap,nextCap);return {W,H,pages,firstTop,nextTop,footer,reserve};
  }
  function buildVisualDocument(options){
    const {rules,sheets,school={},kind='student',qrByVariant=[],teacherNote=''}=options,orientation=L.normalizeOrientation?L.normalizeOrientation(options.orientation):options.orientation==='landscape'?'landscape':'portrait',doc=new P.PDFDocument();
    if(school.logoDataUrl)doc.setJpeg(school.logoDataUrl,school.logoWidth,school.logoHeight,'logo');
    function addSheet(sheet,answers,qrMatrix){const layout=buildLayoutForSheet(sheet,rules,school,answers,orientation,qrMatrix,teacherNote);layout.pages.forEach((items,pidx)=>{const page=doc.addPage({orientation}),C=PdfCanvas(page),chrome=drawPageChrome(C,{...layout,rules,sheet,school,answers,pageNo:pidx+1,pageCount:layout.pages.length,first:pidx===0,qrMatrix:pidx===0?qrMatrix:null});let y=chrome.contentTop;for(const item of items){const globalIndex=sheet.questions.indexOf(item),h=footprintHeight(item,answers,orientation);drawQuestionBlock(C,item,globalIndex,chrome.margin,y,chrome.right-chrome.margin,h,answers,orientation);y+=h;}C.line(chrome.margin,chrome.footerY,chrome.right,chrome.footerY,{color:[202,211,215],width:.5});C.text(chrome.margin,chrome.footerY+14,`Sheet ${sheet.code}`,7,{color:[95,105,120]});C.text(chrome.right,chrome.footerY+14,`Page ${pidx+1} of ${layout.pages.length} · Tech Tinker Club`,7,{align:'right',color:[95,105,120]});if(answers&&teacherNote&&pidx===layout.pages.length-1){const noteLines=wrapLines(`Teacher note: ${String(teacherNote).replace(/\s+/g,' ').trim().slice(0,240)}`,chrome.right-chrome.margin,6.5,false).slice(0,2);let ny=chrome.footerY-18;for(const lineText of noteLines){C.text(chrome.margin,ny,lineText,6.5,{color:[95,105,120]});ny+=8;}}});}
    if(kind==='student'||kind==='both')sheets.forEach(s=>addSheet(s,false,null));if(kind==='answers'||kind==='both')sheets.forEach((s,i)=>addSheet(s,true,qrByVariant[i]||null));return doc;
  }
  function renderVisualPreview(options){
    const {rules,sheet,school={},answers=false,orientation='portrait',qrMatrix=null,teacherNote=''}=options,ori=orientation==='landscape'?'landscape':'portrait',layout=buildLayoutForSheet(sheet,rules,school,!!answers,ori,qrMatrix,teacherNote),images={logo:school.logoDataUrl||''};
    const svgs=layout.pages.map((items,pidx)=>{const C=new SvgCanvas(layout.W,layout.H,images),chrome=drawPageChrome(C,{...layout,rules,sheet,school,answers:!!answers,pageNo:pidx+1,pageCount:layout.pages.length,first:pidx===0,qrMatrix:pidx===0?qrMatrix:null});let y=chrome.contentTop;for(const item of items){const idx=sheet.questions.indexOf(item),h=footprintHeight(item,!!answers,ori);drawQuestionBlock(C,item,idx,chrome.margin,y,chrome.right-chrome.margin,h,!!answers,ori);y+=h;}C.line(chrome.margin,chrome.footerY,chrome.right,chrome.footerY,{color:[202,211,215],width:.5});C.text(chrome.margin,chrome.footerY+14,`Sheet ${sheet.code}`,7,{color:[95,105,120]});C.text(chrome.right,chrome.footerY+14,`Page ${pidx+1} of ${layout.pages.length} · Tech Tinker Club`,7,{align:'right',color:[95,105,120]});if(answers&&teacherNote&&pidx===layout.pages.length-1){const noteLines=wrapLines(`Teacher note: ${String(teacherNote).replace(/\s+/g,' ').trim().slice(0,240)}`,chrome.right-chrome.margin,6.5,false).slice(0,2);let ny=chrome.footerY-18;for(const lineText of noteLines){C.text(chrome.margin,ny,lineText,6.5,{color:[95,105,120]});ny+=8;}}return C.svg(ori==='landscape'?'is-landscape':'is-portrait');});
    return `<div class="tt99-visual-preview-stack" data-visual-pages="${svgs.length}">${svgs.join('')}</div>`;
  }

  if(P&&L){
    const originalBuild=L.buildDocument.bind(L),originalPreview=L.renderPreviewSvg.bind(L);
    L.buildDocument=function(options){const enhanced=options?.sheets?.some(s=>s?.questions?.some(q=>q?.visual||q?.response||q?.marking?.mode==='rubric'||responseSpec(q)));return enhanced?buildVisualDocument(options):originalBuild(options);};
    L.renderPreviewSvg=function(options){const enhanced=options?.sheet?.questions?.some(q=>q?.visual||q?.response||q?.marking?.mode==='rubric'||responseSpec(q));return enhanced?renderVisualPreview(options):originalPreview(options);};
  }

  // UI copy is owned by custom-app.js. Keep this module focused on visual generation/layout.

  global.TT99CustomGraphs={VERSION,VISUAL_PALETTE,BAR_CATALOGUE,LINE_CATALOGUE,ELIGIBLE,GRAPH_FAMILIES,IMPLEMENTED_BAR:[...IMPLEMENTED_BAR],IMPLEMENTED_LINE:[...IMPLEMENTED_LINE],allowedTypes,graphPool,packQuestions,footprintHeight,responseSpec,responseHeight,markingGuidanceLines,markingGuidanceHeight,renderVisualPreview,buildVisualDocument};
}(typeof window!=='undefined'?window:globalThis));
