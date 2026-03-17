import { useEffect, useState } from 'react'
import { getAllExecutions } from '../../api/ExecutionApi'
import StatusBadge from '../../components/StatusBadge'

export default function AuditLog() {
  const [executions, setExecutions] = useState([])
  const [loading, setLoading]       = useState(true)
  const [selected, setSelected]     = useState(null)
  const [error, setError]           = useState('')

  useEffect(() => {
    getAllExecutions()
      .then(res => setExecutions(res.data || []))
      .catch(() => setError('Failed to load audit log'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div style={{ padding: 40, color: '#999' }}>Loading...</div>

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

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table>
          <thead>
            <tr>
              <th>Execution ID</th>
              <th>Workflow</th>
              <th>Version</th>
              <th>Status</th>
              <th>Triggered By</th>
              <th>Started</th>
              <th>Ended</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {executions.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center',
                                          padding: '40px', color: '#999' }}>
                  No executions yet.
                </td>
              </tr>
            ) : executions.map(ex => (
              <>
                <tr key={ex.id}>
                  <td style={{ fontFamily: 'monospace', fontSize: '11px', color: '#666' }}>
                    {ex.id?.substring(0, 8)}...
                  </td>
                  <td style={{ fontWeight: '500' }}>{ex.workflowName}</td>
                  <td>v{ex.workflowVersion}</td>
                  <td><StatusBadge status={ex.status} /></td>
                  <td style={{ fontSize: '12px', color: '#666' }}>
                    {ex.triggeredBy || '—'}
                  </td>
                  <td style={{ fontSize: '12px', color: '#666' }}>
                    {ex.startedAt ? new Date(ex.startedAt).toLocaleString() : '—'}
                  </td>
                  <td style={{ fontSize: '12px', color: '#666' }}>
                    {ex.endedAt ? new Date(ex.endedAt).toLocaleString() : '—'}
                  </td>
                  <td>
                    <button
                      onClick={() => setSelected(selected?.id === ex.id ? null : ex)}
                      style={{ fontSize: '12px', padding: '4px 10px',
                               borderRadius: '6px', cursor: 'pointer',
                               background: '#ede9fe', color: '#5b21b6',
                               border: '1px solid #ddd8fe' }}
                    >
                      {selected?.id === ex.id ? 'Hide' : 'View Logs'}
                    </button>
                  </td>
                </tr>

                {selected?.id === ex.id && (
                  <tr key={ex.id + '-logs'}>
                    <td colSpan={8} style={{ background: '#fafafa', padding: '16px' }}>
                      {(!ex.logs || ex.logs.length === 0) ? (
                        <p style={{ color: '#999', fontSize: '13px' }}>No logs.</p>
                      ) : ex.logs.map((log, i) => (
                        <div key={i} style={{
                          border: '1px solid #e5e5e5', borderRadius: '8px',
                          padding: '10px 14px', marginBottom: '8px',
                          borderLeft: log.status === 'completed'
                            ? '3px solid #22c55e' : '3px solid #ef4444'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ fontWeight: '600' }}>{log.step_name}</span>
                            <span style={{ fontSize: '11px', color: '#999' }}>
                              {log.timestamp
                                ? new Date(log.timestamp).toLocaleString() : ''}
                            </span>
                          </div>
                          <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                            Type: {log.step_type}
                            {log.approver_id && ` · Approver: ${log.approver_id}`}
                            {log.comment && ` · Comment: ${log.comment}`}
                          </div>
                        </div>
                      ))}

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
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}