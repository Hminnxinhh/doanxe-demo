// Articulated original Canvas rigs. Each limb has its own pivot and animation curve.
// Path2D caches vector geometry; the runtime never rasterizes a whole character to fake a walk.
const paths=new Map();
function path(c,d,fill,stroke='#294c48',width=2.4){let p=paths.get(d);if(!p){p=new Path2D(d);paths.set(d,p);}c.fillStyle=fill;c.strokeStyle=stroke;c.lineWidth=width;c.lineJoin='round';c.lineCap='round';if(fill)c.fill(p);if(stroke)c.stroke(p);}
function joint(c,x,y,angle,draw){c.save();c.translate(x,y);c.rotate(angle);draw();c.restore();}
function eye(c,x,y,blink=false){path(c,blink?`M${x-2} ${y}l5 0`:`M${x} ${y-2}l0 4`,null,'#293f3e',3.3);}
function leg(c,x,y,a,color){joint(c,x,y,a,()=>{path(c,'M-6 0L5 0L6 12L1 16L-7 13Z',color);joint(c,0,11,-a*.65,()=>path(c,'M-6 0L5 0L9 9Q1 15-9 8Z','#5a5e52'));});}
export function drawFriend(c,{kind='fox',x,y,size=60,walk=0,moving=0,facing=1,hurt=0,attack=0,time=0,back=false,rescue=false}){
 c.save();c.translate(x,y);c.scale(size/90*facing,size/90);const step=moving>3?Math.sin(walk):0,blink=Math.sin(time*1.1+kind.length)> .994;
 // Feet and knees are separately articulated and alternate on the contact cycle.
 if(rescue)c.translate(0,5);
 leg(c,-13,-18,rescue?.6:step*.5,kind==='fox'?'#649c89':'#a5b9a6');leg(c,14,-18,rescue?-.3:-step*.5,kind==='fox'?'#649c89':'#a5b9a6');
 if(kind==='fox'){
  joint(c,20,-26,.2+Math.sin(walk*.5+time*2)*.19,()=>{path(c,'M0 0Q41 15 34-23Q23-9 5-14Z','#ed9d58');joint(c,28,-12,Math.sin(time*3)*.15,()=>path(c,'M0 0L7-12Q16 8 1 17L-7 9Z','#fff1d0'));});
  joint(c,-22,-49,rescue?-1+Math.sin(time*13)*.13:-step*.45-hurt*1.6,()=>path(c,'M0 0Q-16 4-13 22L-4 27L4 19Z','#eeaa68'));
  path(c,'M-22-53Q0-64 22-52L25-19Q0-8-25-20Z',hurt?'#f6ba9c':'#4c9d8c');path(c,'M-14-48L-6-28L13-30L18-48',null,'#a1cfaa',3);
  joint(c,22,-49,attack>0?-1.3:rescue?-1.05+Math.sin(time*13+1)*.13:-step*.45+hurt*1.6,()=>{path(c,'M-3 0Q15 3 13 23L3 28L-4 19Z','#eeaa68');if(attack>0)path(c,'M9 16L15-8L20-9L17 23Z','#f1d991');});
  joint(c,0,-62,step*.035-hurt*.7+(rescue?.15:0),()=>{
   path(c,'M-21-17L-31-48Q-32-56-23-49L-4-32L16-51Q24-57 24-47L24-17',hurt?'#ffd2a0':'#efad64');
   path(c,'M-25-44L-19-25L-10-29M18-44L8-28L19-26','#aa6a65',null);
   path(c,'M-22-30Q0-38 23-27L31-10Q25 8 2 13Q-23 7-32-10Z',hurt?'#ffd9ad':'#f2b26a');
   if(!back){path(c,'M-29-12L-10-9L1 3L12-11L29-12Q25 6 2 12Q-20 7-29-12Z','#fff0d1',null);eye(c,-12,-15,blink);eye(c,13,-16,blink);path(c,'M-3-4Q2-7 6-4L2 1Z','#344740');path(c,'M1 3Q-4 9-10 4M2 3Q7 8 12 3',null,'#506056',1.6);}
   path(c,'M-22-30Q0-42 18-33L18-26L-22-24Z','#a6c78d');path(c,'M-24-27Q0-33 22-28L30-23Q0-18-29-22Z','#c8dda0');path(c,'M2-35L5-44L13-41L10-34','#e9d08b');
  });
  path(c,'M-23-56Q0-46 24-59L21-49L-7-43L-24-49Z','#ef8269');joint(c,-15,-47,.12+step*.16,()=>path(c,'M0 0L-23 5L-18 17L3 6Z','#ec705c'));
 }else if(kind==='owl'){
  for(const side of[-1,1])joint(c,side*20,-48,side*(.3+Math.sin(time*10+walk)*.6),()=>{c.scale(side,1);path(c,'M0 0Q34-6 29 25L22 34L15 26L9 31L-2 17Z','#b39acb');});
  path(c,'M-22-46Q0-62 23-44L25-19Q0-6-25-20Z','#a08bbf');
  joint(c,0,-62,Math.sin(time*3)*.04,()=>{path(c,'M-25-10L-27-36L-7-29L15-30L27-40L27-12Q30 11 1 17Q-31 9-25-10Z','#b29bcd');path(c,'M-21-16Q-10-26 1-14Q13-26 24-17L22 1Q9 13 1 6Q-12 14-23 1Z','#fff0d3');eye(c,-11,-10,blink);eye(c,13,-10,blink);path(c,'M-3-1L7-1L2 8Z','#ebbe6e');});
  path(c,'M-23-45L-1-35L23-48L26-40L0-26L-24-37Z','#72b8ae');
 }else{
  const bunny=kind==='bunny',fur=bunny?'#fff0d5':'#aacbd0';
  joint(c,-23,-46,-step*.4,()=>path(c,'M0 0Q-16 5-13 25L-2 28L5 15Z',fur));
  path(c,'M-23-51Q0-61 23-50L28-19Q0-8-27-20Z',bunny?'#7ab68c':'#71a6b6');
  joint(c,23,-45,attack>0?-1.3:step*.4,()=>{path(c,'M0 0Q16 3 13 24L2 29L-4 15Z',fur);if(bunny){path(c,'M4 13L22 12L24 31L6 33Z','#f0dfaf');path(c,'M14 17L14 29M9 23L19 23',null,'#df8f7b',2.6);}});
  joint(c,0,-63,step*.04,()=>{
   if(bunny){for(const side of[-1,1])joint(c,side*12,-21,side*.12+step*.12,()=>{path(c,'M-5 2Q-14-31-3-34Q10-29 6 4Z',fur);path(c,'M-3-23L1-7',null,'#e3b4aa',3);});}
   else{path(c,'M-23-16Q-39-25-28-34Q-16-39-13-24M14-25Q21-40 31-32Q39-21 24-16',fur);}
   path(c,'M-23-24Q0-35 23-23L28-5Q23 16 0 17Q-24 14-28-5Z',hurt?'#f9c7ae':fur);
   eye(c,-12,-11,blink);eye(c,13,-12,blink);path(c,bunny?'M-3-1L5-1L1 4Z':'M-6-2Q0-5 7-2L2 5Z',bunny?'#d49394':'#47666c');path(c,'M-5 7Q0 12 7 6',null,'#657b71',1.6);
   if(bunny){path(c,'M-24-23Q0-31 24-23L23-16L-24-15Z','#7ab68c');path(c,'M-4-28L6-28L6-15L-4-15Z','#f7ebc7',null);path(c,'M1-25L1-18M-2-21L4-21',null,'#d78b77',2);}
  });
  if(!bunny)joint(c,-24,-30,step*.15,()=>{path(c,'M-15-8L6-14L15 0Q12 17-1 23Q-17 13-18-1Z','#e7d59d');path(c,'M-10-5L3-9L9 1Q5 13-1 16Q-10 10-11 0Z','#73a8b3');});
 }
 c.restore();
}
export function drawEnemy(c,e,t){const size=e.kind==='brute'?77:e.kind==='spitter'?55:54;c.save();c.translate(e.x,e.y);c.scale(size/90*e.facing,size/90);const dead=e.hp<=0?Math.max(0,e.dead/.45):1;c.globalAlpha=dead;if(e.hp<=0){c.rotate((1-dead)*.8);c.scale(1,.45+dead*.55);}const step=Math.sin(e.walk);
 if(e.kind==='spitter'){
  joint(c,0,-8,Math.sin(t*3)*.1,()=>{path(c,'M-6 0Q8-17-4-38L6-39Q18-15 6 2Z','#72a475');path(c,'M-4-16Q-34-18-29-39Q-9-40 0-23M6-10Q29-7 30-30Q12-35 6-17','#91bb82');
   joint(c,0,-47,e.state==='windup'?-.12:Math.sin(t*2)*.07,()=>{path(c,'M-19-12L-23-26L-8-25L0-36L11-27L26-27L22-12L29 2L16 10L13 21L-2 15L-17 23L-20 9L-32 2Z',e.hurt?'#f7b9a4':'#c28ba0');path(c,'M-17-7Q0-17 17-6L20 7Q1 18-17 7Z','#805d81');path(c,'M-11-1L11-1L12 8L-11 10Z',e.state==='windup'?'#ffd88c':'#443f61');eye(c,-10,-14);eye(c,12,-15);});});
 }else if(e.kind==='brute'){
  leg(c,-18,-15,step*.25,'#788c86');leg(c,18,-15,-step*.25,'#788c86');
  for(const side of[-1,1])joint(c,side*26,-55,side*(e.state==='windup'?-2:e.attack>0?.5:step*.22),()=>{path(c,'M-9-2L9-5L15 25L8 36L-12 31L-16 12Z',e.hurt?'#dbbda2':'#8f9f92');if(side===1)path(c,'M-15 21L24 14L36 30L27 48L-10 51L-24 37Z','#809c91');});
  path(c,'M-30-60L-18-76L17-75L32-56L34-15Q0 7-34-16Z',e.hurt?'#e2b19b':'#8ca496');path(c,'M-18-69L-9-47L19-49L25-63',null,'#bdd0a6',4);
  joint(c,0,-68,e.state==='windup'?-.1:.04*step,()=>{path(c,'M-22-15L-8-27L16-25L28-8L22 13L-15 15L-27 1Z','#a5b7a1');path(c,'M-18-4L-4-3M7-4L21-5',null,'#ffdc93',5);path(c,'M-8 8L9 8',null,'#537369',3);});
 }else{
  for(const side of[-1,1])for(const front of[0,1])joint(c,side*23,-18-front*15,side*(.25+Math.sin(e.walk+front*Math.PI)*.4),()=>path(c,'M0 0L19 12L22 25',null,'#69576d',6));
  path(c,'M-33-44L-19-64L12-68L32-50L36-24L21-10L-20-9L-36-25Z',e.hurt?'#efb5a5':'#ac869e');path(c,'M-18-62L-9-34L19-30L29-47M-9-34L-25-15',null,'#896980',3);path(c,'M-27-29L-8-28L-9-18L-24-17M8-29L28-30L24-18L8-18Z','#ffdc93');joint(c,0,-11,e.state==='windup'?.25:0,()=>path(c,'M-10-3L9-3L7 5L-7 5Z','#68546d'));path(c,'M-17-62Q-23-81-8-76L0-66M9-64Q17-83 23-73L21-62','#8eb486');
 }
 c.restore();}
