import test from 'node:test';
import assert from 'node:assert/strict';
import {challenges} from '../src/challenges.js';
import {bonusChallenges} from '../src/bonus.js';
import {designChallenges} from '../src/design-challenges.js';
import {courseChallenges} from '../src/course.js';
import {getLanguage,setLanguage,translate,localizeQuestion} from '../src/i18n.js';
import {uiThai} from '../src/locales/ui.th.js';
const questions=[...challenges,...bonusChallenges,...designChallenges,...courseChallenges];

test('Thai curriculum covers all191questions without changing the answer or visual data',()=>{
 assert.equal(questions.length,191);
 for(const original of questions){
  const copy=localizeQuestion(original,'th');
  for(const field of ['title','prompt','principle','explanation','takeaway'])assert.match(copy[field],/[ก-๙]/,`${original.id}.${field}`);
  assert.equal(copy.correct,original.correct);assert.equal(copy.visual,original.visual);assert.equal(copy.id,original.id);
  assert.equal(copy.options.length,original.options.length);
  original.options.forEach((option,i)=>{assert.match(copy.options[i].label,/[ก-๙]/,`${original.id}.options[${i}].label`);for(const key of Object.keys(option).filter(k=>!['label','heading','detail'].includes(k)))assert.deepEqual(copy.options[i][key],option[key],`${original.id}.${key}`);});
  assert.equal(localizeQuestion(original,'en'),original);
 }
});
test('language changes preserve numeric game state and translate dynamic UI copy',()=>{
 setLanguage('th');assert.equal(getLanguage(),'th');
 for(const [english,thai] of [['Join game','เข้าร่วมเกม'],['24 questions','24 ข้อ'],['8 / 24 answered','ตอบแล้ว 8 / 24 คน'],['Correct · B','ถูกต้อง · B'],['You finished 21st.','คุณได้อันดับที่ 21'],['45 seconds','45 วินาที']])assert.equal(translate(english),thai);
 assert.equal(translate('  Join game  '),'  เข้าร่วมเกม  ');
 assert.equal(translate('Maya123'),'Maya123');
 setLanguage('en');assert.equal(translate('Join game'),'Join game');
});
test('Thai UI dictionary contains meaningful Thai strings for setup, gameplay, results and errors',()=>{
 for(const key of ['GAME PIN','CHOOSE AN ANIMAL','Create a game','Reveal answers','Why it works','Final results','End this game?','Choose an animal from the list before joining.'])assert.match(uiThai[key],/[ก-๙]/,key);
 assert.equal(localizeQuestion(undefined,'th'),undefined);
});

test('localizing persistent controls restores English and follows changing aria labels',async()=>{
 const {localizeElement}=await import('../src/i18n.js');
 const oldDocument=globalThis.document;
 const node={textContent:'Join game',parentElement:{closest:()=>null}};
 const protectedName={textContent:'Forest',parentElement:{closest:()=>({})}};
 const attrs=new Map([['aria-label','Play Halloween lobby music']]);
 const element={closest:()=>null,hasAttribute:k=>attrs.has(k),getAttribute:k=>attrs.get(k),setAttribute:(k,v)=>attrs.set(k,v)};
 const root={querySelectorAll:()=>[element]};
 globalThis.document={documentElement:{},title:'',createTreeWalker:()=>{let n=0;return {nextNode:()=>[node,protectedName][n++]||null};}};
 try{
  setLanguage('th');localizeElement(root);assert.equal(node.textContent,'เข้าร่วมเกม');assert.equal(protectedName.textContent,'Forest');assert.equal(attrs.get('aria-label'),'เล่นเพลงฮาโลวีน');
  element.setAttribute('aria-label','Pause Halloween lobby music');localizeElement(root);assert.equal(attrs.get('aria-label'),'พักเพลงฮาโลวีน');
  setLanguage('en');localizeElement(root);assert.equal(node.textContent,'Join game');assert.equal(attrs.get('aria-label'),'Pause Halloween lobby music');
 }finally{globalThis.document=oldDocument;setLanguage('en');}
});
