import{d as $,o as i,c as l,p as x,a as e,C as E,t,z as I,k as v,l as g,s as h,j as A,F as b,q as k,_ as B,f as C,T as F,r as f,G as L,b as D,v as G}from"./index-iCPyvwA9.js";import{a as m,S as M}from"./SectionTitle-FN2I6_DZ.js";import{A as y}from"./AppBadge-DiR4f-eN.js";import{A as j}from"./AppButton-PIS2dbnO.js";const q={style:{"font-size":"1.5rem"}},R={class:"ai-card__content"},U={class:"ai-card__header"},H={class:"ai-card__name"},J={class:"ai-card__badges"},K={class:"ai-card__desc"},O={class:"ai-card__footer"},Q={class:"ai-card__tags"},W=$({__name:"AIFeatureCard",props:{feature:{},active:{type:Boolean}},emits:["select"],setup(w){const a=w,d={writing:"#5B8AF0",vision:"#8B6FF0",analysis:"#4CAF82",creative:"#F0A05B",productivity:"#E8607A"},c={writing:"写作",vision:"视觉",analysis:"分析",creative:"创意",productivity:"效率"};return(r,n)=>(i(),l("div",{class:x(["ai-card",{"ai-card--active":a.active}]),onClick:n[0]||(n[0]=p=>r.$emit("select",a.feature))},[e("div",{class:"ai-card__icon",style:E({background:d[a.feature.category]+"18"})},[e("span",q,t(a.feature.icon.includes("mdi")?"🤖":a.feature.icon),1)],4),e("div",R,[e("div",U,[e("h4",H,t(a.feature.name),1),e("div",J,[a.feature.isNew?(i(),I(y,{key:0,color:"#4CAF82",size:"sm"},{default:v(()=>[...n[1]||(n[1]=[g("New",-1)])]),_:1})):h("",!0),a.feature.isPro?(i(),I(y,{key:1,color:"#F0A05B",size:"sm"},{default:v(()=>[...n[2]||(n[2]=[g("Pro",-1)])]),_:1})):h("",!0)])]),e("p",K,t(a.feature.description),1),e("div",O,[A(y,{color:d[a.feature.category],size:"sm"},{default:v(()=>[g(t(c[a.feature.category]),1)]),_:1},8,["color"]),e("div",Q,[(i(!0),l(b,null,k(a.feature.tags.slice(0,2),p=>(i(),l("span",{key:p,class:"tag"},t(p),1))),128))])])])],2))}}),X=B(W,[["__scopeId","data-v-f562046b"]]),Y={class:"ai-page"},Z={class:"ai-hero"},ee={class:"ai-hero__inner"},ae={class:"ai-hero__stats"},se={class:"ai-stat"},te={class:"ai-stat"},ne={class:"ai-workspace"},ie={class:"ai-panel"},oe={class:"ai-panel__cats"},le=["onClick"],ce={class:"ai-panel__list"},re={class:"ai-main"},de={class:"ai-workspace-panel__header"},ue={class:"ai-ws-icon"},_e={class:"ai-ws-title"},ve={class:"ai-ws-desc"},pe={class:"ai-io"},fe={class:"ai-input-area"},me=["placeholder"],Ae={class:"ai-input-actions"},ge={class:"ai-char-count"},he={key:0,class:"ai-output-area"},ye={key:0,class:"ai-loading"},Ie={key:1,class:"ai-output"},be={class:"ai-output__text"},ke={class:"ai-output__actions"},we=$({__name:"AIPage",setup(w){const a=f(m[0]),d=f("all"),c=f(""),r=f(""),n=f(!1),p={all:"全部",writing:"写作",vision:"视觉",analysis:"分析",creative:"创意",productivity:"效率"},T={all:"✨",writing:"✍️",vision:"🔍",analysis:"💡",creative:"🎨",productivity:"⚡"},P={"AI 文案创作":"✍️","AI 代码助手":"💻","AI 图片识别":"🔍","AI 情感分析":"💡","AI 翻译润色":"🌐","AI 思维导图":"🗺️","AI 诗词创作":"🪶","AI 摘要提取":"📋"},z=L(()=>d.value==="all"?m:m.filter(_=>_.category===d.value)),N={1:`# ✍️ AI 文案创作

根据您的主题，生成了以下文案：

**标题建议：**
- 探索无限可能：当代技术的边界与未来
- 以代码为笔，书写数字时代的故事

**正文：**
在这个日新月异的时代，技术已不再只是工具，而是一种语言，一种思维方式。我们用代码构建桥梁，用算法描绘未来...

*（演示输出，接入真实 AI API 后可获得更精准的结果）*`,2:`# 💻 AI 代码助手

\`\`\`typescript
import { ref, computed } from "vue"

export function useExample(initialValue = "") {
  const data = ref(initialValue)
  const isEmpty = computed(() => !data.value.trim())
  return { data, isEmpty }
}
\`\`\`

以上是根据您描述生成的代码示例，包含完整类型注解和注释。`,3:`# 🔍 AI 图片识别

**识别结果：**
- 场景：室外自然风光
- 主体：山地景观，远处有雪山
- 色调：暖色调，黄金时段拍摄
- 文字：未检测到文字内容

*（演示输出，实际识别需上传真实图片并接入视觉 API）*`,4:`# 💡 AI 情感分析

**情感倾向：** 积极正面 😊
**置信度：** 87%

**关键词分析：**
- 正面词汇：美好、期待、感谢
- 情感强度：中等偏强

**总结：** 文本整体情绪乐观，表达了对未来的期待与感激之情。`,5:`# 🌐 AI 翻译润色

**原文：** 您输入的内容

**英文翻译：**
The content you entered has been professionally translated with native-level fluency.

**润色建议：** 建议使用更丰富的表达方式，可以适当增加修辞手法让文章更生动。`,6:`# 🗺️ AI 思维导图

\`\`\`
主题
├── 核心概念
│   ├── 基础理论
│   └── 应用实践
├── 关键要素
│   ├── 要素一
│   ├── 要素二
│   └── 要素三
└── 行动计划
    ├── 短期目标
    └── 长期规划
\`\`\`

*（完整思维导图可导出为图片或 Markdown 格式）*`,7:`# 🪶 AI 诗词创作

**七言绝句：**

霜叶随风入画图，
孤灯独照夜云孤。
此情若问归何处，
一寸相思万里途。

**现代诗：**

你说秋天很美
我说是你让秋天变得美
像一枚书签
夹在我生命里最好的那一页`,8:`# 📋 AI 摘要提取

**核心要点（共3条）：**

1. 文章主要探讨了技术发展对现代生活的深远影响
2. 作者认为数字化转型是不可逆的历史趋势
3. 提出了三个应对策略：学习、适应、创新

**关键词：** 技术、数字化、转型、创新

**阅读时长：** 约 3 分钟`};async function V(){!c.value.trim()||!a.value||(n.value=!0,r.value="",await new Promise(_=>setTimeout(_,1500)),r.value=N[a.value.id]||`# AI 处理结果

已完成处理。这是演示输出，接入真实 AI API 后可获得实际结果。`,n.value=!1)}function S(_){a.value=_,c.value="",r.value=""}return(_,s)=>(i(),l("div",Y,[e("section",Z,[s[5]||(s[5]=e("div",{class:"ai-hero__bg"},[e("div",{class:"ai-blob ai-blob--1"}),e("div",{class:"ai-blob ai-blob--2"})],-1)),e("div",ee,[s[4]||(s[4]=e("div",{class:"ai-hero__icon animate-float"},"✨",-1)),A(M,{title:"AI 工坊",subtitle:"集成多种 AI 能力，让创作、分析、开发更高效。选择一个工具开始体验。",align:"center"}),e("div",ae,[e("span",se,"🔧 "+t(C(m).length)+" 个工具",1),e("span",te,"🆕 "+t(C(m).filter(o=>o.isNew).length)+" 个新功能",1),s[3]||(s[3]=e("span",{class:"ai-stat"},"⚡ 即时响应",-1))])])]),e("div",ne,[e("aside",ie,[e("div",oe,[(i(),l(b,null,k(p,(o,u)=>e("button",{key:u,class:x(["ai-cat-btn",{"ai-cat-btn--active":d.value===u}]),onClick:Ce=>d.value=u},t(T[u])+" "+t(o),11,le)),64))]),e("div",ce,[(i(!0),l(b,null,k(z.value,o=>{var u;return i(),I(X,{key:o.id,feature:o,active:((u=a.value)==null?void 0:u.id)===o.id,onSelect:S},null,8,["feature","active"])}),128))])]),e("main",re,[A(F,{name:"ai-fade",mode:"out-in"},{default:v(()=>[a.value?(i(),l("div",{key:a.value.id,class:"ai-workspace-panel"},[e("div",de,[e("span",ue,t(P[a.value.name]||"🤖"),1),e("div",null,[e("h3",_e,t(a.value.name),1),e("p",ve,t(a.value.description),1)])]),e("div",pe,[e("div",fe,[s[6]||(s[6]=e("label",{class:"ai-label"},"输入内容",-1)),D(e("textarea",{"onUpdate:modelValue":s[0]||(s[0]=o=>c.value=o),class:"ai-textarea",placeholder:a.value.placeholder,rows:"6"},null,8,me),[[G,c.value]]),e("div",Ae,[e("span",ge,t(c.value.length)+" 字",1),A(j,{loading:n.value,disabled:!c.value.trim(),onClick:V},{default:v(()=>[g(t(n.value?"生成中...":"✨ 开始生成"),1)]),_:1},8,["loading","disabled"])])]),A(F,{name:"output-fade"},{default:v(()=>[r.value||n.value?(i(),l("div",he,[s[8]||(s[8]=e("label",{class:"ai-label"},"AI 输出",-1)),n.value?(i(),l("div",ye,[...s[7]||(s[7]=[e("div",{class:"ai-loading__dots"},[e("span"),e("span"),e("span")],-1),e("p",null,"AI 正在思考中...",-1)])])):(i(),l("div",Ie,[e("pre",be,t(r.value),1),e("div",ke,[e("button",{class:"tag",onClick:s[1]||(s[1]=o=>r.value="")},"清除"),e("button",{class:"tag",onClick:s[2]||(s[2]=o=>{c.value="",r.value=""})},"重置")])]))])):h("",!0)]),_:1})])])):h("",!0)]),_:1})])])]))}}),Te=B(we,[["__scopeId","data-v-be76f8ed"]]);export{Te as default};
