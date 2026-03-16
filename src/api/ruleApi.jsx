import axios from 'axios'

const BASE = 'http://localhost:8080'

export const getRulesByStep = (stepId)       => axios.get(`${BASE}/steps/${stepId}/rules`)
export const addRule        = (stepId, data) => axios.post(`${BASE}/steps/${stepId}/rules`, data)
export const updateRule     = (id, data)     => axios.put(`${BASE}/rules/${id}`, data)
export const deleteRule     = (id)           => axios.delete(`${BASE}/rules/${id}`)