import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { handleApi } from './src/api.js';

const files={'/':['public/index.html','text/html'],'/app.js':['public/app.js','text/javascript'],'/families.js':['src/families.js','text/javascript'],'/styles.css':['public/styles.css','text/css']};
const root=new URL('./',import.meta.url);
const server=http.createServer(async(req,res)=>{
  try{
    const origin=process.env.APP_ORIGIN||`http://${req.headers.host}`;
    const url=new URL(req.url,origin);
    if(url.pathname.startsWith('/api/')||url.pathname==='/health'){
      let body='';for await(const chunk of req){body+=chunk;if(body.length>48000){res.writeHead(413);res.end('Request too large');return}}
      const request=new Request(url,{method:req.method,headers:req.headers,...(['GET','HEAD'].includes(req.method)?{}:{body})});
      const result=await handleApi(request,process.env);res.writeHead(result.status,Object.fromEntries(result.headers));res.end(await result.text());return;
    }
    const file=files[url.pathname];if(!file||!['GET','HEAD'].includes(req.method)){res.writeHead(404);res.end('Not found');return}
    res.writeHead(200,{'Content-Type':file[1]+'; charset=utf-8','X-Content-Type-Options':'nosniff','Referrer-Policy':'same-origin','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self'; img-src 'self' blob: data:; object-src 'none'; base-uri 'none'; frame-ancestors 'none'"});
    res.end(req.method==='HEAD'?'':await readFile(fileURLToPath(new URL(file[0],root))));
  }catch{res.writeHead(500);res.end('Request failed')}
});
server.listen(Number(process.env.PORT)||3000,'0.0.0.0',()=>console.log('Graph Studio is listening.'));
