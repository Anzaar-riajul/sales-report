import Sidebar from './Sidebar';
import Header from './Header';
import { useReports } from '../../hooks/useReports';

export default function Layout({ children, user }) {
  const { reports } = useReports();
  const latestReport = reports && reports.length > 0 ? reports[0] : null;

  return (
    <div className="min-h-screen bg-bg-primary">
      <Sidebar user={user} />
      <div className="lg:ml-60 pb-14 lg:pb-0">
        <Header latestReport={latestReport} />
        <main className="px-2 pt-4 pb-1 sm:px-3 sm:pt-6 sm:pb-2">
          {children}
        </main>
      </div>
    </div>
  );
}
