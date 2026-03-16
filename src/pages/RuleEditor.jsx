import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getRulesByStep, addRule, updateRule, deleteRule } from '../api/ruleApi'
import { getStepsByWorkflow } from '../api/stepApi'
import LoadingSpinner from '../components/LoadingSpinner'

function RuleEditor() {
  const { stepId } = useParams()
  const navigate   = useNavigate()

  const [rules, setRules]         = useState([])
  const [allSteps, setAllSteps]   = useState([])  // all steps for dropdown
  const [workflowId, setWorkflowId] = useState('')
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState('')
  const [currentStepName, setCurrentStepName] = useState('')

  // rule form
  const [showForm, setShowForm]       = useState(false)
  const [editingRule, setEditingRule] = useState(null)
  const [condition, setCondition]     = useState('')
  const [nextStepId, setNextStepId]   = useState('')
  const [priority, setPriority]       = useState(1)

  useEffect(() => {
    loadData()
  }, [stepId])

  const loadData = async () => {
    try {
      setLoading(true)

      // get rules for this step
      const rulesRes = await getRulesByStep(stepId)
      setRules(rulesRes.data || [])

      // get workflowId from the first rule OR from URL state
      // we need to load all steps for the dropdown
      // get workflowId by fetching step info from rules response
      // simplest: store workflowId in URL as query param
      const params = new URLSearchParams(window.location.search)
      const wfId   = params.get('workflowId')

      if (wfId) {
        setWorkflowId(wfId)
        const stepsRes = await getStepsByWorkflow(wfId)
        const steps    = stepsRes.data || []
        setAllSteps(steps)

        // find current step name
        const current = steps.find(s => s.id === stepId)
        if (current) setCurrentStepName(current.name)
      }

    } catch (err) {
      setError('Failed to load rules')
    } finally {
      setLoading(false)
    }
  }

  const openAddRule = () => {
    setEditingRule(null)
    setCondition('')
    setNextStepId('')
    setPriority(rules.length + 1)
    setShowForm(true)
  }

  const openEditRule = (rule) => {
    setEditingRule(rule)
    setCondition(rule.conditionExpr)
    setNextStepId(rule.nextStepId || '')
    setPriority(rule.priority)
    setShowForm(true)
  }

  const handleSaveRule = async () => {
  if (!condition.trim()) { setError('Condition is required'); return }
  setError('')
  const data = {
    conditionExpr: condition,
    nextStepId:    nextStepId || null,
    priority:      Number(priority)
  }
  try {
    if (editingRule) {
      await updateRule(editingRule.id, data)
    } else {
      await addRule(stepId, data)
    }
    setShowForm(false)
    loadData()
  } catch (err) {
    // show real error
    console.error('Rule save error:', err)
    const msg = err.response?.data?.message
             || err.response?.data
             || err.message
             || 'Failed to save rule'
    setError(String(msg))
  }
}

  const handleDelete = async (ruleId) => {
    if (!window.confirm('Delete this rule?')) return
    try {
      await deleteRule(ruleId)
      loadData()
    } catch (err) {
      setError('Delete failed')
    }
  }

  // find step name from UUID — for display in table
  const getStepName = (stepId) => {
    if (!stepId) return <span style={{ color: '#22c55e', fontWeight: '500' }}>END (workflow completes)</span>
    const step = allSteps.find(s => s.id === stepId)
    return step ? step.name : stepId.substring(0, 8) + '...'
  }

  if (loading) return <LoadingSpinner />

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center',
                    gap: '12px', marginBottom: '24px' }}>
        <button
          onClick={() => navigate(-1)}
          style={{ background: 'none', border: 'none',
                   color: '#4f46e5', cursor: 'pointer', fontSize: '14px' }}
        >
          ← Back
        </button>
        <h1 className="page-title" style={{ margin: 0 }}>
          Rules for: {currentStepName || 'Step'}
        </h1>
      </div>

      {error && (
        <div style={{ background: '#fee2e2', color: '#dc2626',
                      padding: '10px 14px', borderRadius: '8px',
                      marginBottom: '16px', fontSize: '13px' }}>
          {error}
        </div>
      )}

      <div style={{ background: '#ede9fe', borderRadius: '8px',
                    padding: '12px 16px', marginBottom: '16px',
                    fontSize: '12px', color: '#5b21b6' }}>
        Rules are evaluated in priority order. Lower number = checked first.
        Always add a DEFAULT rule as the last rule.
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between',
                      alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '600', margin: 0 }}>
            Rules ({rules.length})
          </h2>
          <button
            onClick={openAddRule}
            style={{ background: '#4f46e5', color: 'white', border: 'none',
                     padding: '8px 16px', borderRadius: '8px',
                     fontSize: '13px', cursor: 'pointer' }}
          >
            + Add Rule
          </button>
        </div>

        {rules.length === 0 ? (
          <p style={{ color: '#999', textAlign: 'center', padding: '24px' }}>
            No rules yet. Add your first rule.
          </p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Priority</th>
                <th>Condition</th>
                <th>Next Step</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rules.map((rule) => (
                <tr key={rule.id}>
                  <td>
                    <span style={{ background: '#ede9fe', color: '#5b21b6',
                                   padding: '2px 8px', borderRadius: '20px',
                                   fontSize: '12px', fontWeight: '600' }}>
                      {rule.priority}
                    </span>
                  </td>
                  <td>
                    <code style={{ background: '#f5f5f5', padding: '4px 8px',
                                   borderRadius: '4px', fontSize: '12px' }}>
                      {rule.conditionExpr}
                    </code>
                  </td>
                  <td style={{ fontSize: '13px' }}>
                    {getStepName(rule.nextStepId)}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        onClick={() => openEditRule(rule)}
                        style={{ fontSize: '12px', padding: '4px 10px',
                                 borderRadius: '6px', cursor: 'pointer' }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(rule.id)}
                        style={{ fontSize: '12px', padding: '4px 10px',
                                 borderRadius: '6px', background: '#ef4444',
                                 color: 'white', border: 'none', cursor: 'pointer' }}
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

      {/* Rule form modal */}
      {showForm && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.4)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 100
        }}>
          <div style={{
            background: 'white', borderRadius: '12px',
            padding: '24px', width: '520px', maxWidth: '90vw'
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600',
                         marginBottom: '16px' }}>
              {editingRule ? 'Edit Rule' : 'Add Rule'}
            </h3>

            <div className="form-group">
              <label className="label">Priority *</label>
              <input
                type="number"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                min={1}
                style={{ maxWidth: '100px' }}
              />
              <p style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>
                Lower number = evaluated first
              </p>
            </div>

            <div className="form-group">
              <label className="label">Condition *</label>
              <input
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                placeholder="e.g. amount > 100 && country == 'US'  OR  DEFAULT"
                style={{ fontFamily: 'monospace', fontSize: '13px' }}
              />
              <p style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>
                Use DEFAULT as the last rule to catch everything else
              </p>
            </div>

            <div className="form-group">
              <label className="label">Next Step</label>

              {/* DROPDOWN instead of raw UUID input */}
              <select
                value={nextStepId}
                onChange={(e) => setNextStepId(e.target.value)}
              >
                <option value="">— END workflow (no next step) —</option>
                {allSteps
                  .filter(s => s.id !== stepId) // exclude current step
                  .map(s => (
                    <option key={s.id} value={s.id}>
                      {s.stepOrder}. {s.name} ({s.stepType})
                    </option>
                  ))
                }
              </select>

              <p style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>
                Select END if this rule should complete the workflow
              </p>
            </div>

            <div style={{ display: 'flex', gap: '8px',
                          justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowForm(false)}
                style={{ padding: '8px 16px', borderRadius: '8px',
                         cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveRule}
                style={{ background: '#4f46e5', color: 'white', border: 'none',
                         padding: '8px 20px', borderRadius: '8px',
                         fontWeight: '500', cursor: 'pointer' }}
              >
                {editingRule ? 'Update Rule' : 'Add Rule'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default RuleEditor