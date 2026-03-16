import axios from 'axios'

const BASE = 'http://localhost:8080'

export const getAllWorkflows  = ()        => axios.get(`${BASE}/workflows`)
export const getWorkflowById = (id)      => axios.get(`${BASE}/workflows/${id}`)
export const searchWorkflows  = (name)   => axios.get(`${BASE}/workflows/search?name=${name}`)
export const createWorkflow   = (data)   => axios.post(`${BASE}/workflows`, data)
export const updateWorkflow   = (id, data) => axios.put(`${BASE}/workflows/${id}`, data)
export const deleteWorkflow   = (id)     => axios.delete(`${BASE}/workflows/${id}`)
export const setStartStep     = (wfId, stepId) =>
  axios.put(`${BASE}/workflows/${wfId}/start-step/${stepId}`)