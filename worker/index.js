import assets from '../.sites-runtime/assets.js';
import { handleApi } from '../src/api.js';
export default {async fetch(request,env){
 const path=new URL(request.url).pathname;
 if(path.startsWith('/api/')||path==='/health')return handleApi(request,env);
 const asset=assets[path];if(!asset||!['GET','HEAD'].includes(request.method))return new Response('Not found',{status:404});
 return new Response(request.method==='HEAD'?null:asset.body,{headers:{'Content-Type':asset.type+'; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'same-origin','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self'; img-src 'self' blob: data:; object-src 'none'; base-uri 'none'"}});
}};
