import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getSignupRequests, approveRequest, rejectRequest, addUserDirectly, getAllUsers, updateUserRole, removeUser } from '../firebase/auth';
import DetailModal from '../components/UI/DetailModal';

const ROLE_OPTIONS = [
  { value: 'viewer', label: 'Viewer', icon: '👁', color: '#64748B', desc: 'Can view all data but cannot input or edit reports' },
  { value: 'admin', label: 'Admin', icon: '⚙', color: '#0D9488', desc: 'Can view data, input reports, and edit existing reports' },
  { value: 'super_admin', label: 'Super Admin', icon: '👑', color: '#C9A84C', desc: 'Full access including user management and settings' },
];

function UserCard({ u, currentUser, onRoleChange, onRemove, onClick }) {
  const role = ROLE_OPTIONS.find(r => r.value === u.role) || ROLE_OPTIONS[0];
  const isSelf = u.uid === currentUser?.uid;
  return (
    <button onClick={onClick} className="w-full text-left bg-white/80 border border-border/30 rounded-2xl p-4 hover:shadow-lg hover:shadow-accent-gold/8 hover:border-accent-gold/20 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 relative overflow-hidden group">
      <div className="absolute top-0 left-0 w-full h-0.5 rounded-t-2xl opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: `linear-gradient(90deg, ${role.color}, ${role.color}80, transparent)` }} />
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0" style={{ background: `${role.color}15` }}>
          {role.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-text-primary truncate">{u.email || u.uid}</p>
            {isSelf && <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-accent-gold/10 text-accent-gold font-bold">YOU</span>}
          </div>
          <p className="text-[10px] font-mono text-text-muted truncate">{u.uid}</p>
        </div>
        <div className="flex-shrink-0">
          <span className="text-[9px] px-2 py-1 rounded-full font-bold" style={{ background: `${role.color}15`, color: role.color }}>
            {role.label}
          </span>
        </div>
      </div>
    </button>
  );
}

function RequestCard({ req, onApprove, onReject, onClick }) {
  return (
    <button onClick={onClick} className="w-full text-left bg-white/80 border border-border/30 rounded-2xl p-4 hover:shadow-lg hover:shadow-accent-gold/8 hover:border-accent-gold/20 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 group">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200/50 flex items-center justify-center text-lg flex-shrink-0">
          📩
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-text-primary truncate">{req.email || 'No email'}</p>
          <p className="text-[10px] font-mono text-text-muted">UID: {req.uid}</p>
          {req.createdAt && (
            <p className="text-[9px] text-text-muted mt-0.5">Requested: {new Date(req.createdAt.seconds ? req.createdAt.seconds * 1000 : req.createdAt).toLocaleDateString()}</p>
          )}
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0" onClick={e => e.stopPropagation()}>
          <button onClick={() => onApprove(req)}
            className="px-2.5 py-1.5 bg-accent-teal/10 border border-accent-teal/20 rounded-lg text-[10px] font-bold text-accent-teal hover:bg-accent-teal/20 transition-colors">
            ✓
          </button>
          <button onClick={() => onReject(req)}
            className="px-2.5 py-1.5 bg-accent-rose/10 border border-accent-rose/20 rounded-lg text-[10px] font-bold text-accent-rose hover:bg-accent-rose/20 transition-colors">
            ✕
          </button>
        </div>
      </div>
    </button>
  );
}

export default function Settings() {
  const { user, isSuperAdmin } = useAuth();
  const [tab, setTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [directEmail, setDirectEmail] = useState('');
  const [directUid, setDirectUid] = useState('');
  const [directRole, setDirectRole] = useState('viewer');
  const [addMsg, setAddMsg] = useState('');
  const [addError, setAddError] = useState('');
  const [modal, setModal] = useState(null);

  const loadData = async () => {
    setLoading(true);
    const [u, r] = await Promise.all([getAllUsers(), getSignupRequests()]);
    setUsers(u);
    setRequests(r);
    setLoading(false);
  };

  useEffect(() => {
    if (isSuperAdmin) loadData();
  }, [isSuperAdmin]);

  const handleApprove = async (req) => {
    await approveRequest(req.id, req.uid, req.email);
    loadData();
  };

  const handleReject = async (req) => {
    await rejectRequest(req.id);
    setRequests(prev => prev.filter(r => r.id !== req.id));
  };

  const handleRoleChange = async (uid, role) => {
    if (uid === user.uid) return;
    await updateUserRole(uid, role);
    setUsers(prev => prev.map(u => u.uid === uid ? { ...u, role } : u));
  };

  const handleRemoveUser = async (uid) => {
    if (uid === user.uid) return;
    await removeUser(uid);
    setUsers(prev => prev.filter(u => u.uid !== uid));
  };

  const handleDirectAdd = async () => {
    setAddMsg('');
    setAddError('');
    if (!directUid && !directEmail) { setAddError('Enter UID or email'); return; }
    try {
      const uid = directUid || directEmail;
      await addUserDirectly(uid, directEmail, directRole);
      setAddMsg(`✓ ${directEmail || uid} added as ${directRole}`);
      setDirectEmail('');
      setDirectUid('');
      loadData();
    } catch (err) {
      setAddError('Failed to add user');
    }
  };

  const openUserDetail = (u) => {
    const role = ROLE_OPTIONS.find(r => r.value === u.role) || ROLE_OPTIONS[0];
    setModal({
      title: u.email || 'User', icon: role.icon, color: role.color,
      subtitle: `${role.label} · ${u.uid}`,
      content: (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-bg-elevated/40 rounded-xl p-3 text-center">
              <p className="text-[9px] text-text-muted uppercase">Role</p>
              <p className="text-sm font-bold" style={{ color: role.color }}>{role.label}</p>
              <p className="text-[9px] text-text-muted mt-1">{role.desc}</p>
            </div>
            <div className="bg-bg-elevated/40 rounded-xl p-3 text-center">
              <p className="text-[9px] text-text-muted uppercase">UID</p>
              <p className="text-[10px] font-mono text-text-primary break-all">{u.uid}</p>
            </div>
          </div>
          {u.email && (
            <div className="bg-bg-elevated/40 rounded-xl p-3">
              <p className="text-[9px] text-text-muted uppercase mb-1">Email</p>
              <p className="text-xs font-medium text-text-primary">{u.email}</p>
            </div>
          )}
          {u.uid !== user?.uid && (
            <div className="space-y-2">
              <p className="text-[10px] text-text-muted uppercase font-medium">Change Role</p>
              <div className="grid grid-cols-2 gap-2">
                {ROLE_OPTIONS.filter(r => r.value !== 'super_admin').map(r => (
                  <button key={r.value} onClick={() => { handleRoleChange(u.uid, r.value); setModal(null); }}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      u.role === r.value ? 'border-accent-gold/30 bg-accent-gold/5 shadow-md' : 'border-border/30 bg-white/80 hover:border-accent-gold/20'
                    }`}>
                    <span className="text-lg">{r.icon}</span>
                    <p className="text-[10px] font-bold mt-1" style={{ color: r.color }}>{r.label}</p>
                  </button>
                ))}
              </div>
              <button onClick={() => { handleRemoveUser(u.uid); setModal(null); }}
                className="w-full py-2.5 bg-accent-rose/5 border border-accent-rose/15 rounded-xl text-xs font-bold text-accent-rose hover:bg-accent-rose/10 transition-colors">
                Remove User
              </button>
            </div>
          )}
        </div>
      ),
    });
  };

  const openRequestDetail = (req) => {
    setModal({
      title: 'Signup Request', icon: '📩', color: '#F59E0B',
      subtitle: req.email || req.uid,
      content: (
        <div className="space-y-3">
          <div className="bg-bg-elevated/40 rounded-xl p-3">
            <p className="text-[9px] text-text-muted uppercase mb-1">Email</p>
            <p className="text-xs font-medium text-text-primary">{req.email || 'Not provided'}</p>
          </div>
          <div className="bg-bg-elevated/40 rounded-xl p-3">
            <p className="text-[9px] text-text-muted uppercase mb-1">UID</p>
            <p className="text-[10px] font-mono text-text-primary break-all">{req.uid}</p>
          </div>
          {req.createdAt && (
            <div className="bg-bg-elevated/40 rounded-xl p-3">
              <p className="text-[9px] text-text-muted uppercase mb-1">Requested At</p>
              <p className="text-xs text-text-primary">{new Date(req.createdAt.seconds ? req.createdAt.seconds * 1000 : req.createdAt).toLocaleString()}</p>
            </div>
          )}
          <div className="flex gap-2">
            <button onClick={() => { handleApprove(req); setModal(null); }}
              className="flex-1 py-3 bg-gradient-to-r from-accent-teal to-emerald-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-accent-teal/25 hover:shadow-xl hover:-translate-y-0.5 transition-all">
              ✓ Approve
            </button>
            <button onClick={() => { handleReject(req); setModal(null); }}
              className="flex-1 py-3 bg-gradient-to-r from-accent-rose to-rose-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-accent-rose/25 hover:shadow-xl hover:-translate-y-0.5 transition-all">
              ✕ Reject
            </button>
          </div>
        </div>
      ),
    });
  };

  const openRoleGuide = () => {
    setModal({
      title: 'Role Permissions', icon: '📋', color: '#C9A84C',
      subtitle: 'Access levels explained',
      content: (
        <div className="space-y-2">
          {ROLE_OPTIONS.map(r => (
            <div key={r.value} className="bg-bg-elevated/40 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{r.icon}</span>
                <span className="text-xs font-bold" style={{ color: r.color }}>{r.label}</span>
              </div>
              <p className="text-[11px] text-text-muted leading-relaxed">{r.desc}</p>
            </div>
          ))}
        </div>
      ),
    });
  };

  // ─── Non-admin view ───
  if (!isSuperAdmin) {
    return (
      <div className="space-y-4 max-w-md mx-auto animate-fade-in">
        {/* Header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-accent-gold to-amber-500 rounded-2xl p-5 text-white shadow-lg shadow-accent-gold/20">
          <div className="absolute -top-8 -right-8 w-24 h-24 bg-white/10 rounded-full" />
          <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-white/10 rounded-full" />
          <div className="relative">
            <h1 className="text-xl font-bold tracking-tight">Settings</h1>
            <p className="text-white/80 text-xs mt-1">Account info and preferences</p>
          </div>
        </div>

        {/* Account Card */}
        <div className="bg-white/80 border border-border/30 rounded-2xl p-4">
          <div className="flex items-center gap-3">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="" className="w-12 h-12 rounded-xl shadow-md" />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-gold to-amber-400 flex items-center justify-center text-lg text-white font-bold shadow-md">
                {user?.email?.charAt(0).toUpperCase() || 'A'}
              </div>
            )}
            <div>
              <p className="font-semibold text-text-primary">{user?.displayName || user?.email}</p>
              <p className="text-xs text-text-muted">{user?.email}</p>
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-accent-gold/10 text-accent-gold font-bold mt-1 inline-block">Viewer</span>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="bg-white/80 border border-border/30 rounded-2xl p-4 space-y-2">
          <div className="flex items-center justify-between py-2 border-b border-border/20">
            <span className="text-xs text-text-muted">App</span>
            <span className="text-xs font-medium text-text-primary">Anzaar Sales Report</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-border/20">
            <span className="text-xs text-text-muted">Version</span>
            <span className="text-xs font-mono text-text-primary">2.0.0</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-xs text-text-muted">Role</span>
            <span className="text-xs font-medium text-accent-gold">Viewer (read-only)</span>
          </div>
        </div>

        {/* Contact admin hint */}
        <div className="bg-accent-gold/5 border border-accent-gold/15 rounded-2xl p-4 text-center">
          <p className="text-xs text-text-muted">Need admin access?</p>
          <p className="text-[10px] text-accent-gold font-medium mt-1">Contact the super admin to upgrade your role.</p>
        </div>
      </div>
    );
  }

  // ─── Super Admin view ───
  return (
    <div className="space-y-4 max-w-md mx-auto animate-fade-in">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-accent-gold to-amber-500 rounded-2xl p-5 text-white shadow-lg shadow-accent-gold/20">
        <div className="absolute -top-8 -right-8 w-24 h-24 bg-white/10 rounded-full" />
        <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-white/10 rounded-full" />
        <div className="relative">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold tracking-tight">Admin Settings</h1>
              <p className="text-white/80 text-xs mt-1">{users.length} users · {requests.length} pending</p>
            </div>
            <button onClick={loadData} disabled={loading}
              className="w-8 h-8 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all disabled:opacity-50">
              <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-bg-elevated/60 p-1 rounded-xl border border-border/30">
        {[
          { key: 'users', icon: '👥', label: 'Users', count: users.length },
          { key: 'requests', icon: '📩', label: 'Requests', count: requests.length },
          { key: 'add', icon: '➕', label: 'Add User' },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-[10px] font-semibold transition-all ${
              tab === t.key ? 'bg-white text-text-primary shadow-sm' : 'text-text-muted hover:text-text-primary'
            }`}>
            <span className="text-xs">{t.icon}</span>
            <span>{t.label}</span>
            {t.count !== undefined && (
              <span className={`text-[8px] px-1 py-0.5 rounded-full font-bold ${
                tab === t.key ? 'bg-accent-gold/10 text-accent-gold' : 'bg-bg-elevated text-text-muted'
              }`}>{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Quick Stats */}
      {tab === 'users' && (
        <div className="grid grid-cols-3 gap-1.5">
          {ROLE_OPTIONS.map(r => {
            const count = users.filter(u => u.role === r.value).length;
            return (
              <button key={r.value} onClick={openRoleGuide}
                className="bg-white/80 border border-border/30 rounded-xl p-3 text-center hover:shadow-md transition-all">
                <span className="text-lg">{r.icon}</span>
                <p className="text-sm font-bold font-mono mt-1" style={{ color: r.color }}>{count}</p>
                <p className="text-[9px] text-text-muted">{r.label}s</p>
              </button>
            );
          })}
        </div>
      )}

      {/* Users Tab */}
      {tab === 'users' && (
        <div className="space-y-2">
          {loading ? (
            <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-16 bg-bg-elevated/50 rounded-2xl animate-pulse" />)}</div>
          ) : users.length === 0 ? (
            <div className="bg-white/80 border border-border/30 rounded-2xl p-8 text-center">
              <p className="text-sm text-text-muted">No users yet</p>
            </div>
          ) : (
            users.map(u => (
              <UserCard key={u.uid} u={u} currentUser={user} onRoleChange={handleRoleChange} onRemove={handleRemoveUser} onClick={() => openUserDetail(u)} />
            ))
          )}
        </div>
      )}

      {/* Requests Tab */}
      {tab === 'requests' && (
        <div className="space-y-2">
          {loading ? (
            <div className="space-y-2">{[1,2].map(i => <div key={i} className="h-16 bg-bg-elevated/50 rounded-2xl animate-pulse" />)}</div>
          ) : requests.length === 0 ? (
            <div className="bg-white/80 border border-border/30 rounded-2xl p-8 text-center">
              <div className="w-12 h-12 rounded-xl bg-accent-teal/10 flex items-center justify-center mx-auto mb-3">
                <span className="text-xl">✅</span>
              </div>
              <p className="text-sm font-semibold text-text-primary">All caught up!</p>
              <p className="text-xs text-text-muted mt-1">No pending signup requests</p>
            </div>
          ) : (
            requests.map(r => (
              <RequestCard key={r.id} req={r} onApprove={handleApprove} onReject={handleReject} onClick={() => openRequestDetail(r)} />
            ))
          )}
        </div>
      )}

      {/* Add User Tab */}
      {tab === 'add' && (
        <div className="space-y-3">
          <div className="bg-white/80 border border-border/30 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-xl bg-accent-gold/10 flex items-center justify-center">
                <span className="text-sm">➕</span>
              </div>
              <div>
                <p className="text-xs font-semibold text-text-primary">Add User Directly</p>
                <p className="text-[9px] text-text-muted">Grant access instantly</p>
              </div>
            </div>
            <input type="text" placeholder="Firebase UID" value={directUid} onChange={e => setDirectUid(e.target.value)}
              className="w-full text-xs px-3 py-2.5 border border-border/50 rounded-xl focus:outline-none focus:border-accent-gold/50 bg-white" />
            <input type="email" placeholder="Email (optional)" value={directEmail} onChange={e => setDirectEmail(e.target.value)}
              className="w-full text-xs px-3 py-2.5 border border-border/50 rounded-xl focus:outline-none focus:border-accent-gold/50 bg-white" />
            <div>
              <p className="text-[9px] text-text-muted uppercase mb-1.5 font-medium">Assign Role</p>
              <div className="grid grid-cols-2 gap-2">
                {ROLE_OPTIONS.filter(r => r.value !== 'super_admin').map(r => (
                  <button key={r.value} onClick={() => setDirectRole(r.value)}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      directRole === r.value ? 'border-accent-gold/30 bg-accent-gold/5 shadow-md' : 'border-border/30 hover:border-accent-gold/20'
                    }`}>
                    <span className="text-lg">{r.icon}</span>
                    <p className="text-[10px] font-bold mt-1" style={{ color: r.color }}>{r.label}</p>
                  </button>
                ))}
              </div>
            </div>
            <button onClick={handleDirectAdd}
              className="w-full py-3 bg-gradient-to-r from-accent-gold to-amber-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-accent-gold/25 hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-40"
              disabled={!directUid && !directEmail}>
              Add User
            </button>
            {addMsg && <p className="text-xs text-accent-teal text-center font-medium">{addMsg}</p>}
            {addError && <p className="text-xs text-accent-rose text-center font-medium">{addError}</p>}
          </div>

          {/* Role guide */}
          <button onClick={openRoleGuide}
            className="w-full bg-white/80 border border-border/30 rounded-2xl p-4 text-left hover:shadow-md transition-all">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-accent-gold/10 flex items-center justify-center">
                <span className="text-sm">📋</span>
              </div>
              <div>
                <p className="text-xs font-semibold text-text-primary">Role Permissions Guide</p>
                <p className="text-[9px] text-text-muted">Click to see what each role can do</p>
              </div>
            </div>
          </button>
        </div>
      )}

      {/* Account */}
      <div className="bg-white/80 border border-border/30 rounded-2xl p-4">
        <div className="flex items-center gap-3">
          {user?.photoURL ? (
            <img src={user.photoURL} alt="" className="w-10 h-10 rounded-xl shadow-md" />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-gold to-amber-400 flex items-center justify-center text-sm text-white font-bold shadow-md">
              {user?.email?.charAt(0).toUpperCase() || 'A'}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-text-primary truncate">{user?.displayName || user?.email}</p>
            <p className="text-[10px] text-text-muted truncate">{user?.email}</p>
          </div>
          <span className="text-[9px] px-2 py-1 rounded-full bg-accent-gold/10 text-accent-gold font-bold">👑 Super Admin</span>
        </div>
      </div>

      {/* DetailModal */}
      {modal && (
        <DetailModal open={!!modal} onClose={() => setModal(null)} title={modal.title} subtitle={modal.subtitle} icon={modal.icon} color={modal.color}>
          {modal.content}
        </DetailModal>
      )}
    </div>
  );
}
