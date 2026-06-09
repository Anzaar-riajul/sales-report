import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, getDocs, query, where, writeBatch, Timestamp, increment, arrayUnion } from 'firebase/firestore';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

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

const FILE_PATH = join(__dirname, '..', 'Anzaar Sales Report updet.csv');

const MONTH_MAP = {
  january: '01', february: '02', march: '03', april: '04',
  may: '05', june: '06', july: '07', august: '08',
  september: '09', october: '10', november: '11', december: '12',
};

function extractNumber(pattern, text) {
  const regex = new RegExp(pattern, 'i');
  const match = text.match(regex);
  if (!match) return 0;
  return parseInt(match[1].replace(/,/g, ''), 10) || 0;
}

function parseCommaNumber(str) {
  if (!str) return 0;
  const cleaned = str.replace(/,/g, '').trim();
  const num = parseInt(cleaned, 10);
  return isNaN(num) ? 0 : num;
}

function parseProductLine(line) {
  const trimmed = line.trim();
  if (!trimmed) return null;
  const cleaned = trimmed.replace(/^[\d]+[.)]\s*/, '').replace(/^[-•·]\s*/, '').trim();
  if (!cleaned) return null;
  if (/^(Regular|Customize|Total|Bismillah|Anzaar|Online|Order)/i.test(cleaned)) return null;
  if (/^Order|Product|Advance|Value/i.test(cleaned) && /\d/.test(cleaned)) return null;

  const dashMatch = cleaned.match(/^(.+?)\s*[-–—]\s*(\d+)\s*$/);
  if (dashMatch) return { name: dashMatch[1].trim(), quantity: parseInt(dashMatch[2], 10) };

  const colonMatch = cleaned.match(/^(.+?):\s*(\d+)\s*$/);
  if (colonMatch) return { name: colonMatch[1].trim(), quantity: parseInt(colonMatch[2], 10) };

  const spaceMatch = cleaned.match(/^(.+?)\s+(\d+)\s*$/);
  if (spaceMatch) {
    const qty = parseInt(spaceMatch[2], 10);
    if (qty < 200) return { name: spaceMatch[1].trim(), quantity: qty };
  }
  return null;
}

function parseReport(rawText) {
  const dateRegex = /(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December),?\s+(\d{4})/i;
  const dateMatch = rawText.match(dateRegex);
  let dateString = null, dayOfWeek = null, date = null;
  if (dateMatch) {
    const day = dateMatch[1].padStart(2, '0');
    const month = MONTH_MAP[dateMatch[2].toLowerCase()];
    const year = dateMatch[3];
    dateString = `${year}-${month}-${day}`;
    const dayRegex = /\((Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday)\)/i;
    const dayMatch = rawText.match(dayRegex);
    dayOfWeek = dayMatch ? dayMatch[1].charAt(0).toUpperCase() + dayMatch[1].slice(1).toLowerCase() : null;
    date = new Date(`${dateString}T00:00:00`);
  }

  const regularOrder = extractNumber(/(?:Regular\s*Order)[:\s]*(\d[\d,]*)/, rawText);
  const regularProduct = extractNumber(/(?:Regular\s*Product)[:\s]*(\d[\d,]*)/, rawText);
  const customizeOrder = extractNumber(/(?:Customize\s*order|Customize\s*Order)[:\s]*(\d[\d,]*)/, rawText);
  const customizeProduct = extractNumber(/(?:Customize\s*Product|Customize\s*product)[:\s]*(\d[\d,]*)/, rawText);
  const totalOrder = extractNumber(/(?:Total\s*Order)[:\s]*(\d[\d,]*)/, rawText);
  const totalProduct = extractNumber(/(?:Total\s*Product)[:\s]*(\d[\d,]*)/, rawText);
  const advanceMatch = rawText.match(/(?:Total\s*Advance)[:\s]*([\d,]+)/i);
  const totalAdvance = advanceMatch ? parseCommaNumber(advanceMatch[1]) : 0;
  const valueMatch = rawText.match(/(?:Total\s*Order\s*Value)[:\s]*([\d,]+)/i);
  const totalOrderValue = valueMatch ? parseCommaNumber(valueMatch[1]) : 0;

  const outstandingAmount = totalOrderValue - totalAdvance;
  const advanceRate = totalOrderValue > 0 ? Math.round((totalAdvance / totalOrderValue) * 100) : 0;
  const avgOrderValue = totalOrder > 0 ? Math.round(totalOrderValue / totalOrder) : 0;

  const lines = rawText.split('\n');
  const products = [];
  let inProductList = false;
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (/^=+/.test(trimmed)) { inProductList = true; continue; }
    if (!inProductList && /^\d+[.)]\s*/.test(trimmed) && /[A-Za-z]/.test(trimmed)) inProductList = true;
    if (inProductList) {
      const product = parseProductLine(trimmed);
      if (product) {
        const existing = products.find(p => p.name.toLowerCase() === product.name.toLowerCase());
        if (existing) existing.quantity += product.quantity;
        else products.push(product);
      }
    }
  }

  return { date, dateString, dayOfWeek, regularOrder, regularProduct, customizeOrder, customizeProduct, totalOrder, totalProduct, totalAdvance, totalOrderValue, outstandingAmount, advanceRate, avgOrderValue, products, rawText };
}

