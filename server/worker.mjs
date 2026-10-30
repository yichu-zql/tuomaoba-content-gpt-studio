import {skills} from './skill-prompts.mjs';
export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin');
    const cors = {'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN || '', 'Vary':'Origin', 'Access-Control-Allow-Headers':'Authorization, Content-Type', 'Access-Control-Allow-Methods':'POST, OPTIONS', 'Cache-Control':'no-store'};
    const reply = (data,status=200) => Response.json(data,{status,headers:cors});
    if (!origin || origin !== env.ALLOWED_ORIGIN) return reply({error:'来源未获授权'},403);
    if (new URL(request.url).pathname !== '/api/gpt') return reply({error:'接口不存在'},404);
    if (request.method === 'OPTIONS') return new Response(null,{status:204,headers:cors});
    if (request.method !== 'POST') return reply({error:'只接受 POST'},405);
    if (!env.ACCESS_TOKEN || request.headers.get('Authorization') !== 'Bearer '+env.ACCESS_TOKEN) return reply({error:'访问口令不正确'},401);
    if (!env.OPENAI_API_KEY || !env.OPENAI_MODEL) return reply({error:'服务端尚未配置模型或密钥'},503);
    try {
      // 流式限制请求体，不能仅信任 Content-Length。
      const reader=request.body?.getReader(); if(!reader) return reply({error:'请求为空'},400);
      const chunks=[]; let total=0;
      while(true){const {done,value}=await reader.read(); if(done)break;total+=value.byteLength;if(total>60000){await reader.cancel();return reply({error:'素材过长，请缩短后重试'},413);}chunks.push(value);}
      const bytes=new Uint8Array(total);let at=0;for(const c of chunks){bytes.set(c,at);at+=c.length;}
      let input;try{input=JSON.parse(new TextDecoder().decode(bytes));}catch{return reply({error:'请求格式错误'},400);}
      if (!['generate','breakdown'].includes(input.task) || typeof input.prompt !== 'string' || input.prompt.length<8) return reply({error:'任务或素材无效'},400);
      const upstream=await fetch('https://api.openai.com/v1/responses', {method:'POST',headers:{Authorization:'Bearer '+env.OPENAI_API_KEY,'Content-Type':'application/json'},body:JSON.stringify({model:env.OPENAI_MODEL,store:false,instructions:skills[input.task]+'\n只输出调用方要求的JSON对象，不要代码块。',input:input.prompt,text:{format:{type:'json_object'}},max_output_tokens:6000}),signal:AbortSignal.timeout(90000)});
      if(!upstream.ok) return reply({error:upstream.status===429?'模型额度或频率受限，请稍后重试':'模型服务调用失败，请检查服务端配置'},upstream.status===429?429:502);
      const result=await upstream.json();
      if(result.status!=='completed') return reply({error:'模型输出未完成，请缩短素材重试'},502);
      const raw=(result.output||[]).flatMap(x=>x.content||[]).filter(x=>x.type==='output_text').map(x=>x.text).join('');
      let data;try{data=JSON.parse(raw);}catch{return reply({error:'模型未返回有效JSON，请重试'},502);}
      if(!data || typeof data!=='object' || Array.isArray(data)) return reply({error:'模型结构无效'},502);
      return reply({data});
    } catch(e) { return reply({error:e.name==='TimeoutError'?'生成超时，请重试':'请求未完成，请稍后重试'},502); }
  }
};
