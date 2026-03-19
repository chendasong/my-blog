import type { CoupleInfo, CoupleMemory } from '@/types'

export const coupleInfo: CoupleInfo = {
  person1: {
    name: 'Chen',
    nickname: '晨晨',
    avatar: '/images/couple-avatar-1.svg',
    birthday: '1996-08-15',
  },
  person2: {
    name: 'Yue',
    nickname: '月月',
    avatar: '/images/couple-avatar-2.svg',
    birthday: '1998-03-22',
  },
  startDate: '2021-07-14',
  coverImage: '/images/couple-cover.svg',
  motto: '愿得一人心，白首不相离。',
}

export const coupleMemories: CoupleMemory[] = [
  {
    id: '1',
    title: '第一次见面',
    description: '在那个阳光明媚的下午，我们在书店相遇。你在看一本村上春树，我鼓起勇气问你好不好看。',
    image: '/images/memory-1.svg',
    date: '2021-05-20',
    type: 'milestone',
    emotion: 'sweet',
  },
  {
    id: '2',
    title: '在一起的纪念日',
    description: '2021年7月14日，我们正式在一起。那天我们去了海边，看了日落，吃了你最喜欢的冰淇淋。',
    image: '/images/memory-2.svg',
    date: '2021-07-14',
    type: 'milestone',
    emotion: 'romantic',
  },
  {
    id: '3',
    title: '第一次旅行 — 厦门',
    description: '我们的第一次旅行，去了厦门。鼓浪屿的老建筑、南普陀的香火、沙坡尾的文艺，还有海边的风。',
    image: '/images/memory-3.svg',
    date: '2021-10-01',
    type: 'photo',
    emotion: 'happy',
  },
  {
    id: '4',
    title: '你生日那天',
    description: '为你准备了惊喜，你哭了，我也差点哭了。那个蛋糕有点歪，但你说是吃过最好吃的。',
    image: '/images/memory-4.svg',
    date: '2022-03-22',
    type: 'photo',
    emotion: 'sweet',
  },
  {
    id: '5',
    title: '三周年纪念',
    description: '转眼三年了。我们一起经历了很多，吵过架，哭过，也笑过更多。谢谢你一直在。',
    image: '/images/memory-5.svg',
    date: '2024-07-14',
    type: 'milestone',
    emotion: 'romantic',
  },
  {
    id: '6',
    title: '我们的心愿',
    description: '想和你去看极光，想和你一起养一只猫，想和你走遍想去的地方，想和你慢慢变老。',
    image: '/images/memory-6.svg',
    date: '2024-01-01',
    type: 'wish',
    emotion: 'romantic',
  },
]
