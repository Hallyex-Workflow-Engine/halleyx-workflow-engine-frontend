function LoadingSpinner() {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '48px'
    }}>
      <div style={{
        width: '32px',
        height: '32px',
        border: '3px solid #e5e5e5',
        borderTop: '3px solid #4f46e5',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite'
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

export default LoadingSpinner