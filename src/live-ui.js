import { icon } from './icons.js';
import { renderAnnotatedVisual, renderVisualComparisonTip, describeAnswerVisual } from './answer-insights.js';
import { sidekicks, renderSidekick } from './sidekicks.js';
import { firebaseConfig, firebaseEmulators } from './firebase-config.js';
import { connectRealtime } from './realtime.js';
import { mountLobbyMusic, unmountLobbyMusic } from './lobby-music.js';
import { rankPlayers, validateNickname, normalizePin, buildRoomQuestionIds, shouldEndRound } from './multiplayer-engine.js';

const SESSION_KEY = 'design-gym-live-session-v1';
const PREFERENCES_KEY = 'design-gym-live-preferences-v1';
const themes = [{id:'purple',label:'Purple party',color:'#46178f'},{id:'midnight',label:'Midnight',color:'#182335'},{id:'coral',label:'Coral',color:'#bd3d50'},{id:'forest',label:'Forest',color:'#185b48'}];
const avatars = sidekicks;
const escape = (value='') => String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const avatar = (value, large=false) => {const index=Number.isInteger(value)?Math.max(0,Math.min(5,value)):Math.max(0,avatars.findIndex(a=>a.id===value));const a=avatars[index]||avatars[0];return `<span class="live-avatar ${large?'live-avatar-large':''}" style="--avatar:${a.color}" aria-hidden="true">${renderSidekick(index)}</span>`;};
const avatarValue = value => Number.isInteger(value) ? Math.max(0,Math.min(5,value)) : Math.max(0,avatars.findIndex(a=>a.id===value));
let current = null;

export function mountLive(container, {challenges,topics,routeMode='join',onExit=()=>{},onToast=()=>{}}) {
  unmountLive();
  const params=new URLSearchParams(location.search);
  routeMode=routeMode==='host'?'host':'join';
  const joinPin=routeMode==='join'?normalizePin(params.get('join')||''):'';
  const preferences=loadPreferences();
  const content=document.createElement('div');content.className='live-content-root';
  const musicContainer=document.createElement('div');musicContainer.className='live-music-root';
  container.replaceChildren(content,musicContainer);
  current={container,content,musicContainer,routeMode,challenges,topics,onExit,onToast,controller:new AbortController(),service:null,servicePromise:null,connectionUnsubscribe:null,connected:false,room:null,pin:'',unsubscribe:null,timer:null,toastTimer:null,form:{pin:joinPin,name:'',avatar:avatars[0].id,topic:'all',count:10,duration:30,title:'The design eye challenge',mode:'visual',theme:preferences.theme,motion:preferences.motion},sound:preferences.sound,audioContext:null,busy:false,error:'',answerBusy:false,pendingChoice:null,revealing:false,autoRevealKey:null,lastAnimatedPhaseKey:'',quitConfirm:false,disposed:false};
  const state=current;
  container.classList.add('live-mounted');
  container.addEventListener('click',event=>handleClick(state,event),{signal:state.controller.signal});
  container.addEventListener('submit',event=>handleSubmit(state,event),{signal:state.controller.signal});
  container.addEventListener('input',event=>handleInput(state,event),{signal:state.controller.signal});
  container.addEventListener('change',event=>handleInput(state,event),{signal:state.controller.signal});
  document.addEventListener('keydown',event=>handleKey(state,event),{signal:state.controller.signal});
  render(state);
  if(firebaseConfig && !joinPin) restoreSession(state);
}

export function unmountLive() {
  if(!current)return;
  const state=current;state.disposed=true;
  state.controller.abort();state.unsubscribe?.();state.connectionUnsubscribe?.();state.audioContext?.close().catch(()=>{});
  clearInterval(state.timer);clearTimeout(state.toastTimer);
  unmountLobbyMusic();state.container.classList.remove('live-mounted');state.container.replaceChildren();
  current=null;
}

