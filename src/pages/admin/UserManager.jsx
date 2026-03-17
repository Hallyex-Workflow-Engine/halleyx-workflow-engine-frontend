import { useEffect, useState } from 'react'
import { getAllUsers, createUser, deleteUser, updateRole } from '../../api/userApi'

const ROLES = ['ADMIN', 'MANAGER', 'CEO', 'EMPLOYEE']

export default function UserManager() {
  const [users, setUsers]     = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')
  const [showForm, setShowForm] = useState(false)

  const [name, setName]         = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole]         = useState('EMPLOYEE')

  useEffect(() => { loadUsers() }, [])

  const loadUsers = async () => {
    try {
      const res = await getAllUsers()
      setUsers(res.data || [])
    } catch { setError('Failed to load users') }
    finally  { setLoading(false) }
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    try {
      await createUser({ name, email, password, role })
      setShowForm(false)
      setName(''); setEmail(''); setPassword(''); setRole('EMPLOYEE')
      loadUsers()
    } catch { setError('Failed to create user') }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this user?')) return
    try { await deleteUser(id); loadUsers() }
    catch { setError('Delete failed') }
  }

  const handleRoleChange = async (id, newRole) => {
    try { await updateRole(id, newRole); loadUsers() }
    catch { setError('Role update failed') }
  }

  if (loading) return <div style={{ padding: 40, color: '#999' }}>Loading...</div>

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', marginBottom: '20px' }}>
        <h1 className="page-title" style={{ margin: 0 }}>Users</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          + Add User
        </button>
      </div>

      {error && (
        <div style={{ background: '#fee2e2', color: '#dc2626',
                      padding: '10px 14px', borderRadius: '8px',
                      marginBottom: '16px', fontSize: '13px' }}>
          {error}
        </div>
      )}

      {showForm && (
        <div className="card" style={{ marginBottom: '20px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '16px' }}>
            Create New User
          </h3>
          <form onSubmit={handleCreate}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="label">Name</label>
                <input value={name} onChange={e => setName(e.target.value)}
                  placeholder="Full name" required />
              </div>
              <div className="form-group">
                <label className="label">Email</label>
                <input type="email" value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="email@company.com" required />
              </div>
              <div className="form-group">
                <label className="label">Password</label>
                <input type="password" value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Password" required />
              </div>
              <div className="form-group">
                <label className="label">Role</label>
                <select value={role} onChange={e => setRole(e.target.value)}>
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              <button type="submit" className="btn btn-primary">Create</button>
              <button type="button" className="btn"
                onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td style={{ fontWeight: '500' }}>{u.name}</td>
                <td style={{ color: '#666' }}>{u.email}</td>
                <td>
                  <select
                    value={u.role}
                    onChange={e => handleRoleChange(u.id, e.target.value)}
                    style={{ width: 'auto', padding: '4px 8px', fontSize: '12px' }}
                  >
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </td>
                <td>
                  <button className="btn btn-danger"
                    style={{ fontSize: '12px', padding: '4px 10px' }}
                    onClick={() => handleDelete(u.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}