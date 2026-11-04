// Audio Monopoli Blox — semua suara dibuat lewat Web Audio API (tanpa file mp3).
(function(){
const LS=(k,v)=>{try{if(v===undefined)return localStorage.getItem(k);localStorage.setItem(k,v)}catch(e){return null}};
let ctx,master,musicG,sfxG,noiseBuf,timer,step=0,nextT=0,playing=false;
const st={music:LS('a_music')!=='0',sfx:LS('a_sfx')!=='0'};
const mtof=m=>440*Math.pow(2,(m-69)/12);

function init(){
 if(ctx)return ctx;
 const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return null;
 ctx=new AC();
 const comp=ctx.createDynamicsCompressor();
 master=ctx.createGain();master.gain.value=.9;
 musicG=ctx.createGain();musicG.gain.value=st.music?.16:0;
 sfxG=ctx.createGain();sfxG.gain.value=st.sfx?.55:0;
 musicG.connect(master);sfxG.connect(master);master.connect(comp);comp.connect(ctx.destination);
 noiseBuf=ctx.createBuffer(1,ctx.sampleRate,ctx.sampleRate);
 const d=noiseBuf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
 return ctx}

// satu nada: tipe gelombang, frekuensi, mulai, durasi, volume, tujuan, (slide ke frekuensi lain)
function tone(type,f,t,dur,vol,dest,f2){
 const o=ctx.createOscillator(),g=ctx.createGain();
 o.type=type;o.frequency.setValueAtTime(f,t);if(f2)o.frequency.exponentialRampToValueAtTime(f2,t+dur);
 g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+.008);
 g.gain.exponentialRampToValueAtTime(.0001,t+dur);
 o.connect(g);g.connect(dest);o.start(t);o.stop(t+dur+.05)}
function noise(t,dur,vol,dest,freq,q,type){
 const s=ctx.createBufferSource(),f=ctx.createBiquadFilter(),g=ctx.createGain();
 s.buffer=noiseBuf;f.type=type||'bandpass';f.frequency.value=freq||3000;f.Q.value=q||1;
 g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.0001,t+dur);
 s.connect(f);f.connect(g);g.connect(dest);s.start(t,Math.random()*.5);s.stop(t+dur+.02)}

// ===== MUSIK: loop 8 bar, 108 bpm =====
const BPM=108,EIGHTH=60/BPM/2;
const CH=[[48,64,67],[45,64,69],[41,65,69],[43,62,67],[48,64,67],[43,62,67],[45,64,69],[41,65,69]]; // [bass,t1,t2]
const CHN=[[0,4,7],[0,3,7],[0,4,7],[0,4,7],[0,4,7],[0,4,7],[0,3,7],[0,4,7]];
const MEL=[
 [76,0,79,0,76,74,72,0],[69,72,76,0,74,72,69,0],[72,0,77,0,76,72,69,0],[71,74,79,0,77,74,71,0],
 [79,0,76,0,72,76,79,0],[74,0,79,0,78,74,71,0],[72,76,81,0,79,76,72,0],[77,0,76,74,72,0,0,0]];
function music(i,t){
 const bar=Math.floor(i/8)%8,s=i%8,ch=CH[bar],root=ch[0];
 // bass
 if(s==0||s==4)tone('triangle',mtof(root),t,EIGHTH*1.8,.9,musicG);
 if(s==6)tone('triangle',mtof(root+7),t,EIGHTH*1.2,.6,musicG);
 // arpeggio (piano-ish)
 const iv=CHN[bar],arp=[0,1,2,1][s%4],n=root+12+iv[arp]+(s>=4&&s%4==2?12:0);
 tone('square',mtof(n),t,EIGHTH*.9,.12,musicG);
 // melodi
 const m=MEL[bar][s];if(m){tone('triangle',mtof(m),t,EIGHTH*1.7,.55,musicG);tone('sine',mtof(m+12),t,EIGHTH*1.2,.12,musicG)}
 // perkusi ringan
 if(s==0||s==4)noise(t,.12,.5,musicG,120,.7,'lowpass');
 if(s==2||s==6)noise(t,.08,.25,musicG,2200,1.2);
 if(s%2==1)noise(t,.03,.12,musicG,8000,1,'highpass')}
function tick(){
 if(!ctx||!playing)return;
 while(nextT<ctx.currentTime+.35){music(step,nextT);nextT+=EIGHTH;step++}}
function startMusic(){
 if(!init())return;if(ctx.state=='suspended')ctx.resume();
 if(playing)return;playing=true;nextT=ctx.currentTime+.1;step=0;timer=setInterval(tick,100);tick()}
function stopMusic(){playing=false;clearInterval(timer)}

