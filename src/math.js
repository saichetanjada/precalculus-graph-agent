import { parse } from 'mathjs';
import { model } from './families.js';

export const FAMILIES = ['linear','quadratic','absolute','sqrt','cubic','exp','log','rational','sin','cos','tan'];
const FUNCTIONS = new Set(['sin','cos','tan','asin','acos','atan','sqrt','abs','log','log10','log2','exp','cbrt']);
const OPERATORS = new Set(['+','-','*','/','^']);

export function safeExpression(expression) {
  if (typeof expression !== 'string' || expression.length > 240 || !expression.trim()) throw new Error('Use an expression of 1–240 characters.');
  const node = parse(expression);
  let count = 0;
  node.traverse((n, path, parent) => {
    if (++count > 80) throw new Error('Expression is too complex.');
    if (n.isConstantNode) { if (typeof n.value !== 'number' || !Number.isFinite(n.value) || Math.abs(n.value)>1e12) throw new Error('Use finite numeric constants.'); }
    else if (n.isSymbolNode) { if (!['x','pi','e'].includes(n.name) && !(parent?.isFunctionNode && path === 'fn' && FUNCTIONS.has(n.name))) throw new Error('Unsupported symbol. Use x, pi, or e.'); }
    else if (n.isOperatorNode) { if (!OPERATORS.has(n.op)) throw new Error('Unsupported operation.'); }
    else if (n.isFunctionNode) { if (!n.fn.isSymbolNode || !FUNCTIONS.has(n.fn.name) || n.args.length>2) throw new Error('Unsupported function.'); }
    else if (!n.isParenthesisNode) throw new Error('Only mathematical expressions are supported.');
  });
  const compiled = node.compile();
  return x => { try { const y=compiled.evaluate({x}); return typeof y === 'number' && Number.isFinite(y) && Math.abs(y)<1e100 ? y : null; } catch { return null; } };
}

export function analyzeFamily(params) {
  const {family, a, h, k, b}=params;
  if (!FAMILIES.includes(family) || ![a,h,k,b].every(Number.isFinite) || a === 0 || Math.abs(a)>1000 || Math.abs(h)>1000 || Math.abs(k)>1000) throw new Error('Invalid function parameters.');
  if (['exp','log'].includes(family) && (b<=0||b===1||b>100)) throw new Error('Use a positive base other than 1, at most 100.');
  if (['sin','cos','tan'].includes(family) && (b<=0||b>10)) throw new Error('Trig frequency must be greater than 0 and at most 10.');
  const m=model(family,a,h,k,b);
  return {formula:m.formula,domain:m.domain,range:m.range,roots:m.roots.filter(Number.isFinite),rootScope:['sin','cos','tan'].includes(family)?'Representative roots in [-30,30]; periodic formulas are in steps.':'All real roots unless numerical overflow occurs.',yIntercept:Number.isFinite(m.fun(0))?m.fun(0):null,steps:m.sol,parameters:params};
}

export function evaluateExpression(expression, x) {
  if(!Number.isFinite(x)||Math.abs(x)>1e6) throw new Error('Use a finite input between −1,000,000 and 1,000,000.');
  return {expression,x,value:safeExpression(expression)(x),note:'null means undefined, non-real, or outside numerical limits.'};
}

export function sampleExpression(expression, xmin=-10, xmax=10, ymin=-10, ymax=10) {
  if(![xmin,xmax,ymin,ymax].every(Number.isFinite)||xmin>=xmax||ymin>=ymax||Math.max(...[xmin,xmax,ymin,ymax].map(Math.abs))>1000||xmax-xmin<0.01||ymax-ymin<0.01) throw new Error('Use ordered bounds in [-1000,1000], with a span of at least 0.01.');
  const fn=safeExpression(expression), samples=[],roots=[];
  const addRoot=x=>{const residual=fn(x);if(residual!==null&&Math.abs(residual)<1e-7&&!roots.some(r=>Math.abs(r-x)<1e-5))roots.push(x)};
  for(let i=0;i<=1200;i++){
    const x=xmin+(xmax-xmin)*i/1200,y=fn(x);samples.push([x,y]);
    if(y!==null&&Math.abs(y)<1e-10)addRoot(x);
    if(i>0){let [l,fl]=samples[i-1],r=x,fr=y;if(fl!==null&&fr!==null&&fl*fr<0){for(let j=0;j<48;j++){const mid=(l+r)/2,fm=fn(mid);if(fm===null)break;if(fl*fm<=0){r=mid;fr=fm}else{l=mid;fl=fm}}addRoot((l+r)/2);}}
  }
  return {kind:'expression',expression,xmin,xmax,ymin,ymax,samples,roots:roots.slice(0,40),yIntercept:fn(0),note:'Numerical plot only. Roots are candidates found in this window, not a complete symbolic solution. Sampling can miss narrow features, isolated holes, repeated roots, or rapid oscillations. Determine domain, range, and asymptotes analytically.'};
}
