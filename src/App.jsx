import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import WorkflowList from './pages/WorkflowList'
import WorkflowEditor from './pages/WorkflowEditor'
import RuleEditor from './pages/RuleEditor'
import ExecutionPage from './pages/ExecutionPage'
import AuditLog from './pages/AuditLog'

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <div style={{ padding: '24px', maxWidth: '1100px', margin: '0 auto' }}>
        <Routes>
          <Route path="/"                          element={<WorkflowList />} />
          <Route path="/workflows/new"             element={<WorkflowEditor />} />
          <Route path="/workflows/:id/edit"        element={<WorkflowEditor />} />
          <Route path="/steps/:stepId/rules"       element={<RuleEditor />} />
          <Route path="/workflows/:id/execute"     element={<ExecutionPage />} />
          <Route path="/audit"                     element={<AuditLog />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App