// ===== EFEK SUARA =====
const FX={
 click(t){tone('square',660,t,.05,.15,sfxG,880)},
 dice(t){for(let i=0;i<9;i++)noise(t+i*.065,.05,.7,sfxG,1500+Math.random()*2500,2);
  tone('sine',180,t+.6,.12,.5,sfxG,90)},
 hop(t){tone('sine',420,t,.07,.25,sfxG,640)},
 land(t){tone('sine',200,t,.15,.5,sfxG,70);noise(t,.08,.3,sfxG,400,1,'lowpass')},
 coin(t){tone('square',988,t,.08,.18,sfxG);tone('square',1319,t+.07,.28,.18,sfxG)},
 pay(t){tone('sawtooth',330,t,.18,.2,sfxG,180);tone('sawtooth',220,t+.14,.25,.2,sfxG,110)},
 buy(t){[523,659,784,1047].forEach((f,i)=>tone('square',f,t+i*.07,.2,.16,sfxG));noise(t+.25,.2,.25,sfxG,6000,1,'highpass')},
 build(t){for(let i=0;i<3;i++){noise(t+i*.12,.06,.8,sfxG,900,2);tone('square',150,t+i*.12,.07,.25,sfxG,90)}
  tone('triangle',784,t+.4,.25,.3,sfxG)},
 card(t){noise(t,.18,.5,sfxG,5000,.8,'highpass');tone('triangle',880,t+.1,.15,.3,sfxG);tone('triangle',1175,t+.2,.25,.3,sfxG)},
 jail(t){for(let i=0;i<4;i++)tone('sawtooth',i%2?600:800,t+i*.18,.18,.2,sfxG);noise(t+.75,.25,.6,sfxG,300,1,'lowpass')},
 turn(t){tone('sine',784,t,.18,.35,sfxG);tone('sine',1047,t+.14,.35,.35,sfxG)},
 join(t){tone('sine',600,t,.1,.3,sfxG,900);tone('sine',900,t+.1,.15,.3,sfxG)},
 bankrupt(t){[392,330,262,196].forEach((f,i)=>tone('sawtooth',f,t+i*.2,.3,.22,sfxG))},
 win(t){[523,659,784,1047,784,1047,1319].forEach((f,i)=>{tone('square',f,t+i*.13,.25,.18,sfxG);tone('triangle',f/2,t+i*.13,.25,.3,sfxG)});
  tone('square',1568,t+.95,.9,.18,sfxG)},
 error(t){tone('square',200,t,.12,.2,sfxG);tone('square',150,t+.12,.2,.2,sfxG)}};

function play(name,delay){
 if(!st.sfx||!FX[name])return;if(!init())return;if(ctx.state=='suspended')ctx.resume();
 FX[name](ctx.currentTime+.01+(delay||0))}

function setMusic(on){st.music=on;LS('a_music',on?1:0);if(!init())return;
 musicG.gain.setTargetAtTime(on?.16:0,ctx.currentTime,.1);if(on)startMusic();else stopMusic()}
function setSfx(on){st.sfx=on;LS('a_sfx',on?1:0);if(!init())return;sfxG.gain.setTargetAtTime(on?.55:0,ctx.currentTime,.05)}

// browser memblokir audio sebelum ada interaksi → mulai di klik/sentuh pertama
function unlock(){if(!init())return;ctx.resume();if(st.music)startMusic()}
['pointerdown','keydown','touchstart'].forEach(e=>addEventListener(e,unlock,{once:true,passive:true}));
document.addEventListener('visibilitychange',()=>{if(!ctx)return;document.hidden?ctx.suspend():ctx.resume()});
// suara klik untuk semua tombol
document.addEventListener('click',e=>{if(e.target.closest&&e.target.closest('button'))play('click')},true);

// tombol kontrol melayang
function ui(){
 const b=document.createElement('div');
 b.style.cssText='position:fixed;right:10px;bottom:10px;z-index:20;display:flex;gap:6px';
 const mk=(k,on,off,set)=>{const x=document.createElement('button');
  x.style.cssText='width:42px;height:42px;padding:0;border-radius:50%;font-size:18px;background:#3a2a73;color:#fff;box-shadow:0 3px 0 #22164a';
  const r=()=>{x.textContent=st[k]?on:off;x.style.opacity=st[k]?1:.6;x.title=(k=='music'?'Musik ':'Efek suara ')+(st[k]?'nyala':'mati')};
  x.onclick=()=>{set(!st[k]);r()};r();return x};
 b.append(mk('music','🎵','🔇',setMusic),mk('sfx','🔊','🔈',setSfx));document.body.appendChild(b)}
if(document.body)ui();else addEventListener('DOMContentLoaded',ui);

window.Sound={play,setMusic,setSfx,state:st,unlock};
})();
