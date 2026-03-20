import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useState } from 'react'

const ROLE_COLORS = {
  ADMIN:    { bg: '#ede9fe', color: '#5b21b6' },
  MANAGER:  { bg: '#fef3c7', color: '#d97706' },
  CEO:      { bg: '#fee2e2', color: '#dc2626' },
  EMPLOYEE: { bg: '#dbeafe', color: '#1d4ed8' },
}

const ROLE_ICONS = {
  ADMIN:    '👤',
  MANAGER:  '👤',
  CEO:      '👤',
  EMPLOYEE: '👤',
}

export default function Navbar() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const [open, setOpen] = useState(false)

  if (location.pathname === '/login') return null

  const link = (path, label) => (
    <Link to={path} style={{
      textDecoration: 'none',
      fontSize: '14px',
      fontWeight: '500',
      color: location.pathname.startsWith(path) ? '#4f46e5' : '#555',
      borderBottom: location.pathname.startsWith(path)
        ? '2px solid #4f46e5'
        : '2px solid transparent',
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
      background: 'white',
      borderBottom: '1px solid #e5e5e5',
      padding: '0 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      height: '60px',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>

      {/* LEFT SIDE */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '30px' }}>
        <span style={{
          fontWeight: '700',
          fontSize: '18px',
          color: '#111'
        }}>
          ⚡ Workflow Engine
        </span>

        {user?.role === 'ADMIN' && (
          <>
            {link('/', 'Workflows')}
            {link('/audit', 'Audit')}
            {link('/users', 'Users')}
          </>
        )}

        {user?.role === 'MANAGER' && (
          <>
            {link('/manager', 'Approvals')}
          </>
        )}

        {user?.role === 'CEO' && (
          <>
            {link('/ceo', 'Dashboard')}
            {link('/audit', 'Audit')}
          </>
        )}

        {user?.role === 'EMPLOYEE' && (
          <>
            {link('/executions', 'My Executions')}
          </>
        )}
      </div>

      {/* RIGHT SIDE */}
      {user && (
        <div style={{ position: 'relative' }}>

          {/* PROFILE BUTTON */}
          <div
            onClick={() => setOpen(!open)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              cursor: 'pointer'
            }}
          >
            {/* Avatar */}
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              background: roleStyle.bg,
              color: roleStyle.color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px',
              fontWeight: '600'
            }}>
              {ROLE_ICONS[user.role] || '👤'}
            </div>

            {/* Name */}
            <span style={{
              fontSize: '13px',
              fontWeight: '500',
              color: '#333'
            }}>
              {user.name}
            </span>
          </div>

          {/* DROPDOWN */}
          {open && (
            <div style={{
              position: 'absolute',
              right: 0,
              top: '50px',
              background: 'white',
              border: '1px solid #e5e5e5',
              borderRadius: '10px',
              width: '180px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.08)',
              overflow: 'hidden'
            }}>

              <div style={{
                padding: '12px',
                borderBottom: '1px solid #f3f4f6'
              }}>
                <div style={{ fontSize: '13px', fontWeight: '600' }}>
                  {user.name}
                </div>
                <div style={{
                  fontSize: '11px',
                  color: roleStyle.color,
                  marginTop: '2px'
                }}>
                  {user.role}
                </div>
              </div>

              <div
                onClick={() => {
                  navigate('/profile')
                  setOpen(false)
                }}
                style={menuItem}
              >
                👤 My Profile
              </div>

              <div
                onClick={handleLogout}
                style={{ ...menuItem, color: '#dc2626' }}
              >
                🚪 Logout
              </div>

            </div>
          )}
        </div>
      )}
    </nav>
  )
}

const menuItem = {
  padding: '10px 14px',
  fontSize: '13px',
  cursor: 'pointer',
  borderBottom: '1px solid #f3f4f6'
}