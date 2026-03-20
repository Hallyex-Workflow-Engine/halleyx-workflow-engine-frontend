import { useState, useEffect } from "react";
import axios from "axios";

/* ─────────────────────────────────────────────
   Axios instance — same baseURL as authApi.jsx
───────────────────────────────────────────── */
const http = axios.create({
  baseURL: "http://localhost:8080",
  withCredentials: true,          // sends session cookie, same as authApi
});

/* ─────────────────────────────────────────────
   Date util — handles Jackson array or ISO str
───────────────────────────────────────────── */
function fmtDate(val) {
  if (!val) return "—";
  let d;
  if (Array.isArray(val)) {
    const [y, mo, day, h = 0, mi = 0, s = 0] = val;
    d = new Date(y, mo - 1, day, h, mi, s);
  } else {
    d = new Date(val);
  }
  return isNaN(d.getTime()) ? "—" : d.toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

/* ─────────────────────────────────────────────
   Primitives
───────────────────────────────────────────── */
function Spinner() {
  return (
    <span style={{
      display: "inline-block", width: 20, height: 20,
      border: "2.5px solid #e5e7eb", borderTopColor: "#111",
      borderRadius: "50%", animation: "spin .65s linear infinite",
    }} />
  );
}

function Field({ label, error, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 14 }}>
      {label && <label style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>{label}</label>}
      {children}
      {error && <span style={{ fontSize: 12, color: "#ef4444" }}>{error}</span>}
    </div>
  );
}

function TextInput({ error, ...props }) {
  return (
    <input
      style={{
        padding: "9px 12px", borderRadius: 8, fontSize: 14,
        border: `1.5px solid ${error ? "#ef4444" : "#e5e7eb"}`,
        background: error ? "#fff8f8" : "#fafaf9",
        color: "#111", width: "100%", boxSizing: "border-box",
        fontFamily: "inherit",
      }}
      {...props}
    />
  );
}

function Btn({ variant = "solid", loading, children, ...props }) {
  const base = variant === "ghost"
    ? { background: "#fff", color: "#374151", border: "1px solid #e5e7eb" }
    : { background: "#111", color: "#fff", border: "none" };
  return (
    <button
      disabled={loading || props.disabled}
      style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        gap: 6, padding: "9px 20px", borderRadius: 8, fontSize: 14, fontWeight: 600,
        cursor: "pointer", fontFamily: "inherit", transition: "opacity .15s",
        opacity: (loading || props.disabled) ? 0.55 : 1, ...base,
      }}
      {...props}
    >
      {loading ? <Spinner /> : children}
    </button>
  );
}

/* ─────────────────────────────────────────────
   Modal
───────────────────────────────────────────── */
function Modal({ title, onClose, children }) {
  useEffect(() => {
    const fn = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose]);

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, zIndex: 999,
      background: "rgba(0,0,0,.45)", backdropFilter: "blur(2px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: "#fff", borderRadius: 14, width: "100%", maxWidth: 420,
        boxShadow: "0 20px 60px rgba(0,0,0,.18)", animation: "fadeUp .2s ease",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px 0" }}>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#111" }}>{title}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: "#9ca3af", lineHeight: 1 }}>×</button>
        </div>
        <div style={{ padding: "18px 24px 24px" }}>{children}</div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Edit Profile Modal
