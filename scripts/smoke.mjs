import { runTutor } from '../src/agent.js';
try {
 const result=await runTutor({question:'Plot f(x)=(x-2)^2-3. Explain the vertex and x-intercepts in simple terms, and verify one root.',context:'No function selected.'},process.env,AbortSignal.timeout(60000));
 if(!result.actions.length||!result.toolCalls.some(t=>t.name.startsWith('plot_')&&t.status==='completed'))throw new Error('No successful graph tool call.');
 console.log(JSON.stringify({ok:true,tools:result.toolCalls,graphs:result.actions.map(a=>a.kind),answer:result.answer},null,2));
} catch(e){console.log(JSON.stringify({ok:false,status:e.status||null,code:e.code||e.error?.code||null,message:e.message?.replace(/sk-[A-Za-z0-9_-]+/g,'[redacted]')},null,2));process.exitCode=1}
