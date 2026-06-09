import { collection, query, orderBy, getDocs, doc, getDoc, updateDoc, setDoc, Timestamp, writeBatch, where, arrayUnion, arrayRemove, increment } from 'firebase/firestore';
import { db } from './config';
import { categorizeProduct } from '../utils/categorize';

const REPORTS_COLLECTION = 'reports';
const PRODUCTS_COLLECTION = 'products';
const CATEGORY_MAP_COLLECTION = 'config';
const CATEGORY_MAP_DOC = 'productCategoryMap';

let cachedCategoryMappings = null;

async function withRetry(fn, maxRetries = 1) {
  for (let i = 0; i <= maxRetries; i++) {
    try {
      const result = await Promise.race([
        fn(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 15000))
      ]);
      return result;
    } catch (err) {
      if (err.message === 'timeout' && i < maxRetries) {
        await new Promise(r => setTimeout(r, 500));
        continue;
      }
      if ((err.code === 'unavailable' || err.code === 'deadline-exceeded' || err.message?.includes('offline')) && i < maxRetries) {
        await new Promise(r => setTimeout(r, 1000 * (i + 1)));
        continue;
      }
      throw err;
    }
  }
}

export async function getReports() {
  const snapshot = await withRetry(() => getDocs(query(collection(db, REPORTS_COLLECTION), orderBy('dateString', 'desc'))));
  return snapshot.docs.map(doc => {
    const data = doc.data();
    const { rawText, ...rest } = data;
    return { id: doc.id, ...rest };
  });
}

export async function getReportRawText(dateString) {
  const q = query(collection(db, REPORTS_COLLECTION), where('dateString', '==', dateString));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  return snapshot.docs[0].data().rawText || '';
}

export async function getReportByDate(dateString) {
  const snapshot = await withRetry(() => getDocs(query(collection(db, REPORTS_COLLECTION), where('dateString', '==', dateString))));
  if (snapshot.empty) return null;
  const docSnap = snapshot.docs[0];
  return { id: docSnap.id, ...docSnap.data() };
}

// Helper function to parse Bengali/English date strings
function parseFlexibleDate(dateString) {
  if (!dateString) return new Date();
  
  // Extract just the date part (e.g., "08 June, 2026" from "08 June, 2026 (Monday)")
  const dateMatch = dateString.match(/(\d{1,2})\s+(\w+),?\s+(\d{4})/);
  if (!dateMatch) return new Date(); // Fallback
  
  const [, day, month, year] = dateMatch;
  
  // Month mapping (English & Bengali)
  const monthMap = {
    'January': 0, 'February': 1, 'March': 2, 'April': 3, 'May': 4, 'June': 5,
    'July': 6, 'August': 7, 'September': 8, 'October': 9, 'November': 10, 'December': 11,
    'জানুয়ারি': 0, 'ফেব্রুয়ারি': 1, 'মার্চ': 2, 'এপ্রিল': 3, 'মে': 4, 'জুন': 5,
    'জুলাই': 6, 'আগস্ট': 7, 'সেপ্টেম্বর': 8, 'অক্টোবর': 9, 'নভেম্বর': 10, 'ডিসেম্বর': 11,
  };
  
  const monthIndex = monthMap[month] ?? 0;
  return new Date(parseInt(year), monthIndex, parseInt(day));
}

