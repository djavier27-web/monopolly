(function(){
const _B=typeof module!=='undefined'?require('./board.js'):null,BD=_B?_B.BOARD:BOARD,HH=_B?_B.H:H;
const R=n=>Math.floor(Math.random()*n),K=i=>'t'+i,cl=v=>Math.min(6,Math.max(1,parseInt(v)||1));
const COL=['#e5383b','#2f6fed','#2fbf71','#ffd23f','#e85aa8','#f5922f'],TOK=['🚗','🎩','🐶','🚀','👑','🐱'];
const CARDS=[['Menang lomba! +150',150],['Bayar dokter -50',-50],['Maju ke START +200','go'],['Masuk Penjara!','jail'],['Bonus saham +80',80],['Denda parkir -100',-100]];
const norm=s=>{s.players=s.players||[];s.own=s.own||{};s.hs=s.hs||{};s.used=s.used||{};s.log=s.log||[];s.dice=s.dice||[1,1];s.rn=s.rn||0;s.dc=s.dc||0;s.dbl=!!s.dbl;s.turn=s.turn||0;s.phase=s.phase||'roll';return s};
const log=(r,t)=>{r.log.unshift(t);r.log=r.log.slice(0,40)};
const jail=p=>{p.pos=10;p.jail=3};
const mk=(i,uid,name)=>({id:i,uid,name:String(name||'Pemain').slice(0,14),color:COL[i],ico:TOK[i],money:1500,pos:0,jail:0,out:false});
function pay(r,p,a,to){
 if(p.money<a){if(to)to.money+=p.money;p.money=0;p.out=true;
  for(const k in r.own)if(r.own[k]===p.id){if(to)r.own[k]=to.id;else{delete r.own[k];delete r.hs[k]}}
  log(r,p.name+' bangkrut!');const al=r.players.filter(x=>!x.out);if(al.length==1)r.winner=al[0].id;return false}
 p.money-=a;if(to)to.money+=a;return true}
function rent(r,i,sum){const t=BD[i],o=r.own[K(i)],mine=BD.map((x,j)=>j).filter(j=>r.own[K(j)]===o);
 if(t.t=='rail')return 25*2**(mine.filter(j=>BD[j].t=='rail').length-1);
 if(t.t=='util')return sum*(mine.filter(j=>BD[j].t=='util').length>1?10:4);
 const b=Math.round(t.p/10),h=r.hs[K(i)]||0,full=BD.every((x,j)=>x.c!==t.c||r.own[K(j)]===o);
 return h?b*(1+4*h):b*(full?2:1)}
function land(r,p,sum){const t=BD[p.pos];
 if(['prop','rail','util'].includes(t.t)){const o=r.own[K(p.pos)];
  if(o==null){r.phase='buy';return}
  if(o!==p.id){const to=r.players[o],a=rent(r,p.pos,sum);log(r,`${p.name} bayar sewa $${a} ke ${to.name}`);pay(r,p,a,to)}}
 else if(t.t=='tax'){log(r,`${p.name} bayar pajak $${t.a}`);pay(r,p,t.a)}
 else if(t.t=='gojail'){jail(p);log(r,p.name+' masuk penjara!')}
 else if(t.t=='chance'||t.t=='chest'){const [tx,v]=CARDS[R(CARDS.length)];log(r,`${p.name}: ${tx}`);
  if(v=='go'){p.pos=0;p.money+=200}else if(v=='jail')jail(p);else if(v>0)p.money+=v;else pay(r,p,-v)}}
function nextDice(r,p,cfg){cfg=cfg||{};
 const q=Object.entries(cfg.q||{}).filter(([id,e])=>!r.used[id]&&(e.pid<0||e.pid===p.id)).sort((a,b)=>a[1].t-b[1].t)[0];
 if(q){r.used[q[0]]=1;return q[1].d.map(cl)}
 const s=cfg.set||{mode:'random'};if(s.mode=='fixed')return[cl(s.a),cl(s.b)];
 if(s.mode=='doubles'){const x=1+R(6);return[x,x]}
 if(s.mode=='range'){const mn=cl(s.min),mx=Math.max(mn,cl(s.max)),w=mx-mn+1;return[mn+R(w),mn+R(w)]}
 return[1+R(6),1+R(6)]}
function doRoll(r,p,cfg){const d=nextDice(r,p,cfg),s=d[0]+d[1],dbl=d[0]==d[1];r.dice=d;r.rn++;r.phase='end';
 log(r,`${p.name} lempar ${d[0]}+${d[1]}`);let free=false;
 if(p.jail){if(dbl){p.jail=0;free=true;log(r,p.name+' bebas dari penjara')}
  else if(--p.jail>0){r.dbl=false;return}else{log(r,p.name+' bayar denda $50');pay(r,p,50);if(p.out)return}}
 r.dc=dbl&&!free?r.dc+1:0;r.dbl=dbl&&!free;
 if(r.dc>=3){jail(p);r.dbl=false;r.dc=0;log(r,p.name+' 3x double → penjara!');return}
 const np=p.pos+s;if(np>=40){p.money+=200;log(r,p.name+' lewat START +$200')}p.pos=np%40;land(r,p,s)}
function endTurn(r){const c=r.players[r.turn];
 if(r.dbl&&!c.jail&&!c.out){r.dbl=false;r.phase='roll';return}
 r.dc=0;r.dbl=false;do r.turn=(r.turn+1)%r.players.length;while(r.players[r.turn].out);r.phase='roll'}
const newRoom=(uid,name)=>({started:false,turn:0,phase:'roll',own:{},hs:{},used:{},dice:[1,1],rn:0,log:['Ruang dibuat'],dc:0,dbl:false,players:[mk(0,uid,name)]});
function apply(s0,a,uid,cfg){const r=norm(JSON.parse(JSON.stringify(s0))),e=m=>({err:m}),p=r.players.find(x=>x.uid==uid);
 if(a.type=='join'){if(p)return{s:r};if(r.started)return e('Game sudah dimulai');if(r.players.length>=6)return e('Ruang penuh');
  const q=mk(r.players.length,uid,a.name);r.players.push(q);log(r,q.name+' bergabung');return{s:r}}
 if(!p)return e('Kamu bukan pemain');
 if(a.type=='start'){if(p.id!=0||r.players.length<2||r.started)return e('Host saja, minimal 2 pemain');r.started=true;log(r,'Game dimulai!');return{s:r}}
 if(!r.started||r.winner!=null)return e('Game tidak berjalan');
 if(r.players[r.turn]!==undefined&&r.players[r.turn].uid!==uid)return e('Bukan giliranmu');
 const t=a.type;
 if(t=='roll'&&r.phase=='roll')doRoll(r,p,cfg);
 else if(t=='buy'&&r.phase=='buy'){const T=BD[p.pos];if(p.money<T.p)return e('Uang kurang');p.money-=T.p;r.own[K(p.pos)]=p.id;log(r,`${p.name} membeli ${T.n}`);r.phase='end'}
 else if(t=='skip'&&r.phase=='buy')r.phase='end';
 else if(t=='end'&&r.phase=='end')endTurn(r);
 else if(t=='build'&&r.phase!='buy'){const i=+a.tile,T=BD[i];
  if(!T||!T.c||r.own[K(i)]!==p.id||!BD.every((x,j)=>x.c!==T.c||r.own[K(j)]===p.id)||(r.hs[K(i)]||0)>=5||p.money<HH[T.c])return e('Tidak bisa membangun');
  p.money-=HH[T.c];r.hs[K(i)]=(r.hs[K(i)]||0)+1;log(r,`${p.name} membangun di ${T.n}`)}
 else return e('Aksi tidak valid');
 return{s:r}}
function adm(s0,a){const r=norm(JSON.parse(JSON.stringify(s0))),p=r.players[a.pid];if(!p)return null;
 if(a.type=='money')p.money+=parseInt(a.amt)||0;else if(a.type=='tp')p.pos=Math.min(39,Math.max(0,parseInt(a.pos)||0));return r}
const G={apply,adm,norm,newRoom};if(typeof module!=='undefined')module.exports=G;else window.Game=G;
})();
