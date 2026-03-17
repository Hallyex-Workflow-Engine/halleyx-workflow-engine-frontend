import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getWorkflowById, createWorkflow, updateWorkflow, setStartStep } from '../../api/workflowApi'
import { getStepsByWorkflow, addStep, updateStep, deleteStep } from '../../api/stepApi'

const STEP_TYPES = ['APPROVAL', 'NOTIFICATION', 'TASK']

export default function WorkflowEditor() {
  const { id }   = useParams()
  const navigate = useNavigate()
  const isEdit   = Boolean(id)

  const [loading, setLoading]   = useState(isEdit)
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState('')
  const [success, setSuccess]   = useState('')

  const [name, setName]               = useState('')
  const [inputSchema, setInputSchema] = useState('')
  const [startStepId, setStartStepId] = useState('')
  const [steps, setSteps]             = useState([])

  const [showStepForm, setShowStepForm] = useState(false)
  const [editingStep, setEditingStep]   = useState(null)
  const [stepName, setStepName]         = useState('')
  const [stepType, setStepType]         = useState('APPROVAL')
  const [stepOrder, setStepOrder]       = useState(1)
  const [stepMetadata, setStepMetadata] = useState('')

  useEffect(() => { if (isEdit) loadWorkflow() }, [id])

  const loadWorkflow = async () => {
    try {
      const [wfRes, stepsRes] = await Promise.all([
        getWorkflowById(id),
        getStepsByWorkflow(id)
      ])
      const wf = wfRes.data
      setName(wf.name || '')
      setInputSchema(wf.inputSchema || '')
      setStartStepId(wf.startStepId || '')
      setSteps(stepsRes.data || [])
    } catch { setError('Failed to load workflow') }
    finally  { setLoading(false) }
  }

  const flash = (msg) => {
    setSuccess(msg)
    setTimeout(() => setSuccess(''), 3000)
  }

  const handleSave = async () => {
    if (!name.trim()) { setError('Name is required'); return }
    setSaving(true); setError('')
    try {
      if (isEdit) {
        await updateWorkflow(id, { name, inputSchema })
        flash('Workflow updated!')
      } else {
        const res = await createWorkflow({ name, inputSchema })
        navigate(`/workflows/${res.data.id}/edit`)
      }
    } catch { setError('Failed to save') }
    finally { setSaving(false) }
  }

  const openAdd = () => {
    setEditingStep(null); setStepName(''); setStepType('APPROVAL')
    setStepOrder(steps.length + 1); setStepMetadata(''); setError('')
    setShowStepForm(true)
  }

  const openEdit = (step) => {
    setEditingStep(step); setStepName(step.name); setStepType(step.stepType)
    setStepOrder(step.stepOrder); setStepMetadata(step.metadata || ''); setError('')
    setShowStepForm(true)
  }

  const handleSaveStep = async () => {
    if (!stepName.trim()) { setError('Step name required'); return }
    setError('')
    const data = { name: stepName, stepType, stepOrder, metadata: stepMetadata }
    try {
      if (editingStep) { await updateStep(editingStep.id, data); flash('Step updated!') }
      else             { await addStep(id, data); flash('Step added!') }
      setShowStepForm(false)
      loadWorkflow()
    } catch { setError('Failed to save step') }
  }

  const handleDeleteStep = async (stepId) => {
    if (!window.confirm('Delete this step and all its rules?')) return
    try { await deleteStep(stepId); flash('Step deleted!'); loadWorkflow() }
    catch { setError('Delete failed') }
  }

  const handleSetStart = async (stepId) => {
    try { await setStartStep(id, stepId); setStartStepId(stepId); flash('Start step set!') }
    catch { setError('Failed to set start step') }
  }

  if (loading) return <div style={{ padding: 40, color: '#999' }}>Loading...</div>

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <button onClick={() => navigate('/')}
          style={{ background: 'none', border: 'none', color: '#4f46e5',
                   cursor: 'pointer', fontSize: '14px' }}>
          ← Back
        </button>
        <h1 className="page-title" style={{ margin: 0 }}>
          {isEdit ? 'Edit Workflow' : 'Create Workflow'}
        </h1>
      </div>

      {error && <div style={{ background: '#fee2e2', color: '#dc2626',
        padding: '10px 14px', borderRadius: '8px', marginBottom: '16px',
        fontSize: '13px' }}>{error}</div>}

      {success && <div style={{ background: '#dcfce7', color: '#15803d',
        padding: '10px 14px', borderRadius: '8px', marginBottom: '16px',
        fontSize: '13px' }}>{success}</div>}

      {/* Workflow details */}
      <div className="card">
        <h2 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>
          Workflow Details
        </h2>
        <div className="form-group">
          <label className="label">Name *</label>
          <input value={name} onChange={e => setName(e.target.value)}
            placeholder="e.g. Expense Approval" />
        </div>
        <div className="form-group">
          <label className="label">Input Schema (JSON)</label>
          <textarea rows={5} value={inputSchema}
            onChange={e => setInputSchema(e.target.value)}
            placeholder={'{\n  "amount": {"type": "number", "required": true}\n}'}
            style={{ resize: 'vertical', fontFamily: 'monospace', fontSize: '12px' }}
          />
        </div>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : isEdit ? 'Update Workflow' : 'Create Workflow'}
        </button>
      </div>

      {/* Steps — only in edit mode */}
      {isEdit && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between',
                        alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: '600', margin: 0 }}>
                Steps ({steps.length})
              </h2>
              {startStepId && (
                <p style={{ fontSize: '11px', color: '#15803d', margin: '4px 0 0' }}>
                  Starts from: <strong>
                    {steps.find(s => s.id === startStepId)?.name || 'Unknown'}
                  </strong>
                </p>
              )}
            </div>
            <button className="btn btn-primary" onClick={openAdd}>+ Add Step</button>
          </div>

          {steps.length === 0 ? (
            <p style={{ color: '#999', textAlign: 'center', padding: '24px' }}>
              No steps yet. Add your first step.
            </p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Assignee</th>
                  <th>Start Step</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {steps.map(step => {
                  let assignee = '—'
                  try {
                    if (step.metadata) {
                      const m = JSON.parse(step.metadata)
                      assignee = m.assignee_email || '—'
                    }
                  } catch {}

                  return (
                    <tr key={step.id}>
                      <td style={{ color: '#999' }}>{step.stepOrder}</td>
                      <td style={{ fontWeight: '500' }}>{step.name}</td>
                      <td>
                        <span style={{
                          background: step.stepType === 'APPROVAL' ? '#dbeafe'
                            : step.stepType === 'NOTIFICATION' ? '#dcfce7' : '#fef3c7',
                          color: step.stepType === 'APPROVAL' ? '#1d4ed8'
                            : step.stepType === 'NOTIFICATION' ? '#15803d' : '#d97706',
                          padding: '2px 8px', borderRadius: '20px',
                          fontSize: '11px', fontWeight: '600'
                        }}>
                          {step.stepType}
                        </span>
                      </td>
                      <td style={{ fontSize: '12px', color: '#666' }}>{assignee}</td>
                      <td>
                        {step.id === startStepId ? (
                          <span style={{ background: '#dcfce7', color: '#15803d',
                            padding: '3px 10px', borderRadius: '20px',
                            fontSize: '11px', fontWeight: '600' }}>
                            Start ✓
                          </span>
                        ) : (
                          <button className="btn" style={{ fontSize: '11px',
                            padding: '3px 10px' }}
                            onClick={() => handleSetStart(step.id)}>
                            Set Start
                          </button>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button className="btn" style={{ fontSize: '12px',
                            padding: '4px 10px' }}
                            onClick={() => openEdit(step)}>Edit</button>
                          <button className="btn" style={{ fontSize: '12px',
                            padding: '4px 10px', background: '#ede9fe',
                            color: '#6d28d9', border: '1px solid #ddd8fe' }}
                            onClick={() => navigate(
                              `/steps/${step.id}/rules?workflowId=${id}`)}>
                            Rules
                          </button>
                          <button className="btn btn-danger" style={{ fontSize: '12px',
                            padding: '4px 10px' }}
                            onClick={() => handleDeleteStep(step.id)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Step form modal */}
      {showStepForm && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.4)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: 'white', borderRadius: '12px',
            padding: '24px', width: '480px', maxWidth: '90vw' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>
              {editingStep ? 'Edit Step' : 'Add Step'}
            </h3>

            <div className="form-group">
              <label className="label">Step Name *</label>
              <input value={stepName} onChange={e => setStepName(e.target.value)}
                placeholder="e.g. Manager Approval" autoFocus />
            </div>
            <div className="form-group">
              <label className="label">Step Type *</label>
              <select value={stepType} onChange={e => setStepType(e.target.value)}>
                {STEP_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="label">Order</label>
              <input type="number" value={stepOrder} min={1} style={{ maxWidth: '100px' }}
                onChange={e => setStepOrder(Number(e.target.value))} />
            </div>
            <div className="form-group">
              <label className="label">Metadata (JSON)</label>
              <textarea rows={3} value={stepMetadata}
                onChange={e => setStepMetadata(e.target.value)}
                placeholder='{"assignee_email": "manager@company.com"}'
                style={{ fontFamily: 'monospace', fontSize: '12px', resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button className="btn"
                onClick={() => { setShowStepForm(false); setError('') }}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleSaveStep}>
                {editingStep ? 'Update' : 'Add Step'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}