import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getSignupRequests, approveRequest, rejectRequest, addUserDirectly, getAllUsers, updateUserRole, removeUser } from '../firebase/auth';
import Card from '../components/UI/Card';
import Badge from '../components/UI/Badge';

const ROLE_OPTIONS = [
  { value: 'viewer', label: 'Viewer', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
  { value: 'admin', label: 'Admin', color: 'bg-accent-teal/10 text-accent-teal border-accent-teal/20' },
  { value: 'super_admin', label: 'Super Admin', color: 'bg-accent-gold/10 text-accent-gold border-accent-gold/20' },
];

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

  if (!isSuperAdmin) {
    return (
      <div className="space-y-5 max-w-3xl animate-fade-in">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-accent-gold/10 border border-accent-gold/20 flex items-center justify-center">
            <span className="text-sm text-accent-gold font-semibold">⚙</span>
          </div>
          <div>
            <h2 className="font-semibold text-lg sm:text-xl text-text-primary">Settings</h2>
            <p className="text-xs text-text-muted">Account info and app preferences</p>
          </div>
        </div>

        <Card>
          <h3 className="section-title mb-2">Account</h3>
          <div className="flex items-center gap-3">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="" className="w-10 h-10 rounded-xl" />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-bg-elevated flex items-center justify-center text-sm text-text-muted">
                {user?.email?.charAt(0).toUpperCase() || 'A'}
              </div>
            )}
            <div>
              <p className="font-medium text-text-primary">{user?.displayName || user?.email}</p>
              <p className="text-xs text-text-muted">{user?.email}</p>
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="section-title mb-2">About</h3>
          <div className="space-y-1.5 text-sm text-text-muted">
            <p><span className="text-text-primary">App:</span> Anzaar Islamic Lifestyle Dashboard</p>
            <p><span className="text-text-primary">Version:</span> 1.0.0</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-4xl animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-accent-gold/10 border border-accent-gold/20 flex items-center justify-center">
            <span className="text-sm text-accent-gold font-semibold">⚙</span>
          </div>
          <div>
            <h2 className="font-semibold text-lg sm:text-xl text-text-primary">Admin Settings</h2>
            <p className="text-xs text-text-muted">User management and app preferences</p>
          </div>
        </div>
        <button onClick={loadData} disabled={loading}
          className="text-xs text-accent-gold hover:underline font-medium disabled:opacity-50">
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {/* ─── Tabs ─── */}
      <div className="flex gap-1 bg-bg-elevated/80 p-0.5 rounded-xl border border-border/60 w-fit">
        {[
          { key: 'users', label: 'Users', count: users.length },
          { key: 'requests', label: 'Requests', count: requests.length },
          { key: 'add', label: 'Add User' },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-3 sm:px-4 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap ${
              tab === t.key
                ? 'bg-white text-accent-gold shadow-sm border border-accent-gold/15'
                : 'text-text-muted hover:text-text-primary'
            }`}>
            {t.label}{t.count !== undefined ? ` (${t.count})` : ''}
          </button>
        ))}
      </div>

      {/* ─── Users Tab ─── */}
      {tab === 'users' && (
        <Card>
          <h3 className="section-title mb-3">All Users</h3>
          {loading ? (
            <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-12 bg-bg-elevated rounded-xl animate-pulse" />)}</div>
          ) : users.length === 0 ? (
            <p className="text-sm text-text-muted py-4 text-center">No users yet</p>
          ) : (
            <div className="space-y-1.5">
              {users.map(u => (
                <div key={u.uid} className="flex items-center justify-between bg-bg-elevated/40 rounded-xl px-4 py-3 border border-border/30">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-text-primary truncate">{u.email || u.uid}</p>
                      <Badge variant={u.role === 'super_admin' ? 'gold' : u.role === 'admin' ? 'teal' : 'default'}>
                        {u.role === 'super_admin' ? 'Super Admin' : u.role === 'admin' ? 'Admin' : 'Viewer'}
                      </Badge>
                    </div>
                    <p className="text-[10px] font-mono text-text-muted truncate">{u.uid}</p>
                  </div>
                  {u.uid !== user.uid && (
                    <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                      <select value={u.role} onChange={e => handleRoleChange(u.uid, e.target.value)}
                        className="text-xs border border-border/60 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:border-accent-gold/50">
                        {ROLE_OPTIONS.filter(r => r.value !== 'super_admin').map(r => (
                          <option key={r.value} value={r.value}>{r.label}</option>
                        ))}
                      </select>
                      <button onClick={() => handleRemoveUser(u.uid)}
                        className="text-xs text-accent-rose hover:underline px-2 py-1">Remove</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* ─── Requests Tab ─── */}
      {tab === 'requests' && (
        <Card>
          <h3 className="section-title mb-3">Pending Signup Requests</h3>
          {loading ? (
            <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-12 bg-bg-elevated rounded-xl animate-pulse" />)}</div>
          ) : requests.length === 0 ? (
            <p className="text-sm text-text-muted py-6 text-center">No pending requests</p>
          ) : (
            <div className="space-y-2">
              {requests.map(r => (
                <div key={r.id} className="flex items-center justify-between bg-bg-elevated/60 rounded-xl px-4 py-3 border border-border/50">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">{r.email || 'No email'}</p>
                    <p className="text-[10px] font-mono text-text-muted truncate">UID: {r.uid}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                    <button onClick={() => handleApprove(r)}
                      className="px-3 py-1.5 bg-accent-teal/10 border border-accent-teal/20 rounded-lg text-xs font-medium text-accent-teal hover:bg-accent-teal/20 transition-colors">
                      Approve
                    </button>
                    <button onClick={() => handleReject(r)}
                      className="px-3 py-1.5 bg-accent-rose/10 border border-accent-rose/20 rounded-lg text-xs font-medium text-accent-rose hover:bg-accent-rose/20 transition-colors">
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* ─── Add User Tab ─── */}
      {tab === 'add' && (
        <Card>
          <h3 className="section-title mb-1">Add User Directly</h3>
          <p className="text-xs text-text-muted mb-4">Instantly grant access with a role</p>
          <div className="flex flex-col sm:flex-row gap-2 mb-3">
            <input type="text" placeholder="UID" value={directUid} onChange={e => setDirectUid(e.target.value)}
              className="input-dark text-sm py-2 px-3 flex-1 min-w-0" />
            <input type="email" placeholder="Email (optional)" value={directEmail} onChange={e => setDirectEmail(e.target.value)}
              className="input-dark text-sm py-2 px-3 flex-1 min-w-0" />
          </div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs text-text-muted">Role:</span>
            <select value={directRole} onChange={e => setDirectRole(e.target.value)}
              className="text-xs border border-border/60 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:border-accent-gold/50">
              {ROLE_OPTIONS.filter(r => r.value !== 'super_admin').map(r => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
            <button onClick={handleDirectAdd} className="btn-primary text-sm py-1.5 px-4 whitespace-nowrap">Add</button>
          </div>
          {addMsg && <p className="text-xs text-accent-teal">{addMsg}</p>}
          {addError && <p className="text-xs text-accent-rose">{addError}</p>}
        </Card>
      )}

      {/* ─── Account Info ─── */}
      <Card>
        <h3 className="section-title mb-2">Account</h3>
        <div className="flex items-center gap-3">
          {user?.photoURL ? <img src={user.photoURL} alt="" className="w-10 h-10 rounded-xl" /> : (
            <div className="w-10 h-10 rounded-xl bg-bg-elevated flex items-center justify-center text-sm text-text-muted">
              {user?.email?.charAt(0).toUpperCase() || 'A'}
            </div>
          )}
          <div>
            <p className="font-medium text-text-primary">{user?.displayName || user?.email}</p>
            <p className="text-xs text-text-muted">{user?.email}</p>
          </div>
          <Badge variant="gold">Super Admin</Badge>
        </div>
      </Card>

      {/* ─── About ─── */}
      <Card>
        <h3 className="section-title mb-2">About</h3>
        <div className="space-y-1.5 text-sm text-text-muted">
          <p><span className="text-text-primary">App:</span> Anzaar Islamic Lifestyle Dashboard</p>
          <p><span className="text-text-primary">Version:</span> 1.0.0</p>
        </div>
      </Card>
    </div>
  );
}
