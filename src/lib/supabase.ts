import { createClient } from '@supabase/supabase-js'

const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim() ?? ''
const anon = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim() ?? ''

/** 未配置时仅用于通过 createClient 校验、避免白屏；数据请求会失败，请在 .env 填写真实值 */
const PLACEHOLDER_URL = 'https://__configure-in-env__.supabase.co'
const PLACEHOLDER_ANON =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNvbmZpZ3VyZSIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNjAwMDAwMDAwLCJleHAiOjE5MTAwMDAwMDB9.local-dev-placeholder'

if (!url || !anon) {
  console.warn(
    '[Supabase] 未检测到 VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY。若 .env 曾被覆盖，请到 Supabase 控制台 → Project Settings → API 复制 Project URL 与 anon public key 填回 .env。'
  )
}

export const supabase = createClient(url || PLACEHOLDER_URL, anon || PLACEHOLDER_ANON)
