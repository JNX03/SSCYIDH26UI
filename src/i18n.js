import {courseThai} from './locales/course.th.js';
import {practiceThai} from './locales/practice.th.js';
import {uiThai} from './locales/ui.th.js';
import {visualThai} from './locales/visuals.th.js';
import {insightThai} from './locales/insights.th.js';
const KEY='design-gym-language';
let language='en';
try{language=localStorage.getItem(KEY)==='th'?'th':'en';}catch{}
const originalNodes=new WeakMap();
const originalAttributes=new WeakMap();
export const getLanguage=()=>language;
export function setLanguage(value){language=value==='th'?'th':'en';try{localStorage.setItem(KEY,language);}catch{}if(typeof document!=='undefined'){document.documentElement.lang=language;document.title=language==='th'?'Design Gym — เกมตอบคำถามออกแบบ':'Design Gym — Design quiz';}return language;}
export function localizeQuestion(question,locale=language){
 if(!question||locale!=='th')return question;
 const copy=courseThai[question.id]||practiceThai[question.id];
 if(!copy)return question;
 return {...question,...copy,options:question.options.map((option,index)=>({...option,...copy.options?.[index]}))};
}
const hueNames={'red':'แดง','red-orange':'แดงส้ม','orange':'ส้ม','yellow-orange':'เหลืองส้ม','yellow':'เหลือง','yellow-green':'เหลืองเขียว','green':'เขียว','blue-green':'เขียวน้ำเงิน','blue':'น้ำเงิน','blue-violet':'น้ำเงินม่วง','violet':'ม่วง','red-violet':'แดงม่วง'};
const hueList=value=>value.split(', ').map(hue=>hueNames[hue.toLowerCase()]||hue).join(' · ');
const patterns=[
 [/^Traditional RYB wheel marking (.+)\.$/,m=>`วงล้อสี RYB แบบดั้งเดิม ทำเครื่องหมายสี${hueList(m[1])}`],
 [/^Color wheel marking (.+)$/,m=>`วงล้อสีที่ทำเครื่องหมายสี${hueList(m[1])}`],
 [/^The outlined hues are (.+)\. (.+)$/,m=>`สีที่ทำเครื่องหมายคือ${hueList(m[1])} ${translate(m[2])}`],
 [/^A (.+) example\. Compare its visible arrangement, wording, and controls with the other option\.$/,m=>`ตัวอย่างด้าน${translate(m[1])} เปรียบเทียบการจัดวาง ข้อความ และตัวควบคุมกับอีกตัวเลือก`],
 [/^(\d+) design questions$/,m=>`คำถามด้านการออกแบบ ${m[1]} ข้อ`],
 [/^(\d+) (?:visual challenges|questions) available · (\d+) in this game$/,m=>`มี ${m[1]} ข้อ · เกมนี้ใช้ ${m[2]} ข้อ`],
 [/^(\d+) questions(?:\.)?$/,m=>`${m[1]} ข้อ`],[/^(\d+) seconds$/,m=>`${m[1]} วินาที`],
 [/^(\d+)s per round$/,m=>`รอบละ ${m[1]} วินาที`],
 [/^(\d+) \/ (\d+) answered$/,m=>`ตอบแล้ว ${m[1]} / ${m[2]} คน`],
 [/^(\d+) (?:player is|players are) ready\.?$/,m=>`พร้อมแล้ว ${m[1]} คน`],
 [/^(\d+) PLAYERS?$/,m=>`ผู้เล่น ${m[1]} คน`],
 [/^(\d+) correct in a row$/,m=>`ตอบถูกต่อเนื่อง ${m[1]} ข้อ`],
 [/^(\d+) correct$/,m=>`ตอบถูก ${m[1]} ข้อ`],[/^(\d+) in a row$/,m=>`ต่อเนื่อง ${m[1]} ข้อ`],
 [/^Round (\d+) complete\.$/,m=>`จบรอบที่ ${m[1]}`],
 [/^(\d+) questions remaining\.$/,m=>`เหลืออีก ${m[1]} ข้อ`],
 [/^You finished (\d+)(?:st|nd|rd|th)\.$/,m=>`คุณได้อันดับที่ ${m[1]}`],
 [/^Share this game PIN: (\d+)$/,m=>`แชร์รหัสเกมนี้: ${m[1]}`],
 [/^Your pick is Option ([AB])\. (.*)$/,m=>`คุณเลือกข้อ ${m[1]} · ${translate(m[2])}`],
 [/^(Correct|Compare) · ([AB])$/,m=>`${m[1]==='Correct'?'ถูกต้อง':'เปรียบเทียบ'} · ${m[2]}`],
 [/^Option ([AB])\.?$/,m=>`ข้อ ${m[1]}`],
 [/^Option ([AB])\. (.*)$/,m=>`ข้อ ${m[1]} · ${translate(m[2])}`],
 [/^(Look here|Compare): (.*)$/,m=>`${m[1]==='Look here'?'จุดที่ดี':'จุดที่ควรแก้'}: ${translate(m[2])}`],
 [/^What to spot: (.*)$/,m=>`สังเกต: ${translate(m[1])}`],
 [/^(Correct example|Comparison example)\. (.*)\.$/,m=>`${m[1]==='Correct example'?'ตัวอย่างที่ถูกต้อง':'ตัวอย่างเปรียบเทียบ'} · ${translate(m[2])}`],
 [/^(Purple|Midnight|Coral|Forest) theme$/,m=>`ธีม${translate(m[1])}`],
];
export function translate(value,locale=language){
 const raw=String(value??'');if(locale!=='th')return raw;
 const clean=raw.trim();let result=uiThai[clean]??visualThai[clean]??insightThai[clean];
 if(result===undefined){for(const [pattern,format] of patterns){const match=clean.match(pattern);if(match){result=format(match);break;}}}
 if(result===undefined)return raw;
 return raw.slice(0,raw.indexOf(clean))+result+raw.slice(raw.indexOf(clean)+clean.length);
}
export function localizeElement(root){
 if(!root||typeof document==='undefined')return;
 document.documentElement.lang=language;
 document.title=language==='th'?'Design Gym — เกมตอบคำถามออกแบบ':'Design Gym — Design quiz';
 const walker=document.createTreeWalker(root,4);let node;
 while((node=walker.nextNode())){
  if(!node.textContent.trim()||node.parentElement?.closest('[data-localize-skip],script,style,[data-live-action="language"]'))continue;
  const previous=originalNodes.get(node);const source=previous&&node.textContent===previous.translated?previous.source:node.textContent;
  const translated=translate(source);originalNodes.set(node,{source,translated});node.textContent=translated;
 }
 for(const element of root.querySelectorAll('[aria-label],[title],[placeholder]')){
  if(element.closest('[data-localize-skip],[data-live-action="language"]'))continue;
  for(const attr of ['aria-label','title','placeholder']){if(!element.hasAttribute(attr))continue;const values=originalAttributes.get(element)||{};const current=element.getAttribute(attr),previous=values[attr];const source=previous&&current===previous.translated?previous.source:current;const translated=translate(source);values[attr]={source,translated};originalAttributes.set(element,values);element.setAttribute(attr,translated);}
 }
}