function host(state){return Boolean(state.routeMode==='host' && state.room && state.service?.uid===state.room.hostId);}
function question(state){return state.challenges.find(q=>q.id===state.room?.questionIds?.[state.room.round]);}
function connectedPlayers(state){return Object.entries(state.room?.players||{}).filter(([,p])=>p&&p.connected!==false);}
function currentAnswers(state){return state.room?.answers?.[state.room?.round]||{};}
function myAnswer(state){return currentAnswers(state)[state.service?.uid];}
function myScore(state){return state.room?.scores?.[state.service?.uid]||{};}
function appearance(state){const value=state.room?.appearance||state.form;return {theme:themes.some(t=>t.id===value.theme)?value.theme:'purple',motion:value.motion!==false};}
function questionPool(state){return state.form.mode==='full'?state.challenges:state.challenges.filter(q=>!String(q.visual||'').startsWith('course-'));}
function availableQuestions(state){return questionPool(state).filter(q=>state.form.topic==='all'||q.topic===state.form.topic);}
function visibleError(error){
  const message=typeof error==='string'?error:error?.message||'The connection could not be completed.';
  if(/permission.denied/i.test(message))return 'This room is unavailable or your session has expired. Check the game PIN and try again.';
  if(/network|offline|unavailable/i.test(message))return 'We couldn’t reach the live game. Check your connection, then try again.';
  return message.replace(/^Firebase:\s*/,'').replace(/\s*\(auth\/[^)]+\)\.?$/,'').slice(0,240);
}
function toast(state,message){
  if(state.disposed)return;
  clearTimeout(state.toastTimer);
  const element=state.container.querySelector('[data-live-toast]');
  if(element){element.textContent=message;element.classList.add('show');state.toastTimer=setTimeout(()=>element.classList.remove('show'),3200);}
}
function setError(state,error){if(state.disposed)return;state.error=visibleError(error);render(state);}
async function service(state){
  if(!firebaseConfig)throw new Error('Live play is being connected. Please try again shortly.');
  if(state.service)return state.service;
  if(!state.servicePromise)state.servicePromise=connectRealtime(firebaseConfig,firebaseEmulators).then(result=>{state.service=result;if(state.disposed)return result;state.connected=result.connected!==false;if(result.watchConnection)state.connectionUnsubscribe=result.watchConnection(connected=>{if(state.disposed)return;state.connected=connected;render(state);});return result;}).catch(error=>{state.servicePromise=null;throw error;});
  return state.servicePromise;
}
function remember(state,asHost){
  try{sessionStorage.setItem(SESSION_KEY,JSON.stringify({pin:state.pin,uid:state.service.uid,asHost,name:state.form.name,avatar:state.form.avatar}));}catch{}
}
function forget(){try{sessionStorage.removeItem(SESSION_KEY);}catch{}}
async function restoreSession(state){
  let saved;try{saved=JSON.parse(sessionStorage.getItem(SESSION_KEY)||'null');}catch{return;}
  if(!saved?.pin||!saved.uid)return;
  if(Boolean(saved.asHost)!==(state.routeMode==='host'))return;
  state.busy=true;render(state);
  try{
    const api=await service(state);
    if(state.disposed)return;
    if(api.uid!==saved.uid){forget();state.busy=false;render(state);return;}
    state.pin=normalizePin(saved.pin);state.form.name=saved.name||'';state.form.avatar=avatars[avatarValue(saved.avatar)].id;
    if(!saved.asHost)await api.joinRoom(state.pin,{name:state.form.name,avatar:avatarValue(state.form.avatar)});
    if(state.disposed)return;
    watch(state);
  }catch(error){forget();state.pin='';state.error=visibleError(error);}
  finally{if(!state.disposed){state.busy=false;render(state);}}
}
function watch(state){
  state.unsubscribe?.();state.error='';
  state.unsubscribe=state.service.watchRoom(state.pin,room=>{
    if(state.disposed)return;
    const previousRound=state.room?.round;
    const previousPhase=state.room?.phase;
    if(room?.hostId===state.service.uid && state.routeMode!=='host'){forget();state.pin='';state.room=null;state.error='This session belongs to a host. Use a different device or browser profile to join as a player.';render(state);return;}
    state.room=room;
    if(!room){forget();state.pin='';state.error='This game could not be found. Ask the host for a new PIN.';}
    if(previousRound!==room?.round){state.pendingChoice=null;state.answerBusy=false;state.revealing=false;state.autoRevealKey=null;}
    if(previousPhase!==room?.phase && room?.phase!=='question')state.revealing=false;
    render(state);
  },error=>setError(state,error));
}
async function run(state,task){
  if(state.busy||state.disposed)return;
  state.busy=true;state.error='';render(state);
  try{await task();}catch(error){if(!state.disposed)state.error=visibleError(error);}
  finally{if(!state.disposed){state.busy=false;render(state);}}
}
async function hostGame(state){
  if(state.routeMode!=='host')return;
  const ids=buildRoomQuestionIds(questionPool(state),state.form.topic,Number(state.form.count),Math.random);
  if(!ids.length){setError(state,'There are no questions in this topic yet. Choose another topic.');return;}
  await run(state,async()=>{
    const api=await service(state);const pin=await api.createRoom({questionIds:ids,duration:Number(state.form.duration),title:state.form.title.trim()||'The design eye challenge',appearance:{theme:state.form.theme,motion:state.form.motion}});
    if(state.disposed)return;
    state.pin=String(pin);remember(state,true);watch(state);
  });
}
async function joinGame(state){
  if(state.routeMode!=='join')return;
  const pin=normalizePin(state.form.pin);const nickname=validateNickname(state.form.name);
  if(!pin){setError(state,'Enter the six-digit game PIN from your host.');return;}
  if(!nickname.valid){setError(state,nickname.error);return;}
  state.form.name=nickname.name;
  await run(state,async()=>{
    const api=await service(state);await api.joinRoom(pin,{name:nickname.name,avatar:avatarValue(state.form.avatar)});
    if(state.disposed)return;
    state.pin=pin;remember(state,false);watch(state);
  });
}
async function answer(state,choice){
  if(state.disposed||host(state)||state.room?.phase!=='question'||myAnswer(state)||state.answerBusy||state.pendingChoice!==null||remaining(state)<=0)return;
  if(![0,1].includes(choice))return;
  const round=state.room.round;
  state.answerBusy=true;state.pendingChoice=choice;state.error='';render(state);
  try{await state.service.submitAnswer(state.pin,round,choice);}
  catch(error){if(!state.disposed && state.room?.round===round){state.pendingChoice=null;state.error=visibleError(error);}}
  finally{if(!state.disposed){state.answerBusy=false;render(state);}}
}
async function reveal(state){
  if(!host(state)||state.room?.phase!=='question'||state.revealing)return;
  state.revealing=true;render(state);
  try{await state.service.revealRound(state.pin,Object.fromEntries(state.challenges.map(q=>[q.id,q])));}
  catch(error){state.revealing=false;setError(state,error);}
}
async function exit(state){
  if(!state.room){const cb=state.onExit;unmountLive();cb();return;}
  await run(state,async()=>{
    if(host(state))await state.service.closeRoom(state.pin);else await state.service.leaveRoom(state.pin);
    forget();const cb=state.onExit;unmountLive();cb();
  });
}
function handleInput(state,event){
  const key=event.target.dataset.liveField;
  if(key && Object.hasOwn(state.form,key)){state.form[key]=event.target.type==='checkbox'?event.target.checked:event.target.value;if(key==='motion')savePreferences(state);if(['topic','count','motion'].includes(key)){render(state);state.container.querySelector(`[data-live-field="${key}"]`)?.focus();}}
}
function handleSubmit(state,event){
  const form=event.target.closest('[data-live-form]');if(!form)return;
  event.preventDefault();if(state.busy||!firebaseConfig)return;primeAudio(state);
  if(form.dataset.liveForm==='host')hostGame(state);else joinGame(state);
}
function handleClick(state,event){
  const target=event.target.closest('[data-live-action]');if(!target||target.disabled)return;
  const action=target.dataset.liveAction;
  if(action==='sound'){state.sound=!state.sound;savePreferences(state);primeAudio(state);if(state.sound)playTone(state,'question');render(state);state.container.querySelector('[data-live-action="sound"]')?.focus();return;}
  primeAudio(state);
  if(action==='theme'){state.form.theme=themes.some(t=>t.id===target.dataset.theme)?target.dataset.theme:'purple';savePreferences(state);render(state);state.container.querySelector(`[data-theme-option="${state.form.theme}"]`)?.focus();return;}
  if(action==='mode'){state.form.mode=target.dataset.mode==='full'?'full':'visual';render(state);state.container.querySelector(`[data-mode="${state.form.mode}"]`)?.focus();return;}
  if(action==='avatar'){state.form.avatar=target.dataset.avatar;render(state);state.container.querySelector(`[data-avatar="${state.form.avatar}"]`)?.focus();}
  else if(action==='answer')answer(state,Number(target.dataset.choice));
  else if(action==='start')run(state,()=>state.service.startRound(state.pin,0));
  else if(action==='reveal')reveal(state);
  else if(action==='ranking')run(state,()=>state.service.showLeaderboard(state.pin));
  else if(action==='next')run(state,()=>state.service.startRound(state.pin,state.room.round+1));
  else if(action==='finish')run(state,()=>state.service.finishRoom(state.pin));
  else if(action==='exit'){if(state.room&&state.room.phase!=='closed'){state.quitConfirm=true;render(state);}else exit(state);}
  else if(action==='cancel-exit'){state.quitConfirm=false;render(state);}
  else if(action==='confirm-exit')exit(state);
  else if(action==='retry'){state.error='';if(state.pin&&state.service)watch(state);else render(state);}
  else if(action==='new-game'){state.unsubscribe?.();state.unsubscribe=null;state.room=null;state.pin='';state.error='';state.pendingChoice=null;forget();render(state);}
  else if(action==='copy')copyLink(state);
}
function handleKey(state,event){
  if(event.target.matches('input,textarea,select')||event.altKey||event.ctrlKey||event.metaKey)return;
  if(event.key==='1'||event.key==='2'){event.preventDefault();answer(state,Number(event.key)-1);}
  if(event.key==='Escape' && state.quitConfirm){state.quitConfirm=false;render(state);}
}
async function copyLink(state){
  const link=new URL('/',location.origin);link.searchParams.set('join',state.pin);if(new URLSearchParams(location.search).get('emulator')==='1')link.searchParams.set('emulator','1');
  try{await navigator.clipboard.writeText(link.href);toast(state,'Join link copied. Send it to your players.');}
  catch{toast(state,`Share this game PIN: ${state.pin}`);}
}
function remaining(state){
  const room=state.room;if(!room||room.phase!=='question')return 0;
  const now=state.service?.serverNow?.()||Date.now();
  return Math.max(0,Math.ceil((Number(room.duration)*1000-(now-Number(room.startedAt)))/1000));
}
function tick(state){
  if(state.disposed||state.room?.phase!=='question')return;
  const seconds=remaining(state);const full=Number(state.room.duration)||30;
  state.container.querySelectorAll('[data-live-timer]').forEach(el=>{el.textContent=String(seconds).padStart(2,'0');el.classList.toggle('urgent',seconds<=5);});
  state.container.querySelectorAll('[data-live-timebar]').forEach(el=>{el.style.width=`${Math.min(100,seconds/full*100)}%`;});
  if(seconds===0)state.container.querySelectorAll('[data-live-action="answer"]').forEach(el=>el.disabled=true);
  if(host(state)&&(seconds===0||shouldEndRound(state.room))){const key=`${state.pin}:${state.room.round}:${state.room.startedAt}`;if(state.autoRevealKey!==key){state.autoRevealKey=key;reveal(state);}}
}
function topbar(state){
  const playing=Boolean(state.room);
  const provider=firebaseEmulators?'Local Firebase test':firebaseConfig?'Live · Firebase':'Live setup pending';
  return `<header class="live-topbar"><button class="live-brand" data-live-action="exit" aria-label="Exit live play"><span>${icon('layers',23)}</span>design<span class="live-brand-light">gym</span><i>LIVE</i></button><div class="live-topbar-right"><span class="live-provider-badge ${firebaseConfig?'is-ready':''}">${escape(provider)}</span>${playing?`<span class="live-room-chip">GAME PIN <strong>${escape(state.pin)}</strong></span>`:'<span class="live-topbar-note">A better design eye, together.</span>'}<button class="live-sound-button ${state.sound?'is-on':''}" data-live-action="sound" aria-label="Sound ${state.sound?'on':'off'}" aria-pressed="${state.sound}" title="Sound ${state.sound?'on':'off'}">${icon(state.sound?'sound':'mute',18)}</button><button class="live-exit" data-live-action="exit" aria-label="${playing?'Leave live game':'Back to game entry'}">${icon('close',20)}</button></div></header>`;
}
function errorBanner(state){return state.error?`<div class="live-error" role="alert">${icon('info',18)}<span>${escape(state.error)}</span><button data-live-action="retry">Try again ${icon('refresh',13)}</button></div>`:'';}
function render(state){
  if(state.disposed)return;
  clearInterval(state.timer);
  const look=appearance(state);const phaseKey=state.room?`${state.room.phase}:${state.room.round}`:'entry';const animate=phaseKey!==state.lastAnimatedPhaseKey;state.lastAnimatedPhaseKey=phaseKey;if(animate&&state.room?.phase==='question')playTone(state,'question');if(animate&&state.room?.phase==='reveal')playTone(state,!host(state)&&myAnswer(state)?.choice===question(state)?.correct?'correct':'reveal');
  state.content.innerHTML=`<div class="live-shell live-party-stage ${animate?'live-phase-enter':''}" data-theme="${look.theme}" data-motion="${look.motion}" data-phase="${escape(state.room?.phase||'entry')}"><div class="live-stage-art" aria-hidden="true"><i></i><i></i><i></i></div>${state.room?.phase==='finished'&&look.motion?confetti():''}${topbar(state)}${state.room?renderRoom(state):state.pin?`<main class="live-room live-opening-room"><span class="live-spinner"></span><h1>Opening your room…</h1><p>A little friendly competition is on its way.</p>${errorBanner(state)}</main>`:renderEntry(state)}<div class="live-toast" role="status" aria-live="polite" data-live-toast></div>${state.quitConfirm?quitDialog(state):''}</div>`;
  mountLobbyMusic(state.musicContainer,{isHost:host(state),phase:state.room?.phase||'entry'});
  if(state.room?.phase==='question'){tick(state);state.timer=setInterval(()=>tick(state),250);}
}
function renderEntry(state){
  const isHost=state.routeMode==='host';
  return `<main class="live-entry ${isHost?'live-entry-host':'live-entry-join'}"><div class="live-entry-heading"><span class="live-eyebrow"><i></i> ${isHost?'YOU BRING THE PEOPLE':'TRUST YOUR EYE. JOIN THE FUN.'}</span><h1>${isHost?'Your room.<br><span>Your rules.</span>':'Ready?<br><span>Let’s play.</span>'}</h1><p>${isHost?'Pick your questions, make it yours, and get the room playing.':'Enter your game PIN, choose a nickname, and get ready to spot good design.'}</p></div><section class="live-entry-card"><div class="live-entry-card-body">${errorBanner(state)}${!firebaseConfig?`<div class="live-setup-note">${icon('info',20)}<div><strong>Live play is being connected.</strong><p>The game connection is being prepared. Please try again shortly.</p></div></div>`:''}${isHost?hostForm(state):joinForm(state)}</div></section><div class="live-entry-footer"><span>${icon('grid',15)} ${state.challenges.length} design questions</span><span>${icon('clock',15)} Real-time rounds</span><span>${icon('trophy',15)} A little friendly rivalry</span></div></main>`;
}
function hostForm(state){
  const disabled=state.busy||!firebaseConfig;const available=availableQuestions(state);
  return `<div class="live-form-heading"><h2>You bring the people.<br>We’ll bring the questions.</h2><p>Pick your challenge and share a game PIN.</p></div><form data-live-form="host"><span class="live-field-label">CHOOSE YOUR CHALLENGE</span><div class="live-mode-picker" role="group" aria-label="Question style"><button type="button" data-live-action="mode" data-mode="visual" aria-pressed="${state.form.mode==='visual'}" class="${state.form.mode==='visual'?'selected':''}">${icon('grid',15)}<span>Visual challenges<small>Spot the better design</small></span></button><button type="button" data-live-action="mode" data-mode="full" aria-pressed="${state.form.mode==='full'}" class="${state.form.mode==='full'?'selected':''}">${icon('book',15)}<span>Full foundations<small>Visuals + real scenarios</small></span></button></div><label class="live-field-label" for="live-title">GAME NAME</label><input class="live-input" id="live-title" data-live-field="title" value="${escape(state.form.title)}" maxlength="60" placeholder="The design eye challenge" required><label class="live-field-label" for="live-topic">WHAT ARE WE PRACTICING?</label><select class="live-input" id="live-topic" data-live-field="topic"><option value="all">A little bit of everything</option>${state.topics.map(t=>`<option value="${escape(t.id)}" ${state.form.topic===t.id?'selected':''}>${escape(t.label)}</option>`).join('')}</select><p class="live-question-availability" role="status">${available.length} ${state.form.mode==='visual'?'visual challenges':'questions'} available · ${Math.min(Number(state.form.count),available.length)} in this game</p><div class="live-form-columns"><div><label class="live-field-label" for="live-count">QUESTIONS</label><select class="live-input" id="live-count" data-live-field="count">${[8,10,20].map(n=>`<option value="${n}" ${Number(state.form.count)===n?'selected':''}>${n} questions</option>`).join('')}</select></div><div><label class="live-field-label" for="live-duration">TIME PER QUESTION</label><select class="live-input" id="live-duration" data-live-field="duration">${[15,30,45].map(n=>`<option value="${n}" ${Number(state.form.duration)===n?'selected':''}>${n} seconds</option>`).join('')}</select></div></div>${appearancePicker(state)}<button class="live-primary live-full" type="submit" ${disabled||!available.length?'disabled':''}>${state.busy?'<span class="live-spinner"></span> Creating your game…':`Create a game ${icon('arrow',18)}`}</button><p class="live-form-footnote">You’ll host the room. Players join on their own devices.</p></form>`;
}
function joinForm(state){
  const disabled=state.busy||!firebaseConfig;
  return `<div class="live-form-heading"><h2>Join the game.</h2><p>Your host has the PIN. You’ve got the eye.</p></div><form data-live-form="join"><label class="live-field-label" for="live-pin">GAME PIN</label><input class="live-input live-pin-input" id="live-pin" data-live-field="pin" value="${escape(state.form.pin)}" maxlength="9" inputmode="numeric" pattern="[0-9 -]{6,9}" autocomplete="off" placeholder="000 000" required><label class="live-field-label" for="live-name">WHAT SHOULD WE CALL YOU?</label><input class="live-input" id="live-name" data-live-field="name" value="${escape(state.form.name)}" minlength="1" maxlength="20" autocomplete="nickname" placeholder="Your nickname" required><span class="live-field-label">PICK YOUR LITTLE SIDEKICK</span><div class="live-avatar-options" role="group" aria-label="Choose your avatar">${avatars.map(a=>`<button type="button" aria-label="${a.label}" aria-pressed="${state.form.avatar===a.id}" class="${state.form.avatar===a.id?'selected':''}" data-live-action="avatar" data-avatar="${a.id}">${avatar(a.id)}</button>`).join('')}</div><button class="live-primary live-full" type="submit" ${disabled?'disabled':''}>${state.busy?'<span class="live-spinner"></span> Finding your game…':`Let’s play ${icon('arrow',18)}`}</button><p class="live-form-footnote">A good eye beats a lucky guess. You’ve got this.</p></form>`;
}
function renderRoom(state){
  const phase=state.room.phase;
  if(phase==='closed')return `<main class="live-room live-closed"><span class="live-big-icon">${icon('heart',42)}</span><span class="live-eyebrow">THANKS FOR PLAYING</span><h1>This room has closed.</h1><p>The host ended this game. There’s always another chance to train your eye.</p><button class="live-primary" data-live-action="new-game">Find another game ${icon('arrow',17)}</button></main>`;
  if(phase==='lobby')return lobby(state);
  if(phase==='question'||phase==='reveal')return roundView(state);
  if(phase==='leaderboard'||phase==='finished')return leaderboard(state,phase==='finished');
  return `<main class="live-room"><span class="live-spinner"></span><p>Getting your game ready…</p>${errorBanner(state)}</main>`;
}
function lobby(state){
  const isHost=host(state);const players=connectedPlayers(state);
  return `<main class="live-room live-lobby">${errorBanner(state)}<span class="live-eyebrow"><i></i> ${isHost?'YOUR ROOM IS OPEN':'YOU’RE IN GOOD COMPANY'}</span><h1>${escape(state.room.title||'The design eye challenge')}</h1><p class="live-lobby-subtitle">${isHost?'Share the PIN, gather your people, and let the good guesses begin.':'You’re in! Get comfortable. Your host will start the game shortly.'}</p><div class="live-pin-card"><div><span>JOIN WITH GAME PIN</span><strong>${escape(state.pin.slice(0,3))}<i></i>${escape(state.pin.slice(3))}</strong></div><button class="live-copy-button" data-live-action="copy" aria-label="Copy game invitation">${icon('external',20)}<span>Copy join link</span></button></div><div class="live-lobby-meta"><span>${icon('layers',16)} ${state.room.questionIds.length} questions</span><i></i><span>${icon('clock',16)} ${state.room.duration}s per round</span><i></i><span>${icon('bolt',16)} Faster answers, more points</span></div><section class="live-players-section"><div class="live-players-heading"><h2>The room <span>${players.length}</span></h2><span class="live-connection ${state.connected?'':'is-offline'}"><i></i> ${state.connected?'LIVE':'RECONNECTING'}</span></div>${players.length?`<div class="live-players-grid">${players.map(([uid,p])=>`<div class="live-player-chip ${uid===state.service.uid?'is-me':''}">${avatar(p.avatar)}<span>${escape(p.name)}${uid===state.service.uid?'<small>YOU</small>':''}</span></div>`).join('')}</div>`:`<div class="live-waiting-players"><span class="live-waiting-orbit">✦</span><h3>A little quiet before the fun.</h3><p>Your players will appear here as they join.</p></div>`}</section><div class="live-lobby-bottom">${isHost?`<p>${players.length?`${players.length} ${players.length===1?'player is':'players are'} ready. Let’s see those design instincts.`:'Waiting for your first player…'}</p><button class="live-primary" data-live-action="start" ${state.busy||!players.length?'disabled':''}>${state.busy?'<span class="live-spinner"></span> Starting…':`Start the game ${icon('play',17)}`}</button>`:`<div class="live-waiting-host"><span class="live-spinner"></span> Waiting for the host to start…</div>`}</div></main>`;
}
function roundView(state){
  const q=question(state);if(!q)return `<main class="live-room">${errorBanner(state)}<h1>This question is unavailable.</h1><button class="live-primary" data-live-action="exit">Leave game</button></main>`;
  const isHost=host(state);const revealed=state.room.phase==='reveal';const mine=myAnswer(state);const selected=mine?.choice??state.pendingChoice;const submitted=selected!==null&&selected!==undefined;const answerCount=Object.keys(currentAnswers(state)).length;const count=Object.keys(state.room.players||{}).length;const seconds=remaining(state);const correct=mine?.choice===q.correct;
  return `<main class="live-room live-round">${errorBanner(state)}<div class="live-round-meta"><span class="live-round-number">QUESTION <strong>${state.room.round+1}<i>/</i>${state.room.questionIds.length}</strong></span><span class="live-round-topic">${escape(state.topics.find(t=>t.id===q.topic)?.label||'Design foundations')}</span><span class="live-round-audience">${icon('bolt',15)} ${answerCount} / ${count} answered</span></div><div class="live-round-progress"><span style="width:${(state.room.round+1)/state.room.questionIds.length*100}%"></span></div><div class="live-question-heading"><span class="live-eyebrow">${revealed?'A LITTLE MORE DESIGN WISDOM':isHost?'TRUST YOUR EYE':'ONE GOOD DECISION'}</span><h1>${escape(q.prompt)}</h1><p>${revealed?escape(q.principle):isHost?'Your players are making their picks.':'Choose the example that best answers the question.'}</p></div><div class="live-answer-grid ${q.visual==='course-concept'?'live-scenario-grid':''}" role="group" aria-label="Answer choices">${q.options.map((option,i)=>{const status=revealed?(i===q.correct?'correct':i===selected?'incorrect':'muted'):submitted?(i===selected?'selected':'dimmed'):'';return `<button class="live-answer-card ${status}" data-live-action="answer" data-choice="${i}" ${isHost||revealed||submitted||seconds<=0?'disabled':''} aria-label="Option ${i===0?'A':'B'}. ${escape(describeAnswerVisual(q,i,revealed))}" aria-pressed="${i===selected}"><div class="live-visual-surface">${renderAnnotatedVisual(q,i,revealed)}</div><span class="live-answer-caption"><span class="live-choice-key" aria-hidden="true">${i===0?'▲':'◆'}</span><span>Option ${i===0?'A':'B'}</span><span class="live-choice-shortcut" aria-hidden="true">${i+1}</span><span class="live-choice-result">${revealed&&i===q.correct?icon('check',18):revealed&&i===selected?icon('close',18):submitted&&i===selected?icon('lock',16):''}</span></span></button>`;}).join('')}</div>${revealed?renderVisualComparisonTip(q):''}${!revealed&&submitted&&!isHost?lockedPanel(state,selected):''}${revealed?`<section class="live-reveal"><div class="live-reveal-copy"><span class="live-reveal-icon ${!isHost&&!correct?'is-missed':''}">${correct&&!isHost?'<span class="live-reaction-star">✦</span>':icon(isHost?'book':'info',22)}</span><div><strong>${isHost?'Let’s learn what makes it work.':correct?'Sharp eye. That’s the one!':mine?'A little lesson for next time.':'Time’s up. Here’s what to notice.'}</strong><p>${escape(q.takeaway)}</p>${!isHost&&correct&&Number(myScore(state).streak)>1?`<span class="live-streak-reaction">${icon('flame',14)} ${Number(myScore(state).streak)} correct in a row</span>`:''}</div>${!isHost?`<span class="live-points-gained">+${Number(myScore(state).lastPoints)||0}<small>POINTS</small></span>`:''}</div><div class="live-reveal-actions"><span class="live-learning-label">${icon('book',16)} A little design wisdom</span>${isHost?`<button class="live-primary" data-live-action="ranking" ${state.busy?'disabled':''}>${state.busy?'One moment…':'See the leaderboard'} ${icon('arrow',17)}</button>`:'<span class="live-small-wait">'+icon('lock',13)+' Waiting for the host</span>'}</div><div class="live-theory"><div class="live-insight-heading">${icon('spark',18)}<span>Why it works</span></div><strong>${escape(q.principle)}</strong><p>${escape(q.explanation)}</p><span class="live-insight-footer">${isHost?'Take a moment to talk it through. You choose when to continue.':'Read the explanation. Your host will lead the next step.'}</span></div></section>`:`<footer class="live-round-footer"><div class="live-time"><span class="live-timer-ring">${icon('clock',20)}<strong data-live-timer>${String(seconds).padStart(2,'0')}</strong></span><div><strong>${submitted?'The reveal is coming.':isHost?'A little thinking time.':'A good eye takes a moment.'}</strong><span>${submitted?'Your host controls the next step.':isHost?'The answer reveals when time runs out.':'Pick one. Faster correct answers earn more points.'}</span></div></div>${isHost?`<button class="live-secondary" data-live-action="reveal" ${state.revealing?'disabled':''}>${state.revealing?'Revealing…':`Reveal answers ${icon('arrow',16)}`}</button>`:submitted?`<span class="live-answer-locked">${icon('lock',15)} ${state.answerBusy?'Sending your answer…':'Answer submitted'}</span>`:'<span class="live-keyboard-hint">Press <kbd>1</kbd> or <kbd>2</kbd> to choose</span>'}<div class="live-time-track"><i data-live-timebar style="width:${seconds/Number(state.room.duration)*100}%"></i></div></footer>`}</main>`;
}
function leaderboard(state,finished){
  const isHost=host(state);const ranking=rankPlayers(state.room);const last=state.room.round>=state.room.questionIds.length-1;const myRank=ranking.find(p=>p.uid===state.service.uid);const podium=ranking.slice(0,3);
  return `<main class="live-room live-leaderboard">${errorBanner(state)}<span class="live-eyebrow">${icon('trophy',16)} ${finished?'A LITTLE WISER. A LITTLE CLOSER.':'A LITTLE FRIENDLY RIVALRY'}</span><h1>${finished?'Good eyes. Great game.':'Look who’s got the eye.'}</h1><p class="live-leaderboard-subtitle">${finished?`${escape(state.room.title)} · ${state.room.questionIds.length} questions of good design.`:`Round ${state.room.round+1} is in the books. There’s still room for an aha moment.`}</p>${finished&&podium.length?`<div class="live-podium">${[1,0,2].filter(i=>podium[i]).map(i=>{const p=podium[i];return `<div class="live-podium-player live-podium-place-${i+1}">${i===0?'<span class="live-winner-crown">✦</span>':''}${avatar(p.avatar,true)}<strong>${escape(p.name)}</strong><span>${Number(p.score)||0}<small>pts</small></span><div class="live-podium-block"><b>${i+1}</b></div></div>`;}).join('')}</div>`:''}<section class="live-ranking"><div class="live-ranking-header"><span>THE LEADERBOARD</span><span>${ranking.length} ${ranking.length===1?'PLAYER':'PLAYERS'}</span></div>${ranking.length?ranking.map((p,index)=>`<div class="live-ranking-row ${p.uid===state.service.uid?'is-me':''}"><span class="live-rank-number">${p.rank||index+1}</span>${avatar(p.avatar)}<span class="live-rank-name">${escape(p.name)}${p.uid===state.service.uid?'<small>YOU</small>':''}<span>${Number(p.correct)||0} correct ${Number(p.streak)>1?`<i>·</i> ${Number(p.streak)} in a row`:''}</span></span><strong>${(Number(p.score)||0).toLocaleString()}<small>PTS</small></strong></div>`).join(''):'<div class="live-waiting-players"><p>No player scores to show yet.</p></div>'}</section><div class="live-ranking-bottom">${isHost?finished?`<p>Thanks for making a little room for good design.</p><button class="live-primary" data-live-action="new-game">Host another game ${icon('refresh',17)}</button>`:`<p>${last?'One last look. Then, a little celebration.':`${state.room.questionIds.length-state.room.round-1} more chances to trust your eye.`}</p><button class="live-primary" data-live-action="${last?'finish':'next'}" ${state.busy?'disabled':''}>${state.busy?'One moment…':last?'See the final results':'Next question'} ${icon('arrow',18)}</button>`:finished?`<p>${myRank?`You finished ${ordinal(myRank.rank)}. Every round makes your design eye a little sharper.`:'Thanks for playing. Every round makes your design eye sharper.'}</p><button class="live-primary" data-live-action="new-game">Join another game ${icon('arrow',17)}</button>`:`<div class="live-waiting-host"><span class="live-spinner"></span> Waiting for the host to start the next question.</div>`}</div></main>`;
}
function ordinal(n){const v=n%100;return `${n}${v>=11&&v<=13?'th':n%10===1?'st':n%10===2?'nd':n%10===3?'rd':'th'}`;}
function quitDialog(state){return `<div class="live-dialog-backdrop"><section class="live-dialog" role="dialog" aria-modal="true" aria-labelledby="live-quit-title"><span class="live-big-icon">${icon('info',29)}</span><h2 id="live-quit-title">${host(state)?'End this live game?':'Leave this live game?'}</h2><p>${host(state)?'Your room will close and your players will leave the game.':'You’ll leave the room. You can join again with the game PIN while it’s still open.'}</p><div><button class="live-secondary" data-live-action="cancel-exit">Keep playing</button><button class="live-primary" data-live-action="confirm-exit" ${state.busy?'disabled':''}>${state.busy?'One moment…':host(state)?'End game':'Leave game'}</button></div></section></div>`;}

