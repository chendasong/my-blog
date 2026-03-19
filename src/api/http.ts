import axios from 'axios'

const http = axios.create({
  baseURL: 'http://localhost:3001',
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
