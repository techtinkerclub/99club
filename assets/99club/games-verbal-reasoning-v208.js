/* 99 Club Studio · Games verbal reasoning bridge v2.08 */
(function(global){
'use strict';
var VR=global.TT99VerbalReasoning,G=global.TT99Games,A=global.TT99ArithmeticGames;
if(!VR||!G||!A||G.__verbalReasoningV208)return;
var compatibility={};Object.keys(G.TOPICS||{}).forEach(function(k){compatibility[k]='excellent';});
var DEF={
 id:'verbalreasoning',title:'Verbal Reasoning',group:'Verbal Reasoning',contentArea:'verbal',kind:'independent',printableMode:'questions',
 answerSheetSupport:true,workedExampleSupport:true,needsCutting:false,needsDice:false,needsPartner:false,
 supportedAnswerTypes:['word','letter','number','reasoning'],difficultyOptions:['easy','standard','challenge'],
 defaultSettings:{difficulty:'standard',questionTypes:VR.TYPE_IDS.slice()},
 settingsSchema:[{id:'difficulty',type:'difficulty',label:'Difficulty'}],
 difficultyDescriptions:{easy:'Common words and one-step patterns',standard:'Broader vocabulary and multi-step patterns',challenge:'Less obvious relationships and richer deductions'},
 compatibility:compatibility
};
A.DEFINITIONS.verbalreasoning=DEF;
G.ENGINES.verbalreasoning=DEF;
var baseNormalise=A.normalise.bind(A),baseGenerate=A.generate.bind(A),baseWorked=A.workedExample.bind(A),baseValidate=A.validate.bind(A);
A.normalise=function(id,raw){
 if(id!=='verbalreasoning')return baseNormalise(id,raw);
 raw=raw&&typeof raw==='object'?raw:{};
 var difficulty=['easy','standard','challenge'].indexOf(raw.difficulty)>=0?raw.difficulty:'standard';
 var questionTypes=Array.isArray(raw.questionTypes)?raw.questionTypes.filter(function(x){return !!VR.TYPES[x];}):VR.TYPE_IDS.slice();
 if(!questionTypes.length)questionTypes=VR.TYPE_IDS.slice();
 return {difficulty:difficulty,questionTypes:Array.from(new Set(questionTypes))};
};
A.generate=function(id,settings,seed){
 if(id!=='verbalreasoning')return baseGenerate(id,settings,seed);
 var o=A.normalise(id,settings&&settings.engineSettings&&settings.engineSettings.verbalreasoning),blocked=settings&&settings._finiteExclusions&&Array.isArray(settings._finiteExclusions.verbal)?settings._finiteExclusions.verbal:[];
 var q=VR.generateFromTypes(o.questionTypes,o.difficulty,String(seed)+':vr',blocked);
 return {engineId:'verbalreasoning',title:'Verbal Reasoning',difficulty:o.difficulty,question:q,questionKey:q.key,typeId:q.typeId,typeLabel:q.typeLabel,seed:seed,options:o,instruction:'Solve the verbal-reasoning question. Show any useful working or letter pattern.'};
};
A.workedExample=function(id,settings,seed){
 if(id!=='verbalreasoning')return baseWorked(id,settings,seed);
 var o=A.normalise(id,settings&&settings.engineSettings&&settings.engineSettings.verbalreasoning),type=o.questionTypes[0]||'letter_series',q=VR.generate(type,'easy',String(seed)+':worked');
 return {engineId:id,kind:id,title:'Verbal Reasoning worked example',goal:'Spot the rule or relationship, then apply it carefully.',rules:['Read exactly what the question asks before trying a rule.','Use the same rule for every example in the question.','Check your answer against all the information given.'],steps:['Identify the question type: '+q.typeLabel+'.','Look for the simplest rule that explains every clue or example.','Apply that rule to the missing part.','Check that the answer fits the whole question.'],tip:'If a rule works for only one clue but not the others, it is probably not the intended rule.',commonMistake:'Do not change the rule halfway through a question.',exampleQuestion:q};
};
A.validate=function(a){
 if(a&&a.engineId==='verbalreasoning')return VR.validate(a.question);
 return baseValidate(a);
};
G.VERBAL=VR;
G.__verbalReasoningV208=true;
})(typeof globalThis!=='undefined'?globalThis:this);
