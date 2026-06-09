import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, orderBy, getDocs } from 'firebase/firestore';

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

async function main() {
  console.log('\n📊 Firestore Data Verification\n');

  const snapshot = await getDocs(query(collection(db, 'reports'), orderBy('dateString', 'desc')));
  const reports = snapshot.docs.map(d => d.data());

  console.log(`Total reports: ${reports.length}\n`);

  const agg = reports.reduce((acc, r) => ({
    totalOrder: acc.totalOrder + (r.totalOrder || 0),
    regularOrder: acc.regularOrder + (r.regularOrder || 0),
    customizeOrder: acc.customizeOrder + (r.customizeOrder || 0),
    totalProduct: acc.totalProduct + (r.totalProduct || 0),
    regularProduct: acc.regularProduct + (r.regularProduct || 0),
    customizeProduct: acc.customizeProduct + (r.customizeProduct || 0),
    totalOrderValue: acc.totalOrderValue + (r.totalOrderValue || 0),
    totalAdvance: acc.totalAdvance + (r.totalAdvance || 0),
  }), { totalOrder: 0, regularOrder: 0, customizeOrder: 0, totalProduct: 0, regularProduct: 0, customizeProduct: 0, totalOrderValue: 0, totalAdvance: 0 });

  const avgOrderValue = agg.totalOrder > 0 ? Math.round(agg.totalOrderValue / agg.totalOrder) : 0;
  const advanceRate = agg.totalOrderValue > 0 ? Math.round((agg.totalAdvance / agg.totalOrderValue) * 100) : 0;
  const customizeRate = agg.totalOrder > 0 ? Math.round((agg.customizeOrder / agg.totalOrder) * 100) : 0;
  const outstanding = agg.totalOrderValue - agg.totalAdvance;

  console.log('━━━ ALL-TIME TOTALS (Dashboard → Last 7d may show less) ━━━\n');
  console.log(`  📦 Total Orders:      ${agg.totalOrder.toLocaleString()}`);
  console.log(`     Regular:           ${agg.regularOrder.toLocaleString()}`);
  console.log(`     Customize:         ${agg.customizeOrder.toLocaleString()}`);
  console.log(`  💰 Total Order Value: ৳${agg.totalOrderValue.toLocaleString()}`);
  console.log(`  💳 Total Advance:     ৳${agg.totalAdvance.toLocaleString()}`);
  console.log(`  ⏳ Outstanding:       ৳${outstanding.toLocaleString()}`);
  console.log(`  📈 Advance Rate:      ${advanceRate}%`);
  console.log(`  🧾 Avg Order Value:   ৳${avgOrderValue.toLocaleString()}`);
  console.log(`  🎨 Customize Rate:    ${customizeRate}%`);
  console.log(`  📐 Total Products:    ${agg.totalProduct.toLocaleString()}`);
  console.log(`     Reg Products:      ${agg.regularProduct.toLocaleString()}`);
  console.log(`     Cust Products:     ${agg.customizeProduct.toLocaleString()}`);

  console.log('\n━━━ LAST 7 REPORTS ━━━\n');
  const last7 = reports.slice(0, 7);
  const agg7 = last7.reduce((acc, r) => ({
    totalOrder: acc.totalOrder + (r.totalOrder || 0),
    regularOrder: acc.regularOrder + (r.regularOrder || 0),
    customizeOrder: acc.customizeOrder + (r.customizeOrder || 0),
    totalOrderValue: acc.totalOrderValue + (r.totalOrderValue || 0),
    totalAdvance: acc.totalAdvance + (r.totalAdvance || 0),
    totalProduct: acc.totalProduct + (r.totalProduct || 0),
  }), { totalOrder: 0, regularOrder: 0, customizeOrder: 0, totalOrderValue: 0, totalAdvance: 0, totalProduct: 0 });
  const aov7 = agg7.totalOrder > 0 ? Math.round(agg7.totalOrderValue / agg7.totalOrder) : 0;
  const advRate7 = agg7.totalOrderValue > 0 ? Math.round((agg7.totalAdvance / agg7.totalOrderValue) * 100) : 0;
  const custRate7 = agg7.totalOrder > 0 ? Math.round((agg7.customizeOrder / agg7.totalOrder) * 100) : 0;

  console.log(`  Orders:     ${agg7.totalOrder}`);
  console.log(`  Value:      ৳${agg7.totalOrderValue.toLocaleString()}`);
  console.log(`  Advance:    ৳${agg7.totalAdvance.toLocaleString()}`);
  console.log(`  AOV:        ৳${aov7.toLocaleString()}`);
  console.log(`  Adv Rate:   ${advRate7}%`);
  console.log(`  Cust Rate:  ${custRate7}%`);
  console.log(`  Products:   ${agg7.totalProduct}`);

  console.log('\n━━━ LATEST 7 REPORTS (daily) ━━━\n');
  last7.forEach(r => {
    console.log(`  ${r.dateString}  O:${r.totalOrder}  P:${r.totalProduct}  ৳${(r.totalOrderValue || 0).toLocaleString()}  Adv:${(r.totalAdvance || 0).toLocaleString()}  ${r.dayOfWeek || ''}`);
  });

  console.log('\n━━━ PRODUCT STATS ━━━\n');
  const prodSnap = await getDocs(collection(db, 'products'));
  const products = prodSnap.docs.map(d => d.data());
  const totalQty = products.reduce((s, p) => s + (p.totalQuantitySold || 0), 0);
  const dead = products.filter(p => {
    const last = p.lastSeenDate?.toDate?.();
    if (!last) return false;
    return (Date.now() - last.getTime()) > 14 * 86400000;
  });

  console.log(`  Total unique products: ${products.length}`);
  console.log(`  Total qty sold:        ${totalQty}`);
  console.log(`  Dead (14d+ no sale):   ${dead.length}`);

  console.log('\n✅ Verification complete!\n');
  process.exit(0);
}

main().catch(err => { console.error('❌', err.message); process.exit(1); });
