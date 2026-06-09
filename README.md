# Anzaar Islamic Lifestyle — Dashboard

A full-stack analytics dashboard for **Anzaar Islamic Lifestyle**, a Bangladeshi Islamic fashion brand. Automatically parses daily order reports and generates deep business intelligence.

## Tech Stack

- **Frontend:** React 18 + Vite
- **Styling:** Tailwind CSS v3
- **Charts:** Recharts
- **Database:** Firebase Firestore (free tier)
- **Auth:** Firebase Auth (Google Sign-In)
- **Hosting:** Vercel (free tier)

## Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project (or use existing)
3. Enable **Firestore Database** (start in test mode, then apply rules)
4. Enable **Authentication** → **Google provider**
5. Add your authorized domain (e.g., `localhost` for dev, `your-app.vercel.app` for prod)
6. Go to Project Settings → General → Your apps → **Web app**
7. Copy the Firebase config values

## Environment Variables

Copy `.env.example` to `.env` and fill in your Firebase config:

```bash
cp .env.example .env
```

Then edit `.env`:

```
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

## Local Development

```bash
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

## First Login

1. Sign in with Google
2. Go to Firebase Console → Firestore
3. Create a document at `config/allowedUsers` with a field `uids` (array) containing your Google account UID:

```json
{
  "uids": ["your-google-uid-here"]
}
```

You can find your UID by signing in once and checking the Firebase Auth console, or by looking at the network request in your browser's dev tools.

## Deploy to Vercel

```bash
npm install -g vercel
vercel --prod
```

Add the environment variables in the Vercel dashboard (Settings → Environment Variables).

Then update Firebase Authentication → Authorized domains to include your Vercel domain.

## Firestore Security Rules

Apply the rules in `firestore.rules`:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null
        && request.auth.uid in get(/databases/$(database)/documents/config/allowedUsers).data.uids;
    }
  }
}
```

## Report Format

Paste daily reports in this format:

```
Bismillahir Rahmanir Rahim
Anzaar Islamic Lifestyle
Online Order update: 08 June, 2026 (Monday)
 Regular Order: 68 pcs Regular Product: 82 Pcs Customize order: 21 pcs Customize Product: 27 pcs Total Order: 89 Total Product: 109 pcs Total Advance: 39,135 TK Total Order Value: 3,15,475 TK
==================
1. Abaya Airaffa-4
2. Abaya Anaira v1-2
3. Abaya Tahsheen-6
```

## Project Structure

```
src/
├── components/
│   ├── Dashboard/    — Summary cards, charts, top products
│   ├── Input/        — Report paste box
│   ├── Layout/       — Sidebar, header, layout wrapper
│   ├── Products/     — Product ranking, category breakdown, dead stock
│   ├── Reports/      — Daily, weekly, monthly reports
│   └── UI/           — Card, Badge, Alert, Loader
├── firebase/         — Firebase config, auth, Firestore CRUD
├── hooks/            — useAuth, useReports, useProducts
├── pages/            — Dashboard, DailyInput, Analytics, Products, Alerts
└── utils/            — Parser, categorizer, analytics, formatters
```
