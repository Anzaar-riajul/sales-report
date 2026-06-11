import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useReports } from '../hooks/useReports';
import { getSignupRequests, approveRequest, rejectRequest, addUserDirectly, getAllUsers, updateUserRole, removeUser } from '../firebase/auth';
import DetailModal from '../components/UI/DetailModal';
import RangePDF from '../components/Dashboard/RangePDF';
import DataEntryTab from '../components/Settings/DataEntryTab';
import { formatBDT, formatNumber } from '../utils/formatters';
import { generateReportPDF, generateReportJPG, generateBoth } from '../utils/pdfGenerator';
import { subDays, format } from 'date-fns';

const ROLE_OPTIONS = [
  { value: 'viewer', label: 'Viewer', icon: '👁', color: '#64748B', desc: 'Can view all data but cannot input or edit reports' },
  { value: 'admin', label: 'Admin', icon: '⚙', color: '#0D9488', desc: 'Can view data, input reports, and edit existing reports' },
  { value: 'super_admin', label: 'Super Admin', icon: '👑', color: '#C9A84C', desc: 'Full access including user management and settings' },
];

const QUICK_RANGES = [
  { label: 'Today', key: 'today', getRange: () => { const d = new Date(); return { start: format(d, 'yyyy-MM-dd'), end: format(d, 'yyyy-MM-dd') }; } },
  { label: 'Yesterday', key: 'yesterday', getRange: () => { const d = subDays(new Date(), 1); return { start: format(d, 'yyyy-MM-dd'), end: format(d, 'yyyy-MM-dd') }; } },
  { label: 'This Week', key: 'this_week', getRange: () => { const d = new Date(); const day = d.getDay(); const start = subDays(d, day === 0 ? 6 : day - 1); return { start: format(start, 'yyyy-MM-dd'), end: format(d, 'yyyy-MM-dd') }; } },
  { label: 'Last 7d', key: '7d', getRange: () => ({ start: format(subDays(new Date(), 6), 'yyyy-MM-dd'), end: format(new Date(), 'yyyy-MM-dd') }) },
  { label: 'Last 30d', key: '30d', getRange: () => ({ start: format(subDays(new Date(), 29), 'yyyy-MM-dd'), end: format(new Date(), 'yyyy-MM-dd') }) },
  { label: 'Last 90d', key: '90d', getRange: () => ({ start: format(subDays(new Date(), 89), 'yyyy-MM-dd'), end: format(new Date(), 'yyyy-MM-dd') }) },
  { label: 'All Time', key: 'all', getRange: () => null },
];

const TABS = [
  { key: 'entry', icon: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
    </svg>
  ), label: 'Entry' },
  { key: 'export', icon: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  ), label: 'Export' },
  { key: 'users', icon: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ), label: 'Users', badge: true },
  { key: 'requests', icon: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
    </svg>
  ), label: 'Requests', badge: true },
  { key: 'add', icon: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
    </svg>
  ), label: 'Add User' },
];

