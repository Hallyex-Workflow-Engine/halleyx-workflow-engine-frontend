import { useEffect, useState, useCallback } from 'react'
import axios from 'axios'

/* ─────────────────────────────────────────────
   HTTP client — matches authApi.jsx setup
───────────────────────────────────────────── */
const http = axios.create({
  baseURL: 'http://localhost:8080',
  withCredentials: true,
})

const ROLES = ['ADMIN', 'MANAGER', 'CEO', 'EMPLOYEE']

const ROLE_STYLE = {
  ADMIN:    { bg: '#18181b', color: '#fff' },
  MANAGER:  { bg: '#1d4ed8', color: '#fff' },
  CEO:      { bg: '#7c3aed', color: '#fff' },
  EMPLOYEE: { bg: '#f3f4f6', color: '#374151' },
}

/* ─────────────────────────────────────────────
   Primitives
───────────────────────────────────────────── */
function Spinner({ size = 18, color = '#111' }) {
  return (
    <span style={{
      display: 'inline-block', width: size, height: size,
      border: `2px solid #e5e7eb`, borderTopColor: color,
      borderRadius: '50%', animation: 'spin .65s linear infinite', flexShrink: 0,
    }} />
  )
}

function Avatar({ name, url, size = 34 }) {
  const [broken, setBroken] = useState(false)
  const letters = (name || '?').split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
  if (url && !broken) {
    return <img src={url} alt={name} onError={() => setBroken(true)}
      style={{ width: size, height: size, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: 8, background: '#18181b',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#fff', fontSize: size * 0.35, fontWeight: 700, flexShrink: 0, letterSpacing: .5,
    }}>{letters}</div>
  )
}

function Badge({ role }) {
  const st = ROLE_STYLE[role] || ROLE_STYLE.EMPLOYEE
  return (
    <span style={{
      display: 'inline-block', padding: '2px 10px', borderRadius: 20,
      fontSize: 11, fontWeight: 700, letterSpacing: '.05em',
      textTransform: 'uppercase', background: st.bg, color: st.color,
    }}>{role}</span>
  )
}

function IconBtn({ title, onClick, children, danger }) {
  const [hover, setHover] = useState(false)
  return (
    <button
      title={title}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: 32, height: 32, borderRadius: 7, border: 'none', cursor: 'pointer',
        background: hover ? (danger ? '#fef2f2' : '#f3f4f6') : 'transparent',
        color: hover ? (danger ? '#ef4444' : '#111') : '#9ca3af',
        transition: 'background .15s, color .15s', fontSize: 15,
      }}
    >{children}</button>
  )
}

function Btn({ variant = 'solid', loading, size = 'md', children, ...props }) {
  const base = variant === 'ghost'
    ? { background: '#fff', color: '#374151', border: '1px solid #e5e7eb' }
    : variant === 'danger'
    ? { background: '#ef4444', color: '#fff', border: 'none' }
    : { background: '#18181b', color: '#fff', border: 'none' }
  const pad = size === 'sm' ? '6px 14px' : '9px 20px'
  return (
    <button
      disabled={loading || props.disabled}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: pad, borderRadius: 8, fontSize: 13, fontWeight: 600,
        cursor: 'pointer', fontFamily: 'inherit',
        opacity: (loading || props.disabled) ? 0.55 : 1,
        transition: 'opacity .15s', ...base,
      }}
      {...props}
    >
      {loading ? <Spinner size={13} color={variant === 'ghost' ? '#374151' : '#fff'} /> : children}
    </button>
  )
}

/* ─────────────────────────────────────────────
   Toast
───────────────────────────────────────────── */
function Toast({ msg, ok, onGone }) {
  useEffect(() => { const t = setTimeout(onGone, 3200); return () => clearTimeout(t) }, [onGone])
  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
      background: ok ? '#18181b' : '#ef4444', color: '#fff',
      padding: '10px 18px', borderRadius: 10, fontSize: 13, fontWeight: 500,
      boxShadow: '0 8px 30px rgba(0,0,0,.18)', animation: 'fadeUp .2s ease',
      display: 'flex', alignItems: 'center', gap: 8,
    }}>
      {ok ? '✓' : '✕'} {msg}
    </div>
  )
}

