import { useEffect, useState } from 'react'
import { getAllWorkflows, searchWorkflows } from '../../api/workflowApi'
import { getAllExecutions, getExecution, startExecution, cancelExecution, retryExecution } from '../../api/ExecutionApi'
import { getStepsByWorkflow } from '../../api/stepApi'
import { getAllUsers } from '../../api/userApi'
import StatusBadge from '../../components/StatusBadge'
import { useAuth } from '../../context/AuthContext'

export default function EmployeeDashboard() {
  const { user } = useAuth()

  const [activeTab, setActiveTab]         = useState('workflows')
  const [workflows, setWorkflows]         = useState([])
  const [myExecutions, setMyExecutions]   = useState([])
  const [users, setUsers]                 = useState([])
  const [loading, setLoading]             = useState(true)
  const [error, setError]                 = useState('')
  const [search, setSearch]               = useState('')

  const [selectedWf, setSelectedWf]           = useState(null)
  const [inputFields, setInputFields]         = useState({})
  const [formValues, setFormValues]           = useState({})
  const [starting, setStarting]               = useState(false)
  const [activeExecution, setActiveExecution] = useState(null)

  const [trackExecution, setTrackExecution] = useState(null)
  const [trackSteps, setTrackSteps]         = useState([])

  useEffect(() => { loadAll() }, [])

  useEffect(() => {
    if (!activeExecution || activeExecution.status !== 'IN_PROGRESS') return
    const t = setInterval(async () => {
      try {
        const res = await getExecution(activeExecution.id)
        setActiveExecution(res.data)
        setMyExecutions(prev => prev.map(e => e.id === res.data.id ? res.data : e))
      } catch { clearInterval(t) }
    }, 3000)
    return () => clearInterval(t)
  }, [activeExecution])

  const loadAll = async () => {
    setLoading(true)
    try {
      const [wfRes, exRes, usersRes] = await Promise.all([
        getAllWorkflows(),
        getAllExecutions(),
        getAllUsers()
      ])
      setWorkflows(wfRes.data || [])
      setMyExecutions((exRes.data || []).filter(ex => ex.triggeredBy === user.id))
      setUsers(usersRes.data || [])
    } catch { setError('Failed to load data') }
    finally  { setLoading(false) }
  }

  const getUserName = (id) => {
    const u = users.find(u => u.id === id)
    return u ? u.name : id ? id.substring(0, 8) + '...' : '—'
  }

  const handleSearch = async (value) => {
    setSearch(value)
    try {
      const res = value.trim() ? await searchWorkflows(value) : await getAllWorkflows()
      setWorkflows(res.data || [])
    } catch { setError('Search failed') }
  }

  const openExecuteModal = (wf) => {
    setSelectedWf(wf)
    setActiveExecution(null)
    try {
      const schema = wf.inputSchema ? JSON.parse(wf.inputSchema) : {}
      setInputFields(schema)
      const init = {}
      Object.keys(schema).forEach(k => { init[k] = '' })
      setFormValues(init)
    } catch { setInputFields({}); setFormValues({}) }
  }

  const handleStart = async () => {
    setStarting(true); setError('')
    try {
      const res = await startExecution(selectedWf.id, {
        inputData: formValues, triggeredBy: user.id
      })
      setActiveExecution(res.data)
      setMyExecutions(prev => [res.data, ...prev])
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to start execution')
    } finally { setStarting(false) }
  }

  const handleCancel = async (execId) => {
    if (!window.confirm('Cancel this execution?')) return
    try {
      const res = await cancelExecution(execId)
      setMyExecutions(prev => prev.map(e => e.id === res.data.id ? res.data : e))
      if (activeExecution?.id === execId) setActiveExecution(res.data)
    } catch { setError('Cancel failed') }
  }

  const handleRetry = async (execId) => {
    try {
      const res = await retryExecution(execId)
      setMyExecutions(prev => prev.map(e => e.id === res.data.id ? res.data : e))
      setActiveExecution(res.data)
    } catch { setError('Retry failed') }
  }

  const openTrack = async (ex) => {
    setTrackExecution(ex)
    try {
      const res = await getStepsByWorkflow(ex.workflowId)
      setTrackSteps(res.data || [])
    } catch { setTrackSteps([]) }
  }

  if (loading) return <div style={{ padding: 40, color: '#999' }}>Loading...</div>

  const tabStyle = (t) => ({
    padding: '8px 20px', borderRadius: '8px', border: 'none',
    cursor: 'pointer', fontSize: '13px', fontWeight: '500',
    background: activeTab === t ? '#4f46e5' : '#f3f4f6',
    color: activeTab === t ? 'white' : '#555'
  })

  return (
    <div>
      <h1 className="page-title">My Dashboard</h1>

      {error && (
        <div style={{ background: '#fee2e2', color: '#dc2626', padding: '10px 14px',
          borderRadius: '8px', marginBottom: '16px', fontSize: '13px' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        <button style={tabStyle('workflows')} onClick={() => setActiveTab('workflows')}>
          Workflows
        </button>
        <button style={tabStyle('myex')} onClick={() => setActiveTab('myex')}>
          My Executions ({myExecutions.length})
        </button>
      </div>

      {/* TAB 1 — Workflows */}
      {activeTab === 'workflows' && (
        <div className="card">
          <div style={{ marginBottom: '16px' }}>
            <input type="text" placeholder="Search workflows..."
              value={search} onChange={e => handleSearch(e.target.value)}
              style={{ maxWidth: '300px' }} />
          </div>
          {workflows.length === 0 ? (
            <p style={{ color: '#999', textAlign: 'center', padding: '24px' }}>
              No workflows available.
            </p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Workflow</th><th>Version</th><th>Status</th><th>Action</th>
                </tr>
              </thead>
              <tbody>
                {workflows.map(wf => (
                  <tr key={wf.id}>
                    <td style={{ fontWeight: '500' }}>{wf.name}</td>
                    <td>v{wf.version}</td>
                    <td><StatusBadge status={wf.isActive ? 'Active' : 'Inactive'} /></td>
                    <td>
                      <button className="btn btn-primary"
                        style={{ fontSize: '12px', padding: '4px 12px' }}
                        disabled={!wf.isActive}
                        onClick={() => openExecuteModal(wf)}>
                        Execute
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* TAB 2 — My Executions */}
      {activeTab === 'myex' && (
        <div>
          {myExecutions.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
              <p style={{ color: '#999', marginBottom: '12px' }}>No executions yet.</p>
              <button className="btn btn-primary" onClick={() => setActiveTab('workflows')}>
                Start your first execution
              </button>
            </div>
          ) : myExecutions.map(ex => (
            <div key={ex.id} className="card" style={{ marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between',
                            alignItems: 'center', marginBottom: '10px' }}>
                <div>
                  <span style={{ fontWeight: '600', fontSize: '15px' }}>
                    {ex.workflowName}
                  </span>
                  <span style={{ fontSize: '11px', color: '#999', marginLeft: '8px' }}>
                    v{ex.workflowVersion}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <StatusBadge status={ex.status} />
                  <button className="btn"
                    style={{ fontSize: '12px', padding: '4px 10px',
                             background: '#ede9fe', color: '#5b21b6',
                             border: '1px solid #ddd8fe' }}
                    onClick={() => openTrack(ex)}>Track</button>
                  {ex.status === 'IN_PROGRESS' && (
                    <button className="btn btn-danger"
                      style={{ fontSize: '12px', padding: '4px 10px' }}
                      onClick={() => handleCancel(ex.id)}>Cancel</button>
                  )}
                  {ex.status === 'FAILED' && (
                    <button className="btn"
                      style={{ fontSize: '12px', padding: '4px 10px',
                               background: '#fef3c7', color: '#d97706',
                               border: '1px solid #fde68a' }}
                      onClick={() => handleRetry(ex.id)}>Retry</button>
                  )}
                </div>
              </div>

              {ex.logs && ex.logs.length > 0 && (
                <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: '10px' }}>
                  {ex.logs.map((log, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center',
                      gap: '10px', marginBottom: '6px', fontSize: '13px' }}>
                      <span style={{
                        width: '18px', height: '18px', borderRadius: '50%',
                        background: log.status === 'completed' ? '#22c55e' : '#ef4444',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0, color: 'white', fontSize: '10px', fontWeight: '700'
                      }}>
                        {log.status === 'completed' ? '✓' : '✗'}
                      </span>
                      <span>{log.step_name}</span>
                      <span style={{ fontSize: '11px', color: '#999' }}>{log.step_type}</span>
                      {log.approver_id && (
                        <span style={{ fontSize: '11px', color: '#4f46e5' }}>
                          by {getUserName(log.approver_id)}
                        </span>
                      )}
                    </div>
                  ))}
                  {ex.status === 'IN_PROGRESS' && ex.currentStepName && (
                    <div style={{ display: 'flex', alignItems: 'center',
                      gap: '10px', fontSize: '13px' }}>
                      <span style={{
                        width: '18px', height: '18px', borderRadius: '50%',
                        background: '#f59e0b', display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0, color: 'white', fontSize: '10px'
                      }}>⏳</span>
                      <span style={{ fontWeight: '500' }}>{ex.currentStepName}</span>
                      <span style={{ fontSize: '11px', color: '#f59e0b', fontWeight: '500' }}>
                        waiting...
                      </span>
                    </div>
                  )}
                </div>
              )}

              <div style={{ fontSize: '11px', color: '#999', marginTop: '8px' }}>
                Started: {ex.startedAt ? new Date(ex.startedAt).toLocaleString() : '—'}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Execute Modal */}
      {selectedWf && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.4)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: 'white', borderRadius: '12px', padding: '24px',
            width: '520px', maxWidth: '90vw', maxHeight: '80vh', overflowY: 'auto' }}>
            {!activeExecution ? (
              <>
                <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '4px' }}>
                  Execute: {selectedWf.name}
                </h3>
                <p style={{ fontSize: '12px', color: '#999', marginBottom: '16px' }}>
                  Fill in the required fields to start this workflow
                </p>
                {Object.keys(inputFields).length === 0 ? (
                  <p style={{ color: '#999', marginBottom: '16px' }}>No inputs required.</p>
                ) : Object.entries(inputFields).map(([key, config]) => (
                  <div className="form-group" key={key}>
                    <label className="label">
                      {key}
                      {config.required && <span style={{ color: '#ef4444' }}> *</span>}
                      <span style={{ color: '#999', fontWeight: '400', marginLeft: '6px' }}>
                        ({config.type})
                      </span>
                    </label>
                    {config.allowed_values ? (
                      <select value={formValues[key] || ''}
                        onChange={e => setFormValues({ ...formValues, [key]: e.target.value })}>
                        <option value="">Select {key}</option>
                        {config.allowed_values.map(v => (
                          <option key={v} value={v}>{v}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={config.type === 'number' ? 'number' : 'text'}
                        value={formValues[key] || ''}
                        placeholder={`Enter ${key}`}
                        onChange={e => setFormValues({
                          ...formValues,
                          [key]: config.type === 'number'
                            ? Number(e.target.value) : e.target.value
                        })}
                      />
                    )}
                  </div>
                ))}
                <div style={{ display: 'flex', gap: '8px',
                              justifyContent: 'flex-end', marginTop: '8px' }}>
                  <button className="btn" onClick={() => setSelectedWf(null)}>Cancel</button>
                  <button className="btn btn-primary"
                    onClick={handleStart} disabled={starting}>
                    {starting ? 'Starting...' : 'Start Execution'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>
                  Execution Started!
                </h3>
                <div style={{ display: 'flex', alignItems: 'center',
                              gap: '12px', marginBottom: '12px' }}>
                  <StatusBadge status={activeExecution.status} />
                  {activeExecution.currentStepName && (
                    <span style={{ fontSize: '13px', color: '#555' }}>
                      Current: <strong>{activeExecution.currentStepName}</strong>
                    </span>
                  )}
                </div>
                <p style={{ fontSize: '12px', color: '#999', marginBottom: '16px' }}>
                  ID: {activeExecution.id}
                </p>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                  <button className="btn" onClick={() => setSelectedWf(null)}>Close</button>
                  <button className="btn btn-primary"
                    onClick={() => { setSelectedWf(null); setActiveTab('myex') }}>
                    View My Executions
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Track Modal */}
      {trackExecution && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.4)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: 'white', borderRadius: '12px', padding: '24px',
            width: '560px', maxWidth: '90vw', maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between',
                          alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600' }}>
                Tracking: {trackExecution.workflowName}
              </h3>
              <button className="btn" onClick={() => setTrackExecution(null)}>Close</button>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <StatusBadge status={trackExecution.status} />
            </div>

            <h4 style={{ fontSize: '13px', fontWeight: '600',
                         color: '#555', marginBottom: '10px' }}>
              Workflow Steps
            </h4>

            {trackSteps.map((step, index) => {
              const log = trackExecution.logs?.find(l =>
                l.step_name?.toLowerCase().trim() === step.name?.toLowerCase().trim()
              )
              const isCurrent   = trackExecution.currentStepName === step.name
              const isCompleted = log?.status === 'completed'
              const isRejected  = log?.status === 'rejected'
              const isSkipped   = !log && !isCurrent

              return (
                <div key={step.id} style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '10px 14px', borderRadius: '8px', marginBottom: '8px',
                  background: isCurrent   ? '#fef3c7'
                    : isRejected  ? '#fef2f2'
                    : isCompleted ? '#f0fdf4'
                    : isSkipped   ? '#f3f4f6'
                    : '#f9fafb',
                  border: isCurrent   ? '1px solid #fde68a'
                    : isRejected  ? '1px solid #fecaca'
                    : isCompleted ? '1px solid #bbf7d0'
                    : isSkipped   ? '1px solid #e5e7eb'
                    : '1px solid #e5e5e5'
                }}>
                  <span style={{
                    width: '24px', height: '24px', borderRadius: '50%', flexShrink: 0,
                    background: isRejected  ? '#ef4444'
                      : isCompleted ? '#22c55e'
                      : isCurrent   ? '#f59e0b'
                      : isSkipped   ? '#9ca3af'
                      : '#d1d5db',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontSize: '11px', fontWeight: '700'
                  }}>
                    {isRejected  ? '✗'
                      : isCompleted ? '✓'
                      : isCurrent   ? '⏳'
                      : isSkipped   ? '–'
                      : step.stepOrder}
                  </span>

                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '500', fontSize: '13px', color: '#111' }}>
                      {step.name}
                    </div>
                    <div style={{ fontSize: '11px', color: '#999', marginTop: '2px' }}>
                      {step.stepType}
                      {step.metadata && (() => {
                        try {
                          const m = JSON.parse(step.metadata)
                          return m.assignee_email
                            ? ` · Assigned to: ${m.assignee_email}` : ''
                        } catch { return '' }
                      })()}
                    </div>
                  </div>

                  <div style={{ fontSize: '11px', textAlign: 'right' }}>
                    {isRejected && (
                      <>
                        <div style={{ color: '#dc2626', fontWeight: '500' }}>Rejected</div>
                        {log?.approver_id && (
                          <div style={{ color: '#999' }}>
                            by {getUserName(log.approver_id)}
                          </div>
                        )}
                        {log?.comment && (
                          <div style={{ color: '#dc2626' }}>{log.comment}</div>
                        )}
                      </>
                    )}
                    {!isRejected && isCompleted && log?.approver_id && (
                      <div style={{ color: '#15803d' }}>
                        by {getUserName(log.approver_id)}
                      </div>
                    )}
                    {!isRejected && isCompleted && !log?.approver_id && (
                      <div style={{ color: '#15803d' }}>auto completed</div>
                    )}
                    {isCurrent && (
                      <div style={{ color: '#f59e0b', fontWeight: '500' }}>In Progress</div>
                    )}
                    {isSkipped && (
                      <div style={{ color: '#6b7280' }}>skipped</div>
                    )}
                  </div>
                </div>
              )
            })}

            {trackExecution.inputData && (
              <div style={{ marginTop: '16px' }}>
                <h4 style={{ fontSize: '13px', fontWeight: '600',
                             color: '#555', marginBottom: '8px' }}>
                  Input Data
                </h4>
                <pre style={{ background: '#f5f5f5', padding: '10px',
                              borderRadius: '6px', fontSize: '11px', overflow: 'auto' }}>
                  {JSON.stringify(trackExecution.inputData, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}