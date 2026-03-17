import axios from 'axios'

export const getAllUsers  = ()         => axios.get('/api/users')
export const createUser  = (data)     => axios.post('/api/users', data)
export const deleteUser  = (id)       => axios.delete(`/api/users/${id}`)
export const updateRole  = (id, role) => axios.put(`/api/users/${id}/role`, { role })