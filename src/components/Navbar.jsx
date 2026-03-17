import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const ROLE_COLORS = {
  ADMIN:    { bg: '#ede9fe', color: '#5b21b6' },
  MANAGER:  { bg: '#fef3c7', color: '#d97706' },
  CEO:      { bg: '#fee2e2', color: '#dc2626' },
  EMPLOYEE: { bg: '#dbeafe', color: '#1d4ed8' },
}

export default function Navbar() {
  const { user, logout } = useAuth()
  const location         = useLocation()
  const navigate         = useNavigate()

  if (location.pathname === '/login') return null

  const link = (path, label) => (
    <Link to={path} style={{
      textDecoration: 'none', fontSize: '14px', fontWeight: '500',
      color: location.pathname.startsWith(path) ? '#4f46e5' : '#555',
      borderBottom: location.pathname.startsWith(path)
        ? '2px solid #4f46e5' : '2px solid transparent',
      paddingBottom: '4px'
    }}>
      {label}
    </Link>
  )

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const roleStyle = ROLE_COLORS[user?.role] || ROLE_COLORS.EMPLOYEE

  return (
    <nav style={{
      background: 'white', borderBottom: '1px solid #e5e5e5',
      padding: '0 24px', display: 'flex', alignItems: 'center',
      justifyContent: 'space-between', height: '56px'
    }}>
      {/* left — logo + links */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '28px' }}>
        <span style={{ fontWeight: '700', fontSize: '16px', color: '#111' }}>
          Workflow Engine
        </span>

        {user?.role === 'ADMIN' && <>
          {link('/', 'Workflows')}
          {link('/audit', 'Audit Log')}
          {link('/users', 'Users')}
        </>}

        {user?.role === 'MANAGER' && <>
          {link('/manager', 'My Approvals')}
        </>}

        {user?.role === 'CEO' && <>
          {link('/ceo', 'Dashboard')}
        </>}

        {user?.role === 'EMPLOYEE' && <>
          {link('/executions', 'My Executions')}
        </>}
      </div>

      {/* right — user info + logout */}
      {user && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '13px', color: '#666' }}>{user.name}</span>
          <span style={{
            ...roleStyle, padding: '2px 8px',
            borderRadius: '20px', fontSize: '11px', fontWeight: '600'
          }}>
            {user.role}
          </span>
          <button onClick={handleLogout} style={{
            fontSize: '12px', padding: '4px 12px',
            borderRadius: '6px', cursor: 'pointer',
            border: '1px solid #ddd', background: 'white'
          }}>
            Logout
          </button>
        </div>
      )}
    </nav>
  )
}