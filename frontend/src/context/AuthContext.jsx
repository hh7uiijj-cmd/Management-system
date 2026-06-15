import { createContext, useContext, useState, useEffect } from 'react'
import api from '../api/axios'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user')
    return stored ? JSON.parse(stored) : null
  })
  const [token, setToken] = useState(() => localStorage.getItem('token'))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const verifyToken = async () => {
      const storedToken = localStorage.getItem('token')
      if (!storedToken) {
        setLoading(false)
        return
      }
      try {
        const { data } = await api.get('/api/auth/me')
        setUser(data)
        localStorage.setItem('user', JSON.stringify(data))
      } catch {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        setUser(null)
        setToken(null)
      } finally {
        setLoading(false)
      }
    }
    verifyToken()
  }, [])

  const login = async (email, password) => {
    const { data } = await api.post('/api/auth/login', { email, password })
    setToken(data.token)
    setUser(data.user)
    localStorage.setItem('token', data.token)
    localStorage.setItem('user', JSON.stringify(data.user))
    return data
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  const hasPermission = (permission) => {
    return user?.role?.permissions?.includes(permission) || false
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, hasPermission }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export default AuthContext
