'use strict';
(()=>{
 const audio=new Audio('media/laki-welcome.wav');audio.preload='metadata';
 let alignment=null,error=null,loading=null,active=false,frameId=0,cueIndex=-1,shape='rest',lastTime=0,revision=0;
 const pose={jaw:0,round:0,wide:0,closed:0,bite:0};
 const params={rest:[0,0,0,0,0],A:[.88,0,.1,0,0],E:[.38,0,.65,0,0],I:[.20,0,.9,0,0],O:[.60,.8,-.15,0,0],U:[.22,1,-.22,0,0],MBP:[0,0,0,1,0],FV:[.12,0,.15,0,1],S:[.12,0,.35,0,0],L:[.34,0,.1,0,0]};
 const id=x=>document.getElementById(x);
 const ui={play:id('demo-play'),pause:id('demo-pause'),stop:id('demo-stop'),progress:id('demo-progress'),time:id('demo-time'),status:id('demo-status'),phoneme:id('demo-phoneme'),speed:id('demo-speed')};
 function classify(p){if(/[aɑæɐ]/u.test(p))return'A';if(/[ɛeœə]/u.test(p))return'E';if(/[iɪɨɯj]/u.test(p))return'I';if(/[oɔɒ]/u.test(p))return'O';if(/[uʊw]/u.test(p))return'U';if(/[mbp]/u.test(p))return'MBP';if(/[fv]/u.test(p))return'FV';if(/[lsrɾɹʎ]/u.test(p))return'L';if(/[tʃɕʑʂʐszʒdkgɡŋnɲçx]/u.test(p))return'S';return'rest'}
 const words=['Cześć,','jestem','Laki.','Jak','mogę','Ci','pomóc?'];
 async function load(){if(alignment)return alignment;if(!loading)loading=fetch('media/laki-welcome.json').then(r=>{if(!r.ok)throw Error('Nie można wczytać synchronizacji');return r.json()}).then(data=>{if(!data.cues?.length)throw Error('Brak danych głosek');alignment=data;let word=0,pending=false,spoken=false;data.cues.forEach((c,i)=>{if(c.phoneme==='^'||c.phoneme==='$'){c.word=-1}else if(/[\s,.?!]/u.test(c.phoneme)){c.word=spoken?word:-1;if(spoken)pending=true}else{if(pending){word=Math.min(words.length-1,word+1);pending=false}spoken=true;c.word=word}let p=c.phoneme;if(p==='ˈ'||p==='ˌ')p=data.cues.slice(i+1).find(n=>!['ˈ','ˌ'].includes(n.phoneme))?.phoneme||'';c.shape=classify(p)});return data}).catch(err=>{loading=null;throw err});return loading}
 function resetPose(){Object.keys(pose).forEach(k=>pose[k]=0);shape='rest';cueIndex=-1;id('demo-transcript').querySelectorAll('span').forEach(x=>x.classList.remove('current'));ui.phoneme.textContent='—';ui.progress.value=0;ui.time.textContent='0:00';}
 function stop(restore=true){revision++;ui.play.disabled=false;audio.pause();audio.currentTime=0;active=false;cancelAnimationFrame(frameId);resetPose();ui.pause.disabled=true;ui.pause.textContent='Pauza';ui.play.textContent='▶ Odtwórz test';ui.status.textContent='Gotowe nagranie PL · synchronizacja czasów głosek';if(restore&&typeof setState==='function'){setState('idle');id('signal').textContent='SYGNAŁ AUDIO —'}}
 id('tts-state').textContent='Piper PL / test';
 const originalStop=window.stopAll;
 window.stopAll=function(...args){stop(false);return originalStop.apply(this,args)};
 async function play(){if(active){stop();}window.stopAll();const ownRevision=revision;ui.play.disabled=true;try{ui.status.textContent='Wczytywanie nagrania…';await load();if(ownRevision!==revision)return;audio.playbackRate=Number(ui.speed.value);await audio.play();if(ownRevision!==revision){audio.pause();return}active=true;ui.play.disabled=false;ui.pause.disabled=false;ui.play.textContent='↻ Od początku';ui.status.textContent='Odtwarzanie · głos Piper PL';setState('speaking','Nagranie testowe · ruch ust według czasów głosek');id('signal').textContent='PIPER PL / SYNCHRONIZACJA FONEMÓW';eventLog('Test mowy uruchomiony','Cześć, jestem Laki. Jak mogę Ci pomóc?');lastTime=performance.now();tick(lastTime)}catch(err){if(ownRevision!==revision)return;error=err.message;stop();ui.status.textContent='Nie można odtworzyć: '+error;setState('error','Nie udało się odtworzyć testu mowy.')}}
 function tick(now){if(!active)return;frameId=requestAnimationFrame(tick);const t=audio.currentTime;let index=alignment.cues.findIndex(c=>t>=c.start&&t<c.end);if(index<0)index=alignment.cues.length-1;const cue=alignment.cues[index];shape=cue?.shape||'rest';const target=audio.paused?params.rest:(params[shape]||params.rest);
 // Coarticulation: smooth motion between sample-aligned phoneme targets.
 const dt=Math.min(.1,(now-lastTime)/1000);lastTime=now;const mix=1-Math.exp(-dt*32);Object.keys(pose).forEach((k,i)=>pose[k]+=(target[i]-pose[k])*mix);
 if(index!==cueIndex){cueIndex=index;ui.phoneme.textContent=shape==='rest'?'pauza':shape;id('demo-transcript').querySelectorAll('span').forEach((s,i)=>s.classList.toggle('current',i===cue?.word))}
 ui.progress.value=t/(alignment.duration||1);ui.time.textContent='0:'+String(Math.floor(t)).padStart(2,'0')+' / 0:'+String(Math.ceil(alignment.duration)).padStart(2,'0');
 }
 ui.play.onclick=play;ui.pause.onclick=async()=>{if(!active)return;if(audio.paused){try{await audio.play();ui.pause.textContent='Pauza';ui.status.textContent='Odtwarzanie · głos Piper PL';setState('speaking','Nagranie testowe · ruch ust według czasów głosek')}catch(e){ui.status.textContent='Odtwarzanie niedostępne'}}else{audio.pause();ui.pause.textContent='Wznów';ui.status.textContent='Wstrzymano';Object.keys(pose).forEach(k=>pose[k]=0);setState('idle','Test mowy wstrzymany.')}};
 ui.stop.onclick=()=>stop();ui.speed.onchange=()=>{audio.playbackRate=Number(ui.speed.value)};audio.onended=()=>{stop();ui.status.textContent='Test zakończony · możesz odtworzyć ponownie'};audio.onerror=()=>{if(active){stop();ui.status.textContent='Błąd pliku audio'}};
 // Any new conversation, microphone, file or manual state supersedes the demo.
 document.getElementById('chat-form').addEventListener('submit',()=>stop(false),true);
 document.querySelectorAll('[data-prompt],[data-preview],#mic').forEach(b=>b.addEventListener('click',()=>stop(false),true));
 id('audio-file').addEventListener('change',()=>stop(false),true);
 id('welcome').onclick=play;
 document.addEventListener('visibilitychange',()=>{if(document.hidden&&active){audio.pause();Object.keys(pose).forEach(k=>pose[k]=0);ui.pause.textContent='Wznów';ui.status.textContent='Wstrzymano po ukryciu karty';setState('idle','Test mowy wstrzymany.')}});
 addEventListener('pagehide',()=>stop(false));
 window.LakiSpeech={getState:()=>({active,paused:audio.paused,time:audio.currentTime,duration:alignment?.duration||0,shape,pose:{...pose},cue:alignment?.cues[cueIndex]||null,error}),stop,play};
})();
