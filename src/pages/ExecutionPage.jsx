import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getWorkflowById } from '../api/workflowApi'
import {
  startExecution, getExecution,
  approveStep, cancelExecution, retryExecution
} from '../api/ExecutionApi'
import StatusBadge from '../components/StatusBadge'
import LoadingSpinner from '../components/LoadingSpinner'

function ExecutionPage() {
  const { id }   = useParams()   // workflowId
  const navigate = useNavigate()

  const [workflow, setWorkflow]     = useState(null)
  const [execution, setExecution]   = useState(null)
  const [loading, setLoading]       = useState(true)
  const [starting, setStarting]     = useState(false)
  const [error, setError]           = useState('')

  // dynamic input form fields from workflow.inputSchema
  const [inputFields, setInputFields] = useState({})
  const [formValues, setFormValues]   = useState({})

  useEffect(() => {
    loadWorkflow()
  }, [id])

  // poll execution status every 3 seconds while in progress
  useEffect(() => {
    if (!execution) return
    if (execution.status !== 'IN_PROGRESS') return

    const interval = setInterval(async () => {
      try {
        const res = await getExecution(execution.id)
        setExecution(res.data)
      } catch (err) {
        clearInterval(interval)
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [execution])

  const loadWorkflow = async () => {
    try {
      const res = await getWorkflowById(id)
      setWorkflow(res.data)

      // parse input schema to build form fields
      if (res.data.inputSchema) {
        try {
          const schema = JSON.parse(res.data.inputSchema)
          setInputFields(schema)
          // initialise form values
          const initial = {}
          Object.keys(schema).forEach(key => { initial[key] = '' })
          setFormValues(initial)
        } catch {
          setInputFields({})
        }
      }
    } catch (err) {
      setError('Failed to load workflow')
    } finally {
      setLoading(false)
    }
  }

  const handleStart = async () => {
    setError('')
    setStarting(true)
    try {
      const res = await startExecution(id, {
        inputData: formValues,
        triggeredBy: 'user-001'
      })
      setExecution(res.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to start execution')
    } finally {
      setStarting(false)
    }
  }

  const handleApprove = async () => {
    try {
      const res = await approveStep(execution.id, 'user-001')
      setExecution(res.data)
    } catch (err) {
      setError('Approval failed')
    }
  }

  const handleCancel = async () => {
    if (!window.confirm('Cancel this execution?')) return
    try {
      const res = await cancelExecution(execution.id)
      setExecution(res.data)
    } catch (err) {
      setError('Cancel failed')
    }
  }

  const handleRetry = async () => {
    try {
      const res = await retryExecution(execution.id)
      setExecution(res.data)
    } catch (err) {
      setError('Retry failed')
    }
  }

  if (loading) return <LoadingSpinner />

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center',
                    gap: '12px', marginBottom: '24px' }}>
        <button
          onClick={() => navigate('/')}
          style={{ background: 'none', border: 'none',
                   color: '#4f46e5', cursor: 'pointer', fontSize: '14px' }}
        >
          ← Back
        </button>
        <h1 className="page-title" style={{ margin: 0 }}>
          Execute: {workflow?.name}
        </h1>
      </div>

      {error && (
        <div style={{ background: '#fee2e2', color: '#dc2626',
                      padding: '10px 14px', borderRadius: '8px',
                      marginBottom: '16px', fontSize: '13px' }}>
          {error}
        </div>
      )}

      {/* Input form — shown before execution starts */}
      {!execution && (
        <div className="card">
          <h2 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>
            Enter Input Data
          </h2>

          {Object.keys(inputFields).length === 0 ? (
            <p style={{ color: '#999', marginBottom: '16px' }}>
              No input schema defined. Click start to run with empty data.
            </p>
          ) : (
            Object.entries(inputFields).map(([key, config]) => (
              <div className="form-group" key={key}>
                <label className="label">
                  {key}
                  {config.required && (
                    <span style={{ color: '#ef4444' }}> *</span>
                  )}
                  <span style={{ color: '#999', fontWeight: '400',
                                 marginLeft: '6px' }}>
                    ({config.type})
                  </span>
                </label>
                {config.allowed_values ? (
                  <select
                    value={formValues[key] || ''}
                    onChange={(e) => setFormValues({
                      ...formValues, [key]: e.target.value
                    })}
                  >
                    <option value="">Select {key}</option>
                    {config.allowed_values.map(v => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={config.type === 'number' ? 'number' : 'text'}
                    value={formValues[key] || ''}
                    onChange={(e) => setFormValues({
                      ...formValues,
                      [key]: config.type === 'number'
                        ? Number(e.target.value)
                        : e.target.value
                    })}
                    placeholder={`Enter ${key}`}
                  />
                )}
              </div>
            ))
          )}

          <button
            onClick={handleStart}
            disabled={starting}
            style={{ background: '#4f46e5', color: 'white', border: 'none',
                     padding: '10px 28px', borderRadius: '8px',
                     fontWeight: '500', cursor: 'pointer', fontSize: '14px' }}
          >
            {starting ? 'Starting...' : 'Start Execution'}
          </button>
        </div>
      )}

      {/* Execution status — shown after execution starts */}
      {execution && (
        <>
          {/* Status card */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between',
                          alignItems: 'flex-start' }}>
              <div>
                <p style={{ fontSize: '12px', color: '#999',
                            marginBottom: '4px' }}>Execution ID</p>
                <p style={{ fontFamily: 'monospace', fontSize: '12px',
                            marginBottom: '12px' }}>
                  {execution.id}
                </p>
                <div style={{ display: 'flex', gap: '16px',
                              alignItems: 'center' }}>
                  <StatusBadge status={execution.status} />
                  {execution.currentStepName && (
                    <span style={{ fontSize: '13px', color: '#555' }}>
                      Current Step:
                      <strong style={{ marginLeft: '4px' }}>
                        {execution.currentStepName}
                      </strong>
                    </span>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: '8px' }}>
                {execution.status === 'IN_PROGRESS' &&
                 execution.currentStepName && (
                  <button
                    onClick={handleApprove}
                    style={{ background: '#22c55e', color: 'white',
                             border: 'none', padding: '8px 16px',
                             borderRadius: '8px', cursor: 'pointer',
                             fontWeight: '500' }}
                  >
                    Approve Step
                  </button>
                )}
                {execution.status === 'IN_PROGRESS' && (
                  <button
                    onClick={handleCancel}
                    style={{ background: '#ef4444', color: 'white',
                             border: 'none', padding: '8px 16px',
                             borderRadius: '8px', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                )}
                {execution.status === 'FAILED' && (
                  <button
                    onClick={handleRetry}
                    style={{ background: '#f59e0b', color: 'white',
                             border: 'none', padding: '8px 16px',
                             borderRadius: '8px', cursor: 'pointer' }}
                  >
                    Retry
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Input data submitted */}
          <div className="card">
            <h3 style={{ fontSize: '14px', fontWeight: '600',
                         marginBottom: '12px' }}>Input Data</h3>
            <pre style={{
              background: '#f5f5f5', padding: '12px', borderRadius: '8px',
              fontSize: '12px', overflow: 'auto'
            }}>
              {JSON.stringify(execution.inputData, null, 2)}
            </pre>
          </div>

          {/* Execution logs */}
          <div className="card">
            <h3 style={{ fontSize: '14px', fontWeight: '600',
                         marginBottom: '12px' }}>
              Execution Logs ({execution.logs?.length || 0} steps)
            </h3>

            {(!execution.logs || execution.logs.length === 0) ? (
              <p style={{ color: '#999', fontSize: '13px' }}>
                No logs yet. Waiting for steps to complete...
              </p>
            ) : (
              execution.logs.map((log, index) => (
                <div key={index} style={{
                  border: '1px solid #e5e5e5', borderRadius: '8px',
                  padding: '14px', marginBottom: '10px',
                  borderLeft: log.status === 'completed'
                    ? '3px solid #22c55e' : '3px solid #ef4444'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between',
                                alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontWeight: '600', fontSize: '14px' }}>
                      {log.step_name}
                    </span>
                    <span style={{
                      background: log.status === 'completed'
                        ? '#dcfce7' : '#fee2e2',
                      color: log.status === 'completed'
                        ? '#15803d' : '#dc2626',
                      padding: '2px 8px', borderRadius: '20px',
                      fontSize: '11px', fontWeight: '600'
                    }}>
                      {log.status}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '16px',
                                fontSize: '12px', color: '#666' }}>
                    <span>Type: <strong>{log.step_type}</strong></span>
                    {log.approver_id && (
                      <span>Approver: <strong>{log.approver_id}</strong></span>
                    )}
                    {log.timestamp && (
                      <span>
                        Time: {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                    )}
                  </div>
                  {log.error && (
                    <p style={{ color: '#dc2626', fontSize: '12px',
                                marginTop: '6px' }}>
                      Error: {log.error}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default ExecutionPage