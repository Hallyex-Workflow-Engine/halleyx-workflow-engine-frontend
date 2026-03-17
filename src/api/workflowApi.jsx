import axios from 'axios'

export const getAllWorkflows   = ()           => axios.get('/api/workflows')
export const getWorkflowById  = (id)         => axios.get(`/api/workflows/${id}`)
export const searchWorkflows  = (name)       => axios.get(`/api/workflows/search?name=${name}`)
export const createWorkflow   = (data)       => axios.post('/api/workflows', data)
export const updateWorkflow   = (id, data)   => axios.put(`/api/workflows/${id}`, data)
export const deleteWorkflow   = (id)         => axios.delete(`/api/workflows/${id}`)
export const setStartStep     = (wfId, stepId) => axios.put(`/api/workflows/${wfId}/start-step/${stepId}`)