export async function saveReport(parsedData, existingId = null) {
  const mappings = await getCategoryMappings();

  const products = parsedData.products.map(p => ({
    name: p.name,
    quantity: p.quantity || 0,
    category: mappings[p.name] || categorizeProduct(p.name),
  }));

  const reportData = {
    date: Timestamp.fromDate(parsedData.date || new Date()),
    dateString: parsedData.dateString,
    dayOfWeek: parsedData.dayOfWeek,
    regularOrder: parsedData.regularOrder || 0,
    regularProduct: parsedData.regularProduct || 0,
    customizeOrder: parsedData.customizeOrder || 0,
    customizeProduct: parsedData.customizeProduct || 0,
    totalOrder: parsedData.totalOrder || 0,
    totalProduct: parsedData.totalProduct || 0,
    totalAdvance: parsedData.totalAdvance || 0,
    totalOrderValue: parsedData.totalOrderValue || 0,
    outstandingAmount: parsedData.outstandingAmount || 0,
    advanceRate: parsedData.advanceRate || 0,
    avgOrderValue: parsedData.avgOrderValue || 0,
    products,
    rawText: parsedData.rawText,
    createdAt: Timestamp.now(),
  };

  const batch = writeBatch(db);
  const reportRef = existingId
    ? doc(db, REPORTS_COLLECTION, existingId)
    : doc(collection(db, REPORTS_COLLECTION));

  batch.set(reportRef, reportData, { merge: !!existingId });

  const dateTimestamp = Timestamp.fromDate(parsedData.date || new Date(parsedData.dateString + 'T00:00:00'));

  for (const product of products) {
    const productRef = doc(db, PRODUCTS_COLLECTION, product.name);
    batch.set(productRef, {
      name: product.name,
      category: product.category,
      totalQuantitySold: increment(product.quantity),
      totalAppearances: increment(1),
      lastSeenDate: dateTimestamp,
      firstSeenDate: dateTimestamp,
      dailyHistory: arrayUnion({ date: parsedData.dateString, quantity: product.quantity }),
    }, { merge: true });
  }

  await withRetry(() => batch.commit());
  return { id: existingId || reportRef.id, isUpdate: !!existingId };
}

export async function getProducts() {
  const snapshot = await getDocs(collection(db, PRODUCTS_COLLECTION));
  return snapshot.docs.map(doc => {
    const data = doc.data();
    const { dailyHistory, ...rest } = data;
    const lastDateFromHistory = dailyHistory?.length > 0
      ? dailyHistory.map(h => h.date).sort().pop()
      : null;
    return { id: doc.id, ...rest, _lastSeenDate: lastDateFromHistory };
  });
}

export async function getProductDetail(name) {
  const ref = doc(db, PRODUCTS_COLLECTION, name);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

export async function getReportCount() {
  const snapshot = await getDocs(collection(db, REPORTS_COLLECTION));
  return snapshot.size;
}

export async function updateProductCategory(productName, newCategory) {
  const ref = doc(db, PRODUCTS_COLLECTION, productName);
  await updateDoc(ref, { category: newCategory });
  if (cachedCategoryMappings) {
    cachedCategoryMappings[productName] = newCategory;
  }
  await saveCategoryMapping(productName, newCategory);
}

export async function saveCategoryMapping(productName, category) {
  const ref = doc(db, CATEGORY_MAP_COLLECTION, CATEGORY_MAP_DOC);
  const snap = await getDoc(ref);
  const existing = snap.exists() ? (snap.data().mappings || {}) : {};
  existing[productName] = category;
  await setDoc(ref, { mappings: existing }, { merge: true });
}

export async function getCategoryMappings() {
  if (cachedCategoryMappings) return cachedCategoryMappings;
  try {
    const ref = doc(db, CATEGORY_MAP_COLLECTION, CATEGORY_MAP_DOC);
    const snap = await getDoc(ref);
    const mappings = snap.exists() ? (snap.data().mappings || {}) : {};
    cachedCategoryMappings = mappings;
    return mappings;
  } catch {
    return cachedCategoryMappings || {};
  }
}

export async function deleteReport(reportId, products, dateString) {
  const batch = writeBatch(db);
  batch.delete(doc(db, REPORTS_COLLECTION, reportId));
  for (const product of products) {
    const productRef = doc(db, PRODUCTS_COLLECTION, product.name);
    batch.update(productRef, {
      totalQuantitySold: increment(-(product.quantity || 0)),
      totalAppearances: increment(-1),
      dailyHistory: arrayRemove({ date: dateString, quantity: product.quantity }),
    });
  }
  await withRetry(() => batch.commit());
}
