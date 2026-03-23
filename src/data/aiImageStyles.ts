/** 火山 / 兼容生图 API 用的画面风格（可扩展） */
export interface AIImageStyle {
  id: string
  label: string
  /** 中文画风描述，拼进生图提示词 */
  promptFragment: string
}

export const AI_IMAGE_STYLES: AIImageStyle[] = [
  {
    id: 'chiikawa',
    label: '吉伊卡哇风格',
    promptFragment:
      '吉伊卡哇式可爱插画：柔和粉彩色、线条圆润简洁的小动物角色，温馨治愈、无害软萌氛围',
  },
  {
    id: 'doraemon',
    label: '哆啦A梦风格',
    promptFragment:
      '哆啦A梦/藤子·F·不二雄经典画风：轮廓清晰略粗、配色明亮饱和，复古友好、轻松幽默的日式少儿漫画感',
  },
  {
    id: 'spongebob',
    label: '海绵宝宝风格',
    promptFragment:
      '海绵宝宝式美式二维动画：夸张表情与肢体、高饱和色彩，海底奇想、滑稽喜剧氛围',
  },
  {
    id: 'random',
    label: '随机动画风格',
    promptFragment:
      '随即一种国产动画片风格，要有辨识度，比如一看就是海绵宝宝，一看就是大头儿子等等今典IP',
  },
  {
    id: 'dushi',
    label: '现代都市风格',
    promptFragment:
      '现代都市风格，精英风格，高端大气上档次',
  },
  {
    id: 'guangguang',
    label: '真人写实风格',
    promptFragment:
      '真人写实风格，真实自然，不做作',
  },
  {
    id: 'xingkong',
    label: '宫崎骏风格',
    promptFragment:
      '宫崎骏风格，梦幻神秘，星光闪烁',
  },
  {
    id: 'yuanzhu',
    label: '水墨风格',
    promptFragment:
      '水墨风格，古典优雅，自然和谐',
  },
]

export const DEFAULT_AI_IMAGE_STYLE_ID = AI_IMAGE_STYLES[0].id

export function getAiImageStyleById(id: string): AIImageStyle | undefined {
  return AI_IMAGE_STYLES.find((s) => s.id === id)
}

/** 文章封面 / Agent 封面 / 工坊生图统一用这个拼 prompt（全中文） */
export function buildCoverImagePrompt(
  subject: string,
  style: AIImageStyle,
): string {
  const t = subject.trim()
  return `宽屏横图，画幅比例约 16:9，高清精美插画。${style.promptFragment}。画面要有明确视觉主体，构图层次清晰、一眼能读懂。创作主题与内容：${t}`
}

/** 连载条漫单格：少套话，强调画满 + 对白气泡 */
export function buildComicPanelPrompt(
  scene: string,
  style: AIImageStyle,
  panelIndex: number,
  totalPanels: number,
  hasReferenceImage: boolean,
): string {
  const sceneT = scene.trim()
  const ref = hasReferenceImage ? '接上一格，人设画风延续。' : '首格。'
  return [
    '单格漫画，完稿上色，背景与人物都画细，构图饱满，对话丰富。',
    ref,
    style.promptFragment,
    '只用对白气泡呈现台词，不要旁白。',
    `第${panelIndex + 1}/${totalPanels}格`,
    sceneT,
  ].join(' ')
}
