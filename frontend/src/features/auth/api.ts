import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export interface LoginResponse {
  access_token: string
  refresh_token: string
  token_type: string
}

export interface User {
  id: number
  email: string
  nom: string
  id_role: number
  telephone?: string
  actif: boolean
  created_at: string
  role?: { id: number; libelle: string; permissions: Record<string, string[]> }
}

export const authApi = {
  login: (email: string, password: string) =>
    api.post<LoginResponse>('/api/v1/auth/login', new URLSearchParams({
      username: email,
      password: password,
    }), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }),

  getMe: () => api.get<User>('/api/v1/auth/me'),
}

export default api
