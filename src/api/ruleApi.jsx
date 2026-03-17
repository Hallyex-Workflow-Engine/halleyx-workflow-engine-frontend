import axios from 'axios'

export const getRulesByStep = (stepId)       => axios.get(`/api/steps/${stepId}/rules`)
export const addRule        = (stepId, data) => axios.post(`/api/steps/${stepId}/rules`, data)
export const updateRule     = (id, data)     => axios.put(`/api/rules/${id}`, data)
export const deleteRule     = (id)           => axios.delete(`/api/rules/${id}`)