function batchParsePaste(bulkText) {
  if (!bulkText) return [];
  const datePattern = /(?:✿+\s*)?(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December),?\s+(\d{4})(?:\s*✿+)?/gi;
  const splits = [];
  let lastIndex = 0, lastMatch = null;
  let match;
  while ((match = datePattern.exec(bulkText)) !== null) {
    if (lastMatch) {
      const block = bulkText.slice(lastIndex, match.index).trim();
      if (block) {
        const day = lastMatch[1].padStart(2, '0');
        const monthStr = lastMatch[2].toLowerCase();
        const year = lastMatch[3];
        const dateStr = `${year}-${MONTH_MAP[monthStr] || '01'}-${day}`;
        splits.push({ rawText: block, dateString: dateStr });
      }
    }
    lastIndex = match.index;
    lastMatch = match;
  }
  if (lastMatch) {
    const block = bulkText.slice(lastIndex).trim();
    if (block) {
      const day = lastMatch[1].padStart(2, '0');
      const monthStr = lastMatch[2].toLowerCase();
      const year = lastMatch[3];
      const dateStr = `${year}-${MONTH_MAP[monthStr] || '01'}-${day}`;
      splits.push({ rawText: block, dateString: dateStr });
    }
  }
  const results = [];
  for (const { rawText } of splits) {
    const parsed = parseReport(rawText);
    if (parsed.dateString) results.push(parsed);
  }
  return results;
}

async function getExistingByDate(dateString) {
  const q = query(collection(db, 'reports'), where('dateString', '==', dateString));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() };
}

async function importReports(parsedList) {
  let imported = 0, skipped = 0, failed = 0;
  for (let i = 0; i < parsedList.length; i++) {
    const report = parsedList[i];
    const existing = await getExistingByDate(report.dateString);
    if (existing) {
      console.log(`  [${i + 1}/${parsedList.length}] ${report.dateString} — already exists, skipping`);
      skipped++;
      continue;
    }
    try {
      const products = report.products.map(p => ({ name: p.name, quantity: p.quantity || 0, category: 'Uncategorized' }));
      const reportData = {
        date: Timestamp.fromDate(report.date || new Date()),
        dateString: report.dateString, dayOfWeek: report.dayOfWeek,
        regularOrder: report.regularOrder || 0, regularProduct: report.regularProduct || 0,
        customizeOrder: report.customizeOrder || 0, customizeProduct: report.customizeProduct || 0,
        totalOrder: report.totalOrder || 0, totalProduct: report.totalProduct || 0,
        totalAdvance: report.totalAdvance || 0, totalOrderValue: report.totalOrderValue || 0,
        outstandingAmount: report.outstandingAmount || 0, advanceRate: report.advanceRate || 0,
        avgOrderValue: report.avgOrderValue || 0, products, rawText: report.rawText,
        createdAt: Timestamp.now(),
      };

      const batch = writeBatch(db);
      const reportRef = doc(collection(db, 'reports'));
      batch.set(reportRef, reportData);

      const dateParts = report.dateString.split('-');
      const dateObj = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
      const dateTimestamp = Timestamp.fromDate(dateObj);

      for (const product of products) {
        const productRef = doc(db, 'products', product.name);
        batch.set(productRef, {
          name: product.name, category: product.category,
          totalQuantitySold: increment(product.quantity),
          totalAppearances: increment(1),
          lastSeenDate: dateTimestamp, firstSeenDate: dateTimestamp,
          dailyHistory: arrayUnion({ date: report.dateString, quantity: product.quantity }),
        }, { merge: true });
      }
      await batch.commit();
      imported++;
      console.log(`  [${i + 1}/${parsedList.length}] ${report.dateString} — ✓ imported (O:${report.totalOrder} P:${report.totalProduct} ৳${(report.totalOrderValue || 0).toLocaleString()})`);
    } catch (err) {
      failed++;
      console.log(`  [${i + 1}/${parsedList.length}] ${report.dateString} — ✕ FAILED: ${err.message}`);
    }
  }
  return { imported, skipped, failed };
}

async function main() {
  console.log('\n📦 Batch Import from paste file\n');

  const content = readFileSync(FILE_PATH, 'utf-8');
  console.log(`📄 Read file: ${(content.length / 1024).toFixed(0)} KB`);

  const parsed = batchParsePaste(content);
  console.log(`🔍 Detected ${parsed.length} daily reports\n`);

  const { imported, skipped, failed } = await importReports(parsed);

  console.log(`\n✅ Done! Imported: ${imported}, Skipped (already exist): ${skipped}, Failed: ${failed}\n`);
  process.exit(0);
}

main().catch(err => { console.error('❌ Fatal:', err.message); process.exit(1); });
