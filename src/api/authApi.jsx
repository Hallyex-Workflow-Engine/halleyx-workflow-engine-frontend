import axios from 'axios'

axios.defaults.withCredentials = true
axios.defaults.baseURL = 'http://localhost:8080'

export const login  = (email, password) =>
    axios.post('/api/auth/login', { email, password })

export const logout = () =>
    axios.post('/api/auth/logout')

export const getMe  = () =>
    axios.get('/api/auth/me')