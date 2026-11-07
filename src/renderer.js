import { W, H, rng, clamp, ALLIES } from './model.js';
const NAMES = ['fox','camper','trailer','bunny','owl','bear','prowler','boss','tree','amber-tree','pine','rock','log','fern','flowers','mushrooms','ruin','cage','sun','heart','shield','sign','gate'];
const PALETTES = [
  { ground:'#6da779', dark:'#407c62', road:'#e1ca8c', edge:'#b4bd7d', water:'#6bb9b2', river:'#3f9999', speck:'#d1df9d', ambient:'#e5f4a7' },
  { ground:'#b6ac70', dark:'#797e52', road:'#edd49c', edge:'#c7b37c', water:'#6ebbb5', river:'#529e9a', speck:'#f5dda3', ambient:'#ffe0a1' },
  { ground:'#477c7d', dark:'#315d68', road:'#a3b59b', edge:'#688d81', water:'#5299a6', river:'#316e8a', speck:'#afcbbb', ambient:'#a3e2d3' },
];
function mix(a,b,t){const n=parseInt(a.slice(1),16),m=parseInt(b.slice(1),16);return `rgb(${[16,8,0].map(s=>Math.round(((n>>s)&255)*(1-t)+((m>>s)&255)*t)).join(',')})`;}
export class Renderer {
  constructor(canvas) {
    this.canvas=canvas; this.ctx=canvas.getContext('2d',{alpha:false}); this.images={}; this.effects=[];this.shake=0;this.frame=0;this.motion= !matchMedia('(prefers-reduced-motion: reduce)').matches;
    const random=rng(193719); this.props=Array.from({length:48},(_,i)=>({x:i%2 ? 343+random()*72 : -22+random()*67, y:random()*1120,scale:.55+random()*.48,kind:Math.floor(random()*10),flip:random()<.5}));
    this.grass=Array.from({length:200},()=>({x:random()*W,y:random()*H,s:random()*2+.8,a:random()*.3+.15}));
    this.bugs=Array.from({length:16},()=>({x:random()*390,y:random()*844,s:random()*3+.5,phase:random()*7}));
    this.resize(); new ResizeObserver(()=>this.resize()).observe(canvas);
  }
  resize(){const r=this.canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2);const w=Math.round(r.width*dpr),h=Math.round(r.height*dpr);if(this.canvas.width!==w||this.canvas.height!==h){this.canvas.width=w;this.canvas.height=h;}this.scale=this.canvas.width/W;}
  async load(){await Promise.all(NAMES.map(async name=>{const img=new Image();img.src=`./assets/${name}.svg`;await img.decode();this.images[name]=img;}));}
  sprite(name,x,y,w,h=null,rot=0,alpha=1,anchor=.8,flip=false){const img=this.images[name];if(!img)return;h??=w*img.height/img.width;const c=this.ctx;c.save();c.translate(x,y);c.rotate(rot);c.scale(flip?-1:1,1);c.globalAlpha=alpha;c.drawImage(img,-w/2,-h*anchor,w,h);c.restore();}
  shadow(x,y,rx=23,ry=8,alpha=.18){const c=this.ctx;c.save();c.fillStyle=`rgba(21,62,56,${alpha})`;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill();c.restore();}
  rounded(x,y,w,h,r,fill,stroke){const c=this.ctx;c.beginPath();c.roundRect(x,y,w,h,r);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.stroke();}}
  text(text,x,y,size=12,color='#fff1c8',align='center',weight=800){const c=this.ctx;c.font=`${weight} ${size}px ui-rounded, 'Avenir Next', system-ui, sans-serif`;c.textAlign=align;c.textBaseline='middle';c.fillStyle=color;c.fillText(text,x,y);}
  path(points,fill,stroke,width=1){const c=this.ctx;c.beginPath();points(c);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke();}}
  terrain(t,phase,home=false){
    const c=this.ctx,offset=t*(phase===2?27:55),transition=phase===1?clamp((t-60)/4,0,1):phase===2?clamp((t-132)/4,0,1):1;
    const pal={};for(const key in PALETTES[phase])pal[key]=phase?mix(PALETTES[phase-1][key],PALETTES[phase][key],transition):PALETTES[phase][key];
    c.fillStyle=pal.ground;c.fillRect(0,0,W,H);
    // A winding stream, grassy banks, and the hand-drawn sandy caravan trail.
    const roadX=y=>195+Math.sin((y-offset)*.0045)*34+Math.sin((y-offset)*.009)*9;
    const trace=(off,width,color)=>{c.beginPath();for(let y=-60;y<=H+60;y+=12){const x=roadX(y)+off;if(y===-60)c.moveTo(x,y);else c.lineTo(x,y);}c.lineWidth=width;c.lineCap='round';c.strokeStyle=color;c.stroke();};
    trace(-163,87,pal.dark);trace(-166,76,pal.river);trace(-163,55,pal.water);
    // Water ripples follow the stream; no per-frame object allocation for terrain.
    c.strokeStyle='#d2f5d39c';c.lineWidth=1.6;
    for(let i=0;i<16;i++){const y=(i*67+offset*.8)%990-60,x=roadX(y)-166+Math.sin(i*2.3)*18;c.beginPath();c.moveTo(x-8,y);c.quadraticCurveTo(x,y+3,x+9,y);c.stroke();}
    trace(0,187,pal.dark);trace(0,179,pal.edge);trace(0,159,pal.road);
    // Soft cart tracks, scattered pebbles and tufts make the ground feel illustrated.
    trace(-34,2,'#9c926629');trace(34,2,'#9c926629');
    for(const g of this.grass){const y=(g.y+offset)%H,x=g.x,road=Math.abs(x-roadX(y));c.globalAlpha=g.a;c.fillStyle=road<70?'#a68b5d':pal.speck;c.beginPath();c.ellipse(x,y,g.s*1.5,g.s*.65,-.3,0,Math.PI*2);c.fill();if(road>102){c.strokeStyle=pal.dark;c.lineWidth=1;c.beginPath();c.moveTo(x,y);c.lineTo(x-3,y-4);c.moveTo(x,y);c.lineTo(x+1,y-6);c.stroke();}}
    c.globalAlpha=1;
    // One little footbridge drifts through the landscape with the journey.
    const bridgeY=(410+offset)%1120-130;
    if(bridgeY>-60&&bridgeY<900){const bx=roadX(bridgeY)-164;this.shadow(bx,bridgeY+5,58,14,.2);c.save();c.translate(bx,bridgeY);c.rotate(-.12);this.rounded(-56,-15,112,46,6,'#896e4e','#46674f');for(let i=0;i<9;i++)this.rounded(-52+i*12,-12,10,40,2,'#d6b582','#aa875d');c.strokeStyle='#657d5a';c.lineWidth=5;c.beginPath();c.moveTo(-55,-16);c.lineTo(55,-16);c.moveTo(-55,31);c.lineTo(55,31);c.stroke();c.restore();}
    const arranged=this.props.map(p=>({...p,cy:(p.y+offset)%1120-140})).sort((a,b)=>a.cy-b.cy);
    for(const p of arranged){let name=p.kind<4?(phase===0?'tree':phase===1?'amber-tree':'pine'):['fern','rock','flowers','mushrooms','ruin','fern'][p.kind-4];if(phase===2&&p.kind===5)name='ruin';if(phase===0&&name==='ruin')name='flowers';let w=(['tree','amber-tree','pine'].includes(name)?125:name==='ruin'?69:65)*p.scale;this.shadow(p.x,p.cy+5,w*.4,w*.1,.15);this.sprite(name,p.x,p.cy,w,null,Math.sin(p.y)*.04,1,.88,p.flip);}
    if(phase===1){ // High canyon walls, silhouetted behind the orange canopies.
      for(const side of [0,1]){c.save();if(side){c.translate(W,0);c.scale(-1,1);}c.fillStyle='#b1855c';for(let i=0;i<3;i++){let y=(i*385+offset*.65)%1155-160;this.path(p=>{p.moveTo(-10,y);p.bezierCurveTo(36,y-18,60,y+42,39,y+101);p.lineTo(25,y+148);p.lineTo(-10,y+163);p.closePath();},'#ac8c61','#917c57',2);c.strokeStyle='#c5aa79';c.lineWidth=4;c.beginPath();c.moveTo(1,y+25);c.lineTo(27,y+36);c.lineTo(32,y+70);c.stroke();}c.restore();}}
    // Dappled light and airborne leaves, fireflies in the final biome.
    const glow=c.createRadialGradient(290,280,0,220,360,520);glow.addColorStop(0,phase===2?'#b0e7d00d':'#fff3bc17');glow.addColorStop(1,'#143d3526');c.fillStyle=glow;c.fillRect(0,0,W,H);
    for(const b of this.bugs){const x=b.x+Math.sin(t*.6+b.phase)*18,y=(b.y+t*(phase===2?6:17))%H;c.save();c.translate(x,y);c.rotate(Math.sin(t+b.phase));c.fillStyle=phase===2?'#e6f3b1':b.phase>3?'#f8df9b':'#dce3ac';c.globalAlpha=.45+Math.sin(t*2+b.phase)*.22;c.beginPath();if(phase===2){c.arc(0,0,b.s*.65,0,Math.PI*2);c.shadowColor='#dcf7ac';c.shadowBlur=10;}else c.ellipse(0,0,b.s*1.6,b.s*.6,0,0,Math.PI*2);c.fill();c.restore();}
    if(home){const vignette=c.createLinearGradient(0,0,0,844);vignette.addColorStop(0,'#1c4b3c66');vignette.addColorStop(.45,'#1c4b3c00');vignette.addColorStop(1,'#133e3955');c.fillStyle=vignette;c.fillRect(0,0,W,H);}
  }
  drawHome(time){this.begin();this.terrain(time*.22,0,true);const c=this.ctx;
    // Decorative expedition scene: living artwork beneath the title.
    this.sprite('gate',210,388,225,null,0,.66,.8);
    this.shadow(240,535,65,19,.21);this.sprite('camper',248,503+Math.sin(time*2)*1.5,112,null,-.07);
    this.shadow(248,632,44,13,.18);this.sprite('trailer',248,609,87,null,-.05);
    this.shadow(128,528,30,9,.2);this.sprite('fox',129,511+Math.sin(time*2.5)*3,92,null,.04+Math.sin(time*2)*.03);
    this.shadow(86,610,23,7,.17);this.sprite('bunny',86,594+Math.sin(time*2+1)*3,61,null,-.1);
    this.shadow(175,624,25,8,.18);this.sprite('bear',176,607+Math.sin(time*2+2)*2,68,null,.05);
    this.shadow(312,599,20,6,.16);this.sprite('owl',311,572+Math.sin(time*2.5+2)*6,59,null,-.1);
    for(let i=0;i<5;i++){const a=time*.35+i*1.3,x=194+Math.cos(a)*90,y=400+Math.sin(a)*19;this.sprite('sun',x,y,17,null,Math.sin(a)*.2,.5);}
    this.sprite('fern',4,701,126,null,-.2);this.sprite('fern',398,681,140,null,.12,1,.8,true);this.sprite('flowers',42,647,61);this.sprite('mushrooms',340,652,64);
    this.end();
  }
  begin(){const c=this.ctx;c.setTransform(this.scale,0,0,this.canvas.height/H,0,0);c.clearRect(0,0,W,H);c.save();if(this.shake>0&&this.motion)c.translate((Math.random()-.5)*this.shake,(Math.random()-.5)*this.shake);}
  end(){this.ctx.restore();}
  draw(game,elapsed,paused=false){this.begin();const c=this.ctx,t=game.time,phase=game.phase;this.terrain(t,phase);this.frame++;
    if(game.boss){this.shadow(game.boss.x,game.boss.y+60,86,23,.3);const bob=Math.sin(t*2)*3;this.sprite('boss',game.boss.x,game.boss.y+bob,190,null,Math.sin(t*.8)*.025,game.boss.hp<=0?.25:1,.65);if(game.boss.vulnerable&&game.boss.hp>0){c.save();c.globalAlpha=.35+Math.sin(t*5)*.15;c.fillStyle='#c3ffe1';c.shadowColor='#c3ffe1';c.shadowBlur=19;c.beginPath();c.ellipse(game.boss.x,game.boss.y-94,8,15,0,0,Math.PI*2);c.fill();c.restore();}}
    for(const w of game.warnings){if(w.timer>0){const progress=1-w.timer/w.total;c.save();c.strokeStyle='#ffe1b8';c.lineWidth=2;c.setLineDash([6,5]);c.beginPath();c.arc(w.x,w.y,w.radius,0,Math.PI*2);c.stroke();c.setLineDash([]);c.fillStyle=`rgba(229,112,88,${.15+progress*.26})`;c.beginPath();c.arc(w.x,w.y,w.radius*progress,0,Math.PI*2);c.fill();this.text('!',w.x,w.y,25,'#ffe7c3');c.restore();}else{c.save();c.globalAlpha=clamp(1+w.timer*2,0,1);this.sprite('log',w.x,w.y,85,null,Math.PI*.3);c.strokeStyle='#ffd9a0';c.lineWidth=4;c.beginPath();c.arc(w.x,w.y,55-w.timer*40,0,Math.PI*2);c.stroke();c.restore();}}
    for(const item of game.pickups){const pulse=Math.sin(elapsed*5+item.id)*3;this.shadow(item.x,item.y+10,10,4,.1);this.sprite(item.kind,item.x,item.y+pulse, item.kind==='sun'?27:31,null,Math.sin(elapsed*3+item.id)*.1,1,.55);}
    if(game.route)this.drawRoute(game.route,t);
    const actors=[];
    for(const h of game.hazards)actors.push({y:h.y,draw:()=>{this.shadow(h.x,h.y+7,34,10,.2);this.sprite(h.kind,h.x,h.y,h.kind==='log'?92:72,null,h.kind==='log'?-.13:0,h.hit?.65:1,.6);}});
    for(const r of game.rescues)actors.push({y:r.y,draw:()=>this.drawRescue(r,t)});
    for(const e of game.enemies)actors.push({y:e.y,draw:()=>{this.shadow(e.x,e.y+4,24,7);this.sprite('prowler',e.x+Math.sin(t*8+e.id)*2,e.y+Math.sin(t*9+e.id)*2,60,null,Math.sin(t*7+e.id)*.045);}});
    const p=game.player,convoy=game.convoy;
    actors.push({y:convoy.y+100,draw:()=>{this.shadow(convoy.x,convoy.y+113,33,10);this.sprite('trailer',convoy.x,convoy.y+97,65,null,Math.sin(t*4)*.018);c.strokeStyle='#5b6e53';c.lineWidth=4;c.beginPath();c.moveTo(convoy.x,convoy.y+41);c.lineTo(convoy.x,convoy.y+60);c.stroke();}});
    actors.push({y:convoy.y,draw:()=>{this.shadow(convoy.x,convoy.y+20,42,12,.23);this.sprite('camper',convoy.x,convoy.y,83,null,Math.sin(t*3.5)*.018);if(game.shield>0){c.save();c.strokeStyle='#b0ede29e';c.lineWidth=2;c.setLineDash([6,7]);c.beginPath();c.ellipse(convoy.x,convoy.y-35,53,80,0,0,Math.PI*2);c.stroke();c.restore();}if(convoy.hp<36){for(let i=0;i<3;i++){c.save();c.globalAlpha=.15;c.fillStyle='#3d5053';c.beginPath();c.arc(convoy.x+26+Math.sin(t*2+i)*6,convoy.y-85-((t*23+i*18)%60),8+i*3,0,Math.PI*2);c.fill();c.restore();}}}});
    game.allies.forEach((kind,i)=>{const x=clamp(p.x+[-39,35,-12][i]+Math.sin(t*3+i)*3,24,366),y=clamp(p.y+44+i*17,230,765);actors.push({y,draw:()=>{this.shadow(x,y+5,14,5,.13);this.sprite(kind,x,y+Math.sin(t*7+i)*2,kind==='owl'?39:43,null,Math.sin(t*5+i)*.05);}});});
    actors.push({y:p.y,draw:()=>{this.shadow(p.x,p.y+9,23,7,.22);c.save();c.strokeStyle='#fff2aeaa';c.lineWidth=1.8;c.beginPath();c.ellipse(p.x,p.y+7,24,9,0,0,Math.PI*2);c.stroke();c.restore();const walk=p.moving*Math.sin(t*16)*2,rot=p.moving*Math.sin(t*8)*.055;this.sprite('fox',p.x,p.y+walk,59,null,rot,p.invulnerable>0&&Math.floor(t*15)%2===0?.42:1);}});
    actors.sort((a,b)=>a.y-b.y);for(const a of actors)a.draw();
    this.drawEffects(paused?0:elapsed-this.lastElapsed||0);
    this.lastElapsed=elapsed;this.shake*=.86;
    // Framing foliage stays outside the player's area and reinforces the painted scene.
    this.sprite('fern',-8,854,107,null,-.25,.9);this.sprite('fern',404,857,116,null,.24,.9,.8,true);
    if(game.state==='won'){this.sprite('gate',195,331,220,null,0,.75);for(let i=0;i<18;i++){const x=(i*83+elapsed*25)%390,y=(i*71+elapsed*50)%844;c.save();c.translate(x,y);c.rotate(elapsed+i);c.fillStyle=['#f4ce7f','#b9dea1','#ecaa91'][i%3];c.fillRect(-3,-5,6,10);c.restore();}}
    this.end();
  }
  drawRescue(r,t){const c=this.ctx;this.shadow(r.x,r.y+15,35,10,.18);c.save();c.fillStyle='#f8edaa22';c.strokeStyle='#fff0b4aa';c.lineWidth=2;c.setLineDash([5,5]);c.beginPath();c.ellipse(r.x,r.y+8,47,24,0,0,Math.PI*2);c.fill();c.stroke();c.setLineDash([]);c.restore();this.sprite(r.kind,r.x,r.y,47,null,Math.sin(t*2)*.03);this.sprite('cage',r.x,r.y+7,67,null,0,.85);const y=r.y-82+Math.sin(t*4)*3;this.rounded(r.x-13,y-13,26,26,9,'#fff0bf','#b69564');this.text('!',r.x,y,18,'#926f4d');if(r.progress>0){c.strokeStyle='#345f50';c.lineWidth=6;c.beginPath();c.arc(r.x,r.y-20,38,-Math.PI/2,Math.PI*1.5);c.stroke();c.strokeStyle='#e8e9a0';c.lineWidth=4;c.beginPath();c.arc(r.x,r.y-20,38,-Math.PI/2,-Math.PI/2+Math.PI*2*r.progress);c.stroke();}}
  drawRoute(r,t){const c=this.ctx;this.rounded(132,r.y-75,126,24,10,'#234d42e6','#d8d8a755');this.text('CHỌN LỐI ĐI',195,r.y-63,10,'#f2e6b9');for(const [side,x]of[['left',99],['right',291]]){const kind=r[side],icon={heal:'heart',power:'sun',shield:'shield',sun:'sun'}[kind];this.shadow(x,r.y+28,38,11);this.sprite('gate',x,r.y+14,104,null,0,1,.7);this.sprite(icon,x,r.y-4+Math.sin(t*3)*3,31,null,0,1,.55);const label={heal:'+32 độ bền',power:'+1 sức mạnh',shield:'+2 khiên',sun:'+12 nắng'}[kind];this.rounded(x-47,r.y+33,94,24,8,'#f6dfaa','#aa946b');this.text(label,x,r.y+45,9,'#4b6450');}this.sprite('sign',195,r.y+30,43);}
  addEffect(type,e){
    const r=Math.random;if(type==='hit'){this.shake=9;this.effects.push({kind:'ring',x:e.x,y:e.y,color:'#fba387',life:.5,max:.5});}
    if(type==='slam'){this.shake=4;this.effects.push({kind:'ring',x:e.x,y:e.y,color:'#f8c995',life:.6,max:.6});}
    if(type==='shot'||type==='beam')this.effects.push({kind:'bolt',x:e.x,y:e.y,tx:e.tx,ty:e.ty,color:type==='beam'?'#fff2a6':'#ddf8b9',life:.21,max:.21});
    if(['pickup','rescue','heal','poof','block','route'].includes(type)){
      const colors={pickup:['#fff2b2','#f4cb75'],rescue:['#fff1af','#c3e7b5','#f4c996'],heal:['#b0e7ac','#e9efbd'],poof:['#d4b5bf','#edd5ae'],block:['#b0efe1','#def4c4'],route:['#f8dc96','#d0e6b5']};
      for(let i=0;i<(type==='rescue'?22:8);i++)this.effects.push({kind:'spark',x:e.x,y:e.y,vx:(r()-.5)*135,vy:-35-r()*100,color:colors[type][i%colors[type].length],life:.4+r()*.4,max:.8,size:2+r()*3});
      if(['rescue','block','heal'].includes(type))this.effects.push({kind:'ring',x:e.x,y:e.y,color:colors[type][0],life:.65,max:.65});
      if(type==='heal'&&e.amount>0)this.effects.push({kind:'word',text:`+${Math.round(e.amount)}`,x:e.x,y:e.y-25,color:'#f1f5c5',life:.9,max:.9});
    }
  }
  drawEffects(dt){const c=this.ctx;dt=clamp(dt,0,.05);for(const e of this.effects){e.life-=dt;const a=clamp(e.life/e.max,0,1);c.save();c.globalAlpha=a;if(e.kind==='spark'){e.x+=e.vx*dt;e.y+=e.vy*dt;e.vy+=140*dt;c.fillStyle=e.color;c.translate(e.x,e.y);c.rotate(e.life*4);c.beginPath();c.moveTo(0,-e.size*1.5);c.quadraticCurveTo(0,0,e.size,0);c.quadraticCurveTo(0,0,0,e.size*1.5);c.quadraticCurveTo(0,0,-e.size,0);c.quadraticCurveTo(0,0,0,-e.size*1.5);c.fill();}else if(e.kind==='bolt'){c.strokeStyle=e.color;c.lineWidth=e.color==='#fff2a6'?6:3;c.shadowColor=e.color;c.shadowBlur=10;c.beginPath();c.moveTo(e.x,e.y);c.quadraticCurveTo((e.x+e.tx)/2+20,(e.y+e.ty)/2,e.tx,e.ty);c.stroke();}else if(e.kind==='ring'){c.strokeStyle=e.color;c.lineWidth=2;c.beginPath();c.ellipse(e.x,e.y,(1-a)*65+10,(1-a)*35+5,0,0,Math.PI*2);c.stroke();}else if(e.kind==='word'){e.y-=dt*30;this.text(e.text,e.x,e.y,19,e.color);}c.restore();}this.effects=this.effects.filter(e=>e.life>0).slice(-250);}
}
