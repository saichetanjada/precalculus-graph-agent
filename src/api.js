import { runTutor } from './agent.js';

const limits=new Map();let active=0;
export function validateInput(input){
  if(!input||typeof input.question!=='string'||!input.question.trim()||input.question.length>4000)throw new Error('Enter a question of 1–4,000 characters.');
  if(input.history!==undefined&&(!Array.isArray(input.history)||input.history.length>12))throw new Error('Start a new conversation to continue.');
  const history=(input.history||[]).map(m=>{if(!m||!['user','assistant'].includes(m.role)||typeof m.content!=='string'||m.content.length>10000)throw new Error('Invalid conversation.');return {role:m.role,content:m.content}});
  if(history.reduce((n,m)=>n+m.content.length,0)>32000)throw new Error('Start a new conversation to continue.');
  if(input.context!==undefined&&(typeof input.context!=='string'||input.context.length>600))throw new Error('Invalid graph context.');
  return {question:input.question.trim(),history,context:input.context||'',mode:['explain','hint','practice'].includes(input.mode)?input.mode:'explain'};
}
export async function handleApi(request,env){
  const url=new URL(request.url),headers={'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
  const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers});
  if(url.pathname==='/health')return json({ok:true});
  if(url.pathname==='/api/status')return json({configured:!!env.OPENAI_API_KEY,accessCodeRequired:!!env.TUTOR_ACCESS_CODE});
  if(url.pathname!=='/api/tutor')return json({error:'Not found'},404);
  if(request.method!=='POST')return json({error:'Use POST.'},405);
  const origin=request.headers.get('Origin');
  if(origin!==url.origin)return json({error:'This request must come from the tutoring website.'},403);
  if(env.TUTOR_ACCESS_CODE && request.headers.get('X-Tutor-Access-Code')!==env.TUTOR_ACCESS_CODE)return json({error:'Enter the class access code to use the AI tutor.'},401);
  const local=['localhost','127.0.0.1','[::1]'].includes(url.hostname);
  const platformPrivate=Boolean(request.headers.get('oai-authenticated-user-id')) && env.SITES_PRIVATE_DEPLOYMENT==='true';
  if(!env.TUTOR_ACCESS_CODE&&!local&&!platformPrivate&&env.ALLOW_PUBLIC_AI!=='true')return json({error:'The website owner must configure a class access code before enabling AI access.'},503);
  if(!env.OPENAI_API_KEY)return json({error:'The AI service is not configured yet. Graphing still works.'},503);
  const id=request.headers.get('oai-authenticated-user-id')||request.headers.get('CF-Connecting-IP')||'shared';
  const now=Date.now();for(const [k,v]of limits)if(v.until<now)limits.delete(k);
  const bucket=limits.get(id)||{count:0,until:now+3600000};
  if(bucket.count>=30)return json({error:'This session has reached its hourly AI request limit. Try again later.'},429);
  if(active>=3)return json({error:'The tutor is helping other students. Please try again shortly.'},429);
  let input;try{if(Number(request.headers.get('Content-Length'))>48000)throw new Error('Question is too long.');const text=await request.text();if(text.length>48000)throw new Error('Question is too long.');input=validateInput(JSON.parse(text));}catch(e){return json({error:e.message||'Invalid question.'},400)}
  bucket.count++;limits.set(id,bucket);active++;
  try{return json(await runTutor(input,env,AbortSignal.timeout(65000)))}catch(e){
    console.error('Tutor request failed:',e?.status||e?.name||'Error');
    const code=e?.code||e?.error?.code;
    if(['insufficient_quota','credit_balance_exhausted'].includes(code))return json({error:'The AI account needs API credits. The website owner can add credits to enable tutoring.'},503);
    if(e?.status===429)return json({error:'The AI service has reached its current usage limit. Try again later.'},429);
    if(e?.status===401||e?.status===403)return json({error:'The AI service connection needs the website owner’s attention.'},503);
    return json({error:'The AI tutor could not finish that request. Try a shorter question.'},502);
  }finally{active--}
}
