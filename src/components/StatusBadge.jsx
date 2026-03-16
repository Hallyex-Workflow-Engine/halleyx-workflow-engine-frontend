function StatusBadge({ status }) {
  const colors = {
    PENDING:     { bg: '#f3f4f6', color: '#6b7280' },
    IN_PROGRESS: { bg: '#dbeafe', color: '#1d4ed8' },
    COMPLETED:   { bg: '#dcfce7', color: '#15803d' },
    FAILED:      { bg: '#fee2e2', color: '#dc2626' },
    CANCELED:    { bg: '#fef3c7', color: '#d97706' },
    // workflow status
    Active:      { bg: '#dcfce7', color: '#15803d' },
    Inactive:    { bg: '#f3f4f6', color: '#6b7280' },
  }

  const style = colors[status] || { bg: '#f3f4f6', color: '#6b7280' }

  return (
    <span style={{
      background: style.bg,
      color: style.color,
      padding: '3px 10px',
      borderRadius: '20px',
      fontSize: '11px',
      fontWeight: '600'
    }}>
      {status}
    </span>
  )
}

export default StatusBadge