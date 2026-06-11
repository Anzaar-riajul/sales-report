import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env from project root
const envPath = resolve(__dirname, '..', '.env');
const envContent = readFileSync(envPath, 'utf-8');
const envVars = {};
envContent.split('\n').filter(Boolean).forEach(line => {
  const [k, ...v] = line.split('=');
  envVars[k.trim()] = v.join('=').trim();
});

const firebaseConfig = {
  apiKey: envVars.VITE_FIREBASE_API_KEY,
  authDomain: envVars.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: envVars.VITE_FIREBASE_PROJECT_ID,
  storageBucket: envVars.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: envVars.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: envVars.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

async function main() {
  console.log('\n🔧 Fixing product lastSeenDate from dailyHistory...\n');

  const email = process.env.FIX_EMAIL || envVars.VITE_FIX_EMAIL;
  const password = process.env.FIX_PASSWORD || envVars.VITE_FIX_PASSWORD;

  if (!email || !password) {
    console.log('Set FIX_EMAIL and FIX_PASSWORD env vars or VITE_FIX_EMAIL/VITE_FIX_PASSWORD in .env');
    process.exit(1);
  }

  await signInWithEmailAndPassword(auth, email, password);
  console.log('  Authenticated ✓\n');

  const snap = await getDocs(collection(db, 'products'));
  const batch = writeBatch(db);
  let fixed = 0;
  let count = 0;

  for (const docSnap of snap.docs) {
    count++;
    const data = docSnap.data();
    const history = data.dailyHistory || [];

    if (history.length === 0) {
      continue;
    }

    const dates = history.map(h => h.date).sort();
    const correctLastSeen = dates[dates.length - 1];

    const current = data.lastSeenDate?.toDate?.();
    const currentStr = current ? current.toISOString().slice(0, 10) : 'none';

    if (currentStr !== correctLastSeen) {
      batch.update(docSnap.ref, { lastSeenDate: correctLastSeen });
      console.log(`  FIX  ${docSnap.id}: ${currentStr} → ${correctLastSeen}`);
      fixed++;
    }

    // Commit in batches of 500
    if (fixed % 500 === 0 && fixed > 0) {
      await batch.commit();
    }
  }

  if (fixed % 500 !== 0) {
    await batch.commit();
  }

  console.log(`\nDone! ${fixed} / ${count} products fixed.`);
  process.exit(0);
}

main().catch(err => { console.error('❌', err.message); process.exit(1); });