/* ─────────────────────────────────────────────
   Modal
───────────────────────────────────────────── */
function Modal({ title, subtitle, onClose, children, width = 460 }) {
  useEffect(() => {
    const fn = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [onClose])

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,.4)', backdropFilter: 'blur(3px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: '#fff', borderRadius: 16, width: '100%', maxWidth: width,
        boxShadow: '0 24px 60px rgba(0,0,0,.16)', animation: 'fadeUp .2s ease',
      }}>
        <div style={{ padding: '22px 24px 0', borderBottom: '1px solid #f3f4f6', paddingBottom: 16, marginBottom: 4 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#111' }}>{title}</h3>
              {subtitle && <p style={{ margin: '3px 0 0', fontSize: 13, color: '#9ca3af' }}>{subtitle}</p>}
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#9ca3af', lineHeight: 1, marginTop: -2 }}>×</button>
          </div>
        </div>
        <div style={{ padding: '18px 24px 24px' }}>{children}</div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   Form field
───────────────────────────────────────────── */
function Field({ label, error, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 14 }}>
      {label && <label style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{label}</label>}
      {children}
      {error && <span style={{ fontSize: 12, color: '#ef4444' }}>{error}</span>}
    </div>
  )
}

function Input({ error, ...props }) {
  return (
    <input style={{
      padding: '8px 11px', borderRadius: 7, fontSize: 13,
      border: `1.5px solid ${error ? '#ef4444' : '#e5e7eb'}`,
      background: error ? '#fff8f8' : '#fafaf9',
      color: '#111', width: '100%', boxSizing: 'border-box', fontFamily: 'inherit',
    }} {...props} />
  )
}

function Select({ children, ...props }) {
  return (
    <select style={{
      padding: '8px 11px', borderRadius: 7, fontSize: 13,
      border: '1.5px solid #e5e7eb', background: '#fafaf9',
      color: '#111', width: '100%', fontFamily: 'inherit', cursor: 'pointer',
    }} {...props}>{children}</select>
  )
}

/* ─────────────────────────────────────────────
   Add User Modal
───────────────────────────────────────────── */
function AddUserModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'EMPLOYEE' })
  const [err,  setErr]  = useState({})
  const [saving, setSaving]   = useState(false)
  const [serverErr, setServerErr] = useState('')

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  function validate() {
    const e = {}
    if (!form.name.trim())     e.name     = 'Required'
    if (!form.email.trim())    e.email    = 'Required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email'
    if (!form.password)        e.password = 'Required'
    else if (form.password.length < 8) e.password = 'Min 8 characters'
    return e
  }

  async function submit() {
    const e = validate()
    if (Object.keys(e).length) { setErr(e); return }
    setSaving(true); setServerErr('')
    try {
      const { data } = await http.post('/api/users', form)
      onCreated(data)
      onClose()
    } catch (ex) {
      setServerErr(ex.response?.data?.message ?? ex.message)
    } finally { setSaving(false) }
  }

  return (
    <Modal title="Add New User" subtitle="Create a new account and assign a role." onClose={onClose}>
      {serverErr && <div style={errBox}>{serverErr}</div>}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
        <Field label="Full Name" error={err.name}>
          <Input value={form.name} onChange={set('name')} error={err.name} placeholder="John Doe" autoFocus />
        </Field>
        <Field label="Email" error={err.email}>
          <Input type="email" value={form.email} onChange={set('email')} error={err.email} placeholder="john@company.com" />
        </Field>
        <Field label="Password" error={err.password}>
          <Input type="password" value={form.password} onChange={set('password')} error={err.password} placeholder="••••••••" />
        </Field>
        <Field label="Role">
          <Select value={form.role} onChange={set('role')}>
            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </Select>
        </Field>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
        <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
        <Btn loading={saving} onClick={submit}>Create User</Btn>
      </div>
    </Modal>
  )
}

