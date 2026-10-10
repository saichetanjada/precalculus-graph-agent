import {test} from 'node:test';
import assert from 'node:assert/strict';
import {ScriptedModel,functionCall,assistantMessage,modelResponder} from '@openai/agents/testing';
import {runTutor} from '../src/agent.js';
test('SDK executes a graph tool, feeds its result back, and returns the graph action',async()=>{
 const model=new ScriptedModel([
  [functionCall('plot_family',{family:'quadratic',a:1,h:2,k:-3,b:2},{callId:'graph-test'})],
  modelResponder(call=>{const serialized=JSON.stringify(call.request.input);assert.ok(serialized.includes('graphUpdated'));assert.ok(serialized.includes('domain'));return [assistantMessage('The vertex is (2, −3). The roots are 2 ± √3.')];})
 ]);
 const result=await runTutor({question:'Graph the quadratic and explain its vertex.'},{OPENAI_API_KEY:'test-placeholder'},undefined,{model});
 assert.equal(result.actions[0].kind,'family');assert.equal(result.actions[0].h,2);assert.equal(result.toolCalls[0].status,'completed');assert.ok(result.answer.includes('vertex'));model.assertComplete();
});
