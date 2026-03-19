const V="https://api.siliconflow.cn/v1",v="sk-puecndyhetxxaojzvziaijcbumeivatxicjkebhsqdpzctul",z="Qwen/Qwen3.5-397B-A17B",D={1:`请用中文进行思考推理。
你是文案创作师。输出：1.标题(2-3个) 2.正文(300-500字) 3.社交版本(50字内)`,2:`请用中文进行思考推理。
你是全栈工程师，精通 TS/Vue3/Python/Go。输出：1.类型注解 2.关键注释 3.使用说明 4.依赖安装`,3:`请用中文进行思考推理。
图像分析师。输出：1.场景 2.主体 3.色彩构图 4.文字 5.情感`,4:`请用中文进行思考推理。
NLP情感分析专家。输出：1.情感倾向 2.强度 3.关键词汇 4.意图 5.一句话总结`,5:`请用中文进行思考推理。
专业翻译家，精通中英日韩法德西班等 20+语言。
用户输入：[源语言] -> [目标语言]
内容，或直接输入文本。
未指定语言对则自动识别并翻译成中文。
输出：1.**识别语言** 2.**翻译结果** 3.**注释**（歇语/文化差异）`,6:`请用中文进行思考推理。
思维导图专家。生成纯文本树形思维导图。
一级节点3-5个，二级节点每支2-4个，节点内容简洁(2-8字)`,7:`请用中文进行思考推理。
精通古典诗词和现代诗的诗人。
输出：1.古典作品 2.现代诗 3.创作说明。禁止内容平淡缺乏意境`,8:`请用中文进行思考推理。
文本摘要专家。
输出：1.核心主题 2.关键要点(3-5条) 3.重要数据 4.关键词标签(5-8个) 5.预计阅读时间`,9:`请用中文进行思考推理。
博学多才的大厨，精通中国各菜系和世界美食。
根据菜名给出最正宗的完整食谱。
输出：
## [菅名]
**菜系起源**(1-2句)
**食材清单**(X人份): 主料/辅料/调料
**烹饪步骤**: 1.「备料」 2.「处理」 3.「烹制」 4.「摘盘」
**大厨小贴士**: 火候/技巧/常见失败原因
**难度**:★★★☆☆ | 烹饪时间:XX分钟`,10:`请用中文进行思考推理。
你是一位中西医结合的健康顾问，深厚的中医功底，同时掌握现代医学知识。
分析用户描述的症状或健康问题，以中医为主、西医为辅给出全面分析。
输出格式：
## 症状分析
**中医辨识**：（从气血阴阳、脏腑、内外因等视角分析）
**西医参考**：（对应的现代医学解释）
## 调理建议
**中药调理**：（推荐方副或中成药，说明功效）
**饮食调养**：（宜吃什么、忌吃什么）
**生活起居**：（作息、运动、情绪建议）
**穴位保健**：（可自行按摩的穴位）
## 注意事项
（告知需就医的情况及注意事项）
免责声明：以上建议仅供参考，不可替代专业就医。`};async function A(d,f=3){var a,r,c;const t=await fetch("https://ark.cn-beijing.volces.com/api/v3/images/generations",{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer 3be8c7bf-40b3-47ff-9e42-d2cc2a33fd55"},body:JSON.stringify({model:"doubao-seedream-4-5-251128",prompt:d,size:"2048x1800",response_format:"url"})});if(!t.ok){const o=await t.json().catch(()=>({}));throw new Error(((a=o==null?void 0:o.error)==null?void 0:a.message)||`图片生成失败 (${t.status})`)}const e=(c=(r=(await t.json()).data)==null?void 0:r[0])==null?void 0:c.url;return e?[e]:[]}async function B(d){var _,k,b,y,O,w,L,E;const{featureId:f,userInput:m,thinkingMode:l="fast",onChunk:p,onThink:t,onDone:u,onError:e}=d,a={fast:{thinking_budget:512,max_tokens:1024},balanced:{thinking_budget:1024,max_tokens:2048},deep:{thinking_budget:2048,max_tokens:4096}},{thinking_budget:r,max_tokens:c}=a[l],o=D[f]||"你是一个智能助手。";try{const n=await fetch(`${V}/chat/completions`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${v}`},body:JSON.stringify({model:z,stream:!0,max_tokens:c,temperature:.7,thinking:{type:"enabled",budget_tokens:r},messages:[{role:"system",content:o},{role:"user",content:m}]})});if(!n.ok){const s=await n.json().catch(()=>({}));e(((_=s==null?void 0:s.error)==null?void 0:_.message)||`请求失败 (${n.status})`);return}const h=(k=n.body)==null?void 0:k.getReader();if(!h){e("无法读取响应流");return}const S=new TextDecoder;for(;;){const{done:s,value:P}=await h.read();if(s)break;const T=S.decode(P,{stream:!0}).split(`
`).filter(g=>g.startsWith("data: "));for(const g of T){const x=g.slice(6).trim();if(x==="[DONE]"){u();return}try{const i=JSON.parse(x);if(i.error){e(i.error.message||"模型返回错误"),h.cancel();return}const C=(O=(y=(b=i.choices)==null?void 0:b[0])==null?void 0:y.delta)==null?void 0:O.reasoning_content;C&&(t==null||t(C));const j=(E=(L=(w=i.choices)==null?void 0:w[0])==null?void 0:L.delta)==null?void 0:E.content;j&&p(j)}catch{}}}u()}catch(n){e(n instanceof Error?n.message:"网络错误，请检查连接")}}export{A as g,B as s};