function ExportTab() {
  const { reports } = useReports();
  const [quickRange, setQuickRange] = useState('all');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [exporting, setExporting] = useState(null);

  const filteredReports = useMemo(() => {
    if (!reports) return [];
    const range = QUICK_RANGES.find(r => r.key === quickRange);
    if (quickRange === 'custom') {
      if (!customStart || !customEnd) return reports;
      return reports.filter(r => r.dateString >= customStart && r.dateString <= customEnd);
    }
    const rangeDates = range?.getRange();
    if (!rangeDates) return reports;
    return reports.filter(r => r.dateString >= rangeDates.start && r.dateString <= rangeDates.end);
  }, [reports, quickRange, customStart, customEnd]);

  const stats = useMemo(() => {
    if (filteredReports.length === 0) return null;
    const sorted = [...filteredReports].sort((a, b) => new Date(b.dateString) - new Date(a.dateString));
    const totalRevenue = sorted.reduce((s, r) => s + (r.totalOrderValue || 0), 0);
    const totalAdvance = sorted.reduce((s, r) => s + (r.totalAdvance || 0), 0);
    return {
      count: sorted.length,
      totalRevenue, totalAdvance,
      startDate: sorted[sorted.length - 1]?.dateString,
      endDate: sorted[0]?.dateString,
    };
  }, [filteredReports]);

  const rangeLabel = QUICK_RANGES.find(r => r.key === quickRange)?.label || 'Custom Range';
  const baseFilename = stats ? `Anzaar-Report-${stats.startDate}-to-${stats.endDate}` : 'Anzaar-Report';

  const handleExportPDF = async () => {
    if (filteredReports.length === 0) return;
    setExporting('pdf');
    try {
      await generateReportPDF({ dateString: `${stats?.startDate} → ${stats?.endDate}` }, 'range-pdf-content', `${baseFilename}.pdf`);
    } catch (err) { console.error('PDF export failed:', err); }
    setExporting(null);
  };

  const handleExportJPGMobile = async () => {
    if (filteredReports.length === 0) return;
    setExporting('jpg-mobile');
    try {
      await generateReportJPG({ dateString: `${stats?.startDate} → ${stats?.endDate}` }, 'range-pdf-content', `${baseFilename}-Mobile.jpg`, { mobile: true });
    } catch (err) { console.error('Mobile JPG export failed:', err); }
    setExporting(null);
  };

  const handleExportJPGRegular = async () => {
    if (filteredReports.length === 0) return;
    setExporting('jpg-regular');
    try {
      await generateReportJPG({ dateString: `${stats?.startDate} → ${stats?.endDate}` }, 'range-pdf-content', `${baseFilename}.jpg`, { mobile: false });
    } catch (err) { console.error('Regular JPG export failed:', err); }
    setExporting(null);
  };

  const handleExportBoth = async () => {
    if (filteredReports.length === 0) return;
    setExporting('both');
    try {
      await generateBoth({ dateString: `${stats?.startDate} → ${stats?.endDate}` }, 'range-pdf-content', baseFilename);
    } catch (err) { console.error('Both export failed:', err); }
    setExporting(null);
  };

  return (
    <div className="space-y-4">
      {/* Range Selector */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
            <svg className="w-5 h-5 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Select Range</p>
            <p className="text-xs text-gray-400">Choose date range for export</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-3">
          {QUICK_RANGES.map(r => (
            <button key={r.key} onClick={() => setQuickRange(r.key)}
              className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-all duration-200 ${
                quickRange === r.key
                  ? 'bg-gray-900 text-white shadow-md'
                  : 'bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-gray-700'
              }`}>{r.label}</button>
          ))}
          <button onClick={() => setQuickRange('custom')}
            className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-all duration-200 ${
              quickRange === 'custom'
                ? 'bg-gray-900 text-white shadow-md'
                : 'bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-gray-700'
            }`}>Custom</button>
        </div>

        {quickRange === 'custom' && (
          <div className="flex items-center gap-3 mb-4">
            <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)}
              className="flex-1 text-sm px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 bg-gray-50 transition-all" />
            <span className="text-xs text-gray-400 font-medium">to</span>
            <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)}
              className="flex-1 text-sm px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 bg-gray-50 transition-all" />
          </div>
        )}

        {stats && (
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-gray-900 font-mono">{stats.count}</p>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider mt-1">Reports</p>
            </div>
            <div className="bg-amber-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-amber-600 font-mono">{formatBDT(stats.totalRevenue).slice(0, -3)}K</p>
              <p className="text-[10px] text-amber-400 uppercase tracking-wider mt-1">Revenue</p>
            </div>
            <div className="bg-teal-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-teal-600 font-mono">{formatBDT(stats.totalAdvance).slice(0, -3)}K</p>
              <p className="text-[10px] text-teal-400 uppercase tracking-wider mt-1">Advance</p>
            </div>
          </div>
        )}
      </div>

      {/* Export Buttons */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
            <svg className="w-5 h-5 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Export Report</p>
            <p className="text-xs text-gray-400">{rangeLabel} · {filteredReports.length} reports</p>
          </div>
        </div>

        <div className="space-y-3">
          {/* PDF Export */}
          <button onClick={handleExportPDF} disabled={exporting || filteredReports.length === 0}
            className="w-full flex items-center gap-4 p-4 bg-gradient-to-r from-red-50 to-orange-50 border border-red-100 rounded-2xl hover:shadow-lg hover:shadow-red-100/50 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 disabled:opacity-40 group">
            <div className="w-12 h-12 rounded-xl bg-red-500 flex items-center justify-center shadow-lg shadow-red-500/30 group-hover:scale-110 transition-transform">
              {exporting === 'pdf' ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                </svg>
              )}
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-bold text-gray-900">Download PDF</p>
              <p className="text-[11px] text-gray-400 mt-0.5">Compact size, optimized for sharing</p>
            </div>
            <svg className="w-5 h-5 text-gray-300 group-hover:text-gray-500 group-hover:translate-x-1 transition-all" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
          </button>

          {/* JPG Mobile */}
          <button onClick={handleExportJPGMobile} disabled={exporting || filteredReports.length === 0}
            className="w-full flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl hover:shadow-lg hover:shadow-blue-100/50 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 disabled:opacity-40 group">
            <div className="w-12 h-12 rounded-xl bg-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform">
              {exporting === 'jpg-mobile' ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/>
                </svg>
              )}
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-bold text-gray-900">JPG — Mobile Friendly</p>
              <p className="text-[11px] text-gray-400 mt-0.5">600px wide, full report height, share-ready</p>
            </div>
            <svg className="w-5 h-5 text-gray-300 group-hover:text-gray-500 group-hover:translate-x-1 transition-all" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
          </button>

          {/* JPG Regular */}
          <button onClick={handleExportJPGRegular} disabled={exporting || filteredReports.length === 0}
            className="w-full flex items-center gap-4 p-4 bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-100 rounded-2xl hover:shadow-lg hover:shadow-violet-100/50 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 disabled:opacity-40 group">
            <div className="w-12 h-12 rounded-xl bg-violet-500 flex items-center justify-center shadow-lg shadow-violet-500/30 group-hover:scale-110 transition-transform">
              {exporting === 'jpg-regular' ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                </svg>
              )}
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-bold text-gray-900">JPG — Regular</p>
              <p className="text-[11px] text-gray-400 mt-0.5">1080px wide, high quality</p>
            </div>
            <svg className="w-5 h-5 text-gray-300 group-hover:text-gray-500 group-hover:translate-x-1 transition-all" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
          </button>

          {/* Download Both */}
          <button onClick={handleExportBoth} disabled={exporting || filteredReports.length === 0}
            className="w-full flex items-center gap-4 p-4 bg-gradient-to-r from-gray-900 to-gray-800 border border-gray-700 rounded-2xl hover:shadow-lg hover:shadow-gray-900/30 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 disabled:opacity-40 group">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              {exporting === 'both' ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
              )}
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-bold text-white">Download Both</p>
              <p className="text-[11px] text-gray-400 mt-0.5">PDF + JPG Regular together</p>
            </div>
            <svg className="w-5 h-5 text-gray-500 group-hover:text-gray-300 group-hover:translate-x-1 transition-all" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
          </button>
        </div>
      </div>

      {filteredReports.length > 0 && (
        <RangePDF reports={filteredReports} rangeLabel={rangeLabel} startDate={stats?.startDate} endDate={stats?.endDate} />
      )}
    </div>
  );
}

