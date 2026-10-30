import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import worker from '../server/worker.mjs';
const env={ALLOWED_ORIGIN:'https://example.github.io',ACCESS_TOKEN:'test-only',OPENAI_API_KEY:'fake-test-key',OPENAI_MODEL:'test-model'};
const req=(body,token='test-only',origin=env.ALLOWED_ORIGIN)=>new Request('https://api.example/api/gpt',{method:'POST',headers:{Origin:origin,Authorization:'Bearer '+token},body:JSON.stringify(body)});
test('接口拒绝未授权来源、口令与无效任务',async()=>{
 assert.equal((await worker.fetch(req({task:'generate',prompt:'测试素材不少于八个字'},'bad'),env)).status,401);
 assert.equal((await worker.fetch(req({},'test-only','https://bad.example'),env)).status,403);
 assert.equal((await worker.fetch(req({task:'unknown',prompt:'测试素材不少于八个字'}),env)).status,400);
 assert.equal((await worker.fetch(req({task:'generate',prompt:'字'.repeat(60001)}),env)).status,413);
});
test('接口解析Responses输出，不向客户端返回服务密钥',async()=>{
 const original=globalThis.fetch;
 try{
  globalThis.fetch=async(url,options)=>{const payload=JSON.parse(options.body);assert.equal(payload.store,false);assert.match(payload.instructions,/首句/);return Response.json({status:'completed',output:[{content:[{type:'output_text',text:'{"hooks":["开头"]}'}]}]});};
  const response=await worker.fetch(req({task:'breakdown',prompt:'测试素材不少于八个字'}),env);assert.equal(response.status,200);const body=await response.text();assert.ok(!body.includes('fake-test-key'));assert.deepEqual(JSON.parse(body).data.hooks,['开头']);
  globalThis.fetch=async()=>Response.json({status:'completed',output:[{content:[{type:'output_text',text:'不是JSON'}]}]});
  assert.equal((await worker.fetch(req({task:'generate',prompt:'测试素材不少于八个字'}),env)).status,502);
 }finally{globalThis.fetch=original;}
});
test('153条内容和24个主题仍可生成；视频号官号不输出文章结构',()=>{
 const root=new URL('../',import.meta.url), c=vm.createContext({window:{},console});
 for(const f of ['compliance.js','base.js','stores.js',...['douyin','xhs','sph','pyq'].map(p=>'content_'+p+'.js'),...['douyin','xhs','sph','pyq'].map(p=>'playbook_'+p+'.js'),'gen.js','breakdown.js'])vm.runInContext(fs.readFileSync(new URL(f,root),'utf8'),c);
 const w=c.window;assert.equal(w.TMB_ITEMS.length,153);assert.equal(w.TMB_STORES.length,78);let n=0;
 for(const [p,P]of Object.entries(w.TMB_PLATFORMS))for(const t of P.themes){const it=w.TMB_GEN.smart({p,theme:t.name,acct:P.accts[0],form:P.forms[0],idea:'想突出没人推销、顺路就做',points:['没人推销'],occasion:'常规',who:''},0,w.TMB_ITEMS);assert.equal(it.p,p);assert.equal(it.acct,P.accts[0]);if(p==='sph')assert.ok(it.f.script && it.f.post);n++;}assert.equal(n,24);
});
