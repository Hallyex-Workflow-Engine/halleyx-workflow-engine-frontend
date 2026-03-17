import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { login }  = useAuth()
  const navigate   = useNavigate()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  const ROLE_ROUTES = {
    ADMIN:    '/',
    MANAGER:  '/manager',
    CEO:      '/ceo',
    EMPLOYEE: '/executions'
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const user = await login(email, password)
      navigate(ROLE_ROUTES[user.role] || '/login')
    } catch {
      setError('Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      background: '#f5f5f5'
    }}>
      <div className="card" style={{ width: '380px', padding: '32px' }}>

        <div style={{ marginBottom: '28px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#111' }}>
            Workflow Engine
          </h2>
          <p style={{ fontSize: '13px', color: '#999', marginTop: '4px' }}>
            Sign in to your account
          </p>
        </div>

        {error && (
          <div style={{
            background: '#fee2e2', color: '#dc2626',
            padding: '10px 14px', borderRadius: '8px',
            marginBottom: '16px', fontSize: '13px'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="label">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@company.com"
              required
            />
          </div>
          <div className="form-group">
            <label className="label">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', background: '#4f46e5', color: 'white',
              border: 'none', padding: '10px', borderRadius: '8px',
              fontWeight: '500', fontSize: '14px', cursor: 'pointer',
              marginTop: '8px', opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

      </div>
    </div>
  )
}