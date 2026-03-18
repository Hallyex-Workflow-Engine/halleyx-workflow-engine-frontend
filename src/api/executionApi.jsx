import axios from 'axios'


axios.defaults.withCredentials = true;
export const startExecution    = (workflowId, data) => axios.post(`/api/workflows/${workflowId}/execute`, data)
export const getExecution      = (id)               => axios.get(`/api/executions/${id}`)
export const getAllExecutions   = ()                 => axios.get('/api/executions')
export const getPendingApprovals = (email)          => axios.get(`/api/executions/pending?email=${email}`)
export const approveStep       = (id, approverId)   => axios.post(`/api/executions/${id}/approve`, { approverId })
export const cancelExecution   = (id)               => axios.post(`/api/executions/${id}/cancel`)
export const retryExecution    = (id)               => axios.post(`/api/executions/${id}/retry`)
export const rejectStep = (id, rejectorId, comment) =>
    axios.post(`/api/executions/${id}/reject`, { rejectorId, comment })