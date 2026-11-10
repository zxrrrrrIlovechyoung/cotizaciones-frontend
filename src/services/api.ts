import axios from 'axios'

// Permite que una petición concreta omita el logout automático ante un 401
// (p. ej. "contraseña actual incorrecta" al cambiar la contraseña: es un error
// del formulario, no una sesión expirada).
declare module 'axios' {
  export interface AxiosRequestConfig {
    skipAuthRedirect?: boolean
  }
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api',
  withCredentials: true,
  headers: { 'X-Requested-With': 'Cotizaciones' },
})

let accessToken: string | null = null
export function setAccessToken(token: string | null) { accessToken = token }

api.interceptors.request.use((config) => {
  const token = accessToken
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !error.config?.skipAuthRedirect) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      if (window.location.pathname !== '/login') window.location.assign('/login')
    }
    return Promise.reject(error)
  },
)

export default api
