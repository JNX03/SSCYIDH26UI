import {topics,challenges as visualChallenges} from './challenges.js';
import {bonusChallenges} from './bonus.js';
import {designChallenges} from './design-challenges.js';
import {courseChallenges} from './course.js';
import {mountLive} from './live-ui.js';
const challenges=[...bonusChallenges,...visualChallenges,...designChallenges,...courseChallenges];
const routeMode=location.pathname.replace(/\/$/,'')==='/host'?'host':'join';
document.body.classList.add('game-only');
let toastTimer;
function toast(message){const el=document.querySelector('#toast');el.textContent=message;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),3200);}
mountLive(document.querySelector('#app'),{challenges,topics,routeMode,onExit:()=>location.assign('/'),onToast:toast});
