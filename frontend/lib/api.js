import axios from 'axios'

const API_URL = 'https://staff-deck.onrender.com/api';

function getTokenSafe() {
  if (typeof window === 'undefined') return null

  // supports multiple keys (keep your existing 'token', plus common variants)
  return (
    localStorage.getItem('token') ||
    localStorage.getItem('staffdeck.token') ||
    localStorage.getItem('accessToken')
  )
}

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true, // ✅ harmless for Bearer, required if backend uses cookies
})

// Add token to requests (safe for Next.js)
api.interceptors.request.use(
  config => {
    const token = getTokenSafe()
    if (token) {
      config.headers = config.headers || {}
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => Promise.reject(error)
)

// Handle unauthorized/forbidden responses
api.interceptors.response.use(
  response => response,
  error => {
    const status = error?.response?.status

    // FIX: Only redirect on 401 (Unauthorized). 
    // 403 (Forbidden) means the user IS logged in but lacks permission.
    if (status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('token')
      localStorage.removeItem('staffdeck.token')
      localStorage.removeItem('accessToken')
      localStorage.removeItem('user')
      
      // Prevent redirect loop if already on login
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login'
      }
    }

    return Promise.reject(error)
  }
)

export default api

// Auth APIs
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: data => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data)
}

// Employee APIs
export const employeeAPI = {
  getAll: params => api.get('/employees', { params }),
  create: data => api.post('/employees', data),
  getOne: id => api.get(`/employees/${id}`),
  create: data => api.post('/employees', data),
  update: (id, data) => api.put(`/employees/${id}`, data),
  delete: id => api.delete(`/employees/${id}`),
  restore: id => api.post(`/employees/${id}/restore`),
}

// Dashboard APIs
export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
  getPayrollTrend: () => api.get('/dashboard/payroll-trend'),
}

// Payroll APIs
export const payrollAPI = {
  getMySlips: () => api.get('/payroll/me'),
    getPreview: () => api.get('/payroll/preview'), // NEW
    executeRun: data => api.post('/payroll/run', data),
    getRuns: () => api.get('/payroll/runs'),
    getRunDetails: id => api.get(`/payroll/runs/${id}`),
    downloadRun: id => `${API_URL}/payroll/runs/${id}/download`, // Helper for direct link
}

// Document APIs
export const documentAPI = {
  getAll: params => api.get('/documents', { params }),
  upload: formData =>
    api.post('/documents', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  delete: id => api.delete(`/documents/${id}`),
}

export const scheduleAPI = {
    getCalendar: () => api.get('/schedule/calendar'),
    getRequests: () => api.get('/schedule/requests'),
    submitRequest: (data) => api.post('/schedule/request', data),
    actionRequest: (id, status) => api.put(`/schedule/requests/${id}/action`, { status })
}

// Audit APIs
export const auditAPI = {
  getLogs: params => api.get('/audit', { params }),
}

// Settings APIs
export const settingsAPI = {
  get: () => api.get('/settings'),
  update: data => api.put('/settings', data),
}




// Billing APIs (New)
export const billingAPI = {
    getDetails: () => api.get('/billing')
}