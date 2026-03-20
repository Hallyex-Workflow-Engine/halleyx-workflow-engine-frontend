import axios from 'axios'

export const getAllUsers   = ()          => axios.get('/api/users')
export const createUser   = (data)      => axios.post('/api/users', data)
export const deleteUser   = (id)        => axios.delete(`/api/users/${id}`)
export const updateRole   = (id, role)  => axios.put(`/api/users/${id}/role`, { role })


export const getMyProfile = () => axios.get('/api/users/me') 
export const updateProfile = (data) => axios.put('/api/users/me', data)
export const changePassword = (data) => axios.put('/api/users/change-password', data)
