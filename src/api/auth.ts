import bcrypt from 'bcryptjs'
import { supabase } from '@/lib/supabase'

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
      const ext = data.avatar_file.name.split('.').pop()
      const fileName = `avatar-${Date.now()}.${ext}`
      const { error: upErr } = await supabase.storage.from('images').upload(fileName, data.avatar_file, { upsert: true })
      if (upErr) throw upErr
      const { data: urlData } = supabase.storage.from('images').getPublicUrl(fileName)
      avatarUrl = urlData.publicUrl
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

  async updateSiteSettings(settings: Partial<SiteSettings> & { avatar_file?: File }): Promise<SiteSettings> {
    let avatarUrl = settings.owner_avatar
    if (settings.avatar_file) {
      const ext = settings.avatar_file.name.split('.').pop()
      const fileName = `owner-avatar-${Date.now()}.${ext}`
      const { error: upErr } = await supabase.storage.from('images').upload(fileName, settings.avatar_file, { upsert: true })
      if (upErr) throw upErr
      const { data: urlData } = supabase.storage.from('images').getPublicUrl(fileName)
      avatarUrl = urlData.publicUrl
    }
    const { data, error } = await supabase
      .from('site_settings')
      .update({ ...settings, owner_avatar: avatarUrl, updated_at: new Date().toISOString() })
      .eq('id', 1)
      .select()
      .single()
    if (error) throw error
    return data
  },
}
