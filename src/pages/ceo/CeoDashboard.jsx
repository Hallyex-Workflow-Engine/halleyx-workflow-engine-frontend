import { useEffect, useState } from 'react'
import { getPendingApprovals, approveStep, rejectStep, getAllExecutions } from '../../api/ExecutionApi'
import { getStepsByWorkflow } from '../../api/stepApi'
import { getAllUsers } from '../../api/userApi'
import StatusBadge from '../../components/StatusBadge'
import { useAuth } from '../../context/AuthContext'

export default function CeoDashboard() {
  const { user } = useAuth()

  const [activeTab, setActiveTab]         = useState('pending')
  const [pending, setPending]             = useState([])
  const [allExecutions, setAll]           = useState([])
  const [users, setUsers]                 = useState([])
  const [loading, setLoading]             = useState(true)
  const [error, setError]                 = useState('')
  const [rejectModal, setRejectModal]     = useState(null)
  const [comment, setComment]             = useState('')
  const [expandedEx, setExpandedEx]       = useState(null)
  const [expandedSteps, setExpandedSteps] = useState([])

  useEffect(() => { loadAll() }, [])

  const loadAll = async () => {
    setLoading(true)
    try {
      const [pendingRes, allRes, usersRes] = await Promise.all([
        getPendingApprovals(user.email),
        getAllExecutions(),
        getAllUsers()
      ])
      setPending(pendingRes.data || [])
      setAll(allRes.data || [])
      setUsers(usersRes.data || [])
    } catch { setError('Failed to load') }
    finally  { setLoading(false) }
  }

  const getUserName = (id) => {
    const u = users.find(u => u.id === id)
    return u ? u.name : id ? id.substring(0, 8) + '...' : '—'
  }

  const handleApprove = async (execId) => {
    try { await approveStep(execId, user.id); loadAll() }
    catch { setError('Approve failed') }
  }

  const handleReject = async () => {
    if (!comment.trim()) { setError('Comment required'); return }
    try {
      await rejectStep(rejectModal.id, user.id, comment)
      setRejectModal(null); setComment(''); loadAll()
    } catch { setError('Reject failed') }
  }

  const handleExpand = async (ex) => {
    if (expandedEx?.id === ex.id) { setExpandedEx(null); return }
    setExpandedEx(ex)
    try {
      const res = await getStepsByWorkflow(ex.workflowId)
      setExpandedSteps(res.data || [])
    } catch { setExpandedSteps([]) }
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
      <div style={{ display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', marginBottom: '20px' }}>
        <h1 className="page-title" style={{ margin: 0 }}>CEO Dashboard</h1>
        {pending.length > 0 && (
          <span style={{ background: '#fee2e2', color: '#dc2626',
            padding: '4px 12px', borderRadius: '20px',
            fontSize: '12px', fontWeight: '600' }}>
            {pending.length} pending
          </span>
        )}
      </div>

      {error && <div style={{ background: '#fee2e2', color: '#dc2626',
        padding: '10px 14px', borderRadius: '8px',
        marginBottom: '16px', fontSize: '13px' }}>{error}</div>}

      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        <button style={tabStyle('pending')} onClick={() => setActiveTab('pending')}>
          Pending Approvals ({pending.length})
        </button>
        <button style={tabStyle('all')} onClick={() => setActiveTab('all')}>
          All Executions ({allExecutions.length})
        </button>
      </div>

     
      {activeTab === 'pending' && (
        <div>
          {pending.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
              <p style={{ color: '#999' }}>No pending approvals.</p>
            </div>
          ) : pending.map(ex => (
            <div key={ex.id} className="card" style={{ marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between',
                            alignItems: 'flex-start', marginBottom: '12px' }}>
                <div>
                  <p style={{ fontWeight: '600', fontSize: '15px', margin: 0 }}>
                    {ex.workflowName}
                  </p>
                  <p style={{ fontSize: '12px', color: '#999', margin: '4px 0 0' }}>
                    Waiting: <strong>{ex.currentStepName}</strong>
                  </p>
                  <p style={{ fontSize: '12px', color: '#999', margin: '2px 0 0' }}>
                    Triggered by: <strong>{getUserName(ex.triggeredBy)}</strong>
                  </p>
                </div>
                <StatusBadge status={ex.status} />
              </div>

              {ex.inputData && (
                <div style={{ marginBottom: '12px' }}>
                  <p style={{ fontSize: '12px', fontWeight: '500',
                              color: '#555', marginBottom: '6px' }}>
                    Submission data:
                  </p>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {Object.entries(ex.inputData).map(([k, v]) => (
                      <span key={k} style={{ background: '#f3f4f6',
                        padding: '4px 10px', borderRadius: '6px', fontSize: '12px' }}>
                        <strong>{k}:</strong> {String(v)}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {ex.logs && ex.logs.length > 0 && (
                <div style={{ marginBottom: '12px' }}>
                  <p style={{ fontSize: '12px', fontWeight: '500',
                              color: '#555', marginBottom: '6px' }}>
                    Steps completed so far:
                  </p>
                  {ex.logs.map((log, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center',
                      gap: '8px', fontSize: '12px', marginBottom: '4px' }}>
                      <span style={{ color: log.status === 'completed'
                        ? '#22c55e' : '#ef4444', fontWeight: '700' }}>
                        {log.status === 'completed' ? '✓' : '✗'}
                      </span>
                      <span>{log.step_name}</span>
                      <span style={{ color: '#999' }}>{log.step_type}</span>
                      {log.approver_id && (
                        <span style={{ color: '#4f46e5' }}>
                          approved by {getUserName(log.approver_id)}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div style={{ display: 'flex', gap: '8px',
                            borderTop: '1px solid #f3f4f6', paddingTop: '12px' }}>
                <button className="btn btn-success" style={{ padding: '8px 20px' }}
                  onClick={() => handleApprove(ex.id)}>Approve</button>
                <button className="btn btn-danger" style={{ padding: '8px 20px' }}
                  onClick={() => { setRejectModal(ex); setComment('') }}>Reject</button>
              </div>
            </div>
          ))}
        </div>
      )}

     
      {activeTab === 'all' && (
        <div>
          {allExecutions.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
              <p style={{ color: '#999' }}>No executions yet.</p>
            </div>
          ) : allExecutions.map(ex => (
            <div key={ex.id} className="card" style={{ marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between',
                            alignItems: 'center' }}>
                <div>
                  <span style={{ fontWeight: '600' }}>{ex.workflowName}</span>
                  <span style={{ fontSize: '11px', color: '#999', marginLeft: '8px' }}>
                    v{ex.workflowVersion}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <StatusBadge status={ex.status} />
                  <span style={{ fontSize: '12px', color: '#666' }}>
                    {getUserName(ex.triggeredBy)}
                  </span>
                  <span style={{ fontSize: '12px', color: '#999' }}>
                    {ex.startedAt ? new Date(ex.startedAt).toLocaleString() : '—'}
                  </span>
                  <button className="btn"
                    style={{ fontSize: '12px', padding: '4px 10px',
                             background: '#ede9fe', color: '#5b21b6',
                             border: '1px solid #ddd8fe' }}
                    onClick={() => handleExpand(ex)}>
                    {expandedEx?.id === ex.id ? 'Hide' : 'All Steps'}
                  </button>
                </div>
              </div>

              {expandedEx?.id === ex.id && (
                <div style={{ marginTop: '16px', borderTop: '1px solid #f3f4f6',
                              paddingTop: '16px' }}>
                  <p style={{ fontSize: '12px', fontWeight: '600',
                              color: '#555', marginBottom: '10px' }}>
                    All Steps:
                  </p>
                  {expandedSteps.map(step => {
                    const log = ex.logs?.find(l => l.step_name === step.name)
                    const isCurrent = ex.currentStepName === step.name
                    return (
                      <div key={step.id} style={{
                        display: 'flex', alignItems: 'center', gap: '12px',
                        padding: '10px', borderRadius: '8px', marginBottom: '6px',
                        background: isCurrent ? '#fef3c7' : '#f9fafb',
                        border: isCurrent ? '1px solid #fde68a' : '1px solid #e5e5e5'
                      }}>
                        <span style={{
                          width: '22px', height: '22px', borderRadius: '50%',
                          background: log?.status === 'completed' ? '#22c55e'
                            : log?.status === 'rejected' ? '#ef4444'
                            : isCurrent ? '#f59e0b' : '#e5e5e5',
                          display: 'flex', alignItems: 'center',
                          justifyContent: 'center', flexShrink: 0,
                          color: 'white', fontSize: '11px', fontWeight: '700'
                        }}>
                          {log?.status === 'completed' ? '✓'
                            : log?.status === 'rejected' ? '✗'
                            : isCurrent ? '⏳' : step.stepOrder}
                        </span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: '500', fontSize: '13px' }}>
                            {step.name}
                          </div>
                          <div style={{ fontSize: '11px', color: '#999' }}>
                            {step.stepType}
                            {step.metadata && (() => {
                              try {
                                const m = JSON.parse(step.metadata)
                                return m.assignee_email
                                  ? ` · ${m.assignee_email}` : ''
                              } catch { return '' }
                            })()}
                          </div>
                        </div>
                        {log && (
                          <div style={{ fontSize: '11px', color: '#666',
                                        textAlign: 'right' }}>
                            <div style={{ fontWeight: '500' }}>{log.status}</div>
                            {log.approver_id && (
                              <div>by {getUserName(log.approver_id)}</div>
                            )}
                            {log.comment && (
                              <div style={{ color: '#dc2626' }}>{log.comment}</div>
                            )}
                            {log.timestamp && (
                              <div style={{ color: '#999' }}>
                                {new Date(log.timestamp).toLocaleTimeString()}
                              </div>
                            )}
                          </div>
                        )}
                        {isCurrent && !log && (
                          <span style={{ fontSize: '11px', color: '#f59e0b',
                                         fontWeight: '500' }}>In Progress</span>
                        )}
                      </div>
                    )
                  })}

                  {ex.inputData && (
                    <div style={{ marginTop: '12px' }}>
                      <p style={{ fontSize: '12px', fontWeight: '500',
                                  color: '#555', marginBottom: '6px' }}>
                        Input Data:
                      </p>
                      <pre style={{ background: '#f5f5f5', padding: '10px',
                                    borderRadius: '6px', fontSize: '11px' }}>
                        {JSON.stringify(ex.inputData, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

    
      {rejectModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.4)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: 'white', borderRadius: '12px',
            padding: '24px', width: '440px', maxWidth: '90vw' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>
              Reject: {rejectModal.workflowName}
            </h3>
            <p style={{ fontSize: '13px', color: '#666', marginBottom: '16px' }}>
              Reason for rejection is required.
            </p>
            <div className="form-group">
              <label className="label">Reason *</label>
              <textarea rows={3} value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder="e.g. Budget not approved for this quarter"
                style={{ resize: 'vertical' }} />
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button className="btn"
                onClick={() => { setRejectModal(null); setComment('') }}>Cancel</button>
              <button className="btn btn-danger" onClick={handleReject}>
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}