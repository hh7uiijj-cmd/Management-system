import axios from 'axios'

// ค่าว่าง ('') หมายถึง relative path — ใช้ตอน deploy จริงบน Firebase Hosting
// ซึ่ง firebase.json rewrite /api/** ไปที่ Cloud Function ให้อัตโนมัติ (same-origin, ไม่มีปัญหา CORS)
// ตอน dev ในเครื่อง ให้ตั้ง VITE_API_URL=http://localhost:5000 ใน .env
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000' : ''),
})

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
