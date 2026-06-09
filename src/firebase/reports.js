import { collection, query, orderBy, getDocs, doc, getDoc, updateDoc, setDoc, Timestamp, writeBatch, where, arrayUnion, increment } from 'firebase/firestore';
import { db } from './config';
import { categorizeProduct } from '../utils/categorize';

const REPORTS_COLLECTION = 'reports';
const PRODUCTS_COLLECTION = 'products';
const CATEGORY_MAP_COLLECTION = 'config';
const CATEGORY_MAP_DOC = 'productCategoryMap';

let cachedCategoryMappings = null;

export async function getReports() {
  const q = query(collection(db, REPORTS_COLLECTION), orderBy('dateString', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function getReportByDate(dateString) {
  const q = query(collection(db, REPORTS_COLLECTION), where('dateString', '==', dateString));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const docSnap = snapshot.docs[0];
  return { id: docSnap.id, ...docSnap.data() };
}

export async function saveReport(parsedData, existingId = null) {
  if (!cachedCategoryMappings) {
    cachedCategoryMappings = await getCategoryMappings();
  }

  const products = parsedData.products.map(p => ({
    name: p.name,
    quantity: p.quantity || 0,
    category: cachedCategoryMappings[p.name] || categorizeProduct(p.name),
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

  const dateTimestamp = Timestamp.fromDate(new Date(parsedData.dateString + 'T00:00:00'));

  for (const product of products) {
    const productRef = doc(db, PRODUCTS_COLLECTION, product.name);
    // merge:true so firstSeenDate is only written on creation (won't overwrite existing)
    batch.set(productRef, {
      name: product.name,
      category: product.category,
      totalQuantitySold: increment(product.quantity),  // ⚡ atomic, no read needed
      totalAppearances: increment(1),                  // ⚡ atomic, no read needed
      lastSeenDate: dateTimestamp,
      firstSeenDate: dateTimestamp,
      dailyHistory: arrayUnion({ date: parsedData.dateString, quantity: product.quantity }),
    }, { merge: true });
  }

  await batch.commit();
  return { id: existingId || reportRef.id, isUpdate: !!existingId };
}

export async function getProducts() {
  const snapshot = await getDocs(collection(db, PRODUCTS_COLLECTION));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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
  const ref = doc(db, CATEGORY_MAP_COLLECTION, CATEGORY_MAP_DOC);
  const snap = await getDoc(ref);
  const mappings = snap.exists() ? (snap.data().mappings || {}) : {};
  cachedCategoryMappings = mappings;
  return mappings;
}
