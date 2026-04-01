import type { CoupleInfo } from '@/types'

/** 未在后台配置时的占位；记忆列表仅来自 Supabase `couple_memories` */
export const coupleInfo: CoupleInfo = {
  person1: {
    name: '',
    nickname: '',
    avatar: '/images/couple-avatar-1.svg',
    birthday: '',
  },
  person2: {
    name: '',
    nickname: '',
    avatar: '/images/couple-avatar-2.svg',
    birthday: '',
  },
  startDate: '',
  coverImage: '',
  motto: '',
}
