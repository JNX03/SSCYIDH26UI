export const STORAGE_KEY = 'design-gym-progress-v1';
export const localDate = () => { const date = new Date(); return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`; };
export function createInitialProgress() { return {xp:0,attempts:0,correct:0,history:[],saved:[],completedSessions:0,topicStats:{},streak:0,lastDate:null,course:{lessons:{},tests:{}}}; }
export function newSession(challenges, topic='all', offset=0) {
  const filtered = challenges.filter(q => topic === 'all' || q.topic === topic);
  // Interleave topics for a mixed session, keeping the introductory kerning exercise first.
  const groups = [...new Set(filtered.map(q=>q.topic))].map(id=>filtered.filter(q=>q.topic===id));
  const ordered = topic === 'all'
    ? Array.from({length:Math.max(0,...groups.map(group=>group.length))},(_,index)=>groups.map(group=>group[index]).filter(Boolean)).flat()
    : filtered;
  const start = ordered.length && Number.isFinite(offset)
    ? ((Math.trunc(offset)%ordered.length)+ordered.length)%ordered.length
    : 0;
  const questions = Array.from({length:Math.min(10,ordered.length)},(_,index)=>ordered[(start+index)%ordered.length]);
  return {questions,index:0,answers:[],complete:questions.length===0};
}
export function answerQuestion(session, choice) {
  if(session.complete || session.answers.length > session.index || ![0,1].includes(choice)) return session;
  const question=session.questions[session.index];
  if(!question) return session;
  const correct=choice===question.correct;
  return {...session,answers:[...session.answers,{id:question.id,choice,correct,xp:correct?20:5}]};
}
export function nextQuestion(session) {
  if(session.complete || session.answers.length<=session.index) return session;
  if(session.index>=session.questions.length-1) return {...session,complete:true};
  return {...session,index:session.index+1};
}
export function recordAnswer(progress, challenge, correct, date=localDate()) {
  const xp=correct?20:5;
  const yesterday=new Date(`${date}T12:00:00`); yesterday.setDate(yesterday.getDate()-1);
  const yesterdayKey=`${yesterday.getFullYear()}-${String(yesterday.getMonth()+1).padStart(2,'0')}-${String(yesterday.getDate()).padStart(2,'0')}`;
  const streak=progress.lastDate===date?progress.streak:progress.lastDate===yesterdayKey?progress.streak+1:1;
  const stat=progress.topicStats[challenge.topic]||{attempts:0,correct:0};
  return {...progress,xp:progress.xp+xp,attempts:progress.attempts+1,correct:progress.correct+(correct?1:0),streak,lastDate:date,history:[...progress.history,{id:challenge.id,topic:challenge.topic,correct,date,xp}],topicStats:{...progress.topicStats,[challenge.topic]:{attempts:stat.attempts+1,correct:stat.correct+(correct?1:0)}}};
}
export const toggleSaved=(progress,id)=>({...progress,saved:progress.saved.includes(id)?progress.saved.filter(v=>v!==id):[...progress.saved,id]});
export const getDailyCount=(progress,date=localDate())=>progress.history.filter(v=>v.date===date).length;
const validCount = value => Number.isSafeInteger(value) && value >= 0;
const validDate = value => {
  if(typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date=new Date(`${value}T12:00:00`);
  return !Number.isNaN(date.getTime()) && `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}` === value;
};
const normalizeCourseEntries = (entries, flag) => {
  const normalized={};
  if(!entries || typeof entries!=='object' || Array.isArray(entries)) return normalized;
  for(const [id,entry] of Object.entries(entries)) {
    if(!id.trim() || ['__proto__','constructor','prototype'].includes(id) || !entry || typeof entry!=='object' || Array.isArray(entry) || typeof entry[flag]!=='boolean' || !Number.isFinite(entry.bestScore) || entry.bestScore<0 || entry.bestScore>100 || !validCount(entry.attempts)) continue;
    normalized[id]={[flag]:entry[flag],bestScore:entry.bestScore,attempts:entry.attempts};
  }
  return normalized;
};
export function loadProgress(storage) {
  try {
    const p=JSON.parse(storage.getItem(STORAGE_KEY));
    if(!p || typeof p!=='object' || Array.isArray(p) || !validCount(p.xp) || !validCount(p.attempts) || !validCount(p.correct) || p.correct>p.attempts || !Array.isArray(p.history) || !Array.isArray(p.saved)) return createInitialProgress();
    const history=p.history.filter(h=>h&&typeof h.id==='string'&&h.id.length>0&&typeof h.topic==='string'&&typeof h.correct==='boolean'&&validDate(h.date)&&validCount(h.xp));
    const saved=[...new Set(p.saved.filter(id=>typeof id==='string'&&id.length>0))];
    const topicStats={};
    if(p.topicStats && typeof p.topicStats==='object' && !Array.isArray(p.topicStats)) {
      for(const [topic,stat] of Object.entries(p.topicStats)) {
        if(['__proto__','constructor','prototype'].includes(topic) || !stat || !validCount(stat.attempts)) continue;
        topicStats[topic]={attempts:stat.attempts,correct:validCount(stat.correct)?Math.min(stat.correct,stat.attempts):0};
      }
    }
    const lastDate=validDate(p.lastDate)?p.lastDate:null;
    const course={lessons:normalizeCourseEntries(p.course?.lessons,'completed'),tests:normalizeCourseEntries(p.course?.tests,'passed')};
    return {...createInitialProgress(),...p,history,saved,topicStats,lastDate,streak:lastDate&&validCount(p.streak)?p.streak:0,completedSessions:validCount(p.completedSessions)?p.completedSessions:0,course};
  } catch { return createInitialProgress(); }
}
