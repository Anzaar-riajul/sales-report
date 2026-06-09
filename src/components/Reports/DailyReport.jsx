import { useState, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Card from '../UI/Card';
import ReportPDF from '../Dashboard/ReportPDF';
import { generateReportPDF } from '../../utils/pdfGenerator';
import { formatDate } from '../../utils/formatters';
import { ChartSkeleton } from '../UI/Loader';

export default function DailyReport({ reports, loading }) {
  const [generating, setGenerating] = useState(false);

  const latestReport = reports && reports.length > 0
    ? [...reports].sort((a, b) => new Date(b.dateString) - new Date(a.dateString))[0]
    : null;

  const handleDownloadPDF = useCallback(async () => {
    if (!latestReport) return;
    setGenerating(true);
    try {
      await generateReportPDF(latestReport, 'report-pdf-content', `Anzaar-Report-${latestReport.dateString}.pdf`);
    } catch (err) {
      console.error('PDF generation failed:', err);
    } finally {
      setGenerating(false);
    }
  }, [latestReport]);

  if (loading) return <ChartSkeleton />;

  const data = reports && reports.length > 0
    ? [...reports].filter(r => r.totalOrderValue > 0).sort((a, b) => a.dateString.localeCompare(b.dateString)).slice(-14).map(r => ({
        date: formatDate(r.dateString),
        orders: r.totalOrder,
        products: r.totalProduct,
      }))
    : [];

  if (data.length === 0) {
    return (
      <Card>
        <h3 className="section-title mb-4">Daily Order Volume</h3>
        <div className="h-64 flex items-center justify-center text-text-muted text-sm">No data</div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h3 className="section-title">Daily Order Volume (Last 14 Days)</h3>
        {latestReport && (
          <button
            onClick={handleDownloadPDF}
            disabled={generating}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-medium text-accent-gold bg-accent-gold/5 hover:bg-accent-gold/10 border border-accent-gold/15 rounded-lg transition-all disabled:opacity-40"
          >
            {generating ? (
              <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            )}
            {generating ? '...' : 'PDF'}
          </button>
        )}
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" strokeOpacity={0.5} />
          <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94A3B8' }} interval="preserveStartEnd" axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} width={30} />
          <Tooltip
            contentStyle={{ background: 'rgba(255,255,255,0.95)', border: 'none', borderRadius: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.08)' }}
          />
          <Bar dataKey="orders" fill="#C9A84C" radius={[4, 4, 0, 0]} name="Orders" />
          <Bar dataKey="products" fill="#0D9488" radius={[4, 4, 0, 0]} name="Products" />
        </BarChart>
      </ResponsiveContainer>

      {/* Hidden PDF render */}
      {latestReport && <ReportPDF report={latestReport} />}
    </Card>
  );
}
