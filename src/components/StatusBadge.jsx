export default function StatusBadge({ status }) {
  const map = {
    PENDING:      { bg: '#f3f4f6', color: '#6b7280' },
    IN_PROGRESS:  { bg: '#dbeafe', color: '#1d4ed8' },
    COMPLETED:    { bg: '#dcfce7', color: '#15803d' },
    FAILED:       { bg: '#fee2e2', color: '#dc2626' },
    CANCELED:     { bg: '#fef3c7', color: '#d97706' },
    Active:       { bg: '#dcfce7', color: '#15803d' },
    Inactive:     { bg: '#f3f4f6', color: '#6b7280' },
  }
  const s = map[status] || { bg: '#f3f4f6', color: '#6b7280' }
  return (
    <span style={{
      background: s.bg, color: s.color,
      padding: '3px 10px', borderRadius: '20px',
      fontSize: '11px', fontWeight: '600'
    }}>
      {status}
    </span>
  )
}