/* ─────────────────────────────────────────────
   Edit User Modal
───────────────────────────────────────────── */
function EditUserModal({ user, onClose, onSaved }) {
  const [form, setForm] = useState({
    name:      user.name      ?? '',
    phone:     user.phone     ?? '',
    avatarUrl: user.avatarUrl ?? '',
    role:      user.role      ?? 'EMPLOYEE',
  })
  const [err,  setErr]  = useState({})
  const [saving, setSaving]   = useState(false)
  const [serverErr, setServerErr] = useState('')

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  async function submit() {
    const e = {}
    if (!form.name.trim()) e.name = 'Required'
    if (Object.keys(e).length) { setErr(e); return }
    setSaving(true); setServerErr('')
    try {
      // update profile fields
      const { data } = await http.put(`/api/users/${user.id}`, form)
      onSaved(data ?? { ...user, ...form })
      onClose()
    } catch (ex) {
      setServerErr(ex.response?.data?.message ?? ex.message)
    } finally { setSaving(false) }
  }

  return (
    <Modal title="Edit User" subtitle={`Editing ${user.email}`} onClose={onClose}>
      {serverErr && <div style={errBox}>{serverErr}</div>}
      <Field label="Full Name" error={err.name}>
        <Input value={form.name} onChange={set('name')} error={err.name} autoFocus />
      </Field>
      <Field label="Phone">
        <Input value={form.phone} onChange={set('phone')} placeholder="+91 99999 99999" type="tel" />
      </Field>
      <Field label="Role">
        <Select value={form.role} onChange={set('role')}>
          {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
        </Select>
      </Field>
      <Field label="Avatar URL">
        <Input value={form.avatarUrl} onChange={set('avatarUrl')} placeholder="https://..." />
      </Field>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
        <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
        <Btn loading={saving} onClick={submit}>Save Changes</Btn>
      </div>
    </Modal>
  )
}

/* ─────────────────────────────────────────────
   Confirm Dialog
───────────────────────────────────────────── */
function ConfirmModal({ title, message, confirmLabel = 'Confirm', danger, onConfirm, onClose }) {
  const [loading, setLoading] = useState(false)
  async function go() {
    setLoading(true)
    try { await onConfirm() } finally { setLoading(false) }
  }
  return (
    <Modal title={title} onClose={onClose} width={380}>
      <p style={{ margin: '0 0 20px', fontSize: 14, color: '#374151', lineHeight: 1.6 }}>{message}</p>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
        <Btn variant={danger ? 'danger' : 'solid'} loading={loading} onClick={go}>{confirmLabel}</Btn>
      </div>
    </Modal>
  )
}

/* ─────────────────────────────────────────────
   Search + Filter bar
───────────────────────────────────────────── */
function SearchBar({ value, onChange, roleFilter, onRoleFilter, showInactive, onToggleInactive }) {
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
      <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
        <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: 14 }}>🔍</span>
        <input
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="Search by name or email…"
          style={{
            width: '100%', boxSizing: 'border-box',
            padding: '8px 11px 8px 32px', borderRadius: 8,
            border: '1.5px solid #e5e7eb', fontSize: 13,
            background: '#fafaf9', fontFamily: 'inherit', color: '#111',
          }}
        />
      </div>
      <select
        value={roleFilter}
        onChange={e => onRoleFilter(e.target.value)}
        style={{ padding: '8px 11px', borderRadius: 8, border: '1.5px solid #e5e7eb', fontSize: 13, background: '#fafaf9', fontFamily: 'inherit', color: '#374151', cursor: 'pointer' }}
      >
        <option value="">All roles</option>
        {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
      </select>
      <button
        onClick={onToggleInactive}
        style={{
          padding: '8px 14px', borderRadius: 8, border: '1.5px solid #e5e7eb',
          fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
          background: showInactive ? '#18181b' : '#fafaf9',
          color: showInactive ? '#fff' : '#374151',
          transition: 'background .15s, color .15s',
        }}
      >
        {showInactive ? '👁 All' : '👁 Active only'}
      </button>
    </div>
  )
}

