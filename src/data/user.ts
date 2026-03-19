import type { UserProfile } from '@/types'

export const userProfile: UserProfile = {
  id: '1',
  name: 'Chen DS',
  nickname: '晨光',
  avatar: '/images/avatar.svg',
  bio: '热爱生活，热爱代码。用文字记录美好，用技术创造未来。',
  location: '中国 · 深圳',
  website: 'https://chends.github.io',
  social: {
    github: 'https://github.com/chends',
    twitter: 'https://twitter.com/chends',
    weibo: 'https://weibo.com/chends',
  },
  joinedAt: '2022-01-01',
  stats: {
    articles: 42,
    notes: 128,
    views: 15600,
    followers: 320,
  },
}