export function drawBoss(c,b,t){c.save();c.translate(b.x,b.y);c.scale(1.15,1.15);const dead=b.state==='defeated',squash=dead?Math.max(.25,Math.min(1,b.clock/1.5)):1;c.scale(1,squash);c.globalAlpha=dead?.55:1;const charge=b.state==='charge',wind=b.state==='windup',roar=b.state==='roar',exposed=b.state==='exposed',a=charge?Math.sin(t*30)*.6:Math.sin(t*2)*.06;
 for(const side of[-1,1]){
  joint(c,side*45,31,a*side,()=>path(c,'M-20-3L16-6L26 26L16 38L-21 36L-28 19Z','#719487'));
  joint(c,side*64,-44,side*(wind&&b.attackKind==='slam'?-1.7:roar?-1:charge?-.7:a),()=>{path(c,'M-15-5L18-8L27 15L22 44L-12 51L-24 24Z',b.hit?'#ffcfaa':'#8aa898', '#345e58',3);path(c,'M-8 31L12 30M-5 39L15 37',null,'#b7c9a4',3);});
 }
 path(c,'M-58-77L-24-100L26-101L62-77L70-27L54 25L13 48L-29 39L-68 8L-72-35Z',b.hit?'#edbfa1':b.phase===2?'#648b87':'#7ba18e','#315c55',4);
 path(c,'M-58-77L-33-36L2-22L26-101M-33-36L-61 13M2-22L12 46M2-22L59-43',null,'#3d7165',4);
 if(b.phase===2)path(c,'M-25-88L-10-60L-18-42L7-14L0 9L20 22M31-65L18-39L33-18',null,'#efc681',3);
 joint(c,0,-60,roar?Math.sin(t*18)*.1:charge?.14:Math.sin(t*2)*.025,()=>{
  for(const side of[-1,1])joint(c,side*48,-30,side*(wind?-.16:.06),()=>{c.scale(side,1);path(c,'M0 0L14-28L11-49L21-61L27-40L42-46L46-37L29-23L16 7Z','#9e8058');path(c,'M14-30Q-6-59 12-63Q33-54 23-35M27-42Q46-70 52-52Q56-34 34-31','#75b17d');});
  path(c,'M-53-21Q-32-41 0-37Q35-44 55-23L53 18Q32 42 0 43Q-38 40-57 15Z',b.hit?'#ffe0b2':'#93b29c','#345e58',3);
  path(c,'M-43-8L-13-4L-15 9L-39 8M14-5L44-9L40 7L16 10Z',exposed?'#fff4ad':b.phase===2?'#ffb982':'#f9d58d');
  joint(c,0,26,roar?.35:exposed?.18:0,()=>path(c,'M-18-4L-4-10L15-9L25 1L9 13L-12 11L-25 1Z','#386658'));
  path(c,'M-55-28Q-72-52-48-60Q-35-80-16-65Q1-88 23-70Q51-83 58-57Q77-50 54-29L30-23L5-35L-24-24Z','#5baf7b','#345e58',3);
  const pulse=exposed?1+Math.sin(t*9)*.1:1;joint(c,0,-55,Math.sin(t*3)*.04,()=>{c.scale(pulse,pulse);path(c,'M-13-7L-7-36L6-43L20-12L8 9Z',exposed?'#fff4b0':b.phase===2?'#f5bc85':'#9fe4c8');path(c,'M-7-36L3-12L6-43M3-12L8 9M3-12L20-12',null,'#eaffd6',2);});
 });c.restore();}
export function drawTurret(c,x,y,shot=0,aim=0,time=0){
 c.save();c.translate(x,y);c.scale(.75,.75);
 path(c,'M-22 3L0-5L23 3L22 17L0 25L-23 17Z','#a18b60');
 path(c,'M-12-24L12-24L16 9L-16 10Z','#73a894');
 joint(c,0,-19,aim,()=>{
  const recoil=shot>0?Math.sin(shot/.25*Math.PI)*5:0;c.translate(0,recoil);
  path(c,'M-5 1L-5-35L5-35L6 2Z','#dbc78e');
  for(const side of[-1,1])joint(c,side*4,-23,side*(shot>0?.25:0),()=>{c.scale(side,1);path(c,'M0 0Q18-19 30-6L33 5Q21-4 7 8Z','#91b88b');});
  path(c,'M-29-22L0-9L29-22',null,'#ead4a1',2);path(c,'M0-43L-8-34L0-29L8-35Z','#f4d58d');
 });path(c,'M9-5L26-2L25 11L12 6Z','#edbb79');c.restore();
}
