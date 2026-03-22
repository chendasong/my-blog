import bcrypt from 'bcryptjs'
import { supabase } from '@/lib/supabase'
import { uploadImageSmart, deleteRemoteStorageFile, isHostedStorageAssetUrl } from '@/lib/qiniuClient'

export interface AdminUser {
  id: string
  username: string
  nickname: string
  avatar: string
  email: string
  bio: string
}

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

export const authApi = {
  async login(username: string, password: string): Promise<AdminUser> {
    const { data, error } = await supabase
      .from('admin_users')
      .select('*')
      .eq('username', username)
      .single()
    if (error || !data) throw new Error('账号不存在')
    const valid = await verifyPassword(password, data.password_hash)
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
      .select()
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

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
