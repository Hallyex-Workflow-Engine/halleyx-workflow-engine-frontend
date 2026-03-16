import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  getWorkflowById, createWorkflow,
  updateWorkflow, setStartStep
} from '../api/workflowApi'
import {
  getStepsByWorkflow, addStep,
  updateStep, deleteStep
} from '../api/stepApi'
import LoadingSpinner from '../components/LoadingSpinner'

const STEP_TYPES = ['APPROVAL', 'NOTIFICATION', 'TASK']

function WorkflowEditor() {
  const { id }   = useParams()
  const navigate = useNavigate()
  const isEdit   = Boolean(id)

  const [loading, setLoading]     = useState(isEdit)
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState('')
  const [success, setSuccess]     = useState('')

  // workflow fields
  const [name, setName]               = useState('')
  const [inputSchema, setInputSchema] = useState('')
  const [startStepId, setStartStepId] = useState('')  // tracks current start step

  // steps
  const [steps, setSteps] = useState([])

  // step form state
  const [showStepForm, setShowStepForm]   = useState(false)
  const [editingStep, setEditingStep]     = useState(null)
  const [stepName, setStepName]           = useState('')
  const [stepType, setStepType]           = useState('APPROVAL')
  const [stepOrder, setStepOrder]         = useState(1)
  const [stepMetadata, setStepMetadata]   = useState('')

  useEffect(() => {
    if (isEdit) loadWorkflow()
  }, [id])

  const loadWorkflow = async () => {
    try {
      const [wfRes, stepsRes] = await Promise.all([
        getWorkflowById(id),
        getStepsByWorkflow(id)
      ])
      const wf = wfRes.data
      setName(wf.name || '')
      setInputSchema(wf.inputSchema || '')
      setStartStepId(wf.startStepId || '')   // store start step id
      setSteps(stepsRes.data || [])
    } catch (err) {
      setError('Failed to load workflow. Make sure Spring Boot is running.')
    } finally {
      setLoading(false)
    }
  }

  const showSuccess = (msg) => {
    setSuccess(msg)
    setTimeout(() => setSuccess(''), 3000)
  }

  // ─── WORKFLOW ────────────────────────────────────────────────
  const handleSaveWorkflow = async () => {
    if (!name.trim()) { setError('Workflow name is required'); return }
    setSaving(true)
    setError('')
    try {
      if (isEdit) {
        await updateWorkflow(id, { name, inputSchema })
        showSuccess('Workflow updated successfully!')
      } else {
        const res = await createWorkflow({ name, inputSchema })
        navigate(`/workflows/${res.data.id}/edit`)
        return
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save workflow')
    } finally {
      setSaving(false)
    }
  }

  // ─── STEP FORM ───────────────────────────────────────────────
  const openAddStep = () => {
    setEditingStep(null)
    setStepName('')
    setStepType('APPROVAL')
    setStepOrder(steps.length + 1)
    setStepMetadata('')
    setError('')
    setShowStepForm(true)
  }

  const openEditStep = (step) => {
    setEditingStep(step)
    setStepName(step.name)
    setStepType(step.stepType)
    setStepOrder(step.stepOrder)
    setStepMetadata(step.metadata || '')
    setError('')
    setShowStepForm(true)
  }

  const handleSaveStep = async () => {
    if (!stepName.trim()) { setError('Step name is required'); return }
    setError('')
    try {
      const data = {
        name:      stepName,
        stepType:  stepType,
        stepOrder: stepOrder,
        metadata:  stepMetadata
      }
      if (editingStep) {
        await updateStep(editingStep.id, data)
        showSuccess('Step updated!')
      } else {
        await addStep(id, data)
        showSuccess('Step added!')
      }
      setShowStepForm(false)
      loadWorkflow()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save step')
    }
  }

  const handleDeleteStep = async (stepId) => {
    if (!window.confirm('Delete this step and all its rules?')) return
    setError('')
    try {
      await deleteStep(stepId)
      showSuccess('Step deleted!')
      loadWorkflow()
    } catch (err) {
      setError('Failed to delete step')
    }
  }

  const handleSetStartStep = async (stepId) => {
    setError('')
    try {
      await setStartStep(id, stepId)
      setStartStepId(stepId)   // update local state immediately
      showSuccess('Start step updated!')
      loadWorkflow()
    } catch (err) {
      setError('Failed to set start step')
    }
  }

  if (loading) return <LoadingSpinner />

  return (
    <div>

      {/* Header */}
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
          {isEdit ? `Edit Workflow` : 'Create Workflow'}
        </h1>
      </div>

      {/* Error */}
      {error && (
        <div style={{ background: '#fee2e2', color: '#dc2626',
                      padding: '10px 14px', borderRadius: '8px',
                      marginBottom: '16px', fontSize: '13px' }}>
          {error}
        </div>
      )}

      {/* Success */}
      {success && (
        <div style={{ background: '#dcfce7', color: '#15803d',
                      padding: '10px 14px', borderRadius: '8px',
                      marginBottom: '16px', fontSize: '13px' }}>
          {success}
        </div>
      )}

      {/* Workflow Details Card */}
      <div className="card">
        <h2 style={{ fontSize: '16px', fontWeight: '600',
                     marginBottom: '16px' }}>
          Workflow Details
        </h2>

        <div className="form-group">
          <label className="label">Workflow Name *</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Expense Approval"
          />
        </div>

        <div className="form-group">
          <label className="label">Input Schema (JSON)</label>
          <textarea
            rows={5}
            value={inputSchema}
            onChange={(e) => setInputSchema(e.target.value)}
            placeholder={'{\n  "amount": {"type": "number", "required": true},\n  "country": {"type": "string", "required": true},\n  "priority": {"type": "string", "required": true, "allowed_values": ["High","Medium","Low"]}\n}'}
            style={{ resize: 'vertical', fontFamily: 'monospace',
                     fontSize: '12px', padding: '8px 12px',
                     border: '1px solid #ddd', borderRadius: '6px',
                     width: '100%' }}
          />
          <p style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>
            Define what input fields this workflow needs when executed
          </p>
        </div>

        <button
          onClick={handleSaveWorkflow}
          disabled={saving}
          style={{ background: '#4f46e5', color: 'white', border: 'none',
                   padding: '10px 24px', borderRadius: '8px',
                   fontWeight: '500', cursor: 'pointer', fontSize: '14px' }}
        >
          {saving ? 'Saving...' : isEdit ? 'Update Workflow' : 'Create Workflow'}
        </button>
      </div>

      {/* Steps Card — only after workflow created */}
      {isEdit && (
        <div className="card">

          {/* Steps Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between',
                        alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: '600', margin: 0 }}>
                Steps ({steps.length})
              </h2>
              {startStepId && (
                <p style={{ fontSize: '11px', color: '#15803d',
                            margin: '4px 0 0' }}>
                  Execution starts from:{' '}
                  <strong>
                    {steps.find(s => s.id === startStepId)?.name || 'Unknown'}
                  </strong>
                </p>
              )}
            </div>
            <button
              onClick={openAddStep}
              style={{ background: '#4f46e5', color: 'white', border: 'none',
                       padding: '8px 16px', borderRadius: '8px',
                       fontSize: '13px', cursor: 'pointer' }}
            >
              + Add Step
            </button>
          </div>

          {steps.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px',
                          color: '#999' }}>
              <p style={{ margin: '0 0 8px' }}>No steps yet.</p>
              <p style={{ margin: 0, fontSize: '12px' }}>
                Add your first step. The first step added will automatically
                become the start step.
              </p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Start Step</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {steps.map((step) => (
                  <tr key={step.id}>

                    {/* Order */}
                    <td style={{ color: '#999', fontSize: '13px' }}>
                      {step.stepOrder}
                    </td>

                    {/* Name */}
                    <td style={{ fontWeight: '500' }}>{step.name}</td>

                    {/* Type badge */}
                    <td>
                      <span style={{
                        background:
                          step.stepType === 'APPROVAL'   ? '#dbeafe' :
                          step.stepType === 'NOTIFICATION' ? '#dcfce7' : '#fef3c7',
                        color:
                          step.stepType === 'APPROVAL'   ? '#1d4ed8' :
                          step.stepType === 'NOTIFICATION' ? '#15803d' : '#d97706',
                        padding: '2px 8px', borderRadius: '20px',
                        fontSize: '11px', fontWeight: '600'
                      }}>
                        {step.stepType}
                      </span>
                    </td>

                    {/* Start Step — show badge if current, button if not */}
                    <td>
                      {step.id === startStepId ? (
                        <span style={{
                          background: '#dcfce7', color: '#15803d',
                          padding: '3px 10px', borderRadius: '20px',
                          fontSize: '11px', fontWeight: '600'
                        }}>
                          Current Start ✓
                        </span>
                      ) : (
                        <button
                          onClick={() => handleSetStartStep(step.id)}
                          style={{
                            fontSize: '11px', padding: '3px 10px',
                            borderRadius: '6px', cursor: 'pointer',
                            background: '#f0fdf4', color: '#15803d',
                            border: '1px solid #bbf7d0'
                          }}
                        >
                          Set as Start
                        </button>
                      )}
                    </td>

                    {/* Action buttons */}
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          onClick={() => openEditStep(step)}
                          style={{ fontSize: '12px', padding: '4px 10px',
                                   borderRadius: '6px', cursor: 'pointer' }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => navigate(
                            `/steps/${step.id}/rules?workflowId=${id}`
                          )}
                          style={{ fontSize: '12px', padding: '4px 10px',
                                   borderRadius: '6px', cursor: 'pointer',
                                   background: '#ede9fe', color: '#6d28d9',
                                   border: '1px solid #ddd8fe' }}
                        >
                          Rules
                        </button>
                        <button
                          onClick={() => handleDeleteStep(step.id)}
                          style={{ fontSize: '12px', padding: '4px 10px',
                                   borderRadius: '6px', background: '#ef4444',
                                   color: 'white', border: 'none',
                                   cursor: 'pointer' }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Step Form Modal */}
      {showStepForm && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.45)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 100
        }}>
          <div style={{
            background: 'white', borderRadius: '12px',
            padding: '24px', width: '480px', maxWidth: '90vw',
            boxShadow: '0 4px 24px rgba(0,0,0,0.12)'
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600',
                         marginBottom: '16px' }}>
              {editingStep ? 'Edit Step' : 'Add Step'}
            </h3>

            <div className="form-group">
              <label className="label">Step Name *</label>
              <input
                value={stepName}
                onChange={(e) => setStepName(e.target.value)}
                placeholder="e.g. Manager Approval"
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="label">Step Type *</label>
              <select
                value={stepType}
                onChange={(e) => setStepType(e.target.value)}
              >
                {STEP_TYPES.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <p style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>
                APPROVAL = waits for human click &nbsp;|&nbsp;
                NOTIFICATION = auto sends &nbsp;|&nbsp;
                TASK = auto runs
              </p>
            </div>

            <div className="form-group">
              <label className="label">Order</label>
              <input
                type="number"
                value={stepOrder}
                onChange={(e) => setStepOrder(Number(e.target.value))}
                min={1}
                style={{ maxWidth: '100px' }}
              />
            </div>

            <div className="form-group">
              <label className="label">Metadata (JSON — optional)</label>
              <textarea
                rows={3}
                value={stepMetadata}
                onChange={(e) => setStepMetadata(e.target.value)}
                placeholder='{"assignee_email": "manager@company.com"}'
                style={{ resize: 'vertical', fontFamily: 'monospace',
                         fontSize: '12px', padding: '8px 12px',
                         border: '1px solid #ddd', borderRadius: '6px',
                         width: '100%' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '8px',
                          justifyContent: 'flex-end', marginTop: '8px' }}>
              <button
                onClick={() => { setShowStepForm(false); setError('') }}
                style={{ padding: '8px 16px', borderRadius: '8px',
                         cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveStep}
                style={{ background: '#4f46e5', color: 'white', border: 'none',
                         padding: '8px 20px', borderRadius: '8px',
                         fontWeight: '500', cursor: 'pointer' }}
              >
                {editingStep ? 'Update Step' : 'Add Step'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default WorkflowEditor