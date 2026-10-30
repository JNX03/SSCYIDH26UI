import {localizeElement} from './i18n.js';
import {icon} from './icons.js';
export const HALLOWEEN_EMBED_TRACK='https://api.soundcloud.com/tracks/732989191';
export const HALLOWEEN_TRACK='https://soundcloud.com/kahoot-lobby-music/halloween-original';
let current=null,apiPromise=null;
function widgetApi(){
 if(window.SC?.Widget)return Promise.resolve(window.SC);
 if(apiPromise)return apiPromise;
 apiPromise=new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='https://w.soundcloud.com/player/api.js';script.async=true;script.onload=()=>window.SC?.Widget?resolve(window.SC):reject(new Error('Player unavailable'));script.onerror=()=>reject(new Error('SoundCloud could not be reached'));document.head.append(script);}).catch(error=>{apiPromise=null;throw error;});
 return apiPromise;
}
export function mountLobbyMusic(container,{isHost,phase}){
 if(current?.container!==container){unmountLobbyMusic();create(container);}
 const active=isHost&&phase==='lobby';
 current.active=active;current.panel.hidden=!active;
 if(!active){current.wantPlay=false;current.widget?.pause();update(current);}
}
function create(container){
 const panel=document.createElement('section');panel.className='lobby-music-panel';panel.hidden=true;panel.setAttribute('aria-label','Halloween lobby music');
 panel.innerHTML=`<div class="lobby-music-heading"><span class="lobby-pumpkin" aria-hidden="true">🎃</span><div><strong>Halloween lobby</strong><a href="${HALLOWEEN_TRACK}" target="_blank" rel="noopener noreferrer">Kahoot · SoundCloud ${icon('external',10)}</a></div><button type="button" class="lobby-music-toggle" data-music-play aria-label="Play Halloween lobby music">${icon('play',17)}</button><button type="button" class="lobby-music-mute" data-music-mute aria-label="Mute music" disabled>${icon('sound',17)}</button></div><div class="lobby-music-player"></div><p class="lobby-music-status" role="status">Play Halloween lobby music.</p>`;
 container.append(panel);localizeElement(panel);
 const state={container,panel,widget:null,iframe:null,active:false,wantPlay:false,playing:false,muted:false,ready:false,disposed:false};current=state;
 panel.querySelector('[data-music-play]').addEventListener('click',()=>toggle(state));
 panel.querySelector('[data-music-mute]').addEventListener('click',()=>{state.muted=!state.muted;state.widget?.setVolume(state.muted?0:50);update(state);});
}
async function toggle(state){
 if(!state.active||state.disposed)return;
 state.wantPlay=!state.wantPlay;
 if(state.iframe){state.wantPlay?state.widget?.play():state.widget?.pause();update(state);return;}
 state.panel.querySelector('.lobby-music-status').textContent='Loading SoundCloud… You can also use the player’s play button.';
 const iframe=document.createElement('iframe');iframe.title='Kahoot Halloween Original — SoundCloud player';iframe.width='100%';iframe.height='96';iframe.scrolling='no';iframe.allow='autoplay; encrypted-media';iframe.setAttribute('frameborder','0');
 const embed=new URL('https://w.soundcloud.com/player/');embed.searchParams.set('url',HALLOWEEN_EMBED_TRACK);embed.searchParams.set('auto_play','true');embed.searchParams.set('color','#7851dc');embed.searchParams.set('show_artwork','false');embed.searchParams.set('show_comments','false');embed.searchParams.set('show_user','true');embed.searchParams.set('hide_related','true');embed.searchParams.set('sharing','false');embed.searchParams.set('buying','false');embed.searchParams.set('download','false');iframe.src=embed.href;
 state.iframe=iframe;state.panel.querySelector('.lobby-music-player').append(iframe);update(state);
 try{
  const SC=await widgetApi();if(state.disposed)return;
  const widget=SC.Widget(iframe);state.widget=widget;
  widget.bind(SC.Widget.Events.READY,()=>{if(state.disposed)return;state.ready=true;widget.setVolume(state.muted?0:50);if(state.wantPlay&&state.active)widget.play();else widget.pause();update(state);});
  widget.bind(SC.Widget.Events.PLAY,()=>{if(state.disposed)return;if(!state.active){widget.pause();return;}state.wantPlay=true;state.playing=true;update(state);});
  widget.bind(SC.Widget.Events.PAUSE,()=>{if(state.disposed)return;state.wantPlay=false;state.playing=false;update(state);});
  widget.bind(SC.Widget.Events.FINISH,()=>{if(state.active&&state.wantPlay){widget.seekTo(0);widget.play();}});
  widget.bind(SC.Widget.Events.ERROR,()=>{if(state.disposed)return;state.wantPlay=false;state.panel.querySelector('.lobby-music-status').textContent='SoundCloud could not play this track. Open the source link to check availability.';updateControls(state);});
 }catch{if(!state.disposed){state.panel.querySelector('.lobby-music-status').textContent='Use the SoundCloud player’s controls to play or pause the track.';}}
}
function updateControls(state){
 const play=state.panel.querySelector('[data-music-play]'),mute=state.panel.querySelector('[data-music-mute]');
 play.innerHTML=state.wantPlay?'<span aria-hidden="true">Ⅱ</span>':icon('play',17);play.setAttribute('aria-label',`${state.wantPlay?'Pause':'Play'} Halloween lobby music`);play.setAttribute('aria-pressed',String(state.wantPlay));
 mute.disabled=!state.ready;mute.innerHTML=icon(state.muted?'mute':'sound',17);mute.setAttribute('aria-label',state.muted?'Unmute music':'Mute music');mute.setAttribute('aria-pressed',String(state.muted));localizeElement(state.panel);
}
function update(state){if(state.disposed)return;updateControls(state);if(state.ready)state.panel.querySelector('.lobby-music-status').textContent=state.playing?(state.muted?'Music is playing, muted.':'The original Halloween track, playing through SoundCloud.'):state.wantPlay?'Ready. Press play in the SoundCloud player if playback has not started.':'Music paused. Ready when you are.';localizeElement(state.panel);}
export function unmountLobbyMusic(){if(!current)return;const state=current;state.disposed=true;try{state.widget?.pause();}catch{}state.panel.remove();current=null;}