───────────────────────────────────────────── */
function EditModal({ user, onClose, onDone }) {
  const [name,      setName]      = useState(user.name      ?? "");
  const [phone,     setPhone]     = useState(user.phone     ?? "");
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl ?? "");
  const [err,       setErr]       = useState({});
  const [saving,    setSaving]    = useState(false);
  const [serverErr, setServerErr] = useState("");

  async function save() {
    const e = {};
    if (!name.trim())      e.name  = "Name is required";
    if (name.length > 100) e.name  = "Max 100 characters";
    if (phone.length > 20) e.phone = "Max 20 characters";
    if (Object.keys(e).length) { setErr(e); return; }

    setSaving(true); setServerErr("");
    try {
      const { data } = await http.put("/api/users/me", { name, phone, avatarUrl });
      onDone(data);
      onClose();
    } catch (ex) {
      setServerErr(ex.response?.data?.message ?? ex.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title="Edit Profile" onClose={onClose}>
      {serverErr && <div style={errBox}>{serverErr}</div>}
      <Field label="Full Name" error={err.name}>
        <TextInput value={name} onChange={(e) => setName(e.target.value)} error={err.name} autoFocus />
      </Field>
      <Field label="Phone" error={err.phone}>
        <TextInput value={phone} onChange={(e) => setPhone(e.target.value)} error={err.phone} type="tel" placeholder="+91 99999 99999" />
      </Field>
      <Field label="Avatar URL">
        <TextInput value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="https://..." />
        <span style={{ fontSize: 11, color: "#9ca3af" }}>Any public image URL</span>
      </Field>
      <div style={actions}>
        <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
        <Btn loading={saving} onClick={save}>Save Changes</Btn>
      </div>
    </Modal>
  );
}

/* ─────────────────────────────────────────────
   Change Password Modal
───────────────────────────────────────────── */
function PasswordModal({ onClose, onDone }) {
  const [oldPw,  setOldPw]  = useState("");
  const [newPw,  setNewPw]  = useState("");
  const [conf,   setConf]   = useState("");
  const [show,   setShow]   = useState({ old: false, new: false, conf: false });
  const [err,    setErr]    = useState({});
  const [saving, setSaving] = useState(false);
  const [serverErr, setServerErr] = useState("");

  const toggle = (k) => setShow((s) => ({ ...s, [k]: !s[k] }));

  async function save() {
    const e = {};
    if (!oldPw)            e.oldPw = "Required";
    if (!newPw)            e.newPw = "Required";
    else if (newPw.length < 8) e.newPw = "Minimum 8 characters";
    if (conf !== newPw)    e.conf  = "Passwords do not match";
    if (Object.keys(e).length) { setErr(e); return; }

    setSaving(true); setServerErr("");
    try {
      await http.put("/api/users/change-password", {
        oldPassword: oldPw, newPassword: newPw,
      });
      onDone();
      onClose();
    } catch (ex) {
      setServerErr(ex.response?.data?.message ?? ex.message);
    } finally {
      setSaving(false);
    }
  }

  function PwRow({ label, val, setVal, showKey, errKey }) {
    return (
      <Field label={label} error={err[errKey]}>
        <div style={{ position: "relative" }}>
          <TextInput
            type={show[showKey] ? "text" : "password"}
            value={val}
            onChange={(e) => setVal(e.target.value)}
            error={err[errKey]}
            placeholder="••••••••"
            style={{ paddingRight: 38 }}
          />
          <button type="button" onClick={() => toggle(showKey)} style={{
            position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
            background: "none", border: "none", cursor: "pointer", fontSize: 15,
          }}>
            {show[showKey] ? "🙈" : "👁"}
          </button>
        </div>
      </Field>
    );
  }

  return (
    <Modal title="Change Password" onClose={onClose}>
      {serverErr && <div style={errBox}>{serverErr}</div>}
      <PwRow label="Current Password" val={oldPw} setVal={setOldPw} showKey="old" errKey="oldPw" />
      <PwRow label="New Password"     val={newPw} setVal={setNewPw} showKey="new" errKey="newPw" />
      <PwRow label="Confirm Password" val={conf}  setVal={setConf}  showKey="conf" errKey="conf" />
      <div style={actions}>
        <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
        <Btn loading={saving} onClick={save}>Update Password</Btn>
      </div>
    </Modal>
  );
}

/* ─────────────────────────────────────────────
   Avatar
───────────────────────────────────────────── */
function Avatar({ name, url, size = 68 }) {
  const [broken, setBroken] = useState(false);
  const letters = (name || "?").split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();

  if (url && !broken) {
    return (
      <img src={url} alt={name} onError={() => setBroken(true)} style={{
        width: size, height: size, borderRadius: 14,
        objectFit: "cover", border: "2px solid #e5e7eb", flexShrink: 0,
      }} />
    );
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: 14, background: "#18181b",
      display: "flex", alignItems: "center", justifyContent: "center",
      color: "#fff", fontSize: size * 0.32, fontWeight: 700,
      flexShrink: 0, border: "2px solid #e5e7eb", letterSpacing: 1,
    }}>
      {letters}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Info row
───────────────────────────────────────────── */
function InfoRow({ label, value, mono }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: ".06em" }}>
        {label}
      </span>
      <span style={{ fontSize: 14, color: value ? "#111" : "#d1d5db", fontWeight: 500, fontFamily: mono ? "monospace" : "inherit", wordBreak: "break-all" }}>
        {value || "Not set"}
      </span>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Toast
───────────────────────────────────────────── */
function Toast({ msg, ok, onGone }) {
  useEffect(() => { const t = setTimeout(onGone, 3500); return () => clearTimeout(t); }, [onGone]);
  return (
    <div style={{
      position: "fixed", bottom: 28, right: 28, zIndex: 9999,
      background: ok ? "#18181b" : "#ef4444", color: "#fff",
      padding: "11px 18px", borderRadius: 10, fontSize: 14, fontWeight: 500,
      boxShadow: "0 8px 30px rgba(0,0,0,.18)", animation: "fadeUp .2s ease",
      display: "flex", alignItems: "center", gap: 8,
    }}>
      {ok ? "✓" : "✕"} {msg}
    </div>
  );
}

