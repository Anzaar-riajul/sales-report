import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc, doc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDXf0V1x3xh1Fky0OLin711xK7qvk0fuFM",
  authDomain: "anzaar-sales-reports.firebaseapp.com",
  projectId: "anzaar-sales-reports",
  storageBucket: "anzaar-sales-reports.firebasestorage.app",
  messagingSenderId: "19436994558",
  appId: "1:19436994558:web:bcc7c35e42b01e70dd0aaf",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const COLLECTIONS = ['reports', 'products', 'config'];

async function deleteCollection(colName) {
  const snapshot = await getDocs(collection(db, colName));
  if (snapshot.empty) {
    console.log(`  [${colName}] already empty.`);
    return 0;
  }
  let count = 0;
  for (const d of snapshot.docs) {
    await deleteDoc(doc(db, colName, d.id));
    count++;
    process.stdout.write(`\r  [${colName}] Deleted ${count}/${snapshot.size} documents...`);
  }
  console.log(`\r  [${colName}] ✓ Deleted ${count} documents.           `);
  return count;
}

async function main() {
  console.log('\n🗑  Clearing Firestore...\n');
  let total = 0;
  for (const col of COLLECTIONS) {
    total += await deleteCollection(col);
  }
  console.log(`\n✅ Done! Total ${total} documents deleted.\n`);
  process.exit(0);
}

main().catch(err => { console.error('❌ Error:', err.message); process.exit(1); });
