import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { RoleRoute, ProtectedRoute } from './components/ProtectedRoute'
import Navbar from './components/Navbar'

import Login            from './pages/Login'
import AdminDashboard   from './pages/admin/AdminDashboard'
import WorkflowEditor   from './pages/admin/WorkflowEditor'
import RuleEditor       from './pages/admin/RuleEditor'
import AuditLog         from './pages/admin/AuditLog'
import UserManager      from './pages/admin/UserManager'
import EmployeeDashboard from './pages/employee/EmployeeDashboard'
import ManagerDashboard from './pages/Manager/ManagerDashboard'
import CeoDashboard     from './pages/ceo/CeoDashboard'

function RoleRedirect() {
  const { user, loading } = useAuth()
  if (loading) return <div style={{ padding: 40 }}>Loading...</div>
  if (!user)   return <Navigate to="/login" replace />

  switch (user.role) {
    case 'ADMIN':    return <Navigate to="/"            replace />
    case 'MANAGER':  return <Navigate to="/manager"     replace />
    case 'CEO':      return <Navigate to="/ceo"         replace />
    case 'EMPLOYEE': return <Navigate to="/executions"  replace />
    default:         return <Navigate to="/login"       replace />
  }
}

function AppRoutes() {
  return (
    <>
      <Navbar />
      <div style={{ padding: '24px', maxWidth: '1100px', margin: '0 auto' }}>
        <Routes>
          {/* public */}
          <Route path="/login"        element={<Login />} />
          <Route path="/unauthorized" element={<div style={{padding:40}}>Access denied.</div>} />

          {/* role redirect */}
          <Route path="/redirect" element={<RoleRedirect />} />

          {/* admin */}
          <Route path="/" element={
            <RoleRoute roles={['ADMIN']}><AdminDashboard /></RoleRoute>
          } />
          <Route path="/workflows/new" element={
            <RoleRoute roles={['ADMIN']}><WorkflowEditor /></RoleRoute>
          } />
          <Route path="/workflows/:id/edit" element={
            <RoleRoute roles={['ADMIN']}><WorkflowEditor /></RoleRoute>
          } />
          <Route path="/steps/:stepId/rules" element={
            <RoleRoute roles={['ADMIN']}><RuleEditor /></RoleRoute>
          } />
          <Route path="/audit" element={
            <RoleRoute roles={['ADMIN', 'CEO']}><AuditLog /></RoleRoute>
          } />
          <Route path="/users" element={
            <RoleRoute roles={['ADMIN']}><UserManager /></RoleRoute>
          } />

          {/* employee */}
          <Route path="/executions" element={
            <RoleRoute roles={['EMPLOYEE']}><EmployeeDashboard /></RoleRoute>
          } />
          <Route path="/workflows/:id/execute" element={
            <ProtectedRoute><EmployeeDashboard /></ProtectedRoute>
          } />

          {/* manager */}
          <Route path="/manager" element={
            <RoleRoute roles={['MANAGER']}><ManagerDashboard /></RoleRoute>
          } />

          {/* ceo */}
          <Route path="/ceo" element={
            <RoleRoute roles={['CEO']}><CeoDashboard /></RoleRoute>
          } />

          {/* fallback */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}