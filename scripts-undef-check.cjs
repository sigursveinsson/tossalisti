const fs=require('fs'),path=require('path');
const parser=require(path.resolve('node_modules/@babel/parser'));
const traverse=require(path.resolve('node_modules/@babel/traverse')).default;
const G=new Set(Object.getOwnPropertyNames(globalThis).concat(['window','document','navigator','localStorage','sessionStorage','fetch','location','history','alert','confirm','prompt','URL','URLSearchParams','FileReader','Image','Blob','File','FormData','Notification','AudioContext','MediaRecorder','requestAnimationFrame','cancelAnimationFrame','getComputedStyle','matchMedia','atob','btoa','crypto','performance','IntersectionObserver','ResizeObserver','HTMLElement','Event','CustomEvent','KeyboardEvent','screen','self','caches','indexedDB','process','import','__dirname','structuredClone','queueMicrotask','TextEncoder','TextDecoder','ImageData','OffscreenCanvas','createImageBitmap','BarcodeDetector','DOMException','AbortController','Headers','Request','Response','WebSocket','Worker','MutationObserver','PointerEvent','TouchEvent','DataView','ArrayBuffer','Uint8Array','Float32Array','Int16Array','Uint8ClampedArray','Intl','React']));
let bad=0;
for(const f of process.argv.slice(2)){
  const code=fs.readFileSync(f,'utf8');
  const ast=parser.parse(code,{sourceType:'module',plugins:['jsx']});
  traverse(ast,{ReferencedIdentifier(p){const n=p.node.name; if(p.parentPath.isJSXMemberExpression()||p.isJSXIdentifier()&&/^[a-z]/.test(n)) return; if(!p.scope.hasBinding(n)&&!G.has(n)){console.log(f+':'+p.node.loc.start.line+' undefined '+n);bad++}}});
}
console.log('undef',bad);
