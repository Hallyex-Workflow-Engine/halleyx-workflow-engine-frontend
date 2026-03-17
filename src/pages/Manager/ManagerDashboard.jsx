import { useEffect, useState } from 'react'
import { getPendingApprovals, approveStep, rejectStep, getAllExecutions } from '../../api/ExecutionApi'
import StatusBadge from '../../components/StatusBadge'
import { useAuth } from '../../context/AuthContext'

export default function ManagerDashboard() {
  const { user } = useAuth()

  const [activeTab, setActiveTab]       = useState('pending')
  const [pending, setPending]           = useState([])
  const [myHistory, setMyHistory]       = useState([])
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState('')
  const [rejectModal, setRejectModal]   = useState(null)
  const [comment, setComment]           = useState('')
  const [selected, setSelected]         = useState(null)

  useEffect(() => { loadAll() }, [])

  const loadAll = async () => {
    setLoading(true)
    try {
      const [pendingRes, allRes] = await Promise.all([
        getPendingApprovals(user.email),
        getAllExecutions()
      ])
      setPending(pendingRes.data || [])
      // my history — executions where I was the approver
      const mine = (allRes.data || []).filter(ex =>
        ex.logs?.some(l => l.approver_id === user.id)
      )
      setMyHistory(mine)
    } catch { setError('Failed to load') }
    finally  { setLoading(false) }
  }

  const handleApprove = async (execId) => {
    try {
      await approveStep(execId, user.id)
      loadAll()
    } catch { setError('Approve failed') }
  }

  const handleReject = async () => {
    if (!comment.trim()) { setError('Comment is required for rejection'); return }
    try {
      await rejectStep(rejectModal.id, user.id, comment)
      setRejectModal(null)
      setComment('')
      loadAll()
    } catch { setError('Reject failed') }
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
        <h1 className="page-title" style={{ margin: 0 }}>Manager Dashboard</h1>
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
        <button style={tabStyle('history')} onClick={() => setActiveTab('history')}>
          My History ({myHistory.length})
        </button>
      </div>

      {/* TAB 1 — Pending Approvals */}
      {activeTab === 'pending' && (
        <div>
          {pending.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
              <p style={{ color: '#999' }}>No pending approvals. You are all caught up!</p>
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
                    Step: <strong>{ex.currentStepName}</strong>
                  </p>
                  <p style={{ fontSize: '12px', color: '#999', margin: '2px 0 0' }}>
                    Submitted by: {ex.triggeredBy}
                  </p>
                  <p style={{ fontSize: '12px', color: '#999', margin: '2px 0 0' }}>
                    Started: {ex.startedAt
                      ? new Date(ex.startedAt).toLocaleString() : '—'}
                  </p>
                </div>
                <StatusBadge status={ex.status} />
              </div>

              {/* Input data */}
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

              {/* Previous steps log */}
              {ex.logs && ex.logs.length > 0 && (
                <div style={{ marginBottom: '12px' }}>
                  <p style={{ fontSize: '12px', fontWeight: '500',
                              color: '#555', marginBottom: '6px' }}>
                    Previous steps:
                  </p>
                  {ex.logs.map((log, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center',
                      gap: '8px', fontSize: '12px', marginBottom: '4px',
                      color: '#666' }}>
                      <span style={{ color: log.status === 'completed'
                        ? '#22c55e' : '#ef4444', fontWeight: '700' }}>
                        {log.status === 'completed' ? '✓' : '✗'}
                      </span>
                      <span>{log.step_name}</span>
                      {log.approver_id && (
                        <span style={{ color: '#4f46e5' }}>by {log.approver_id}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid #f3f4f6',
                            paddingTop: '12px' }}>
                <button className="btn btn-success"
                  style={{ padding: '8px 20px' }}
                  onClick={() => handleApprove(ex.id)}>
                  Approve
                </button>
                <button className="btn btn-danger"
                  style={{ padding: '8px 20px' }}
                  onClick={() => { setRejectModal(ex); setComment('') }}>
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 2 — History */}
      {activeTab === 'history' && (
        <div>
          {myHistory.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
              <p style={{ color: '#999' }}>No approval history yet.</p>
            </div>
          ) : (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <table>
                <thead>
                  <tr>
                    <th>Workflow</th>
                    <th>Version</th>
                    <th>Status</th>
                    <th>Triggered By</th>
                    <th>Started</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {myHistory.map(ex => (
                    <>
                      <tr key={ex.id}>
                        <td style={{ fontWeight: '500' }}>{ex.workflowName}</td>
                        <td>v{ex.workflowVersion}</td>
                        <td><StatusBadge status={ex.status} /></td>
                        <td style={{ fontSize: '12px', color: '#666' }}>
                          {ex.triggeredBy || '—'}
                        </td>
                        <td style={{ fontSize: '12px', color: '#666' }}>
                          {ex.startedAt
                            ? new Date(ex.startedAt).toLocaleString() : '—'}
                        </td>
                        <td>
                          <button className="btn"
                            style={{ fontSize: '12px', padding: '4px 10px',
                                     background: '#ede9fe', color: '#5b21b6',
                                     border: '1px solid #ddd8fe' }}
                            onClick={() => setSelected(
                              selected?.id === ex.id ? null : ex
                            )}>
                            {selected?.id === ex.id ? 'Hide' : 'View Logs'}
                          </button>
                        </td>
                      </tr>
                      {selected?.id === ex.id && (
                        <tr key={ex.id + '-logs'}>
                          <td colSpan={6} style={{ background: '#fafafa',
                                                    padding: '16px' }}>
                            {ex.logs?.map((log, i) => (
                              <div key={i} style={{
                                border: '1px solid #e5e5e5', borderRadius: '8px',
                                padding: '10px 14px', marginBottom: '8px',
                                borderLeft: log.status === 'completed'
                                  ? '3px solid #22c55e' : '3px solid #ef4444'
                              }}>
                                <div style={{ display: 'flex',
                                              justifyContent: 'space-between' }}>
                                  <span style={{ fontWeight: '600' }}>
                                    {log.step_name}
                                  </span>
                                  <span style={{ fontSize: '11px', color: '#999' }}>
                                    {log.status}
                                  </span>
                                </div>
                                <div style={{ fontSize: '12px',
                                              color: '#666', marginTop: '4px' }}>
                                  {log.approver_id && `Approver: ${log.approver_id}`}
                                  {log.comment && ` · ${log.comment}`}
                                </div>
                              </div>
                            ))}
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Reject Modal */}
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
              Please provide a reason for rejection.
            </p>
            <div className="form-group">
              <label className="label">Reason *</label>
              <textarea rows={3} value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder="e.g. Amount exceeds budget limit"
                style={{ resize: 'vertical' }} />
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button className="btn"
                onClick={() => { setRejectModal(null); setComment('') }}>
                Cancel
              </button>
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