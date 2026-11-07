import {WORLD,DURATION,SCENARIOS,ALLIES,clamp,distance,rng,routePoint,moveBody} from './world.js';
export {W,H,WORLD,DURATION,SCENARIOS,ALLIES,clamp,distance,rng} from './world.js';
export class Expedition {
 constructor(seed=Date.now()>>>0,variant=seed%3){
  this.seed=seed;this.random=rng(seed);this.variant=((variant%3)+3)%3;this.scenario=SCENARIOS[this.variant];this.time=0;this.state='playing';this.phase=0;this.id=0;this.events=[];
  this.player={x:650,y:1125,hp:100,invulnerable:0,walk:0,facing:1,attack:0,hurt:0};this.input={x:0,y:0};this.target=null;
  this.convoy={...routePoint(0),hp:100,hit:0};this.allies=[];this.enemies=[];this.projectiles=[];this.warnings=[];this.pickups=[];this.zones=[];this.barriers=[];
  this.camp={x:650+this.scenario.side*285,y:1050,kind:this.scenario.friend,progress:0,state:'waiting',opens:9,deadline:31};
  this.shrine={x:650-this.scenario.side*270,y:786,progress:0,state:'waiting'};this.fortify=0;this.decision=null;this.choices=[];
  this.boss=null;this.pads=[{x:482,y:461,progress:0},{x:839,y:362,progress:0},{x:637,y:650,progress:0}];
  this.shotAt=0;this.turretAt=0;this.allyAt=0;this.spawnAt=10;this.wave1=false;this.wave2=false;this.mission2=false;this.coins=0;this.score=0;this.routeHistory=[];
  this.stats={rescued:0,defeated:0,damage:0,hullDamage:0,shots:0,padShots:0,dodged:0,blocked:0,phases:0};
  this.metrics={bossPatterns:[],enemyKinds:[],positions:[],furthest:0};
  for(const p of [{x:520,y:1170},{x:790,y:1100},{x:725,y:859},{x:410,y:808},{x:941,y:820}])this.pickups.push({...p,id:++this.id,kind:'heart'});
 }
 emit(type,data={}){this.events.push({type,...data});}drainEvents(){return this.events.splice(0);}
 damagePlayer(n,source){const p=this.player;if(this.state!=='playing'||p.invulnerable>0)return;p.hp=Math.max(0,p.hp-n);p.invulnerable=.8;p.hurt=.35;this.stats.damage+=n;this.emit('hit',{x:p.x,y:p.y,amount:n});if(source){const d=distance(p,source)||1;moveBody(p,(p.x-source.x)/d*16,(p.y-source.y)/d*16);}if(!p.hp)this.finish(false,'Cáo kiệt sức · Hãy né vùng báo đòn');}
 damageConvoy(n){if(this.state!=='playing')return;this.convoy.hp=Math.max(0,this.convoy.hp-n);this.convoy.hit=.4;this.stats.hullDamage+=n;this.emit('hullHit',{x:this.convoy.x,y:this.convoy.y,amount:n});if(!this.convoy.hp)this.finish(false,'Đoàn xe bị phá · Hãy trở về khi còi báo động vang');}
 finish(won,reason){if(this.state!=='playing')return;this.state=won?'won':'lost';this.reason=reason;this.score+=Math.round(this.convoy.hp*2)+(won?500:0);this.emit('end',{won});}
 spawn(kind,x,y){const e={id:++this.id,kind,x,y,hp:{runner:7,spitter:8,brute:17}[kind],state:'seek',clock:0,attack:0,hurt:0,walk:0,facing:1,cooldown:1.5+this.random(),dead:0};this.enemies.push(e);if(!this.metrics.enemyKinds.includes(kind))this.metrics.enemyKinds.push(kind);return e;}
 hurtEnemy(e,n){if(e.hp<=0)return;e.hp-=n;e.hurt=.18;if(e.hp<=0){e.dead=.45;this.stats.defeated++;this.score+=30;this.coins++;this.emit('poof',{x:e.x,y:e.y});}}
 fire(from,to,speed=160,damage=12,spread=0){const a=Math.atan2(to.y-from.y,to.x-from.x)+spread;this.projectiles.push({id:++this.id,x:from.x,y:from.y-15,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,life:6,damage});}
 warn(kind,x,y,delay,radius=55,extra={}){this.warnings.push({id:++this.id,kind,x,y,timer:delay,total:delay,radius,hit:false,...extra});}
 decide(kind){if(this.decision)return;this.decision=kind;this.shrine.state=kind==='roots'?'done':'missed';this.choices.push(kind);this.routeHistory.push(kind);this.emit('choice',{choice:kind});
  if(kind==='roots'){this.barriers=[-104,0,104].map((dx,i)=>({x:this.convoy.x+dx,y:this.convoy.y-83,hp:42,max:42,id:++this.id,index:i}));this.spawn('brute',this.convoy.x+180,this.convoy.y-145);}
 }
 update(dt){
  if(this.state!=='playing')return;dt=clamp(dt,0,.05);this.time+=dt;const t=this.time,p=this.player,c=this.convoy;
  p.invulnerable=Math.max(0,p.invulnerable-dt);p.hurt=Math.max(0,p.hurt-dt);p.attack=Math.max(0,p.attack-dt);c.hit=Math.max(0,c.hit-dt);
  let v={...this.input};if(this.target){const d=distance(p,this.target);v=d>4?{x:(this.target.x-p.x)/d*Math.min(1,d/25),y:(this.target.y-p.y)/d*Math.min(1,d/25)}:{x:0,y:0};}
  const m=Math.hypot(v.x,v.y);if(m>1){v.x/=m;v.y/=m;}const moved=moveBody(p,v.x*225*dt,v.y*225*dt);p.moving=moved/dt;if(moved>.01){p.walk+=moved*.105;if(Math.abs(v.x)>.12)p.facing=v.x>0?1:-1;}
  this.metrics.furthest=Math.max(this.metrics.furthest,Math.abs(p.x-650));
  const pos=routePoint(Math.min(t/67,1));c.x=pos.x;c.y=pos.y;
  for(const b of this.barriers){b.x=c.x+[-104,0,104][b.index];b.y=c.y-83;}
  if(t>9&&this.camp.state==='waiting'){this.camp.state='open';this.emit('camp',{kind:this.camp.kind});}
  const camp=this.camp;
  if(camp.state==='open'){
   if(distance(p,camp)<49){camp.progress+=dt;if(camp.progress>=2.6){camp.state='rescued';this.allies.push(camp.kind);this.stats.rescued++;this.score+=150;this.choices.push('rescue');this.emit('rescue',{kind:camp.kind,x:camp.x,y:camp.y});}}
   else camp.progress=Math.max(0,camp.progress-dt*.8);
   if(t>camp.deadline&&camp.state==='open'){camp.state='missed';this.choices.push('guard');this.emit('missed',{kind:camp.kind});}
  }
  if(!this.wave1&&t>15){this.wave1=true;this.emit('ambush');for(let i=0;i<3;i++)this.spawn('runner',c.x-140+i*140,c.y-210-i*17);}
  if(!this.mission2&&t>36){this.mission2=true;this.shrine.state='open';this.emit('mission2');}
  if(this.shrine.state==='open'){
   if(distance(p,this.shrine)<51){this.shrine.progress+=dt;if(this.shrine.progress>=2.4)this.decide('roots');}else this.shrine.progress=Math.max(0,this.shrine.progress-dt);
   if(t>43&&distance(p,c)<90){this.fortify+=dt;if(this.fortify>=4)this.decide('turret');}else this.fortify=Math.max(0,this.fortify-dt*.6);
   if(t>56&&!this.decision){this.decide('none');this.emit('missed2');}
  }
  if(!this.wave2&&t>44){this.wave2=true;this.spawn('brute',c.x-145,c.y-175);this.spawn('spitter',c.x+165,c.y-190);}
  if(t>=this.spawnAt&&t<64){this.spawnAt=t+5.8;const kind=t<22?'runner':this.random()<.55?this.scenario.enemy:['runner','spitter','brute'][Math.floor(this.random()*3)];const a=this.random()*Math.PI*2;this.spawn(kind,c.x+Math.cos(a)*210,c.y+Math.sin(a)*185-40);}
  if(t>=68&&!this.boss){this.phase=2;this.boss={x:660,y:292,home:{x:660,y:292},hp:300,maxHp:300,phase:1,state:'arrive',clock:2.8,pattern:0,activePad:this.variant%3,attackKind:'slam',hit:0,exposed:0};this.metrics.bossPatterns=[];this.emit('boss');}
  else if(t>=36&&!this.boss)this.phase=1;
  if(this.boss)this.updateBoss(dt);
  this.updateEnemies(dt);this.updateProjectiles(dt);this.updateWarnings(dt);
  const living=this.enemies.filter(e=>e.hp>0);
  if(t>this.shotAt){const target=living.filter(e=>distance(p,e)<155).sort((a,b)=>distance(p,a)-distance(p,b))[0];if(target){this.shotAt=t+.55;p.attack=.25;this.hurtEnemy(target,3.1);this.stats.shots++;this.emit('shot',{x:p.x,y:p.y-28,tx:target.x,ty:target.y-15});}
   else if(this.boss?.state==='exposed'&&distance(p,this.boss)<180){this.shotAt=t+.6;p.attack=.25;this.boss.hp-=1.8;this.boss.hit=.15;this.emit('shot',{x:p.x,y:p.y-28,tx:this.boss.x,ty:this.boss.y});}}
  if(this.decision==='turret'&&t>this.turretAt){this.turretAt=t+.7;const target=living.filter(e=>distance(c,e)<280).sort((a,b)=>distance(c,a)-distance(c,b))[0];if(target){this.hurtEnemy(target,4);this.emit('turretShot',{x:c.x,y:c.y+35,tx:target.x,ty:target.y});}}
  if(this.allies.length&&t>this.allyAt){this.allyAt=t+({owl:4.5,bear:5,bunny:6}[this.allies[0]]);const kind=this.allies[0];if(kind==='owl'){let n=0;this.projectiles=this.projectiles.filter(b=>{if(distance(b,p)<190){n++;return false;}return true;});this.stats.blocked+=n;this.emit('vacuum',{x:p.x,y:p.y});}
   if(kind==='bear'){for(const e of living)if(distance(e,c)<235){e.slowUntil=t+3;this.hurtEnemy(e,2);}this.emit('snare',{x:c.x,y:c.y});}
   if(kind==='bunny'){this.zones.push({x:c.x,y:c.y+45,life:4});c.hp=Math.min(100,c.hp+5);if(distance(p,c)<160)p.hp=Math.min(100,p.hp+9);this.emit('heal',{x:c.x,y:c.y});}}
  this.zones=this.zones.filter(z=>(z.life-=dt)>0);
  for(const i of this.pickups)if(!i.used&&distance(p,i)<30){i.used=true;p.hp=Math.min(100,p.hp+22);this.emit('heal',{x:p.x,y:p.y});}
  this.enemies=this.enemies.filter(e=>e.hp>0||(e.dead-=dt)>0);
  if(this.boss?.hp<=0){this.boss.hp=0;if(this.boss.state!=='defeated'){this.boss.state='defeated';this.boss.clock=1.5;this.emit('bossDefeated');}if(t>=90&&this.boss.clock<=0)this.finish(true,'Cả đoàn đã vượt rừng!');}
  if(t>=DURATION&&this.state==='playing')this.finish(false,'Cổng chưa mở · Hãy phản công bằng gương nắng');
 }
 updateEnemies(dt){const t=this.time,p=this.player,c=this.convoy;
  for(const e of this.enemies){e.attack=Math.max(0,e.attack-dt);e.hurt=Math.max(0,e.hurt-dt);if(e.hp<=0)continue;e.clock+=dt;e.cooldown-=dt;
   const nearPlayer=distance(e,p)<100;const target=e.kind==='runner'?c:nearPlayer?p:c;const d=distance(e,target)||1;const oldx=e.x;let speed=e.kind==='runner'?61:e.kind==='spitter'?35:30;if(e.slowUntil>t)speed*=.28;
   if(e.state==='windup'){if(e.clock>=e.windup){e.clock=0;e.attack=.45;if(e.kind==='runner'){e.state='dash';e.dx=(e.aim.x-e.x)/(distance(e,e.aim)||1);e.dy=(e.aim.y-e.y)/(distance(e,e.aim)||1);}
    else if(e.kind==='spitter'){this.fire(e,e.aim,145,13);e.state='seek';e.cooldown=2.5;}
    else{this.warn('smash',e.aim.x,e.aim.y,.08,64,{damage:19,enemy:e.id});e.state='recover';e.cooldown=3;}}}
   else if(e.state==='dash'){const dashSpeed=260*(e.slowUntil>t?.28:1);e.x+=e.dx*dashSpeed*dt;e.y+=e.dy*dashSpeed*dt;e.walk+=dt*22;if(distance(e,p)<30)this.damagePlayer(13,e);if(distance(e,c)<43){this.damageConvoy(11);e.hp=0;e.dead=.45;}if(e.clock>.7){e.state='seek';e.cooldown=1.7;e.clock=0;}}
   else if(e.state==='recover'){if(e.clock>.7){e.clock=0;e.state='seek';}}
   else{
    if(e.kind==='spitter'&&d<215){if(e.cooldown<=0){e.state='windup';e.clock=0;e.windup=.85;e.aim={x:p.x,y:p.y};}}
    else if(e.kind==='brute'&&d<92&&e.cooldown<=0){e.state='windup';e.clock=0;e.windup=1.15;e.aim={...target};this.warn('brute',target.x,target.y,1.15,64,{visual:true});}
    else if(e.kind==='runner'&&d<170&&e.cooldown<=0){e.state='windup';e.clock=0;e.windup=.8;e.aim={x:target.x,y:target.y};}
    else if(d>(e.kind==='spitter'?170:43)){const n=moveBody(e,(target.x-e.x)/d*speed*dt,(target.y-e.y)/d*speed*dt,20);e.walk+=n*.12;}
    else if(e.kind==='brute'&&e.cooldown<=0){this.damageConvoy(9);e.cooldown=2;}
   }
   if(Math.abs(e.x-oldx)>.01)e.facing=e.x>oldx?1:-1;
   for(const b of this.barriers)if(b.hp>0&&distance(e,b)<42){this.hurtEnemy(e,35);b.hp-=14;this.stats.blocked++;this.emit('block',{x:b.x,y:b.y});break;}
  }
 }
 updateProjectiles(dt){const p=this.player,c=this.convoy;for(const b of this.projectiles){b.life-=dt;b.x+=b.vx*dt;b.y+=b.vy*dt;for(const wall of this.barriers)if(wall.hp>0&&distance(b,wall)<41){wall.hp-=6;b.life=0;this.stats.blocked++;this.emit('block',{x:wall.x,y:wall.y});break;}if(b.life<=0)continue;if(distance(b,p)<20){this.damagePlayer(b.damage,b);b.life=0;}else if(distance(b,c)<35){this.damageConvoy(6);b.life=0;}}this.projectiles=this.projectiles.filter(b=>b.life>0&&b.x>20&&b.x<WORLD.w-20&&b.y>80&&b.y<WORLD.h);}
 updateWarnings(dt){for(const w of this.warnings){w.timer-=dt;if(w.timer<=0&&!w.hit){w.hit=true;if(w.visual)continue;if(w.kind==='fan'){for(let i=-w.count;i<=w.count;i++)this.fire(w,w.aim,170,w.damage||15,i*.18);}
   else if(w.kind==='charge'){/* Boss collision is swept by the moving body. */}
   else{this.emit('slam',{x:w.x,y:w.y});if(distance(this.player,w)<w.radius+13)this.damagePlayer(w.damage||18,w);else this.stats.dodged++;if(w.enemy&&distance(this.convoy,w)<w.radius+24)this.damageConvoy(9);}}}this.warnings=this.warnings.filter(w=>w.timer>-.5);}
 updateBoss(dt){const b=this.boss,t=this.time,p=this.player;b.clock-=dt;b.hit=Math.max(0,b.hit-dt);
  if(b.hp<=0)return;
  if(b.hp<=150&&b.phase===1){b.phase=2;b.pattern=0;b.state='roar';b.clock=1.8;this.warnings=[];this.emit('bossPhase');this.stats.phases++;}
  if(b.state==='arrive'||b.state==='roar'){if(b.clock<=0){b.state='prepare';b.clock=.6;}}
  else if(b.state==='prepare'&&b.clock<=0){const sequence=b.phase===1?this.scenario.bossOrder.filter(k=>k!=='charge'):['charge',...this.scenario.bossOrder.filter(k=>k!=='charge')];const kind=sequence[b.pattern++%sequence.length];b.attackKind=kind;b.state='windup';b.clock=b.phase===2?1.05:1.4;this.metrics.bossPatterns.push(`${b.phase}:${kind}`);b.aim={x:p.x,y:p.y};
   if(kind==='slam'){for(let i=0;i<(b.phase===2?3:2);i++)this.warn('slam',clamp(p.x+(i-1)*87,385,930),p.y+(i===1?60:0),b.clock+i*.16,53,{damage:18});}
   if(kind==='fan')this.warn('fan',b.x,b.y,b.clock,60,{aim:{...p},count:b.phase===2?3:2,damage:15});
   if(kind==='charge'){b.start={x:b.x,y:b.y};const d=distance(b,p)||1;b.end={x:clamp(b.x+(p.x-b.x)/d*315,400,912),y:clamp(b.y+(p.y-b.y)/d*315,215,590)};this.warn('charge',b.x,b.y,b.clock,37,{end:b.end,visual:true});}}
  else if(b.state==='windup'&&b.clock<=0){if(b.attackKind==='charge'){b.state='charge';b.clock=.65;}else{b.state='exposed';b.clock=3.1;this.emit('expose');}}
  else if(b.state==='charge'){const f=clamp(1-b.clock/.65,0,1);b.x=b.start.x+(b.end.x-b.start.x)*f;b.y=b.start.y+(b.end.y-b.start.y)*f;if(distance(b,p)<65)this.damagePlayer(23,b);if(b.clock<=0){b.state='exposed';b.clock=3.1;this.emit('expose');}}
  else if(b.state==='exposed'&&b.clock<=0){b.state='return';b.clock=.9;}
  else if(b.state==='return'){b.x+=(b.home.x-b.x)*dt*7;b.y+=(b.home.y-b.y)*dt*7;if(b.clock<=0){b.x=b.home.x;b.y=b.home.y;b.state='prepare';b.clock=.45;}}
  for(let i=0;i<this.pads.length;i++){const pad=this.pads[i];if(i===b.activePad&&distance(p,pad)<35){pad.progress=Math.min(.72,pad.progress+dt);if(pad.progress>=.72&&b.state==='exposed'){b.hp-=45;b.hit=.4;this.stats.padShots++;this.score+=80;this.emit('beam',{x:pad.x,y:pad.y,tx:b.x,ty:b.y});pad.progress=0;b.activePad=(b.activePad+1+(this.variant===2?1:0))%3;}}
   else pad.progress=Math.max(0,pad.progress-dt*1.4);}
 }
 snapshot(){return structuredClone({seed:this.seed,variant:this.variant,scenario:this.scenario,time:this.time,state:this.state,phase:this.phase,player:this.player,convoy:this.convoy,camp:this.camp,shrine:this.shrine,fortify:this.fortify,decision:this.decision,choices:this.choices,allies:this.allies,enemies:this.enemies,projectiles:this.projectiles,warnings:this.warnings,barriers:this.barriers,pickups:this.pickups,zones:this.zones,boss:this.boss,pads:this.pads,stats:this.stats,metrics:this.metrics,score:this.score,coins:this.coins});}
}
