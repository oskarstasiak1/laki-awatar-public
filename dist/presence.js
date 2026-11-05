'use strict';
// Original sculpted point cloud: projected 3D head, neck and shoulders.
// Canvas rendering, no external model, texture, tracking, or network dependency.
(()=>{
const canvas=document.getElementById('presence'),avatar=document.getElementById('ghost');
const context=canvas.getContext('2d',{alpha:true});if(!context)return;
let width=600,height=380,dpr=1,last=0;
const points=[],rows=[];
const gaussian=(x,y,cx,cy,sx,sy)=>Math.exp(-(((x-cx)/sx)**2+((y-cy)/sy)**2));
function mouthShape(x,y){
 const width=Math.exp(-Math.pow(x/.27,6));
 const seam=-.49+.018*Math.pow(x/.3,2);
 const cupid=.018*Math.exp(-Math.pow((Math.abs(x)-.075)/.07,2));
 const upper=Math.exp(-Math.pow((y-(seam+.034+cupid))/.031,2));
 const lower=Math.exp(-Math.pow((y-(seam-.052))/.042,2));
 const crease=Math.exp(-Math.pow((y-seam)/.014,2));
 const under=Math.exp(-Math.pow((y-(seam-.125))/.055,2));
 return {depth:width*(.095*upper+.105*lower-.115*crease-.035*under),crease:width*crease};
}
function facialDepth(x,y){
 return .11*gaussian(x,y,0,.45,.65,.15)
 -.21*gaussian(x,y,-.31,.23,.2,.16)-.21*gaussian(x,y,.31,.23,.2,.16)
 +.10*gaussian(x,y,-.42,-.11,.21,.25)+.10*gaussian(x,y,.42,-.11,.21,.25)
 +.22*gaussian(x,y,0,.07,.105,.38)+.32*gaussian(x,y,0,-.1,.16,.13)
 -.10*gaussian(x,y,0,-.26,.22,.07)+mouthShape(x,y).depth
 +.10*gaussian(x,y,0,-.84,.3,.22);
}
for(let j=0;j<=88;j++){
 const row=[];const phi=-Math.PI/2+(j/88)*Math.PI;const y=Math.sin(phi)*1.38;
 for(let i=0;i<=112;i++){
 const theta=-Math.PI+(i/112)*Math.PI*2;
 let jaw=y<-.35?1-.23*Math.min(1,(-y-.35)/.9):1;
 let x=Math.sin(theta)*Math.cos(phi)*.84*jaw;
 let z=Math.cos(theta)*Math.cos(phi)*.8;
 const front=Math.max(0,Math.cos(theta))**5;
 // Brow ridge, paired eye sockets, cheekbones, nose bridge and tip, lips, chin.
 z+=front*facialDepth(x,y);
 const p={x,y,z,front,head:true,row:j,index:i};points.push(p);row.push(p);
 }rows.push(row);
}
function facePoint(x,y){
 const jaw=y<-.35?1-.23*Math.min(1,(-y-.35)/.9):1;
 const ring=Math.sqrt(Math.max(.01,1-(y/1.38)**2));
 const theta=Math.asin(Math.max(-.98,Math.min(.98,x/(.84*jaw*ring))));
 let z=Math.cos(theta)*ring*.8;const front=Math.max(0,Math.cos(theta))**5;
 z+=front*facialDepth(x,y);
 return {x,y,z,front,head:true};
}
// A fading neck and broad shoulder profile establishes a human presence.
for(let j=0;j<29;j++){
 const y=-1.15-j*.046,t=j/28;const breadth=.27+Math.max(0,t-.35)*2.05;
 for(let i=0;i<72;i++){const a=-Math.PI+(i/71)*Math.PI*2;points.push({x:Math.sin(a)*breadth,y,z:Math.cos(a)*(.24+t*.12)-.16,front:Math.max(0,Math.cos(a)),head:false,fade:Math.max(0,1-t*1.07),index:i,row:j})}
}
function resize(){const rect=canvas.getBoundingClientRect();width=rect.width;height=rect.height;dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);context.setTransform(dpr,0,0,dpr,0,0)}
new ResizeObserver(resize).observe(canvas);resize();
function frame(time){requestAnimationFrame(frame);if(document.hidden||avatar.hidden||time-last<40)return;last=time;
const ui=window.LakiUI?.getState()||{state:'idle',level:0};
const reduced=document.body.classList.contains('reduce-motion')||matchMedia('(prefers-reduced-motion:reduce)').matches;
const angle=.47+(reduced?0:Math.sin(time*.00018)*.09),tilt=-.035;
const level=ui.level||0,mouth=parseFloat(getComputedStyle(avatar).getPropertyValue('--mouth'))||0;
const lipOpening=ui.state==='speaking'?Math.min(.15,Math.max(0,mouth)*.14):0;
const bob=reduced?0:Math.sin(time*.0007)*3;
const scale=Math.min(height*.217,width*.205);
const cx=width/2,cy=height*.405+bob;
context.clearRect(0,0,width,height);
let rgb=ui.state==='thinking'?[185,174,142]:ui.state==='error'?[185,135,145]:ui.state==='listening'?[146,203,186]:[156,196,201];
const ca=Math.cos(angle),sa=Math.sin(angle),ct=Math.cos(tilt),st=Math.sin(tilt);
const project=p=>{let py=p.y;if(p.head&&ui.state==='speaking'){const influence=gaussian(p.x,py,0,-.49,.29,.16)*p.front;py+=Math.tanh((py+.49)/.022)*lipOpening*.5*influence;}let x=p.x*ca+p.z*sa,z=-p.x*sa+p.z*ca;const y=py*ct-z*st;z=py*st+z*ct;const perspective=5/(5-z*.17);return{x:cx+x*scale*perspective,y:cy-y*scale*perspective,z,alpha:p.head?.3+(z+.9)*.35:p.fade*.65,point:p}};
const projected=points.map(project);projected.sort((a,b)=>a.z-b.z);
// Broad atmospheric outline under the individual data points.
context.save();context.shadowColor=`rgba(${rgb.join(',')},.18)`;context.shadowBlur=0;
for(const p of projected){const point=p.point;const visible=p.z>-.1||!point.head;let alpha=visible?p.alpha:.055;if(!point.head)alpha*=point.fade;
 if(point.head&&point.front>.7){const sockets=gaussian(point.x,point.y,-.31,.23,.16,.12)+gaussian(point.x,point.y,.31,.23,.16,.12);alpha*=1-.94*Math.min(1,sockets)}
 if(point.head&&point.front>.7)alpha*=1-.68*mouthShape(point.x,point.y).crease;
 const scan=ui.state==='thinking'&&!reduced?1+.3*Math.sin(time*.0018+point.y*7):1;
 context.fillStyle=`rgba(${rgb.join(',')},${Math.max(0,Math.min(.88,alpha*scan))})`;
 const radius=point.head?(p.z>.5?.7:.5):.5;context.fillRect(p.x,p.y,radius*dpr*.7+.4,radius*dpr*.7+.4);
}context.restore();
// Sparse contour slices reveal the depth of the face, rather than a flat icon.
context.strokeStyle=`rgba(${rgb.join(',')},.10)`;context.lineWidth=.55;
for(let j=4;j<rows.length-4;j+=4){context.beginPath();let active=false;for(const point of rows[j]){const p=project(point);if(p.z<.04){active=false;continue}if(!active){context.moveTo(p.x,p.y);active=true}else context.lineTo(p.x,p.y)}context.stroke()}
// Existing landmarks: brows, eyelids and nasal rim, projected in 3D.
// Lips are shaped exclusively by the shared point-cloud geometry above.
context.lineWidth=.65;context.strokeStyle=`rgba(${rgb.join(',')},.25)`;
const line=(coords)=>{context.beginPath();coords.forEach(([x,y],i)=>{const p=project(facePoint(x,y));i?context.lineTo(p.x,p.y):context.moveTo(p.x,p.y)});context.stroke()};
for(const side of [-1,1]){
 line(Array.from({length:28},(_,i)=>{const t=i/27;return [side*(.13+t*.38),.40+Math.sin(t*Math.PI)*.055]}));
 line(Array.from({length:28},(_,i)=>{const t=i/27;return [side*(.17+t*.3),.22+Math.sin(t*Math.PI)*.05]}));
 line(Array.from({length:22},(_,i)=>{const t=i/21;return [side*(.04+t*.12),-.2-Math.sin(t*Math.PI)*.025]}));
}
// Ground plane and signal sweep are intentionally quiet.
context.strokeStyle=`rgba(${rgb.join(',')},.11)`;context.lineWidth=.6;context.beginPath();context.ellipse(cx,height*.89,scale*.97,scale*.13,0,0,Math.PI*2);context.stroke();
if(['listening','speaking'].includes(ui.state)){context.strokeStyle=`rgba(${rgb.join(',')},${.14+level*.35})`;context.beginPath();context.ellipse(cx,height*.89,scale*(1.05+level*.14),scale*.15,0,0,Math.PI*2);context.stroke()}
}
requestAnimationFrame(frame);
})();
