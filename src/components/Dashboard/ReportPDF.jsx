import { formatBDT, formatNumber } from '../../utils/formatters';

const THEME = {
  gold: '#C9A84C',
  goldLight: '#C9A84C15',
  teal: '#0D9488',
  tealLight: '#0D948815',
  rose: '#E11D48',
  roseLight: '#E11D4815',
  blue: '#3B82F6',
  text: '#0F172A',
  muted: '#64748B',
  border: '#E2E8F0',
  bg: '#F8FAFC',
};

function StatBox({ label, value, color }) {
  return (
    <div style={{
      background: `linear-gradient(135deg, ${color}08, ${color}03)`,
      border: `1px solid ${color}20`,
      borderRadius: '10px',
      padding: '10px 12px',
      textAlign: 'center',
    }}>
      <p style={{ fontSize: '8px', color: THEME.muted, textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0, fontWeight: 600 }}>{label}</p>
      <p style={{ fontSize: '16px', fontWeight: 800, color: THEME.text, margin: '4px 0 0', fontFamily: 'monospace' }}>{value}</p>
    </div>
  );
}

function ProductRow({ name, quantity, index, odd }) {
  return (
    <tr style={{ background: odd ? '#F8FAFC' : '#FFFFFF' }}>
      <td style={{ padding: '7px 10px', fontSize: '10px', color: THEME.text, borderBottom: `1px solid ${THEME.border}40` }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <span style={{
            width: '16px', height: '16px', borderRadius: '5px',
            background: THEME.goldLight, color: THEME.gold,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '8px', fontWeight: 700, fontFamily: 'monospace',
          }}>{index + 1}</span>
          {name}
        </span>
      </td>
      <td style={{ padding: '7px 10px', fontSize: '10px', fontWeight: 700, color: THEME.gold, textAlign: 'right', fontFamily: 'monospace', borderBottom: `1px solid ${THEME.border}40` }}>
        ×{quantity}
      </td>
    </tr>
  );
}

export default function ReportPDF({ report }) {
  if (!report) return null;

  const regularRate = report.totalOrder > 0 ? Math.round((report.regularOrder / report.totalOrder) * 100) : 0;
  const customizeRate = report.totalOrder > 0 ? Math.round((report.customizeOrder / report.totalOrder) * 100) : 0;
  const advanceRate = report.totalOrderValue > 0 ? Math.round((report.totalAdvance / report.totalOrderValue) * 100) : 0;
  const pendingAmount = Math.max(0, (report.totalOrderValue || 0) - (report.totalAdvance || 0));

  return (
    <div
      id="report-pdf-content"
      style={{
        width: '794px',
        background: '#FFFFFF',
        fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
        color: THEME.text,
        padding: '0',
        position: 'absolute',
        left: '-9999px',
        top: 0,
      }}
    >
      {/* Header */}
      <div style={{
        background: `linear-gradient(135deg, ${THEME.gold}, ${THEME.gold}DD)`,
        padding: '28px 32px',
        color: '#FFFFFF',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
        <div style={{ position: 'absolute', bottom: '-20px', left: '40%', width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h1 style={{ fontSize: '22px', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>Anzaar Islamic Lifestyle</h1>
              <p style={{ fontSize: '11px', opacity: 0.8, margin: '4px 0 0' }}>Daily Order Report</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>{report.dateString}</p>
              <p style={{ fontSize: '11px', opacity: 0.8, margin: '2px 0 0' }}>{report.dayOfWeek}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{ padding: '20px 32px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '20px' }}>
          <StatBox label="Total Orders" value={formatNumber(report.totalOrder)} color={THEME.gold} />
          <StatBox label="Total Products" value={formatNumber(report.totalProduct)} color={THEME.teal} />
          <StatBox label="Total Advance" value={formatBDT(report.totalAdvance)} color={THEME.gold} />
          <StatBox label="Order Value" value={formatBDT(report.totalOrderValue)} color={THEME.teal} />
        </div>

        {/* Order Split */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
          <div style={{
            background: `linear-gradient(135deg, ${THEME.gold}08, ${THEME.gold}03)`,
            border: `1px solid ${THEME.gold}20`,
            borderRadius: '10px',
            padding: '14px 16px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '10px', fontWeight: 600, color: THEME.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Regular</span>
              <span style={{ fontSize: '18px', fontWeight: 800, color: THEME.gold, fontFamily: 'monospace' }}>{report.regularOrder}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: THEME.muted }}>
              <span>{formatNumber(report.regularProduct)} products</span>
              <span style={{ fontWeight: 600, color: THEME.gold }}>{regularRate}%</span>
            </div>
            <div style={{ marginTop: '6px', height: '4px', background: `${THEME.gold}15`, borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${regularRate}%`, background: THEME.gold, borderRadius: '2px' }} />
            </div>
          </div>

          <div style={{
            background: `linear-gradient(135deg, ${THEME.rose}08, ${THEME.rose}03)`,
            border: `1px solid ${THEME.rose}20`,
            borderRadius: '10px',
            padding: '14px 16px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '10px', fontWeight: 600, color: THEME.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Customize</span>
              <span style={{ fontSize: '18px', fontWeight: 800, color: THEME.rose, fontFamily: 'monospace' }}>{report.customizeOrder}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: THEME.muted }}>
              <span>{formatNumber(report.customizeProduct)} products</span>
              <span style={{ fontWeight: 600, color: THEME.rose }}>{customizeRate}%</span>
            </div>
            <div style={{ marginTop: '6px', height: '4px', background: `${THEME.rose}15`, borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${customizeRate}%`, background: THEME.rose, borderRadius: '2px' }} />
            </div>
          </div>
        </div>

        {/* Advance Details */}
        <div style={{
          background: THEME.bg,
          borderRadius: '10px',
          padding: '12px 16px',
          marginBottom: '20px',
          border: `1px solid ${THEME.border}40`,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginBottom: '4px' }}>
            <span style={{ color: THEME.muted }}>Advance Collected</span>
            <span style={{ fontWeight: 700, color: THEME.teal, fontFamily: 'monospace' }}>{formatBDT(report.totalAdvance)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginBottom: '4px' }}>
            <span style={{ color: THEME.muted }}>Pending Amount</span>
            <span style={{ fontWeight: 700, color: THEME.rose, fontFamily: 'monospace' }}>{formatBDT(pendingAmount)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
            <span style={{ color: THEME.muted }}>Advance Rate</span>
            <span style={{ fontWeight: 700, color: THEME.gold, fontFamily: 'monospace' }}>{advanceRate}%</span>
          </div>
        </div>

        {/* Products Table */}
        {report.products && report.products.length > 0 && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <h3 style={{ fontSize: '12px', fontWeight: 700, color: THEME.text, margin: 0 }}>Products Ordered</h3>
              <span style={{
                fontSize: '9px', fontWeight: 600, color: THEME.gold,
                background: THEME.goldLight, border: `1px solid ${THEME.gold}20`,
                borderRadius: '12px', padding: '2px 8px',
              }}>{report.products.length} items</span>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', border: `1px solid ${THEME.border}40`, borderRadius: '8px', overflow: 'hidden' }}>
              <thead>
                <tr style={{ background: THEME.bg }}>
                  <th style={{ padding: '8px 10px', fontSize: '9px', fontWeight: 600, color: THEME.muted, textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'left', borderBottom: `1px solid ${THEME.border}40` }}>Product</th>
                  <th style={{ padding: '8px 10px', fontSize: '9px', fontWeight: 600, color: THEME.muted, textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'right', borderBottom: `1px solid ${THEME.border}40` }}>Qty</th>
                </tr>
              </thead>
              <tbody>
                {report.products.map((p, i) => (
                  <ProductRow key={p.name} name={p.name} quantity={p.quantity} index={i} odd={i % 2 === 0} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{
        borderTop: `1px solid ${THEME.border}40`,
        padding: '14px 32px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <p style={{ fontSize: '8px', color: THEME.muted, margin: 0 }}>Anzaar Islamic Lifestyle · Sales Report System</p>
        <p style={{ fontSize: '8px', color: THEME.muted, margin: 0 }}>
          Generated {new Date().toLocaleDateString('en-BD', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
}