/* ─────────────────────────────────────────────
   USER MANAGER
───────────────────────────────────────────── */
export default function UserManager() {
  const [users,        setUsers]        = useState([])
  const [loading,      setLoading]      = useState(true)
  const [modal,        setModal]        = useState(null)   // null | 'add' | {type:'edit',user} | {type:'confirm',...}
  const [toast,        setToast]        = useState(null)
  const [search,       setSearch]       = useState('')
  const [roleFilter,   setRoleFilter]   = useState('')
  const [showInactive, setShowInactive] = useState(false)

  const notify = (msg, ok = true) => setToast({ msg, ok, id: Date.now() })

  const load = useCallback(async () => {
    try {
      const { data } = await http.get('/api/users')
      setUsers(data ?? [])
    } catch { notify('Failed to load users', false) }
    finally  { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  /* ── Soft delete (toggle isActive) ── */
  async function toggleActive(user) {
    const next = !user.isActive
    try {
      await http.put(`/api/users/${user.id}/toggle-active`)
      setUsers(us => us.map(u => u.id === user.id ? { ...u, isActive: next } : u))
      notify(next ? `${user.name} reactivated` : `${user.name} deactivated`)
    } catch { notify('Action failed', false) }
  }

  /* ── Hard delete ── */
  async function hardDelete(user) {
    await http.delete(`/api/users/${user.id}`)
    setUsers(us => us.filter(u => u.id !== user.id))
    notify(`${user.name} deleted`)
  }

  /* ── Filtered list ── */
  const filtered = users.filter(u => {
    const q = search.toLowerCase()
    const matchSearch = !q || u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)
    const matchRole   = !roleFilter || u.role === roleFilter
    const matchActive = showInactive || u.isActive !== false
    return matchSearch && matchRole && matchActive
  })

  /* ── Stats ── */
  const total    = users.length
  const active   = users.filter(u => u.isActive !== false).length
  const inactive = total - active

  return (
    <div style={{ fontFamily: "'DM Sans','Segoe UI',system-ui,sans-serif" }}>
      <style>{css}</style>

      {/* ── Page header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#111' }}>Users</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#9ca3af' }}>
            {total} total · {active} active · {inactive} inactive
          </p>
        </div>
        <Btn onClick={() => setModal('add')}>
          <span style={{ fontSize: 16, lineHeight: 1 }}>+</span> Add User
        </Btn>
      </div>

      {/* ── Search bar ── */}
      <div style={{ marginBottom: 16 }}>
        <SearchBar
          value={search} onChange={setSearch}
          roleFilter={roleFilter} onRoleFilter={setRoleFilter}
          showInactive={showInactive} onToggleInactive={() => setShowInactive(v => !v)}
        />
      </div>

      {/* ── Table card ── */}
      <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e7e5e4', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,.04)' }}>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 60, gap: 12 }}>
            <Spinner size={22} /> <span style={{ color: '#9ca3af', fontSize: 14 }}>Loading users…</span>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 24px', color: '#9ca3af' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>👤</div>
            <div style={{ fontSize: 14 }}>No users found</div>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                {['User', 'Email', 'Role', 'Phone', 'Status', 'Actions'].map(h => (
                  <th key={h} style={{
                    padding: '11px 16px', textAlign: 'left', fontSize: 11,
                    fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase',
                    letterSpacing: '.07em', whiteSpace: 'nowrap',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((u, i) => {
                const isActive = u.isActive !== false
                return (
                  <tr key={u.id} style={{
                    borderBottom: i < filtered.length - 1 ? '1px solid #f9fafb' : 'none',
                    opacity: isActive ? 1 : 0.55,
                    transition: 'background .1s',
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = '#fafaf9'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    {/* User */}
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Avatar name={u.name} url={u.avatarUrl} />
                        <span style={{ fontSize: 14, fontWeight: 600, color: '#111', whiteSpace: 'nowrap' }}>
                          {u.name}
                        </span>
                      </div>
                    </td>
                    {/* Email */}
                    <td style={{ padding: '12px 16px', fontSize: 13, color: '#6b7280', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {u.email}
                    </td>
                    {/* Role */}
                    <td style={{ padding: '12px 16px' }}>
                      <Badge role={u.role} />
                    </td>
                    {/* Phone */}
                    <td style={{ padding: '12px 16px', fontSize: 13, color: '#6b7280' }}>
                      {u.phone || <span style={{ color: '#d1d5db' }}>—</span>}
                    </td>
                    {/* Status */}
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        fontSize: 12, fontWeight: 600,
                        color: isActive ? '#15803d' : '#b91c1c',
                      }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: isActive ? '#22c55e' : '#f87171', display: 'inline-block' }} />
                        {isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    {/* Actions */}
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: 2 }}>
                        {/* Edit */}
                        <IconBtn title="Edit user" onClick={() => setModal({ type: 'edit', user: u })}>✏️</IconBtn>
                        {/* Soft delete / reactivate */}
                        <IconBtn
                          title={isActive ? 'Deactivate user' : 'Reactivate user'}
                          danger={isActive}
                          onClick={() => setModal({
                            type: 'confirm',
                            title: isActive ? 'Deactivate User' : 'Reactivate User',
                            message: isActive
                              ? `Deactivate ${u.name}? They won't be able to log in.`
                              : `Reactivate ${u.name}? They'll regain access.`,
                            confirmLabel: isActive ? 'Deactivate' : 'Reactivate',
                            danger: isActive,
                            onConfirm: async () => { await toggleActive(u); setModal(null) },
                          })}
                        >
                          {isActive ? '🚫' : '✅'}
                        </IconBtn>
                        {/* Hard delete */}
                        <IconBtn
                          title="Permanently delete"
                          danger
                          onClick={() => setModal({
                            type: 'confirm',
                            title: 'Delete User',
                            message: `Permanently delete ${u.name}? This cannot be undone.`,
                            confirmLabel: 'Delete',
                            danger: true,
                            onConfirm: async () => { await hardDelete(u); setModal(null) },
                          })}
                        >🗑️</IconBtn>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Modals ── */}
      {modal === 'add' && (
        <AddUserModal
          onClose={() => setModal(null)}
          onCreated={u => { setUsers(us => [u, ...us]); notify(`${u.name} created`) }}
        />
      )}
      {modal?.type === 'edit' && (
        <EditUserModal
          user={modal.user}
          onClose={() => setModal(null)}
          onSaved={updated => {
            setUsers(us => us.map(u => u.id === updated.id ? updated : u))
            notify(`${updated.name} updated`)
          }}
        />
      )}
      {modal?.type === 'confirm' && (
        <ConfirmModal
          title={modal.title}
          message={modal.message}
          confirmLabel={modal.confirmLabel}
          danger={modal.danger}
          onConfirm={modal.onConfirm}
          onClose={() => setModal(null)}
        />
      )}

      {/* ── Toast ── */}
      {toast && <Toast key={toast.id} msg={toast.msg} ok={toast.ok} onGone={() => setToast(null)} />}
    </div>
  )
}

/* ─────────────────────────────────────────────
   Shared styles
───────────────────────────────────────────── */
const errBox = {
  padding: '10px 14px', borderRadius: 8, marginBottom: 14,
  background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', fontSize: 13,
}

const css = `
  @keyframes spin   { to { transform: rotate(360deg); } }
  @keyframes fadeUp { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
  input:focus, select:focus { outline: 2px solid #111 !important; outline-offset: 2px; }
  button:focus-visible      { outline: 2px solid #111; outline-offset: 2px; }
`