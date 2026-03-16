import axios from 'axios'

const BASE = 'http://localhost:8080'

export const startExecution  = (workflowId, data) => axios.post(`${BASE}/workflows/${workflowId}/execute`, data)
export const getExecution    = (id)               => axios.get(`${BASE}/executions/${id}`)
export const getAllExecutions = ()                 => axios.get(`${BASE}/executions`)
export const approveStep     = (id, approverId)   => axios.post(`${BASE}/executions/${id}/approve`, { approverId })
export const cancelExecution = (id)               => axios.post(`${BASE}/executions/${id}/cancel`)
export const retryExecution  = (id)               => axios.post(`${BASE}/executions/${id}/retry`)

