(function(){
  'use strict';
  var endpoint=localStorage.getItem('tmb.gpt.endpoint')||'',token='';
  async function json(prompt,options){
    if(!endpoint || !token) throw new Error('请先在右上角「GPT 设置」填写接口地址和访问口令');
    var res;
    try {res=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({task:options && options.task || 'generate',prompt:prompt}),signal:AbortSignal.timeout(100000)});}catch(e){throw new Error(e.name==='TimeoutError'?'生成超时，请重试':'无法连接 GPT 接口，请检查地址和网络');}
    var body;try{body=await res.json();}catch(e){throw new Error('接口返回格式不正确');}
    if(!res.ok)throw new Error(body.error||'GPT 请求失败');
    if(!body.data || typeof body.data!=='object' || Array.isArray(body.data))throw new Error('GPT 输出格式不正确');
    return body.data;
  }
  window.TMB_GPT={sample:function(){return Promise.resolve({json:json});}};
  document.addEventListener('DOMContentLoaded',function(){
    var btn=document.createElement('button');btn.className='btn';btn.textContent='GPT 设置';btn.id='gptSettings';document.getElementById('btnBreak').before(btn);
    btn.addEventListener('click',function(){
      var d=document.createElement('dialog');d.style.cssText='max-width:540px;width:90%;border:1px solid #ddd;border-radius:20px;padding:24px;color:#1e1f3b';
      d.innerHTML='<h2>连接 GPT</h2><p>接口部署完成后填写。OpenAI 密钥只配置在服务端。</p><form method="dialog"><label>GPT 接口地址<input name="endpoint" type="url" required placeholder="https://你的接口域名/api/gpt" style="width:100%;margin:10px 0"></label><label>团队访问口令<input name="token" type="password" required autocomplete="off" style="width:100%;margin:10px 0"></label><p>口令仅在本次页面打开期间保留，刷新后需要重填。素材文字和参考模板会发送至已配置接口及 OpenAI。</p><p role="status"></p><button class="btn primary" type="submit">保存连接</button> <button class="btn" type="button" id="gptCancel">取消</button></form>';
      document.body.append(d);d.querySelector('[name=endpoint]').value=endpoint;d.querySelector('[name=token]').value=token;
      d.querySelector('#gptCancel').onclick=function(){d.close();};
      d.querySelector('form').addEventListener('submit',function(e){e.preventDefault();var url=d.querySelector('[name=endpoint]').value.trim();try{var u=new URL(url);if(u.protocol!=='https:' || u.username || u.password || u.search || u.hash || u.pathname!=='/api/gpt')throw Error();}catch(err){d.querySelector('[role=status]').textContent='请填写 https://域名/api/gpt，不包含密钥或查询参数';return;}endpoint=url;token=d.querySelector('[name=token]').value;localStorage.setItem('tmb.gpt.endpoint',url);d.close();});
      d.addEventListener('close',function(){d.remove();});d.showModal();
    });
  });
})();
