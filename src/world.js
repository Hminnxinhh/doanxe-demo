export const W=390,H=844,WORLD={w:1320,h:1540},DURATION=120;
export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
export function rng(seed){let s=seed>>>0;return()=>{s+=0x6d2b79f5;let t=s;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
export const ROUTE=[{x:650,y:1230},{x:625,y:1090},{x:686,y:952},{x:592,y:805},{x:689,y:656},{x:660,y:522}];
export function routePoint(t){const lengths=ROUTE.slice(1).map((p,i)=>distance(p,ROUTE[i])),total=lengths.reduce((a,b)=>a+b,0);let d=clamp(t,0,1)*total;for(let i=0;i<lengths.length;i++){if(d<=lengths[i]){const f=d/lengths[i];return{x:ROUTE[i].x+(ROUTE[i+1].x-ROUTE[i].x)*f,y:ROUTE[i].y+(ROUTE[i+1].y-ROUTE[i].y)*f};}d-=lengths[i];}return{...ROUTE.at(-1)};}
export const SCENARIOS=[
 {name:'Bầy gai thức giấc',friend:'owl',side:1,enemy:'spitter',detail:'Đạn gai dày đặc · Mực có thể hút đạn',bossOrder:['fan','slam','charge']},
 {name:'Cuộc đột kích hoàng hôn',friend:'bear',side:-1,enemy:'runner',detail:'Bầy lao nhanh · Bắp có thể ghìm chân chúng',bossOrder:['charge','slam','fan']},
 {name:'Tiếng trống trong sương',friend:'bunny',side:1,enemy:'brute',detail:'Quái nặng tiến lên · Mây dựng vườn hồi phục',bossOrder:['slam','fan','charge']},
];
export const ALLIES={owl:{name:'Mực',role:'Hút đạn gai'},bear:{name:'Bắp',role:'Ghìm chân bầy lao'},bunny:{name:'Mây',role:'Vườn hồi phục'}};
// Deliberately placed navigation obstacles, distinct from decorative canopies.
export const OBSTACLES=[
 {x:460,y:1090,r:41,kind:'rock'},{x:837,y:1165,r:43,kind:'log'},
 {x:800,y:958,r:46,kind:'rock'},{x:510,y:895,r:37,kind:'log'},
 {x:838,y:771,r:46,kind:'rock'},{x:445,y:696,r:40,kind:'ruin'},
 {x:521,y:422,r:33,kind:'ruin'},{x:804,y:448,r:32,kind:'ruin'},
 {x:340,y:1205,r:48,kind:'rock'},{x:1000,y:650,r:42,kind:'log'},
 {x:330,y:930,r:66,kind:'pond'},{x:1050,y:1110,r:58,kind:'pond'},
];
export function moveBody(body,dx,dy,radius=17){
 const before={x:body.x,y:body.y};body.x=clamp(body.x+dx,65,WORLD.w-65);body.y=clamp(body.y+dy,150,WORLD.h-85);
 for(const o of OBSTACLES){const d=distance(body,o),min=radius+o.r;if(d<min){const ax=d>.001?(body.x-o.x)/d:1,ay=d>.001?(body.y-o.y)/d:0;body.x=o.x+ax*min;body.y=o.y+ay*min;}}
 return distance(before,body);
}
