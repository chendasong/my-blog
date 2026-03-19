// ===== 文章类型 =====
export interface Article {
  id: string
  title: string
  summary: string
  content: string
  cover: string
  category: string
  tags: string[]
  author: string
  publishedAt: string
  updatedAt: string
  views: number
  likes: number
  comments: number
  featured: boolean
}

// ===== 笔记类型 =====
export interface Note {
  id: string
  title: string
  content: string
  category: NoteCategory
  tags: string[]
  createdAt: string
  updatedAt: string
  pinned: boolean
  color: string
}

export type NoteCategory = 'work' | 'life' | 'study' | 'idea' | 'todo'

// ===== 情侣空间类型 =====
export interface CoupleMemory {
  id: string
  title: string
  description: string
  image: string
  date: string
  type: 'photo' | 'milestone' | 'wish' | 'diary'
  emotion: 'happy' | 'romantic' | 'sweet' | 'funny'
}

export interface CoupleInfo {
  person1: PersonInfo
  person2: PersonInfo
  startDate: string
  coverImage: string
  motto: string
}

export interface PersonInfo {
  name: string
  nickname: string
  avatar: string
  birthday: string
}

// ===== AI功能类型 =====
export interface AIFeature {
  id: string
  name: string
  description: string
  icon: string
  category: AICategory
  tags: string[]
  isNew: boolean
  isPro: boolean
  hidden?: boolean
  placeholder: string
}

export type AICategory = 'writing' | 'vision' | 'analysis' | 'creative' | 'productivity'

// ===== 用户类型 =====
export interface UserProfile {
  id: string
  name: string
  nickname: string
  avatar: string
  bio: string
  location: string
  website: string
  social: SocialLinks
  joinedAt: string
  stats: UserStats
}

export interface SocialLinks {
  github?: string
  twitter?: string
  weibo?: string
  wechat?: string
}

export interface UserStats {
  articles: number
  notes: number
  views: number
  followers: number
}

// ===== 评论类型 =====
export interface Comment {
  id: string
  articleId: string
  author: string
  avatar: string
  content: string
  createdAt: string
  likes: number
}

// ===== 分类类型 =====
export interface Category {
  id: string
  name: string
  slug: string
  description: string
  count: number
  color: string
  icon: string
}

// ===== 导航菜单 =====
export interface NavItem {
  label: string
  path: string
  icon: string
  children?: NavItem[]
}
