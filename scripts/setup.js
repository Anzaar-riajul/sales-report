import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const KEY_FILE = join(__dirname, '..', 'anzaar-sales-reports-firebase-adminsdk-fbsvc-22a0204476.json');
const UID = 'uYdY8bst0MNxhNwj4lRnNshp71F2';

async function setup() {
  let serviceAccount;
  try {
    serviceAccount = JSON.parse(readFileSync(KEY_FILE, 'utf-8'));
  } catch {
    console.error('❌ Service account key file not found at:', KEY_FILE);
    console.error('   Make sure the file exists in the project root.');
    process.exit(1);
  }

  const app = initializeApp({ credential: cert(serviceAccount) });
  const db = getFirestore(app);

  console.log('✅ Firebase Admin initialized');
  console.log('📧 Project:', serviceAccount.project_id);

  // Create/verify allowedUsers document
  const docRef = db.collection('config').doc('allowedUsers');
  const doc = await docRef.get();

  if (doc.exists) {
    const data = doc.data();
    const uids = data.uids || [];
    if (uids.includes(UID)) {
      console.log('✅ allowedUsers document already exists with your UID');
    } else {
      await docRef.update({ uids: [...uids, UID] });
      console.log('✅ Your UID added to existing allowedUsers document');
    }
  } else {
    await docRef.set({ uids: [UID] });
    console.log('✅ allowedUsers document created with your UID');
  }

  console.log('\n📋 Document: config/allowedUsers');
  console.log('📋 UID:', UID);

  console.log('\n✅ Setup complete!');
  console.log('➡️  Now visit: https://sales-report-lime.vercel.app');
  console.log('➡️  Sign in with Google');

  await app.delete();
}

setup().catch(err => {
  console.error('❌ Setup failed:', err.message);
  process.exit(1);
});
