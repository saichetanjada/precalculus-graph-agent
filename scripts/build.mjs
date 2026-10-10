import {build} from 'esbuild';
import {readFile,writeFile,mkdir,rm,copyFile} from 'node:fs/promises';
const out=new URL('../dist/',import.meta.url);await rm(out,{recursive:true,force:true});await mkdir(new URL('server/',out),{recursive:true});await mkdir(new URL('.openai/',out),{recursive:true});
const files={};for(const [url,path,type]of [['/','public/index.html','text/html'],['/app.js','public/app.js','text/javascript'],['/families.js','src/families.js','text/javascript'],['/styles.css','public/styles.css','text/css']])files[url]={body:await readFile(path,'utf8'),type};
await mkdir('.sites-runtime',{recursive:true});await writeFile('.sites-runtime/assets.js','export default '+JSON.stringify(files)+';');
await build({entryPoints:['worker/index.js'],bundle:true,outfile:'dist/server/index.js',format:'esm',platform:'browser',conditions:['browser'],target:'es2022',external:['node:*'],minify:true,legalComments:'none'});
await copyFile('.openai/hosting.json','dist/.openai/hosting.json');console.log('Built website and agent server.');