function appearancePicker(state){
  return `<fieldset class="live-appearance"><legend>MAKE IT YOURS</legend><div class="live-theme-picker" role="group" aria-label="Room theme">${themes.map(t=>`<button type="button" data-live-action="theme" data-theme="${t.id}" data-theme-option="${t.id}" aria-label="${t.label} theme" aria-pressed="${state.form.theme===t.id}" class="${state.form.theme===t.id?'selected':''}"><i style="background:${t.color}">${state.form.theme===t.id?icon('check',14):''}</i><span>${t.label}</span></button>`).join('')}</div><label class="live-motion-option"><span><strong>A little celebration</strong><small>Round transitions and final confetti</small></span><input type="checkbox" data-live-field="motion" ${state.form.motion?'checked':''} aria-label="Enable motion and celebrations"><i aria-hidden="true"></i></label></fieldset>`;
}
function lockedPanel(state,selected){return `<section class="live-locked-panel" role="status" aria-live="polite"><span>${icon('lock',21)}</span><div><strong>${state.answerBusy?'Locking in your answer…':'Answer locked · Waiting for the host'}</strong><p>Your pick is Option ${selected===0?'A':'B'}. ${state.answerBusy?'Sending your choice to the room.':'You can relax. Your host will reveal the answer.'}</p></div><b>${selected===0?'▲':'◆'}</b></section>`;}
function confetti(){const colors=['#ffd64b','#ff6a8b','#74d7e8','#8de296','#fff'];return `<div class="live-confetti" aria-hidden="true">${Array.from({length:20},(_,i)=>`<i style="--confetti-x:${(i*37+9)%100}%;--confetti-delay:${(i%5)*.23}s;--confetti-turn:${(i%2?-1:1)*(160+i*19)}deg;--confetti-color:${colors[i%colors.length]};--confetti-drift:${(i%2?-1:1)*(20+i%4*13)}px"></i>`).join('')}</div>`;}