function UserCard({ u, currentUser, onRoleChange, onRemove, onClick }) {
  const role = ROLE_OPTIONS.find(r => r.value === u.role) || ROLE_OPTIONS[0];
  const isSelf = u.uid === currentUser?.uid;
  return (
    <button onClick={onClick} className="w-full text-left bg-white border border-gray-100 rounded-2xl p-4 hover:shadow-lg hover:shadow-gray-100/80 hover:border-gray-200 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 group">
      <div className="flex items-center gap-3.5">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${role.color}10` }}>
          <span className="text-lg">{role.icon}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-gray-900 truncate">{u.email || u.uid}</p>
            {isSelf && <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 font-semibold border border-amber-100">YOU</span>}
          </div>
          <p className="text-[10px] font-mono text-gray-400 truncate mt-0.5">{u.uid}</p>
        </div>
        <span className="text-[10px] px-2.5 py-1 rounded-full font-semibold flex-shrink-0" style={{ background: `${role.color}10`, color: role.color }}>
          {role.label}
        </span>
      </div>
    </button>
  );
}

function RequestCard({ req, onApprove, onReject, onClick }) {
  return (
    <button onClick={onClick} className="w-full text-left bg-white border border-gray-100 rounded-2xl p-4 hover:shadow-lg hover:shadow-gray-100/80 hover:border-gray-200 hover:-translate-y-0.5 transition-all duration-300 group">
      <div className="flex items-center gap-3.5">
        <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center flex-shrink-0">
          <span className="text-lg">📩</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">{req.email || 'No email'}</p>
          <p className="text-[10px] font-mono text-gray-400 truncate mt-0.5">UID: {req.uid}</p>
          {req.createdAt && (
            <p className="text-[10px] text-gray-400 mt-1">Requested: {new Date(req.createdAt.seconds ? req.createdAt.seconds * 1000 : req.createdAt).toLocaleDateString()}</p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0" onClick={e => e.stopPropagation()}>
          <button onClick={() => onApprove(req)}
            className="w-9 h-9 bg-teal-50 border border-teal-100 rounded-xl flex items-center justify-center text-teal-600 hover:bg-teal-100 transition-colors font-bold">✓</button>
          <button onClick={() => onReject(req)}
            className="w-9 h-9 bg-red-50 border border-red-100 rounded-xl flex items-center justify-center text-red-500 hover:bg-red-100 transition-colors font-bold">✕</button>
        </div>
      </div>
    </button>
  );
}

export default function Settings() {
  const { user, isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('entry');
  const [users, setUsers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [directEmail, setDirectEmail] = useState('');
  const [directUid, setDirectUid] = useState('');
  const [directRole, setDirectRole] = useState('viewer');
  const [addMsg, setAddMsg] = useState('');
  const [addError, setAddError] = useState('');
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState(null);
  const tabRef = useRef(null);

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

  useEffect(() => {
    if (tabRef.current) {
      const btn = tabRef.current.querySelector(`[data-tab="${tab}"]`);
      if (btn) btn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [tab]);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3500);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const handleApprove = async (req) => {
    try {
      await approveRequest(req.id, req.uid, req.email);
      setToast({ type: 'success', message: `${req.email || req.uid} approved!` });
      loadData();
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Approve failed' });
    }
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
    setAddMsg(''); setAddError('');
    if (!directUid && !directEmail) { setAddError('Enter UID or email'); return; }
    try {
      const uid = directUid || directEmail;
      await addUserDirectly(uid, directEmail, directRole);
      setAddMsg(`✓ ${directEmail || uid} added as ${directRole}`);
      setDirectEmail(''); setDirectUid('');
      loadData();
    } catch (err) { setAddError('Failed to add user'); }
  };

  const openUserDetail = (u) => {
    const role = ROLE_OPTIONS.find(r => r.value === u.role) || ROLE_OPTIONS[0];
    setModal({
      title: u.email || 'User', icon: role.icon, color: role.color,
      subtitle: `${role.label} · ${u.uid}`,
      content: (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-[10px] text-gray-400 uppercase tracking-wider">Role</p>
              <p className="text-sm font-bold mt-1" style={{ color: role.color }}>{role.label}</p>
              <p className="text-[10px] text-gray-400 mt-1">{role.desc}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-[10px] text-gray-400 uppercase tracking-wider">UID</p>
              <p className="text-[10px] font-mono text-gray-900 break-all mt-1">{u.uid}</p>
            </div>
          </div>
          {u.email && (
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Email</p>
              <p className="text-xs font-medium text-gray-900">{u.email}</p>
            </div>
          )}
          {u.uid !== user?.uid && (
            <div className="space-y-2">
              <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">Change Role</p>
              <div className="grid grid-cols-2 gap-2">
                {ROLE_OPTIONS.filter(r => r.value !== 'super_admin').map(r => (
                  <button key={r.value} onClick={() => { handleRoleChange(u.uid, r.value); setModal(null); }}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      u.role === r.value ? 'border-amber-200 bg-amber-50 shadow-md' : 'border-gray-100 bg-white hover:border-gray-200'
                    }`}>
                    <span className="text-lg">{r.icon}</span>
                    <p className="text-[10px] font-bold mt-1" style={{ color: r.color }}>{r.label}</p>
                  </button>
                ))}
              </div>
              <button onClick={() => { handleRemoveUser(u.uid); setModal(null); }}
                className="w-full py-2.5 bg-red-50 border border-red-100 rounded-xl text-xs font-bold text-red-500 hover:bg-red-100 transition-colors">Remove User</button>
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
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Email</p>
            <p className="text-xs font-medium text-gray-900">{req.email || 'Not provided'}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">UID</p>
            <p className="text-[10px] font-mono text-gray-900 break-all">{req.uid}</p>
          </div>
          {req.createdAt && (
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Requested At</p>
              <p className="text-xs text-gray-900">{new Date(req.createdAt.seconds ? req.createdAt.seconds * 1000 : req.createdAt).toLocaleString()}</p>
            </div>
          )}
          <div className="flex gap-2">
            <button onClick={() => { handleApprove(req); setModal(null); }}
              className="flex-1 py-3 bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-teal-500/25 hover:shadow-xl hover:-translate-y-0.5 transition-all">✓ Approve</button>
            <button onClick={() => { handleReject(req); setModal(null); }}
              className="flex-1 py-3 bg-gradient-to-r from-red-500 to-rose-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-red-500/25 hover:shadow-xl hover:-translate-y-0.5 transition-all">✕ Reject</button>
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
            <div key={r.value} className="bg-gray-50 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{r.icon}</span>
                <span className="text-xs font-bold" style={{ color: r.color }}>{r.label}</span>
              </div>
              <p className="text-[11px] text-gray-500 leading-relaxed">{r.desc}</p>
            </div>
          ))}
        </div>
      ),
    });
  };

  if (!isSuperAdmin) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4 animate-fade-in">
        <div className="w-full max-w-sm text-center">
          <div className="w-20 h-20 rounded-3xl bg-red-50 border border-red-100 flex items-center justify-center mx-auto mb-5">
            <span className="text-3xl">🔒</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Access Restricted</h1>
          <p className="text-sm text-gray-500 mb-6 leading-relaxed">Settings is limited to Super Admin access only. Contact your administrator for role changes.</p>
          <button onClick={() => navigate('/')}
            className="px-6 py-3 bg-gray-900 text-white font-bold text-sm rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all inline-flex items-center gap-2">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5 animate-fade-in">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-2xl shadow-2xl text-sm font-medium transition-all ${
          toast.type === 'error'
            ? 'bg-red-50 border border-red-200 text-red-600'
            : 'bg-teal-50 border border-teal-200 text-teal-600'
        }`}>
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-3xl p-6 text-white shadow-2xl shadow-gray-900/20">
        <div className="absolute -top-20 -right-20 w-60 h-60 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-amber-500/10 rounded-full blur-2xl" />
        <div className="relative">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
              <p className="text-gray-400 text-sm mt-1">{users.length} users · {requests.length} pending</p>
            </div>
            <button onClick={loadData} disabled={loading}
              className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all disabled:opacity-50 backdrop-blur-sm">
              <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div ref={tabRef} className="flex gap-1 bg-gray-100/80 p-1 rounded-2xl overflow-x-auto scrollbar-none">
        {TABS.map(t => (
          <button key={t.key} data-tab={t.key} onClick={() => setTab(t.key)}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-3 rounded-xl text-xs font-semibold transition-all duration-200 whitespace-nowrap ${
              tab === t.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600 hover:bg-white/50'
            }`}>
            {t.icon}
            <span>{t.label}</span>
            {t.badge && (
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${
                tab === t.key ? 'bg-amber-100 text-amber-600' : 'bg-gray-200 text-gray-500'
              }`}>{t.key === 'users' ? users.length : requests.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* Quick Role Stats */}
      {tab === 'users' && (
        <div className="grid grid-cols-3 gap-3">
          {ROLE_OPTIONS.map(r => {
            const count = users.filter(u => u.role === r.value).length;
            return (
              <button key={r.value} onClick={openRoleGuide}
                className="bg-white border border-gray-100 rounded-2xl p-4 text-center hover:shadow-lg hover:border-gray-200 transition-all">
                <span className="text-xl">{r.icon}</span>
                <p className="text-2xl font-bold font-mono mt-2" style={{ color: r.color }}>{count}</p>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider mt-1">{r.label}s</p>
              </button>
            );
          })}
        </div>
      )}

      {/* Users Tab */}
      {tab === 'users' && (
        <div className="space-y-3">
          {loading ? (
            <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 bg-gray-100 rounded-2xl animate-pulse" />)}</div>
          ) : users.length === 0 ? (
            <div className="bg-white border border-gray-100 rounded-2xl p-10 text-center">
              <p className="text-sm text-gray-400">No users yet</p>
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
        <div className="space-y-3">
          {loading ? (
            <div className="space-y-3">{[1,2].map(i => <div key={i} className="h-16 bg-gray-100 rounded-2xl animate-pulse" />)}</div>
          ) : requests.length === 0 ? (
            <div className="bg-white border border-gray-100 rounded-2xl p-10 text-center">
              <div className="w-14 h-14 rounded-2xl bg-teal-50 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">✅</span>
              </div>
              <p className="text-sm font-semibold text-gray-900">All caught up!</p>
              <p className="text-xs text-gray-400 mt-1">No pending signup requests</p>
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
        <div className="space-y-4">
          <div className="bg-white border border-gray-100 rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/>
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Add User Directly</p>
                <p className="text-xs text-gray-400">Grant access instantly without signup</p>
              </div>
            </div>
            <input type="text" placeholder="Firebase UID" value={directUid} onChange={e => setDirectUid(e.target.value)}
              className="w-full text-sm px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 bg-gray-50 transition-all" />
            <input type="email" placeholder="Email address (optional)" value={directEmail} onChange={e => setDirectEmail(e.target.value)}
              className="w-full text-sm px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 bg-gray-50 transition-all" />
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-2 font-medium">Assign Role</p>
              <div className="grid grid-cols-2 gap-2">
                {ROLE_OPTIONS.filter(r => r.value !== 'super_admin').map(r => (
                  <button key={r.value} onClick={() => setDirectRole(r.value)}
                    className={`p-4 rounded-xl border text-center transition-all ${
                      directRole === r.value ? 'border-amber-200 bg-amber-50 shadow-md shadow-amber-100/50' : 'border-gray-100 hover:border-gray-200 bg-gray-50'
                    }`}>
                    <span className="text-xl">{r.icon}</span>
                    <p className="text-[10px] font-bold mt-1.5" style={{ color: r.color }}>{r.label}</p>
                  </button>
                ))}
              </div>
            </div>
            <button onClick={handleDirectAdd}
              className="w-full py-3.5 bg-gray-900 text-white font-bold text-sm rounded-xl shadow-lg shadow-gray-900/20 hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-40"
              disabled={!directUid && !directEmail}>Add User</button>
            {addMsg && <p className="text-xs text-teal-600 text-center font-medium">{addMsg}</p>}
            {addError && <p className="text-xs text-red-500 text-center font-medium">{addError}</p>}
          </div>

          <button onClick={openRoleGuide}
            className="w-full bg-white border border-gray-100 rounded-2xl p-4 text-left hover:shadow-lg hover:border-gray-200 transition-all group">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center group-hover:scale-105 transition-transform">
                <svg className="w-5 h-5 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">Role Permissions Guide</p>
                <p className="text-xs text-gray-400">See what each role can do</p>
              </div>
              <svg className="w-4 h-4 text-gray-300 group-hover:text-gray-500 group-hover:translate-x-1 transition-all" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
            </div>
          </button>
        </div>
      )}

      {/* Export Tab */}
      {tab === 'export' && <ExportTab />}

      {/* Data Entry Tab */}
      {tab === 'entry' && <DataEntryTab />}

      {/* Account Card */}
      <div className="bg-white border border-gray-100 rounded-2xl p-4 hover:shadow-lg transition-shadow">
        <div className="flex items-center gap-3.5">
          {user?.photoURL ? (
            <img src={user.photoURL} alt="" className="w-11 h-11 rounded-xl shadow-md ring-2 ring-gray-100" />
          ) : (
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-gray-900 to-gray-700 flex items-center justify-center text-base text-white font-bold shadow-md">
              {user?.email?.charAt(0).toUpperCase() || 'A'}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-900 truncate">{user?.displayName || user?.email}</p>
            <p className="text-[10px] text-gray-400 truncate">{user?.email}</p>
          </div>
          <span className="text-[10px] px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 font-semibold">Admin</span>
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
