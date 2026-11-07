import {W,H,WORLD,ROUTE,OBSTACLES,clamp,distance,rng} from './world.js';
import {drawFriend,drawEnemy,drawBoss,drawTurret} from './rigs.js';
const NAMES=['fox','camper','trailer','bunny','owl','bear','prowler','boss','tree','amber-tree','pine','rock','log','fern','flowers','mushrooms','ruin','cage','sun','heart','shield','sign','gate'];
export class Renderer{
 constructor(canvas){this.canvas=canvas;this.ctx=canvas.getContext('2d',{alpha:false});this.images={};this.camera={x:455,y:650};this.effects=[];this.shake=0;this.motion=!matchMedia('(prefers-reduced-motion: reduce)').matches;this.resize();new ResizeObserver(()=>this.resize()).observe(canvas);}
 resize(){const r=this.canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2),w=Math.round(r.width*dpr),h=Math.round(r.height*dpr);if(this.canvas.width!==w||this.canvas.height!==h){this.canvas.width=w;this.canvas.height=h;}this.scale=this.canvas.width/W;}
 async load(){await Promise.all(NAMES.map(async n=>{const i=new Image();i.src=`./assets/${n}.svg`;await i.decode();this.images[n]=i;}));this.makeMap();}
 sprite(name,x,y,w,rot=0,alpha=1,anchor=.8){const i=this.images[name];if(!i)return;const h=w*i.height/i.width,c=this.ctx;c.save();c.globalAlpha=alpha;c.translate(x,y);c.rotate(rot);c.drawImage(i,-w/2,-h*anchor,w,h);c.restore();}
 shadow(x,y,rx=25,ry=8){const c=this.ctx;c.fillStyle='#214b453a';c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill();}
 text(s,x,y,size=11,color='#fff0cc'){const c=this.ctx;c.font=`800 ${size}px ui-rounded,'Avenir Next',system-ui,sans-serif`;c.textAlign='center';c.textBaseline='middle';c.fillStyle=color;c.fillText(s,x,y);}
 pill(x,y,w,h,fill='#234d45ed',stroke='#e3e3ae70'){const c=this.ctx;c.beginPath();c.roundRect(x,y,w,h,Math.min(h/2,12));c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=1;c.stroke();}}
 line(points,width,color){const c=this.ctx;c.beginPath();points.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.lineWidth=width;c.lineCap='round';c.lineJoin='round';c.strokeStyle=color;c.stroke();}
 makeMap(){
  const previous=this.ctx,map=document.createElement('canvas');map.width=WORLD.w;map.height=WORLD.h;this.ctx=map.getContext('2d');const c=this.ctx,r=rng(8802);
  c.fillStyle='#549574';c.fillRect(0,0,WORLD.w,WORLD.h);
  // Open, overlapping clearings with several branches rather than a scrolling lane.
  for(const spot of [...ROUTE,{x:370,y:1050},{x:935,y:1050},{x:380,y:786},{x:920,y:786}]){c.fillStyle='#88b37d';c.beginPath();c.ellipse(spot.x,spot.y,180,158,-.15,0,Math.PI*2);c.fill();}
  const trails=[ROUTE,[{x:650,y:1100},{x:505,y:1040},{x:365,y:1050}],[{x:650,y:1090},{x:820,y:1080},{x:947,y:1050}],[{x:610,y:820},{x:490,y:775},{x:380,y:786}],[{x:640,y:830},{x:780,y:770},{x:925,y:786}], [{x:385,y:1040},{x:385,y:786}], [{x:945,y:1040},{x:990,y:900},{x:920,y:786}]];
  for(const trail of trails){this.line(trail,95,'#6a9b70');this.line(trail,80,'#c7c58e');this.line(trail,66,'#d9d19c');}
  // Broad mossy arena with concentric ancient stonework.
  c.fillStyle='#8eb294';c.beginPath();c.ellipse(662,400,310,300,0,0,Math.PI*2);c.fill();c.strokeStyle='#c6d2a466';c.lineWidth=9;c.beginPath();c.ellipse(662,400,270,250,0,0,Math.PI*2);c.stroke();
  c.setLineDash([19,22]);c.strokeStyle='#597e7866';c.lineWidth=5;c.beginPath();c.ellipse(662,400,225,207,0,0,Math.PI*2);c.stroke();c.setLineDash([]);
  for(let i=0;i<2100;i++){const x=r()*WORLD.w,y=r()*WORLD.h;c.globalAlpha=.14+r()*.2;c.fillStyle=r()<.5?'#e8e7b3':'#3d7e64';c.beginPath();c.ellipse(x,y,1+r()*2,.8+r(),-.3,0,Math.PI*2);c.fill();if(i%4===0){c.strokeStyle='#4c8869';c.lineWidth=1;c.beginPath();c.moveTo(x-3,y-3);c.lineTo(x,y);c.lineTo(x+1,y-6);c.stroke();}}c.globalAlpha=1;
  for(const o of OBSTACLES){if(o.kind==='pond'){c.fillStyle='#427f79';c.beginPath();c.ellipse(o.x,o.y,o.r+12,o.r+5,-.2,0,Math.PI*2);c.fill();c.fillStyle='#73bdb1';c.beginPath();c.ellipse(o.x,o.y,o.r,o.r-7,-.2,0,Math.PI*2);c.fill();c.strokeStyle='#c9e7c1';c.lineWidth=2;for(let i=0;i<4;i++){c.beginPath();c.moveTo(o.x-25+i*6,o.y-30+i*19);c.quadraticCurveTo(o.x,o.y-25+i*19,o.x+22,o.y-30+i*19);c.stroke();}this.sprite('flowers',o.x+o.r-5,o.y+22,43);}
   else{this.shadow(o.x,o.y+5,o.r,o.r*.3);this.sprite(o.kind,o.x,o.y,o.r*2.1,0,1,.65);}}
  const clear=[...ROUTE,...ROUTE.slice(0,-1).map((p,i)=>({x:(p.x+ROUTE[i+1].x)/2,y:(p.y+ROUTE[i+1].y)/2})),{x:365,y:1050},{x:935,y:1050},{x:380,y:786},{x:920,y:786}];
  const props=[];for(let y=170;y<1530;y+=82)for(let x=90;x<1300;x+=86){const p={x:x+(r()-.5)*66,y:y+(r()-.5)*54};if((distance(p,{x:662,y:400})<310)||clear.some(s=>distance(s,p)<130))continue;const k=r();props.push({...p,name:k<.52?'tree':k<.67?'amber-tree':k<.8?'fern':k<.9?'mushrooms':'flowers',w:k<.67?95+r()*44:40+r()*28});}
  props.sort((a,b)=>a.y-b.y);for(const p of props){this.shadow(p.x,p.y+6,p.w*.32,p.w*.08);this.sprite(p.name,p.x,p.y,p.w);}
  for(const x of[367,945]){this.sprite('ruin',x,699,68);this.sprite('flowers',x-38,731,44);this.sprite('mushrooms',x+49,724,43);this.sprite('sign',x,1188,49);}
  this.sprite('gate',660,216,203);this.sprite('pine',340,244,130);this.sprite('pine',1000,251,130);this.sprite('fern',515,228,66);this.sprite('fern',800,232,70);
  // Picnic camp and landmarks are visible from alternate approach paths.
  this.sprite('sign',697,1337,60);this.sprite('mushrooms',571,1350,69);this.sprite('flowers',770,1325,58);
  this.map=map;this.ctx=previous;
 }
 reset(game){this.camera={x:clamp(game.player.x-W/2,0,WORLD.w-W),y:clamp(game.player.y-H*.57,0,WORLD.h-H)};this.effects=[];}
 begin(){const c=this.ctx;c.setTransform(this.scale,0,0,this.canvas.height/H,0,0);c.fillStyle='#244e42';c.fillRect(0,0,W,H);c.save();if(this.shake>0&&this.motion)c.translate(Math.sin(this.shake*4)*this.shake,Math.cos(this.shake*6)*this.shake*.5);}
 drawHome(t,variant=0){this.begin();const c=this.ctx;c.drawImage(this.map,455,650,W,H,0,0,W,H);const glow=c.createRadialGradient(195,460,10,195,470,270);glow.addColorStop(0,'#fff3a533');glow.addColorStop(1,'#143d3f66');c.fillStyle=glow;c.fillRect(0,0,W,H);
  this.shadow(246,529,56,16);this.sprite('camper',249,501,109,-.05);this.sprite('trailer',249,617,81,-.04);
  this.shadow(119,523,31,10);drawFriend(c,{kind:'fox',x:119,y:522,size:94,walk:t*7,moving:10,time:t});
  for(const[k,x,y]of[['bunny',77,610],['bear',171,625],['owl',317,594]]){this.shadow(x,y+4,24,8);drawFriend(c,{kind:k,x,y,size:k==='owl'?60:67,walk:t*6,moving:6,time:t});}
  this.sprite('fern',2,681,113);this.sprite('fern',394,683,113);this.sprite('flowers',35,639,58);this.sprite('mushrooms',348,645,57);c.restore();
 }
 draw(g,dt,joystick){const c=this.ctx,p=g.player,t=g.time;const arena=g.boss&&p.y<760&&p.y>170;const tx=clamp((arena?p.x*.55+g.boss.x*.45:p.x)-W/2,0,WORLD.w-W),ty=arena?-95:clamp(p.y-H*.57,0,WORLD.h-H);const lerp=1-Math.exp(-dt*9);this.camera.x+=(tx-this.camera.x)*lerp;this.camera.y+=(ty-this.camera.y)*lerp;
  this.begin();c.drawImage(this.map,this.camera.x,this.camera.y,W,H,0,0,W,H);c.save();c.translate(-this.camera.x,-this.camera.y);
  const visible=(a,margin=120)=>a.x>this.camera.x-margin&&a.x<this.camera.x+W+margin&&a.y>this.camera.y-margin&&a.y<this.camera.y+H+margin;
  for(const z of g.zones){c.fillStyle='#bce3a952';c.beginPath();c.ellipse(z.x,z.y,105,65,0,0,Math.PI*2);c.fill();for(let i=0;i<6;i++)this.sprite('flowers',z.x+Math.cos(i)*66,z.y+Math.sin(i)*36,27);}
  for(const w of g.warnings)if(visible(w))this.warning(w,t);
  for(const i of g.pickups)if(!i.used&&visible(i)){this.shadow(i.x,i.y+8,14,4);this.sprite('heart',i.x,i.y+Math.sin(t*4)*3,25);}
  if(g.boss&&g.boss.hp>0)g.pads.forEach((pad,i)=>this.pad(pad,i===g.boss.activePad,g.boss.state==='exposed',i,t));
  const actors=[];
  if(g.camp.state!=='waiting'&&visible(g.camp)){const camp=g.camp;actors.push({y:camp.y,fn:()=>{this.shadow(camp.x,camp.y+8,31,10);if(camp.state==='open'){drawFriend(c,{kind:camp.kind,x:camp.x,y:camp.y,size:45,time:t});this.sprite('cage',camp.x,camp.y+7,70);this.progress(camp.x,camp.y-29,camp.progress/2.6,43,'#ffe2a2');this.pill(camp.x-46,camp.y-102,92,23);this.text(`CỨU ${camp.kind==='owl'?'MỰC':camp.kind==='bear'?'BẮP':'MÂY'}`,camp.x,camp.y-90,9);}
   else{this.sprite('cage',camp.x,camp.y+10,64,.25,.5);this.text(camp.state==='rescued'?'ĐÃ CỨU':'ĐÃ BỎ LỠ',camp.x,camp.y-78,9,camp.state==='rescued'?'#fff0bf':'#d4c1a3');}}});}
  if(g.shrine.state!=='waiting'&&visible(g.shrine))actors.push({y:g.shrine.y,fn:()=>{this.sprite('ruin',g.shrine.x,g.shrine.y,76);this.sprite('fern',g.shrine.x-28,g.shrine.y+18,54);if(g.shrine.state==='open'){this.progress(g.shrine.x,g.shrine.y-35,g.shrine.progress/2.4,43,'#b8edb2');this.pill(g.shrine.x-48,g.shrine.y-125,96,24);this.text('RỄ HỘ VỆ',g.shrine.x,g.shrine.y-113,9);}}});
  const cv=g.convoy;
  actors.push({y:cv.y+78,fn:()=>{this.shadow(cv.x,cv.y+92,31,10);this.sprite('trailer',cv.x,cv.y+77,61);if(g.decision==='turret'){const target=g.enemies.find(e=>e.hp>0&&distance(e,cv)<280);drawTurret(c,cv.x,cv.y+44,target?Math.max(0,.25-(t-(g.turretAt-.7))):0,target?Math.atan2(target.x-cv.x,-(target.y-cv.y))*.45:0,t);}}});
  actors.push({y:cv.y,fn:()=>{this.shadow(cv.x,cv.y+15,38,11);this.sprite('camper',cv.x,cv.y,76,0,cv.hit>0?.65:1);if(g.shrine.state==='open'&&t>43){this.progress(cv.x,cv.y-30,g.fortify/4,52,'#fee1a0');this.text('GIỮ XE · LẮP THÁP',cv.x,cv.y-113,9);}if(cv.hp<45){c.fillStyle='#283e4550';for(let i=0;i<3;i++){c.beginPath();c.arc(cv.x+18,cv.y-89-((t*24+i*17)%42),7+i*2,0,Math.PI*2);c.fill();}}}});
  for(const b of g.barriers)if(b.hp>0)actors.push({y:b.y,fn:()=>{this.shadow(b.x,b.y+5,36,10);this.sprite('log',b.x,b.y,79,.25);this.sprite('fern',b.x,b.y-15,65);this.pill(b.x-20,b.y+15,40,4,'#315e51',null);this.pill(b.x-20,b.y+15,40*b.hp/b.max,4,'#c4dfa8',null);}});
  for(const e of g.enemies)if(visible(e))actors.push({y:e.y,fn:()=>{this.shadow(e.x,e.y+3,e.kind==='brute'?30:22,8);if(e.state==='windup'&&e.kind==='runner'){c.setLineDash([7,5]);this.line([e,e.aim],4,'#f7b480');c.setLineDash([]);}drawEnemy(c,e,t);if(e.hp>0&&e.hurt>0){this.pill(e.x-16,e.y-65,32,4,'#375349',null);this.pill(e.x-16,e.y-65,32*Math.max(0,e.hp)/({runner:7,spitter:8,brute:17}[e.kind]),4,'#eec995',null);}}});
  if(g.boss&&visible(g.boss,240))actors.push({y:g.boss.y,fn:()=>{this.shadow(g.boss.x,g.boss.y+43,90,24);drawBoss(c,g.boss,t);}});
  g.allies.forEach((kind,i)=>{const ally={x:p.x-37,y:p.y+39};actors.push({y:ally.y,fn:()=>{this.shadow(ally.x,ally.y+3,16,5);drawFriend(c,{kind,...ally,size:40,walk:p.walk,moving:p.moving,time:t,facing:p.facing});}});});
  actors.push({y:p.y,fn:()=>{this.shadow(p.x,p.y+4,22,7);this.progress(p.x,p.y+2,1,24,'#f8e9ad',.25);drawFriend(c,{kind:'fox',x:p.x,y:p.y,size:58,walk:p.walk,moving:p.moving,facing:p.facing,hurt:p.hurt,attack:p.attack,time:t,rescue:g.camp.state==='open'&&distance(p,g.camp)<49});}});
  actors.sort((a,b)=>a.y-b.y);for(const a of actors)a.fn();
  for(const b of g.projectiles)if(visible(b)){c.save();c.translate(b.x,b.y);c.rotate(Math.atan2(b.vy,b.vx));c.shadowColor='#ffd591';c.shadowBlur=5;c.fillStyle='#f5ad83';c.strokeStyle='#6d5656';c.lineWidth=1.5;c.beginPath();c.moveTo(9,0);c.quadraticCurveTo(-5,-9,-9,0);c.quadraticCurveTo(-5,9,9,0);c.fill();c.stroke();c.restore();}
  this.drawEffects(dt);c.restore();
  const vignette=c.createLinearGradient(0,0,0,H);vignette.addColorStop(0,'#163b3cc9');vignette.addColorStop(.23,'#143b3c00');vignette.addColorStop(.82,'#143b3c00');vignette.addColorStop(1,'#143b3c99');c.fillStyle=vignette;c.fillRect(0,0,W,H);
  this.indicator(cv,'camper',`${Math.ceil(distance(p,cv))}m`,cv.hp<50?'#f5b59a':'#e9dfa9');
  if(g.camp.state==='open')this.indicator(g.camp,g.camp.kind,`Cứu bạn · ${Math.ceil(31-t)}s`,'#ffe1a0');
  if(g.shrine.state==='open')this.indicator(g.shrine,'fern','Rễ hộ vệ','#c0e4b0');
  if(g.boss?.hp>0)this.indicator(g.pads[g.boss.activePad],'sun','Gương nắng','#ffe5a6');
  this.minimap(g);
  if(joystick){const a=joystick;c.strokeStyle='#fff2c56e';c.fillStyle='#244c452a';c.lineWidth=2;c.beginPath();c.arc(a.x,a.y,35,0,Math.PI*2);c.fill();c.stroke();c.fillStyle='#ffe5b0a0';c.beginPath();c.arc(a.x+a.dx*.6,a.y+a.dy*.6,15,0,Math.PI*2);c.fill();}
  if(g.state==='won')for(let i=0;i<30;i++){c.save();c.translate((i*81+t*31)%390,(i*91+t*53)%844);c.rotate(t+i);c.fillStyle=['#efd28e','#ace2b1','#e9b69d'][i%3];c.fillRect(-2,-4,4,8);c.restore();}
  c.restore();this.shake*=.84;
 }
 progress(x,y,f,r,color,alpha=1){const c=this.ctx;c.save();c.globalAlpha=alpha;c.lineWidth=2;c.strokeStyle='#294e4866';c.beginPath();c.ellipse(x,y,r,r*.45,0,0,Math.PI*2);c.stroke();if(f>0){c.strokeStyle=color;c.lineWidth=3;c.beginPath();c.ellipse(x,y,r,r*.45,0,-Math.PI/2,-Math.PI/2+Math.PI*2*clamp(f,0,1));c.stroke();}c.restore();}
 pad(p,active,exposed,i,t){const c=this.ctx;c.save();this.shadow(p.x,p.y+5,37,11);for(let n=0;n<8;n++){c.fillStyle=active?'#f3d595':'#a7b99b';c.beginPath();c.ellipse(p.x+Math.cos(n*Math.PI/4)*24,p.y+Math.sin(n*Math.PI/4)*15,10,6,n*Math.PI/4,0,Math.PI*2);c.fill();}c.fillStyle=active?'#efc66e':'#688f7d';c.strokeStyle='#577c6b';c.lineWidth=2;c.beginPath();c.ellipse(p.x,p.y,22,15,0,0,Math.PI*2);c.fill();c.stroke();if(active){c.shadowColor='#ffe6a0';c.shadowBlur=exposed?22:8;this.sprite('sun',p.x,p.y-10+Math.sin(t*4)*2,26);this.progress(p.x,p.y,p.progress/.72,39,exposed?'#fff3a2':'#e2d3a0');this.text(exposed?'PHẢN CÔNG':'',p.x,p.y+35,8);}else this.text(String(i+1),p.x,p.y,11,'#bdcfaa');c.restore();}
 warning(w,t){const c=this.ctx;c.save();if(w.timer>0){const f=1-w.timer/w.total;if(w.kind==='fan'){c.setLineDash([6,6]);this.line([w,w.aim],2,'#f6c997aa');c.setLineDash([]);}
   else if(w.kind==='charge'){this.line([w,w.end],w.radius*2,'#e77f6e44');c.setLineDash([10,8]);this.line([w,w.end],3,'#ffc59a');c.setLineDash([]);}
   else{c.fillStyle=`rgba(229,104,88,${.12+f*.23})`;c.strokeStyle='#ffc3a0';c.lineWidth=2;c.beginPath();c.arc(w.x,w.y,w.radius,0,Math.PI*2);c.fill();c.stroke();c.beginPath();c.arc(w.x,w.y,w.radius*f,0,Math.PI*2);c.stroke();this.text('!',w.x,w.y,23,'#fff0c9');}}
  else if(!w.visual&&w.kind!=='fan'){c.globalAlpha=Math.max(0,1+w.timer*2);this.sprite('log',w.x,w.y,63,Math.PI*.22);c.strokeStyle='#f4c997';c.lineWidth=3;c.beginPath();c.arc(w.x,w.y,w.radius-w.timer*30,0,Math.PI*2);c.stroke();}c.restore();}
 indicator(point,icon,label,color){const x=point.x-this.camera.x,y=point.y-this.camera.y;if(x>25&&x<W-25&&y>215&&y<H-125)return;const cx=clamp(x,33,W-33),cy=clamp(y,232,H-150),c=this.ctx;this.pill(cx-23,cy-26,46,48,'#254e46e8',color);this.sprite(icon,cx,cy+4,27);const a=Math.atan2(y-cy,x-cx);c.save();c.translate(cx,cy);c.rotate(a);c.fillStyle=color;c.beginPath();c.moveTo(32,0);c.lineTo(24,-5);c.lineTo(24,5);c.fill();c.restore();this.pill(clamp(cx-52,6,280),cy+27,104,20);this.text(label,clamp(cx,58,332),cy+37,8,color);}
 minimap(g){const c=this.ctx,x=17,y=724,w=82,h=96;this.pill(x,y,w,h,'#204d44d9','#d9dfac66');c.save();c.beginPath();c.roundRect(x+3,y+3,w-6,h-6,9);c.clip();c.globalAlpha=.7;c.drawImage(this.map,x+3,y+3,w-6,h-6);c.globalAlpha=1;const dot=(p,color,r)=>{c.fillStyle=color;c.beginPath();c.arc(x+p.x/WORLD.w*w,y+p.y/WORLD.h*h,r,0,Math.PI*2);c.fill();};const vw=W/WORLD.w*w,vh=H/WORLD.h*h;c.strokeStyle='#e6ecc277';c.lineWidth=1;c.strokeRect(x+this.camera.x/WORLD.w*w,y+this.camera.y/WORLD.h*h,vw,vh);if(g.camp.state==='open')dot(g.camp,'#ffd28a',3);if(g.shrine.state==='open')dot(g.shrine,'#c5ecb1',3);dot(g.convoy,'#f2dba6',3);dot(g.player,'#fff3d0',2.5);c.restore();}
 addEffect(type,e){if(type==='hit'||type==='hullHit')this.shake=6;if(type==='slam')this.shake=3;const color={beam:'#ffeeb1',shot:'#e9f4b9',turretShot:'#c9e8d3'}[type];if(color)this.effects.push({kind:'bolt',...e,color,life:.22,max:.22});
  if(['rescue','hit','hullHit','poof','block','beam','heal','vacuum','snare'].includes(type)){const color={hit:'#f5b295',hullHit:'#efb098',poof:'#d7b5bd',block:'#b8e3bf',heal:'#c9eeb1',rescue:'#ffe4a8',beam:'#ffedab',vacuum:'#cdbfe7',snare:'#d1dfb0'}[type];for(let i=0;i<(type==='rescue'?25:9);i++)this.effects.push({kind:'spark',x:e.x,y:e.y,vx:(Math.random()-.5)*130,vy:-20-Math.random()*90,color,life:.6+Math.random()*.3,max:.9});if(['rescue','heal','vacuum','snare'].includes(type))this.effects.push({kind:'ring',x:e.x,y:e.y,color,life:.7,max:.7});}}
 drawEffects(dt){const c=this.ctx;for(const e of this.effects){e.life-=dt;const a=clamp(e.life/e.max,0,1);c.save();c.globalAlpha=a;if(e.kind==='bolt'){c.strokeStyle=e.color;c.lineWidth=e.color==='#ffeeb1'?9:3;c.shadowColor=e.color;c.shadowBlur=12;c.beginPath();c.moveTo(e.x,e.y);c.quadraticCurveTo((e.x+e.tx)/2+12,(e.y+e.ty)/2,e.tx,e.ty);c.stroke();}else if(e.kind==='ring'){c.strokeStyle=e.color;c.lineWidth=2;c.beginPath();c.ellipse(e.x,e.y,15+(1-a)*150,10+(1-a)*95,0,0,Math.PI*2);c.stroke();}else{e.x+=e.vx*dt;e.y+=e.vy*dt;e.vy+=dt*135;c.translate(e.x,e.y);c.rotate(e.life*6);c.fillStyle=e.color;c.beginPath();c.moveTo(0,-5);c.quadraticCurveTo(1,0,4,0);c.quadraticCurveTo(0,0,0,5);c.quadraticCurveTo(-1,0,-4,0);c.quadraticCurveTo(0,0,0,-5);c.fill();}c.restore();}this.effects=this.effects.filter(e=>e.life>0).slice(-220);}
}