function loadPreferences(){try{const value=JSON.parse(localStorage.getItem(PREFERENCES_KEY)||'{}');return {theme:themes.some(t=>t.id===value.theme)?value.theme:'purple',motion:value.motion!==false,sound:value.sound===true};}catch{return {theme:'purple',motion:true,sound:false};}}
function savePreferences(state){try{localStorage.setItem(PREFERENCES_KEY,JSON.stringify({theme:state.form.theme,motion:state.form.motion,sound:state.sound}));}catch{}}
function primeAudio(state){if(!state.sound||state.disposed)return;try{const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return;state.audioContext ||= new Audio();if(state.audioContext.state==='suspended')state.audioContext.resume().catch(()=>{});}catch{}}
function playTone(state,kind){if(!state.sound||state.disposed||!state.audioContext||state.audioContext.state!=='running')return;try{const context=state.audioContext;const notes=kind==='correct'?[784,1046.5]:kind==='question'?[523.25,659.25]:[659.25,523.25];notes.forEach((frequency,i)=>{const oscillator=context.createOscillator();const gain=context.createGain();const start=context.currentTime+i*.095;oscillator.type='sine';oscillator.frequency.value=frequency;gain.gain.setValueAtTime(0,start);gain.gain.linearRampToValueAtTime(.045,start+.012);gain.gain.exponentialRampToValueAtTime(.001,start+.14);oscillator.connect(gain);gain.connect(context.destination);oscillator.start(start);oscillator.stop(start+.15);});}catch{}}
