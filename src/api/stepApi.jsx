import axios from 'axios'

const BASE = 'http://localhost:8080'

export const getStepsByWorkflow = (workflowId)       => axios.get(`${BASE}/workflows/${workflowId}/steps`)
export const addStep            = (workflowId, data) => axios.post(`${BASE}/workflows/${workflowId}/steps`, data)
export const updateStep         = (id, data)         => axios.put(`${BASE}/steps/${id}`, data)
export const deleteStep         = (id)               => axios.delete(`${BASE}/steps/${id}`)