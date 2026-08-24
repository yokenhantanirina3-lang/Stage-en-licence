import { useEffect } from 'react'
import { useAuthStore } from './store'
import { authApi } from './api'

export function useAuth() {
  const store = useAuthStore()

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (!token) {
      store.setLoading(false)
      return
    }

    authApi.getMe()
      .then((res) => store.setUser(res.data))
      .catch(() => {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        store.setUser(null)
      })
  }, [])

  return {
    ...store,
    login: async (email: string, password: string) => {
      const res = await authApi.login(email, password)
      localStorage.setItem('access_token', res.data.access_token)
      localStorage.setItem('refresh_token', res.data.refresh_token)
      const meRes = await authApi.getMe()
      store.setUser(meRes.data)
    },
    logout: store.logout,
  }
}
