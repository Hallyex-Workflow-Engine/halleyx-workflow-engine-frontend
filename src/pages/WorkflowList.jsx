import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAllWorkflows, deleteWorkflow, searchWorkflows } from '../api/workflowApi'
import StatusBadge from '../components/StatusBadge'
import LoadingSpinner from '../components/LoadingSpinner'

function WorkflowList() {
  const navigate = useNavigate()
  const [workflows, setWorkflows] = useState([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [error, setError]         = useState('')
  useEffect(() => {
    fetchWorkflows()
  }, [])

  const fetchWorkflows = async () => {
    try {
      setLoading(true)
      const res = await getAllWorkflows()
      setWorkflows(res.data)
    } catch (err) {
      setError('Failed to load workflows')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async (value) => {
    setSearch(value)
    if (value.trim() === '') {
      fetchWorkflows()
      return
    }
    try {
      const res = await searchWorkflows(value)
      setWorkflows(res.data)
    } catch (err) {
      setError('Search failed')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this workflow?')) return
    try {
      await deleteWorkflow(id)
      fetchWorkflows()
    } catch (err) {
      setError('Delete failed')
    }
  }

  if (loading) return <LoadingSpinner />

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', marginBottom: '20px' }}>
        <h1 className="page-title" style={{ margin: 0 }}>Workflows</h1>
        <button
          className="btn-primary"
          style={{ padding: '10px 20px', borderRadius: '8px',
                   background: '#4f46e5', color: 'white', border: 'none',
                   fontWeight: '500', cursor: 'pointer' }}
          onClick={() => navigate('/workflows/new')}
        >
          + Create Workflow
        </button>
      </div>

      {error && (
        <div style={{ background: '#fee2e2', color: '#dc2626', padding: '10px 14px',
                      borderRadius: '8px', marginBottom: '16px', fontSize: '13px' }}>
          {error}
        </div>
      )}

     
      <div style={{ marginBottom: '16px' }}>
        <input
          type="text"
          placeholder="Search workflows by name..."
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          style={{ maxWidth: '320px', padding: '8px 12px',
                   border: '1px solid #ddd', borderRadius: '8px' }}
        />
      </div>

   
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Steps</th>
              <th>Version</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {workflows.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center',
                                         padding: '40px', color: '#999' }}>
                  No workflows found. Create your first one!
                </td>
              </tr>
            ) : (
              workflows.map((wf) => (
                <tr key={wf.id} style={{ background: 'white' }}>
                  <td style={{ fontWeight: '500' }}>{wf.name}</td>
                  <td>{wf.stepCount}</td>
                  <td>v{wf.version}</td>
                  <td>
                    <StatusBadge status={wf.isActive ? 'Active' : 'Inactive'} />
                  </td>
                  <td style={{ color: '#999', fontSize: '12px' }}>
                    {new Date(wf.createdAt).toLocaleDateString()}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => navigate(`/workflows/${wf.id}/edit`)}
                        style={{ fontSize: '12px', padding: '4px 10px',
                                 borderRadius: '6px', cursor: 'pointer' }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => navigate(`/workflows/${wf.id}/execute`)}
                        style={{ fontSize: '12px', padding: '4px 10px',
                                 borderRadius: '6px', background: '#4f46e5',
                                 color: 'white', border: 'none', cursor: 'pointer' }}
                      >
                        Execute
                      </button>
                      <button
                        onClick={() => handleDelete(wf.id)}
                        style={{ fontSize: '12px', padding: '4px 10px',
                                 borderRadius: '6px', background: '#ef4444',
                                 color: 'white', border: 'none', cursor: 'pointer' }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default WorkflowList