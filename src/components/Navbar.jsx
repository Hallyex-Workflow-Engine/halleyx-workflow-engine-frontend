import { Link, useLocation } from 'react-router-dom'

function Navbar() {
  const location = useLocation()

  const navStyle = {
    background: 'white',
    borderBottom: '1px solid #e5e5e5',
    padding: '0 24px',
    display: 'flex',
    alignItems: 'center',
    gap: '32px',
    height: '56px'
  }

  const linkStyle = (path) => ({
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: '500',
    color: location.pathname === path ? '#4f46e5' : '#555',
    borderBottom: location.pathname === path ? '2px solid #4f46e5' : '2px solid transparent',
    paddingBottom: '4px'
  })

  return (
    <nav style={navStyle}>
      <span style={{ fontWeight: '700', fontSize: '16px', color: '#111' }}>
        Workflow Engine
      </span>
      <Link to="/"       style={linkStyle('/')}>Workflows</Link>
      <Link to="/audit"  style={linkStyle('/audit')}>Audit Log</Link>
    </nav>
  )
}

export default Navbar