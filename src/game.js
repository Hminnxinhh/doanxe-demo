import { Expedition, ALLIES, W, H, DURATION, clamp } from './model.js';
import { Renderer } from './renderer.js';
import { LocalProgress, PortalAdapter, Sound } from './platform.js';
const $=id=>document.getElementById(id);
const store=new LocalProgress(), portal=new PortalAdapter(), sound=new Sound(store.data.muted);
const renderer=new Renderer($('game'));
let game=null, scene='home', paused=false, elapsed=0, last=0, accumulator=0, pointer=null, toastUntil=0, ended=false, frameCount=0;
const keys=new Set();
const chapters=['Rừng thì thầm','Thung lũng hổ phách','Cánh cổng cổ thụ'];
function show(id, visible){$(id).hidden=!visible;}
function syncSound(){for(const id of ['sound','home-sound']){const b=$(id);b.textContent=id==='sound'?(sound.muted?'♪̸':'♫'):(sound.muted?'♪ Tắt tiếng':'♫ Âm thanh');b.setAttribute('aria-label',sound.muted?'Bật âm thanh':'Tắt âm thanh');b.setAttribute('aria-pressed',String(!sound.muted));}}
function toggleSound(){sound.unlock();sound.muted=!sound.muted;store.data.muted=sound.muted;store.save();syncSound();if(!sound.muted)sound.play('pickup');}
function clearInput(){pointer=null;keys.clear();if(game){game.target=null;game.keys={x:0,y:0};}}
function toast(icon,title,detail,duration=3){$('toast-icon').src=`./assets/${icon}.svg`;$('toast-title').textContent=title;$('toast-detail').textContent=detail;show('toast',true);toastUntil=(game?.time||0)+duration;}
function start(retry=false){
  clearInput();sound.unlock();game=new Expedition();scene='game';paused=false;ended=false;accumulator=0;renderer.effects=[];store.start(retry);portal.gameplayStart();
  for(const id of ['home','pause-screen','result','journal-screen','toast'])show(id,false);show('hud',true);show('gesture-tip',true);updateHUD();
}
function goHome(){clearInput();portal.gameplayStop();game=null;scene='home';paused=false;for(const id of ['hud','pause-screen','result','journal-screen'])show(id,false);show('home',true);$('collection-count').textContent=`${store.data.collection.length}/3`;}
function pause(reason='Chuyến đi đã được tạm dừng.'){
  if(scene!=='game'||!game||game.state!=='playing'||paused)return;paused=true;clearInput();portal.gameplayStop();sound.suspend();$('pause-copy').textContent=reason;show('pause-screen',true);$('resume').focus({preventScroll:true});
}
function resume(){if(!game||game.state!=='playing')return;sound.unlock();paused=false;accumulator=0;last=performance.now();show('pause-screen',false);portal.gameplayStart();}
function finish(){
  if(ended)return;ended=true;clearInput();portal.gameplayStop();store.record(game);const won=game.state==='won';
  sound.play(won?'win':'lose');show('toast',false);show('gesture-tip',false);show('hud',false);show('result',true);
  $('result-eyebrow').textContent=won?'MỘT CHUYẾN ĐI TUYỆT VỜI':'MỖI CHUYẾN ĐI, MỘT ĐIỀU MỚI';
  $('result-title').textContent=won?'Cả đoàn đã về đích!':'Thử một lối đi khác?';
  $('result-detail').textContent=won?'Bạn đã mở cổng rừng và đưa những người bạn về nhà.':game.reason;
  $('result-sun').textContent=game.coins;$('result-rescued').textContent=game.stats.rescued;$('result-hp').textContent=`${Math.ceil(game.convoy.hp)}%`;$('result-score').textContent=game.score.toLocaleString('vi-VN');
  $('record-note').textContent=store.persistent?`Đã lưu trên máy · Sưu tập ${store.data.collection.length}/3 người bạn`:'Bộ nhớ bị chặn · Kết quả chỉ giữ trong phiên này';
  $('replay').focus({preventScroll:true});
}
function processEvents(){for(const e of game.drainEvents()){
  renderer.addEffect(e.type,e);sound.play(e.type);
  if(e.type==='rescue'){const a=ALLIES[e.kind];toast(e.kind,e.already?`${a.name} tiếp sức!`:`${a.name} đã gia nhập!`,e.already?'+12 độ bền · Tăng sức mạnh':a.detail,3.7);show('gesture-tip',false);}
  if(e.type==='camp')toast('cage','Có bạn đang mắc kẹt!','Đứng gần 1 giây để giải cứu',3);
  if(e.type==='fork')toast('sign','Hai lối đi, một lựa chọn','Dẫn cáo qua cổng bạn thích',3.5);
  if(e.type==='route')toast({heal:'heart',power:'sun',shield:'shield',sun:'sun'}[e.reward],{heal:'Trạm nghỉ bên suối',power:'Sức mạnh ánh nắng',shield:'Lá chắn cổ thụ',sun:'Kho báu ven đường'}[e.reward],{heal:'+32 độ bền đoàn xe',power:'Mọi đòn đánh mạnh hơn',shield:'+2 lần chặn sát thương',sun:'+12 nắng cho hành trình'}[e.reward],3);
  if(e.type==='phase')toast(e.phase===1?'amber-tree':'boss',chapters[e.phase],e.phase===1?'Đường hẹp hơn · Cẩn thận đá và gỗ':'Né vòng đỏ · Gom nắng phá giáp',4);
  if(e.type==='end')finish();
}}
function updateHUD(){
  const g=game;if(!g)return;
  $('chapter-name').textContent=chapters[g.phase];$('chapter-number').textContent=`0${g.phase+1}`;
  $('health-fill').style.width=`${g.convoy.hp}%`;$('health-fill').style.background=g.convoy.hp<35?'#eea080':'';
  $('health-value').textContent=Math.ceil(g.convoy.hp);$('shield-value').textContent=g.shield?`◆${g.shield}`:'';
  $('sun-value').textContent=g.coins;$('journey-fill').style.width=`${g.time/DURATION*100}%`;
  $('stop-2').classList.toggle('active',g.phase>=1);$('stop-3').classList.toggle('active',g.phase>=2);
  const remaining=Math.max(0,Math.ceil(DURATION-g.time));$('timer').textContent=`${Math.floor(remaining/60).toString().padStart(2,'0')}:${(remaining%60).toString().padStart(2,'0')}`;
  $('crew-count').textContent=`${g.allies.length} / 3`;document.querySelectorAll('#crew>div').forEach(el=>el.classList.toggle('unlocked',g.allies.includes(el.dataset.kind)));
  show('boss-hud',!!g.boss);if(g.boss){$('boss-fill').style.width=`${Math.max(0,g.boss.hp)/g.boss.maxHp*100}%`;$('boss-hint').textContent=g.boss.vulnerable?'Lõi sáng · Có thể tấn công':'Giáp đóng · Gom nắng phá giáp';}
  if(g.time>9)show('gesture-tip',false);if(g.time>toastUntil)show('toast',false);
}
function journal(){
  show('journal-screen',true);const d=store.data;
  $('album').innerHTML=Object.entries(ALLIES).map(([kind,a])=>`<div class="${d.collection.includes(kind)?'':'locked'}"><img src="./assets/${kind}.svg" alt="${a.name}"><strong>${d.collection.includes(kind)?a.name:'Chưa gặp'}</strong><small>${a.role}</small></div>`).join('');
  const rate=d.starts?Math.round(d.runs/d.starts*100):0;
  $('local-stats').innerHTML=`<b>${d.runs}</b> chuyến hoàn tất · <b>${d.wins}</b> thắng · <b>${d.losses}</b> thua<br><b>${d.sun}</b> nắng · Kỷ lục <b>${d.bestScore}</b> điểm<br><b>${Math.round(d.totalSeconds/60)}</b> phút chơi · <b>${d.retries}</b> lần chơi lại<br>Hoàn tất <b>${rate}%</b> / <b>${d.starts}</b> lượt bắt đầu`;
}
function point(e){const r=$('game').getBoundingClientRect();return{x:clamp((e.clientX-r.left)/r.width*W,26,364),y:clamp((e.clientY-r.top)/r.height*H-52,228,714)};}
$('game').addEventListener('pointerdown',e=>{if(scene!=='game'||paused||game.state!=='playing'||pointer!==null)return;e.preventDefault();sound.unlock();pointer=e.pointerId;$('game').setPointerCapture(e.pointerId);game.target=point(e);});
$('game').addEventListener('pointermove',e=>{if(e.pointerId===pointer&&game&&!paused){e.preventDefault();game.target=point(e);}});
for(const name of ['pointerup','pointercancel','lostpointercapture'])$('game').addEventListener(name,e=>{if(e.pointerId===pointer){pointer=null;if(game)game.target=null;}});
function updateKeys(){if(game)game.keys={x:Number(keys.has('ArrowRight')||keys.has('d'))-Number(keys.has('ArrowLeft')||keys.has('a')),y:Number(keys.has('ArrowDown')||keys.has('s'))-Number(keys.has('ArrowUp')||keys.has('w'))};}
window.addEventListener('keydown',e=>{if(e.key==='Escape'||e.key==='p'){if(e.repeat)return;if(paused)resume();else pause();}if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','w','a','s','d'].includes(e.key)&&scene==='game'&&!paused){e.preventDefault();keys.add(e.key);updateKeys();}});
window.addEventListener('keyup',e=>{keys.delete(e.key);updateKeys();});
window.addEventListener('blur',()=>pause('Bạn vừa rời màn hình. Đoàn xe đang nghỉ chân.'));
document.addEventListener('visibilitychange',()=>{if(document.hidden)pause('Chuyến đi đã dừng khi bạn chuyển ứng dụng.');});
function orientation(){const sideways=matchMedia('(pointer: coarse)').matches&&innerWidth>innerHeight;show('rotate-hint',sideways);if(sideways)pause('Xoay dọc màn hình rồi chạm Đi tiếp.');}
window.addEventListener('resize',orientation);
$('play').onclick=()=>start();$('replay').onclick=()=>start(true);$('restart').onclick=()=>start(true);$('pause').onclick=()=>pause();$('resume').onclick=resume;$('back-home').onclick=goHome;$('result-home').onclick=goHome;
$('sound').onclick=toggleSound;$('home-sound').onclick=toggleSound;$('journal').onclick=journal;$('close-journal').onclick=()=>show('journal-screen',false);
$('clear-data').onclick=()=>{if($('clear-data').dataset.confirm!=='yes'){$('clear-data').dataset.confirm='yes';$('clear-data').textContent='Chạm lần nữa để xác nhận xóa';return;}try{store.clear();}catch{}location.reload();};
function frame(now){
  requestAnimationFrame(frame);const delta=last?Math.min((now-last)/1000,.12):0;last=now;elapsed+=delta;
  if(scene==='home'){renderer.drawHome(elapsed);return;}
  if(!paused&&game.state==='playing'){accumulator+=delta;while(accumulator>=1/60){game.update(1/60);processEvents();accumulator-=1/60;if(game.state!=='playing')break;}}
  renderer.draw(game,elapsed,paused);if(++frameCount%3===0)updateHUD();
}
try{await renderer.load();renderer.drawHome(0);show('loading',false);show('home',true);syncSound();$('collection-count').textContent=`${store.data.collection.length}/3`;orientation();requestAnimationFrame(frame);
  // Read-only diagnostics, only on an explicitly opted-in local test origin.
  if(new URLSearchParams(location.search).has('qa')&&['localhost','127.0.0.1','[::1]'].includes(location.hostname))Object.defineProperty(window,'__EXPEDITION_QA__',{value:Object.freeze({snapshot:()=>game?.snapshot(),progress:()=>structuredClone(store.data),status:()=>({scene,paused,assets:Object.keys(renderer.images).length,frames:frameCount,audio: sound.ctx?.state||'not-started',muted:sound.muted})})});
}catch(error){$('loading').classList.add('error');$('loading').replaceChildren();const p=document.createElement('p');p.textContent='Chưa tải được khu rừng. Hãy mở bản build bằng máy chủ Web và thử lại.';const b=document.createElement('button');b.textContent='Tải lại';b.onclick=()=>location.reload();$('loading').append(p,b);console.error(error);}
