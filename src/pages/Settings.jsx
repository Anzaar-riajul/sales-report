import Card from '../components/UI/Card';

export default function Settings() {
  return (
    <div className="space-y-6 max-w-3xl">
      <h2 className="font-display text-2xl text-text-primary">Settings</h2>

      <Card>
        <h3 className="section-title mb-2">Allowed Users</h3>
        <p className="text-text-muted text-sm mb-4">
          To grant access to new users, add their UIDs to the <code className="text-accent-gold">config/allowedUsers</code> document in Firebase Firestore.
        </p>
        <div className="bg-bg-elevated rounded-lg p-4 border border-border">
          <p className="text-xs text-text-muted mb-2">Firestore path:</p>
          <code className="text-sm text-accent-gold">/config/allowedUsers</code>
          <div className="mt-2">
            <p className="text-xs text-text-muted mb-1">Document structure:</p>
            <pre className="text-xs text-text-primary bg-bg-primary p-3 rounded-lg overflow-x-auto">
{`{
  "uids": [
    "user-uid-1",
    "user-uid-2"
  ]
}`}
            </pre>
          </div>
        </div>
      </Card>

      <Card>
        <h3 className="section-title mb-2">About</h3>
        <div className="space-y-2 text-sm text-text-muted">
          <p><span className="text-text-primary">App:</span> Anzaar Islamic Lifestyle Dashboard</p>
          <p><span className="text-text-primary">Version:</span> 1.0.0</p>
          <p><span className="text-text-primary">Stack:</span> React + Vite + Tailwind CSS + Firebase + Recharts</p>
          <p><span className="text-text-primary">Hosting:</span> Vercel (free tier)</p>
        </div>
      </Card>

      <Card>
        <h3 className="section-title mb-2">Report Format</h3>
        <p className="text-text-muted text-sm mb-3">
          Paste daily reports in this format for the parser to work correctly:
        </p>
        <pre className="text-xs text-text-primary bg-bg-elevated p-4 rounded-lg border border-border overflow-x-auto leading-relaxed">
{`Bismillahir Rahmanir Rahim
Anzaar Islamic Lifestyle
Online Order update: 08 June, 2026 (Monday)
 Regular Order: 68 pcs Regular Product: 82 Pcs Customize order: 21 pcs Customize Product: 27 pcs Total Order: 89 Total Product: 109 pcs Total Advance: 39,135 TK Total Order Value: 3,15,475 TK
==================
1. Abaya Airaffa-4
2. Abaya Anaira v1-2`}
        </pre>
      </Card>
    </div>
  );
}
