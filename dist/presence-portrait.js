'use strict';
// Animation of a generated source portrait using a deformable 2.5D image surface.
// Phoneme timestamps are real; viseme deformation is a simplified prototype rig.
(()=>{
 const canvas=document.getElementById('presence'),avatar=document.getElementById('ghost');
 const gl=canvas.getContext('webgl',{alpha:true,antialias:true,premultipliedAlpha:false});
 if(!gl){const fallback=new Image();fallback.src='media/laki-portrait.png';fallback.alt='Laki — portret holograficzny';fallback.className='portrait-fallback';avatar.append(fallback);canvas.hidden=true;return}
 const vertex=`attribute vec2 position;varying vec2 uv;void main(){uv=vec2((position.x+1.0)*.5,(1.0-position.y)*.5);gl_Position=vec4(position,0.,1.);}`;
 const fragment=`precision highp float;varying vec2 uv;uniform sampler2D portrait;uniform vec2 resolution;uniform float clock;uniform vec4 mouth;uniform float bite;uniform float blink;uniform float reduced;
 float bell(vec2 p,vec2 r){return exp(-dot(p/r,p/r));}
 float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
 void main(){float h=min(resolution.y*1.12,resolution.x*1.0);vec2 q=(uv*resolution-vec2(resolution.x*.5,resolution.y*.49))/h+vec2(.5,.5);float tilt=sin(clock*.25)*.005*(1.-reduced);vec2 v=q-vec2(.5,.43);q=vec2(v.x*cos(tilt)-v.y*sin(tilt),v.x*sin(tilt)+v.y*cos(tilt))+vec2(.5,.43);q.y+=sin(clock*.9)*.0015*(1.-reduced);
 vec2 original=q;vec2 m=q-vec2(.500,.458);float influence=bell(m,vec2(.105,.060));float width=1.+mouth.z*.16-mouth.y*.27;vec2 source=q;source.x-=m.x*(1.-1./width)*influence;float opening=mouth.x*.023*(1.-mouth.w*.95);source.y-=sign(m.y)*opening*exp(-pow(m.x/.075,4.))*exp(-pow(m.y/.080,4.));source.y+=bite*.004*bell(m-vec2(0.,.012),vec2(.08,.018));
 // Blink via local eyelid deformation, leaving the rest of the head stable.
 for(int i=0;i<2;i++){vec2 eye=vec2(i==0?.419:.582,.303);vec2 e=source-eye;float em=exp(-pow(e.x/.045,4.)-pow(e.y/.028,4.));source.y+=e.y*blink*6.*em;}
 vec4 col=texture2D(portrait,source);float halfWidth=.067*width;float profile=sqrt(max(0.,1.-pow(m.x/halfWidth,2.)));float cavity=step(abs(m.x),halfWidth)*(1.-smoothstep(opening*profile-.002,opening*profile,abs(m.y)));cavity*=smoothstep(.003,.009,opening);
 vec2 dotGrid=floor((original-vec2(.5,.458))*1254./3.);float dots=step(.91,hash(dotGrid));vec3 inside=vec3(.006,.017,.025)+vec3(.04,.16,.22)*dots*.45;col.rgb=mix(col.rgb,inside,cavity*.96);
 // A subdued inner ridge prevents an empty painted opening.
 float inner=exp(-pow((m.y-opening*.63)/.0025,2.))*exp(-pow(m.x/(halfWidth*.8),4.))*cavity;col.rgb+=vec3(.025,.055,.065)*inner;
 float inBounds=step(0.,q.x)*step(q.x,1.)*step(0.,q.y)*step(q.y,1.);col.a*=inBounds;gl_FragColor=col;}`;
 function shader(type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s}
 let program;try{program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,vertex));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error('Link error');}catch(e){canvas.hidden=true;const img=new Image();img.src='media/laki-portrait.png';img.alt='Laki — statyczny podgląd';img.className='portrait-fallback';avatar.append(img);return}
 gl.useProgram(program);const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);const a=gl.getAttribLocation(program,'position');gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,2,gl.FLOAT,false,0,0);const loc={};['portrait','resolution','clock','mouth','bite','blink','reduced'].forEach(k=>loc[k]=gl.getUniformLocation(program,k));
 const tex=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,tex);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.uniform1i(loc.portrait,0);
 let ready=false,lost=false,last=0;const img=new Image();img.onload=()=>{gl.bindTexture(gl.TEXTURE_2D,tex);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,img);ready=true};img.src='media/laki-portrait.png';
 function resize(){const d=Math.min(devicePixelRatio||1,1.5),r=canvas.getBoundingClientRect();canvas.width=Math.round(r.width*d);canvas.height=Math.round(r.height*d);gl.viewport(0,0,canvas.width,canvas.height)}new ResizeObserver(resize).observe(canvas);resize();
 canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();lost=true;});canvas.addEventListener('webglcontextrestored',()=>location.reload());
 function frame(t){requestAnimationFrame(frame);if(!ready||lost||document.hidden||avatar.hidden||t-last<33)return;last=t;const reduced=document.body.classList.contains('reduce-motion')||matchMedia('(prefers-reduced-motion:reduce)').matches;const speech=window.LakiSpeech?.getState();let p=speech?.active?speech.pose:null;if(!p){const state=window.LakiUI?.getState();const amount=parseFloat(getComputedStyle(avatar).getPropertyValue('--mouth'))||0;p={jaw:state?.state==='speaking'?amount:0,round:0,wide:0,closed:0,bite:0};}
 const blinkPhase=(t/1000)%6.8,blink=reduced?0:Math.exp(-Math.pow((blinkPhase-5.6)/.065,2.));gl.uniform2f(loc.resolution,canvas.width,canvas.height);gl.uniform1f(loc.clock,t/1000);gl.uniform4f(loc.mouth,p.jaw,p.round,p.wide,p.closed);gl.uniform1f(loc.bite,p.bite);gl.uniform1f(loc.blink,blink);gl.uniform1f(loc.reduced,reduced?1:0);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);gl.drawArrays(gl.TRIANGLES,0,6)}requestAnimationFrame(frame);
})();
