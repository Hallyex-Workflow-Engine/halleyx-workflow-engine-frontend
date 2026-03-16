import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAllExecutions } from '../api/ExecutionApi'
import StatusBadge from '../components/StatusBadge'
import LoadingSpinner from '../components/LoadingSpinner'

function AuditLog() {
  const navigate = useNavigate()
  const [executions, setExecutions] = useState([])
  const [loading, setLoading]       = useState(true)
  const [selected, setSelected]     = useState(null)
  const [error, setError]           = useState('')

  useEffect(() => {
    loadExecutions()
  }, [])

  const loadExecutions = async () => {
    try {
      const res = await getAllExecutions()
      setExecutions(res.data || [])
    } catch (err) {
      setError('Failed to load audit log')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <LoadingSpinner />

  return (
    <div>
      <h1 className="page-title">Audit Log</h1>

      {error && (
        <div style={{ background: '#fee2e2', color: '#dc2626',
                      padding: '10px 14px', borderRadius: '8px',
                      marginBottom: '16px', fontSize: '13px' }}>
          {error}
        </div>
      )}

      {/* Executions table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table>
          <thead>
            <tr>
              <th>Execution ID</th>
              <th>Workflow</th>
              <th>Version</th>
              <th>Status</th>
              <th>Started By</th>
              <th>Start Time</th>
              <th>End Time</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {executions.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center',
                                         padding: '40px', color: '#999' }}>
                  No executions yet. Run a workflow to see logs here.
                </td>
              </tr>
            ) : (
              executions.map((ex) => (
                <tr key={ex.id}>
                  <td style={{ fontFamily: 'monospace', fontSize: '11px',
                               color: '#666' }}>
                    {ex.id?.substring(0, 8)}...
                  </td>
                  <td style={{ fontWeight: '500' }}>{ex.workflowName}</td>
                  <td>v{ex.workflowVersion}</td>
                  <td><StatusBadge status={ex.status} /></td>
                  <td style={{ fontSize: '12px', color: '#666' }}>
                    {ex.triggeredBy || '—'}
                  </td>
                  <td style={{ fontSize: '12px', color: '#666' }}>
                    {ex.startedAt
                      ? new Date(ex.startedAt).toLocaleString()
                      : '—'}
                  </td>
                  <td style={{ fontSize: '12px', color: '#666' }}>
                    {ex.endedAt
                      ? new Date(ex.endedAt).toLocaleString()
                      : '—'}
                  </td>
                  <td>
                    <button
                      onClick={() => setSelected(selected?.id === ex.id ? null : ex)}
                      style={{ fontSize: '12px', padding: '4px 10px',
                               borderRadius: '6px', cursor: 'pointer',
                               background: '#ede9fe', color: '#5b21b6',
                               border: '1px solid #ddd8fe' }}
                    >
                      {selected?.id === ex.id ? 'Hide Logs' : 'View Logs'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Expanded log detail */}
      {selected && (
        <div className="card" style={{ marginTop: '16px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>
            Logs for execution {selected.id?.substring(0, 8)}...
          </h3>
          <p style={{ fontSize: '12px', color: '#999', marginBottom: '16px' }}>
            Workflow: {selected.workflowName} v{selected.workflowVersion}
          </p>

          {(!selected.logs || selected.logs.length === 0) ? (
            <p style={{ color: '#999', fontSize: '13px' }}>No step logs available.</p>
          ) : (
            selected.logs.map((log, index) => (
              <div key={index} style={{
                border: '1px solid #e5e5e5', borderRadius: '8px',
                padding: '12px', marginBottom: '8px',
                borderLeft: log.status === 'completed'
                  ? '3px solid #22c55e' : '3px solid #ef4444'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between',
                              marginBottom: '6px' }}>
                  <span style={{ fontWeight: '600' }}>{log.step_name}</span>
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
                  <span>Type: {log.step_type}</span>
                  {log.approver_id && <span>Approver: {log.approver_id}</span>}
                  {log.timestamp && (
                    <span>At: {new Date(log.timestamp).toLocaleString()}</span>
                  )}
                </div>
                {log.error && (
                  <p style={{ color: '#dc2626', fontSize: '12px', marginTop: '6px' }}>
                    Error: {log.error}
                  </p>
                )}
              </div>
            ))
          )}

          {/* Raw input data */}
          {selected.inputData && (
            <div style={{ marginTop: '12px' }}>
              <p style={{ fontSize: '12px', fontWeight: '500',
                          color: '#555', marginBottom: '6px' }}>
                Input Data:
              </p>
              <pre style={{ background: '#f5f5f5', padding: '10px',
                            borderRadius: '6px', fontSize: '11px',
                            overflow: 'auto' }}>
                {JSON.stringify(selected.inputData, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default AuditLog