const _="https://api.siliconflow.cn/v1",b="sk-puecndyhetxxaojzvziaijcbumeivatxicjkebhsqdpzctul",j="Qwen/Qwen3.5-397B-A17B",k={1:"你是文案创作师。输出：1.标题(2-3个) 2.正文(300-500字) 3.社交版本(50字内)",2:"你是全栈工程师，精通 TS/Vue3/Python/Go。输出：1.类型注解 2.关键注释 3.使用说明 4.依赖安装",3:"图像分析师。输出：1.场景 2.主体 3.色彩构图 4.文字 5.情感",4:"NLP情感分析专家。输出：1.情感倾向 2.强度 3.关键词汇 4.意图 5.一句话总结",5:`专业翻译家，精通中英日韩法德西班等 20+语言。
用户输入：[源语言] -> [目标语言]
内容，或直接输入文本。
未指定语言对则自动识别并翻译成中文。
输出：1.**识别语言** 2.**翻译结果** 3.**注释**（歇语/文化差异）`,6:`思维导图专家。生成纯文本树形思维导图。
一级节点3-5个，二级节点每支2-4个，节点内容简洁(2-8字)`,7:`精通古典诗词和现代诗的诗人。
输出：1.古典作品 2.现代诗 3.创作说明。禁止内容平淡缺乏意境`,8:`文本摘要专家。
输出：1.核心主题 2.关键要点(3-5条) 3.重要数据 4.关键词标签(5-8个) 5.预计阅读时间`,9:`博学多才的大厨，精通中国各菜系和世界美食。
根据菜名给出最正宗的完整食谱。
输出：
## [菅名]
**菜系起源**(1-2句)
**食材清单**(X人份): 主料/辅料/调料
**烹饪步骤**: 1.「备料」 2.「处理」 3.「烹制」 4.「摘盘」
**大厨小贴士**: 火候/技巧/常见失败原因
**难度**:★★★☆☆ | 烹饪时间:XX分钟`};async function S(i,f=3){var s,a,r;const t=await fetch("https://ark.cn-beijing.volces.com/api/v3/images/generations",{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer 3be8c7bf-40b3-47ff-9e42-d2cc2a33fd55"},body:JSON.stringify({model:"doubao-seedream-4-5-251128",prompt:i,size:"2048x1800",response_format:"url"})});if(!t.ok){const o=await t.json().catch(()=>({}));throw new Error(((s=o==null?void 0:o.error)==null?void 0:s.message)||`图片生成失败 (${t.status})`)}const n=(r=(a=(await t.json()).data)==null?void 0:a[0])==null?void 0:r.url;return n?[n]:[]}async function x(i){var n,s,a,r,o;const{featureId:f,userInput:l,onChunk:p,onDone:d,onError:t}=i,O=k[f]||"你是一个智能助手。";try{const e=await fetch(`${_}/chat/completions`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${b}`},body:JSON.stringify({model:j,stream:!0,max_tokens:2048,temperature:.7,messages:[{role:"system",content:O},{role:"user",content:l}]})});if(!e.ok){const c=await e.json().catch(()=>({}));t(((n=c==null?void 0:c.error)==null?void 0:n.message)||`请求失败 (${e.status})`);return}const u=(s=e.body)==null?void 0:s.getReader();if(!u){t("无法读取响应流");return}const w=new TextDecoder;for(;;){const{done:c,value:L}=await u.read();if(c)break;const E=w.decode(L,{stream:!0}).split(`
`).filter(h=>h.startsWith("data: "));for(const h of E){const y=h.slice(6).trim();if(y==="[DONE]"){d();return}try{const m=JSON.parse(y);if(m.error){t(m.error.message||"模型返回错误"),u.cancel();return}const g=(o=(r=(a=m.choices)==null?void 0:a[0])==null?void 0:r.delta)==null?void 0:o.content;g&&p(g)}catch{}}}d()}catch(e){t(e instanceof Error?e.message:"网络错误，请检查连接")}}export{S as g,x as s};
