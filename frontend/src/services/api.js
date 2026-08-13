import axios from 'axios'

// Em desenvolvimento, default = backend local. Em build de produção, usa VITE_API_BASE ou Cloud Run.
export const API_BASE =
  import.meta.env.VITE_API_BASE ||
  (import.meta.env.DEV
    ? 'http://127.0.0.1:8080'
    : 'https://rjb-email-sender-215755766100.europe-west1.run.app')

if (import.meta.env.DEV) {
  console.info('[RJB] API_BASE =', API_BASE)
}

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Interceptor para adicionar token em todas as requisiÃ§Ãµes
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    // FormData precisa do boundary gerado pelo browser — não forçar application/json
    if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
      if (config.headers && typeof config.headers.delete === 'function') {
        config.headers.delete('Content-Type')
      } else if (config.headers) {
        delete config.headers['Content-Type']
      }
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Interceptor para tratar erros de autenticação (não aplica ao próprio login)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status
    const url = String(error.config?.url || '')
    const isLoginRequest = url.includes('/api/admin/login')
    if (!isLoginRequest && (status === 401 || status === 403)) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/admin/login'
    }
    return Promise.reject(error)
  }
)

export default api