/* ─────────────────────────────────────────────
   PROFILE PAGE
───────────────────────────────────────────── */
export default function Profile() {
  const [user,   setUser]   = useState(null);
  const [status, setStatus] = useState("loading");
  const [modal,  setModal]  = useState(null);
  const [toast,  setToast]  = useState(null);

  const notify = (msg, ok = true) => setToast({ msg, ok, id: Date.now() });

  useEffect(() => {
    setStatus("loading");
    http.get("/api/users/me")
      .then(({ data }) => {
        console.log("[Profile] response:", data);
        setUser(data);
        setStatus("ok");
      })
      .catch((err) => {
        console.error("[Profile] error:", err.response?.status, err.message);
        setStatus("error");
      });
  }, []);

  if (status === "loading") {
    return (
      <div style={page}>
        <style>{css}</style>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, paddingTop: 100 }}>
          <Spinner />
          <span style={{ color: "#9ca3af", fontSize: 14 }}>Loading profile…</span>
        </div>
      </div>
    );
  }

  if (status === "error" || !user) {
    return (
      <div style={page}>
        <style>{css}</style>
        <div style={{ textAlign: "center", paddingTop: 100 }}>
          <p style={{ color: "#ef4444", fontSize: 15, fontWeight: 500 }}>Could not load profile.</p>
          <p style={{ color: "#9ca3af", fontSize: 13, marginBottom: 16 }}>Check the browser console for details.</p>
          <Btn onClick={() => window.location.reload()}>Retry</Btn>
        </div>
      </div>
    );
  }

  const active    = user.isActive !== false;
  const roleColor = { ADMIN: "#18181b", MANAGER: "#2563eb", EMPLOYEE: "#6b7280" }[user.role] ?? "#6b7280";

  return (
    <div style={page}>
      <style>{css}</style>

      <div style={card}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 18, marginBottom: 28 }}>
          <Avatar name={user.name} url={user.avatarUrl} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <h1 style={{ margin: 0, fontSize: 21, fontWeight: 700, color: "#111" }}>{user.name}</h1>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 600, color: active ? "#15803d" : "#b91c1c" }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: active ? "#22c55e" : "#f87171", display: "inline-block" }} />
                {active ? "Active" : "Inactive"}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
              <span style={{ background: roleColor, color: "#fff", fontSize: 11, fontWeight: 700, padding: "2px 10px", borderRadius: 20, letterSpacing: ".05em", textTransform: "uppercase" }}>
                {user.role}
              </span>
              <span style={{ color: "#6b7280", fontSize: 13 }}>{user.email}</span>
            </div>
          </div>
        </div>

        <hr style={{ border: "none", borderTop: "1px solid #f3f4f6", margin: "0 0 24px" }} />

        {/* Info grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px 32px", marginBottom: 24 }}>
          <InfoRow label="Email"        value={user.email} />
          <InfoRow label="Phone"        value={user.phone} />
          <InfoRow label="Role"         value={user.role} />
          <InfoRow label="Status"       value={active ? "Active" : "Inactive"} />
          <InfoRow label="Member since" value={fmtDate(user.createdAt)} />
          <InfoRow label="Last updated" value={fmtDate(user.updatedAt)} />
          <div style={{ gridColumn: "1 / -1" }}>
            <InfoRow label="User ID" value={user.id} mono />
          </div>
        </div>

        <hr style={{ border: "none", borderTop: "1px solid #f3f4f6", margin: "0 0 24px" }} />

        {/* Actions */}
        <div style={{ display: "flex", gap: 10 }}>
          <Btn onClick={() => setModal("edit")}>Edit Profile</Btn>
          <Btn variant="ghost" onClick={() => setModal("password")}>Change Password</Btn>
        </div>
      </div>

      {modal === "edit" && (
        <EditModal
          user={user}
          onClose={() => setModal(null)}
          onDone={(updated) => { if (updated) setUser(updated); notify("Profile updated"); }}
        />
      )}
      {modal === "password" && (
        <PasswordModal
          onClose={() => setModal(null)}
          onDone={() => notify("Password changed successfully")}
        />
      )}

      {toast && <Toast key={toast.id} msg={toast.msg} ok={toast.ok} onGone={() => setToast(null)} />}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Shared style objects
───────────────────────────────────────────── */
const page = {
  minHeight: "100vh", background: "#f5f5f4",
  display: "flex", alignItems: "flex-start", justifyContent: "center",
  padding: "48px 16px 80px",
  fontFamily: "'DM Sans','Segoe UI',system-ui,sans-serif",
};

const card = {
  background: "#fff", borderRadius: 18, border: "1px solid #e7e5e4",
  padding: "32px 28px", width: "100%", maxWidth: 540,
  boxShadow: "0 1px 4px rgba(0,0,0,.05),0 8px 24px rgba(0,0,0,.04)",
  animation: "fadeUp .3s ease",
};

const errBox = {
  padding: "10px 14px", borderRadius: 8, marginBottom: 14,
  background: "#fef2f2", border: "1px solid #fecaca", color: "#b91c1c", fontSize: 13,
};

const actions = { display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 4 };

const css = `
  @keyframes spin   { to { transform: rotate(360deg); } }
  @keyframes fadeUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
  input:focus          { outline: 2px solid #111 !important; outline-offset: 2px; }
  button:focus-visible { outline: 2px solid #111; outline-offset: 2px; }
`;