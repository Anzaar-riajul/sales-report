import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getSignupRequests, approveRequest, rejectRequest, addUserDirectly } from '../firebase/auth';
import Card from '../components/UI/Card';
import Badge from '../components/UI/Badge';

export default function Settings() {
  const { user, superAdmin } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [directEmail, setDirectEmail] = useState('');
  const [directUid, setDirectUid] = useState('');
  const [addMsg, setAddMsg] = useState('');
  const [addError, setAddError] = useState('');

  const loadRequests = async () => {
    setLoading(true);
    const data = await getSignupRequests();
    setRequests(data);
    setLoading(false);
  };

  useEffect(() => {
    if (superAdmin) loadRequests();
  }, [superAdmin]);

  const handleApprove = async (request) => {
    await approveRequest(request.id, request.uid);
    setRequests(prev => prev.filter(r => r.id !== request.id));
  };

  const handleReject = async (request) => {
    await rejectRequest(request.id);
    setRequests(prev => prev.filter(r => r.id !== request.id));
  };

  const handleDirectAdd = async () => {
    setAddMsg('');
    setAddError('');
    if (!directEmail && !directUid) {
      setAddError('Enter email or UID');
      return;
    }
    try {
      const uid = directUid || directEmail;
      await addUserDirectly(uid, directEmail);
      setAddMsg(`✓ ${directEmail || uid} added`);
      setDirectEmail('');
      setDirectUid('');
    } catch (err) {
      setAddError('Failed to add user');
    }
  };

  return (
    <div className="space-y-5 max-w-3xl animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-accent-gold/10 border border-accent-gold/20 flex items-center justify-center">
          <span className="text-sm text-accent-gold font-semibold">⚙</span>
        </div>
        <div>
          <h2 className="font-semibold text-lg sm:text-xl text-text-primary">Settings</h2>
          <p className="text-xs text-text-muted">Manage users and app preferences</p>
        </div>
      </div>

      {superAdmin && (
        <>
          {/* ─── Pending Signup Requests ─── */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="section-title">Signup Requests</h3>
                <p className="text-xs text-text-muted mt-0.5">Pending user approvals</p>
              </div>
              <button onClick={loadRequests} disabled={loading}
                className="text-xs text-accent-gold hover:underline font-medium disabled:opacity-50">
                {loading ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>

            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-12 bg-bg-elevated rounded-xl animate-pulse" />
                ))}
              </div>
            ) : requests.length === 0 ? (
              <div className="py-6 text-center">
                <p className="text-sm text-text-muted">No pending requests</p>
              </div>
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

          {/* ─── Direct Add User ─── */}
          <Card>
            <h3 className="section-title mb-1">Add User Directly</h3>
            <p className="text-xs text-text-muted mb-4">Instantly grant access by UID or email</p>

            <div className="flex flex-col sm:flex-row gap-2 mb-3">
              <input type="text" placeholder="UID" value={directUid}
                onChange={e => setDirectUid(e.target.value)}
                className="input-dark text-sm py-2 px-3 flex-1 min-w-0" />
              <input type="email" placeholder="Email (optional)" value={directEmail}
                onChange={e => setDirectEmail(e.target.value)}
                className="input-dark text-sm py-2 px-3 flex-1 min-w-0" />
              <button onClick={handleDirectAdd}
                className="btn-primary text-sm py-2 px-4 whitespace-nowrap">
                Add User
              </button>
            </div>
            {addMsg && <p className="text-xs text-accent-teal">{addMsg}</p>}
            {addError && <p className="text-xs text-accent-rose">{addError}</p>}
          </Card>
        </>
      )}

      {/* ─── Account Info ─── */}
      <Card>
        <h3 className="section-title mb-2">Account</h3>
        <div className="space-y-2 text-sm">
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
            {superAdmin && <Badge variant="gold">Super Admin</Badge>}
          </div>
        </div>
      </Card>

      {/* ─── About ─── */}
      <Card>
        <h3 className="section-title mb-2">About</h3>
        <div className="space-y-1.5 text-sm text-text-muted">
          <p><span className="text-text-primary">App:</span> Anzaar Islamic Lifestyle Dashboard</p>
          <p><span className="text-text-primary">Version:</span> 1.0.0</p>
          <p><span className="text-text-primary">Stack:</span> React + Vite + Tailwind + Firebase + Recharts</p>
        </div>
      </Card>

      {/* ─── Report Format ─── */}
      <Card>
        <h3 className="section-title mb-2">Report Format</h3>
        <p className="text-text-muted text-sm mb-3">
          Paste daily reports in this format for the parser to work correctly:
        </p>
        <pre className="text-xs text-text-primary bg-bg-elevated p-4 rounded-xl border border-border/60 overflow-x-auto leading-relaxed">
{`Bismillahir Rahmanir Rahim
Anzaar Islamic Lifestyle
Online Order update: 08 June, 2026 (Monday)
Regular Order: 68 pcs Customize order: 21 pcs Total Order: 89 Total Advance: 39,135 TK Total Order Value: 3,15,475 TK
==================
1. Abaya Airaffa-4
2. Abaya Anaira v1-2`}
        </pre>
      </Card>
    </div>
  );
}
