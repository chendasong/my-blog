import bcrypt from 'bcryptjs'
import { supabase } from '@/lib/supabase'
import { normalizeAiModelConfig } from '@/lib/modelConfig'
import { uploadImageSmart, deleteRemoteStorageFile, isHostedStorageAssetUrl } from '@/lib/qiniuClient'
import type { AiModelConfig } from '@/types/modelConfig'

export interface AdminUser {
  id: string
  username: string
  nickname: string
  avatar: string
  email: string
  bio: string
}

/** localStorage key for last successful couple password (used to re-verify on each visit). */
export const COUPLE_SAVED_PWD_STORAGE_KEY = 'couple_saved_pwd'

const COUPLE_PASSWORD_FALLBACK = '2024-11-09'

export interface SiteSettings {
  id: number
  site_name: string
  site_subtitle: string
  site_description: string
  owner_nickname: string
  owner_avatar: string
  owner_bio: string
  owner_location: string
  icp_number: string
  couple_password: string
  couple_since: string
  person1_name: string
  person1_avatar: string
  person2_name: string
  person2_avatar: string
  hero_background_image?: string
  hero_background_opacity?: number
  music_urls?: string
  music_names?: string
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

async function loadCouplePasswordFromDb(): Promise<string> {
  const { data, error } = await supabase.from('site_settings').select('couple_password').eq('id', 1).maybeSingle()
  if (error) throw error
  const raw = (data?.couple_password ?? '').trim()
  return raw || COUPLE_PASSWORD_FALLBACK
}

export const authApi = {
  async login(username: string, password: string): Promise<AdminUser> {
    // 用 * 兼容历史表结构；返回值不包含 password_hash / ai_model_config
    const { data, error } = await supabase
      .from('admin_users')
      .select('*')
      .eq('username', username)
      .single()
    if (error || !data) throw new Error('账号不存在')
    const hash = typeof data.password_hash === 'string' ? data.password_hash : ''
    if (!hash) throw new Error('账号数据异常，请联系管理员')
    const valid = await verifyPassword(password, hash)
    if (!valid) throw new Error('密码错误')
    return {
      id: data.id,
      username: data.username,
      nickname: data.nickname,
      avatar: data.avatar,
      email: data.email,
      bio: data.bio,
    }
  },

  async updateProfile(id: string, data: Partial<AdminUser> & { avatar_file?: File }): Promise<AdminUser> {
    let avatarUrl = data.avatar
    if (data.avatar_file) {
      avatarUrl = await uploadImageSmart(data.avatar_file, 'site/admin-avatar')
    }
    const { data: updated, error } = await supabase
      .from('admin_users')
      .update({
        nickname: data.nickname,
        avatar: avatarUrl,
        email: data.email,
        bio: data.bio,
      })
      .eq('id', id)
      .select('id, username, nickname, avatar, email, bio')
      .single()
    if (error) throw error
    return {
      id: updated.id,
      username: updated.username,
      nickname: updated.nickname,
      avatar: updated.avatar,
      email: updated.email,
      bio: updated.bio,
    }
  },

  async getSiteSettings(): Promise<SiteSettings> {
    const { data, error } = await supabase.from('site_settings').select('*').eq('id', 1).single()
    if (error) throw error
    return data
  },

  /** Fresh read from DB; used so cached session cannot outlive an admin password change. */
  async fetchCouplePassword(): Promise<string> {
    return loadCouplePasswordFromDb()
  },

  async verifyCouplePassword(candidate: string): Promise<boolean> {
    const expected = await loadCouplePasswordFromDb()
    return candidate.trim() === expected
  },

  async getAiModelConfig(userId: string): Promise<AiModelConfig> {
    const { data, error } = await supabase
      .from('admin_users')
      .select('ai_model_config')
      .eq('id', userId)
      .maybeSingle()
    if (error) throw error
    return normalizeAiModelConfig(
      (data?.ai_model_config as Partial<AiModelConfig> | null) ?? null,
    )
  },

  async updateAiModelConfig(userId: string, config: AiModelConfig): Promise<AiModelConfig> {
    const normalized = normalizeAiModelConfig(config)
    const { error } = await supabase
      .from('admin_users')
      .update({ ai_model_config: normalized })
      .eq('id', userId)
    if (error) throw error
    return normalized
  },

  async updateSiteSettings(settings: Partial<SiteSettings> & { avatar_file?: File; background_file?: File }): Promise<SiteSettings> {
    let avatarUrl = settings.owner_avatar
    let backgroundUrl = settings.hero_background_image
    const previousBackgroundUrl = (settings.hero_background_image || '').trim()

    if (settings.avatar_file) {
      avatarUrl = await uploadImageSmart(settings.avatar_file, 'site/owner-avatar')
    }

    if (settings.background_file) {
      backgroundUrl = await uploadImageSmart(settings.background_file, 'site/hero-bg')
    }

    const { avatar_file: _f, background_file: _bf, ...settingsData } = settings
    const { data, error } = await supabase
      .from('site_settings')
      .update({
        ...settingsData,
        owner_avatar: avatarUrl,
        hero_background_image: backgroundUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', 1)
      .select()
      .single()
    if (error) throw error

    if (
      settings.background_file &&
      previousBackgroundUrl &&
      previousBackgroundUrl !== backgroundUrl &&
      isHostedStorageAssetUrl(previousBackgroundUrl)
    ) {
      void deleteRemoteStorageFile(previousBackgroundUrl)
    }

    return data
  },
}
