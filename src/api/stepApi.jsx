import axios from 'axios'

export const getStepsByWorkflow = (workflowId)       => axios.get(`/api/workflows/${workflowId}/steps`)
export const addStep            = (workflowId, data) => axios.post(`/api/workflows/${workflowId}/steps`, data)
export const updateStep         = (id, data)         => axios.put(`/api/steps/${id}`, data)
export const deleteStep         = (id)               => axios.delete(`/api/steps/${id}`)