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
    id: 'happy-heroes',
    label: '开心超人风格',
    promptFragment:
      '开心超人式国产超级英雄动画：色块扁平鲜明、造型简洁有英雄感，动感活力、正派热血',
  },
  {
    id: 'pleasant-goat',
    label: '喜羊羊与灰太狼风格',
    promptFragment:
      '喜羊羊与灰太狼式国产卡通：圆润可爱的羊与狼等动物形象，柔和造型、全年龄向轻松家庭风',
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
