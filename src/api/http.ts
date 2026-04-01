import axios from 'axios'

/** 未设置 `VITE_API_BASE` 时默认为 `''`：走当前站点同源（与 Vite 本地 /api、生产同域一致） */
const apiBase = (import.meta.env.VITE_API_BASE as string | undefined)?.trim() ?? ''

const http = axios.create({
  baseURL: apiBase,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
})

http.interceptors.response.use(
  res => res.data,
  err => {
    console.error('[API Error]', err.message)
    return Promise.reject(err)
  }
)

export default http
