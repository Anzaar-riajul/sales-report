import Sidebar from './Sidebar';
import Header from './Header';
import { useReports } from '../../hooks/useReports';

export default function Layout({ children, user }) {
  const { reports } = useReports();
  const latestReport = reports && reports.length > 0 ? reports[0] : null;

  return (
    <div className="min-h-screen bg-bg-primary">
      <Sidebar user={user} />
      <div className="lg:ml-60 pb-16 lg:pb-0">
        <Header latestReport={latestReport} />
        <main className="p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
