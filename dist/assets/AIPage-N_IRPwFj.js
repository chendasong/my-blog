import{d as F,o as i,c as l,n as $,e,z as E,t as s,p as I,w as v,m as g,h,g as A,F as b,r as w,f as C,T as x,i as m,l as L,x as D,y as M}from"./index-Bj8mhZFX.js";import{a as f}from"./ai-features-DNPGPrl8.js";import{A as y}from"./AppBadge-BUN_g3Bp.js";import{_ as B}from"./_plugin-vue_export-helper-DlAUqK2U.js";import{A as G}from"./AppButton-BcZhkr-l.js";import{S as R}from"./SectionTitle-CYrQWJWL.js";const U={style:{"font-size":"1.5rem"}},j={class:"ai-card__content"},q={class:"ai-card__header"},H={class:"ai-card__name"},J={class:"ai-card__badges"},K={class:"ai-card__desc"},O={class:"ai-card__footer"},Q={class:"ai-card__tags"},W=F({__name:"AIFeatureCard",props:{feature:{},active:{type:Boolean}},emits:["select"],setup(k){const a=k,d={writing:"#5B8AF0",vision:"#8B6FF0",analysis:"#4CAF82",creative:"#F0A05B",productivity:"#E8607A"},r={writing:"写作",vision:"视觉",analysis:"分析",creative:"创意",productivity:"效率"};return(c,n)=>(i(),l("div",{class:$(["ai-card",{"ai-card--active":a.active}]),onClick:n[0]||(n[0]=p=>c.$emit("select",a.feature))},[e("div",{class:"ai-card__icon",style:E({background:d[a.feature.category]+"18"})},[e("span",U,s(a.feature.icon.includes("mdi")?"🤖":a.feature.icon),1)],4),e("div",j,[e("div",q,[e("h4",H,s(a.feature.name),1),e("div",J,[a.feature.isNew?(i(),I(y,{key:0,color:"#4CAF82",size:"sm"},{default:v(()=>[...n[1]||(n[1]=[g("New",-1)])]),_:1})):h("",!0),a.feature.isPro?(i(),I(y,{key:1,color:"#F0A05B",size:"sm"},{default:v(()=>[...n[2]||(n[2]=[g("Pro",-1)])]),_:1})):h("",!0)])]),e("p",K,s(a.feature.description),1),e("div",O,[A(y,{color:d[a.feature.category],size:"sm"},{default:v(()=>[g(s(r[a.feature.category]),1)]),_:1},8,["color"]),e("div",Q,[(i(!0),l(b,null,w(a.feature.tags.slice(0,2),p=>(i(),l("span",{key:p,class:"tag"},s(p),1))),128))])])])],2))}}),X=B(W,[["__scopeId","data-v-f562046b"]]),Y={class:"ai-page"},Z={class:"ai-hero"},ee={class:"ai-hero__inner"},ae={class:"ai-hero__stats"},te={class:"ai-stat"},se={class:"ai-stat"},ne={class:"ai-workspace"},ie={class:"ai-panel"},oe={class:"ai-panel__cats"},le=["onClick"],re={class:"ai-panel__list"},ce={class:"ai-main"},de={class:"ai-workspace-panel__header"},ue={class:"ai-ws-icon"},_e={class:"ai-ws-title"},ve={class:"ai-ws-desc"},pe={class:"ai-io"},me={class:"ai-input-area"},fe=["placeholder"],Ae={class:"ai-input-actions"},ge={class:"ai-char-count"},he={key:0,class:"ai-output-area"},ye={key:0,class:"ai-loading"},Ie={key:1,class:"ai-output"},be={class:"ai-output__text"},we={class:"ai-output__actions"},ke=F({__name:"AIPage",setup(k){const a=m(f[0]),d=m("all"),r=m(""),c=m(""),n=m(!1),p={all:"全部",writing:"写作",vision:"视觉",analysis:"分析",creative:"创意",productivity:"效率"},T={all:"✨",writing:"✍️",vision:"🔍",analysis:"💡",creative:"🎨",productivity:"⚡"},P={"AI 文案创作":"✍️","AI 代码助手":"💻","AI 图片识别":"🔍","AI 情感分析":"💡","AI 翻译润色":"🌐","AI 思维导图":"🗺️","AI 诗词创作":"🪶","AI 摘要提取":"📋"},z=L(()=>d.value==="all"?f:f.filter(_=>_.category===d.value)),N={1:`# ✍️ AI 文案创作

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

**阅读时长：** 约 3 分钟`};async function V(){!r.value.trim()||!a.value||(n.value=!0,c.value="",await new Promise(_=>setTimeout(_,1500)),c.value=N[a.value.id]||`# AI 处理结果

已完成处理。这是演示输出，接入真实 AI API 后可获得实际结果。`,n.value=!1)}function S(_){a.value=_,r.value="",c.value=""}return(_,t)=>(i(),l("div",Y,[e("section",Z,[t[5]||(t[5]=e("div",{class:"ai-hero__bg"},[e("div",{class:"ai-blob ai-blob--1"}),e("div",{class:"ai-blob ai-blob--2"})],-1)),e("div",ee,[t[4]||(t[4]=e("div",{class:"ai-hero__icon animate-float"},"✨",-1)),A(R,{title:"AI 工坊",subtitle:"集成多种 AI 能力，让创作、分析、开发更高效。选择一个工具开始体验。",align:"center"}),e("div",ae,[e("span",te,"🔧 "+s(C(f).length)+" 个工具",1),e("span",se,"🆕 "+s(C(f).filter(o=>o.isNew).length)+" 个新功能",1),t[3]||(t[3]=e("span",{class:"ai-stat"},"⚡ 即时响应",-1))])])]),e("div",ne,[e("aside",ie,[e("div",oe,[(i(),l(b,null,w(p,(o,u)=>e("button",{key:u,class:$(["ai-cat-btn",{"ai-cat-btn--active":d.value===u}]),onClick:Ce=>d.value=u},s(T[u])+" "+s(o),11,le)),64))]),e("div",re,[(i(!0),l(b,null,w(z.value,o=>{var u;return i(),I(X,{key:o.id,feature:o,active:((u=a.value)==null?void 0:u.id)===o.id,onSelect:S},null,8,["feature","active"])}),128))])]),e("main",ce,[A(x,{name:"ai-fade",mode:"out-in"},{default:v(()=>[a.value?(i(),l("div",{key:a.value.id,class:"ai-workspace-panel"},[e("div",de,[e("span",ue,s(P[a.value.name]||"🤖"),1),e("div",null,[e("h3",_e,s(a.value.name),1),e("p",ve,s(a.value.description),1)])]),e("div",pe,[e("div",me,[t[6]||(t[6]=e("label",{class:"ai-label"},"输入内容",-1)),D(e("textarea",{"onUpdate:modelValue":t[0]||(t[0]=o=>r.value=o),class:"ai-textarea",placeholder:a.value.placeholder,rows:"6"},null,8,fe),[[M,r.value]]),e("div",Ae,[e("span",ge,s(r.value.length)+" 字",1),A(G,{loading:n.value,disabled:!r.value.trim(),onClick:V},{default:v(()=>[g(s(n.value?"生成中...":"✨ 开始生成"),1)]),_:1},8,["loading","disabled"])])]),A(x,{name:"output-fade"},{default:v(()=>[c.value||n.value?(i(),l("div",he,[t[8]||(t[8]=e("label",{class:"ai-label"},"AI 输出",-1)),n.value?(i(),l("div",ye,[...t[7]||(t[7]=[e("div",{class:"ai-loading__dots"},[e("span"),e("span"),e("span")],-1),e("p",null,"AI 正在思考中...",-1)])])):(i(),l("div",Ie,[e("pre",be,s(c.value),1),e("div",we,[e("button",{class:"tag",onClick:t[1]||(t[1]=o=>c.value="")},"清除"),e("button",{class:"tag",onClick:t[2]||(t[2]=o=>{r.value="",c.value=""})},"重置")])]))])):h("",!0)]),_:1})])])):h("",!0)]),_:1})])])]))}}),ze=B(ke,[["__scopeId","data-v-be76f8ed"]]);export{ze as default};
