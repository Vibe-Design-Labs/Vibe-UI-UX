const vertex='attribute vec2 a_position;varying vec2 v_uv;void main(){v_uv=(a_position+1.0)*0.5;gl_Position=vec4(a_position,0.0,1.0);}';
const fragment='precision mediump float;varying vec2 v_uv;uniform vec2 u_size;uniform vec2 u_center;uniform float u_radius;uniform vec3 u_color;uniform float u_opacity;void main(){vec2 pixel=vec2(v_uv.x,1.0-v_uv.y)*u_size;float d=length(pixel-u_center)/max(u_radius,0.001);float glow=1.0-smoothstep(0.0,1.0,d);gl_FragColor=vec4(u_color,u_opacity*glow);}';

export function createSpotlightRenderer(canvas,{onBackend=()=>{}}={}){
 let gl=null,program=null,buffer=null,shaders=[],uniforms={},disposed=false,last=null;
 const abort=new AbortController();
 const release=()=>{if(gl){if(buffer)gl.deleteBuffer(buffer);if(program)gl.deleteProgram(program);for(const shader of shaders)gl.deleteShader(shader);}buffer=program=null;shaders=[];};
 function fallback(){gl=null;canvas.dataset.backend='css-fallback';onBackend('css-fallback');}
 function init(){
  if(disposed)return;
  try{
   gl=canvas.getContext('webgl',{alpha:true,premultipliedAlpha:false,antialias:false,preserveDrawingBuffer:true});if(!gl)throw new Error('WebGL unavailable');
   const compile=(type,source)=>{const shader=gl.createShader(type);shaders.push(shader);gl.shaderSource(shader,source);gl.compileShader(shader);if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw new Error('Shader compilation failed');return shader;};
   program=gl.createProgram();gl.attachShader(program,compile(gl.VERTEX_SHADER,vertex));gl.attachShader(program,compile(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(program);
   if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error('Shader link failed');
   buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
   for(const name of ['size','center','radius','color','opacity'])uniforms[name]=gl.getUniformLocation(program,'u_'+name);
   canvas.style.background='';canvas.dataset.backend='webgl';onBackend('webgl');
  }catch{release();fallback();}
 }
 function draw({width,height,x,y,radius,color,opacity}){
  if(disposed)return;last={width,height,x,y,radius,color,opacity};
  if(!gl||gl.isContextLost()){
   // Fallback is intentionally marked: CSS interpolation approximates the shader.
   const rgb=[1,3,5].map(i=>parseInt(color.slice(i,i+2),16)).join(',');
   canvas.style.background=`radial-gradient(circle ${radius}px at ${x}px ${y}px,rgba(${rgb},${opacity}) 0%,rgba(${rgb},${opacity*.5}) 50%,rgba(${rgb},0) 100%)`;
   return;
  }
  const dpr=Math.min(globalThis.devicePixelRatio||1,2),w=Math.max(1,Math.round(width*dpr)),h=Math.max(1,Math.round(height*dpr));
  if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
  gl.viewport(0,0,w,h);gl.useProgram(program);gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
  const location=gl.getAttribLocation(program,'a_position');gl.enableVertexAttribArray(location);gl.vertexAttribPointer(location,2,gl.FLOAT,false,0,0);
  gl.uniform2f(uniforms.size,width,height);gl.uniform2f(uniforms.center,x,y);gl.uniform1f(uniforms.radius,radius);
  gl.uniform3f(uniforms.color,...[1,3,5].map(i=>parseInt(color.slice(i,i+2),16)/255));gl.uniform1f(uniforms.opacity,opacity);
  gl.drawArrays(gl.TRIANGLES,0,6);gl.finish();
 }
 canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();buffer=program=null;shaders=[];fallback();if(last)draw(last);},{signal:abort.signal});
 canvas.addEventListener('webglcontextrestored',()=>{init();if(last)draw(last);},{signal:abort.signal});
 init();
 return {draw,get backend(){return canvas.dataset.backend;},dispose(){if(disposed)return;disposed=true;abort.abort();release();gl?.getExtension('WEBGL_lose_context')?.loseContext();gl=null;canvas.style.background='';last=null;}};
}
