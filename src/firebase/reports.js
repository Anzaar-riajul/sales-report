import { collection, query, orderBy, getDocs, doc, getDoc, Timestamp, writeBatch, where } from 'firebase/firestore';
import { db } from './config';
import { categorizeProduct } from '../utils/categorize';

const REPORTS_COLLECTION = 'reports';
const PRODUCTS_COLLECTION = 'products';

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
  const products = parsedData.products.map(p => ({
    name: p.name,
    quantity: p.quantity || 0,
    category: categorizeProduct(p.name),
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

  const productRefs = products.map(p => doc(db, PRODUCTS_COLLECTION, p.name));
  const productSnaps = await Promise.all(productRefs.map(ref => getDoc(ref)));

  const dateString = parsedData.dateString;
  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    const snap = productSnaps[i];
    const ref = productRefs[i];

    if (snap.exists()) {
      const data = snap.data();
      const dailyHistory = (data.dailyHistory || []).map(e => ({ ...e }));
      const existingEntry = dailyHistory.find(h => h.date === dateString);

      if (existingEntry) {
        existingEntry.quantity += product.quantity;
      } else {
        dailyHistory.push({ date: dateString, quantity: product.quantity });
      }

      batch.set(ref, {
        name: product.name,
        category: product.category,
        totalQuantitySold: (data.totalQuantitySold || 0) + product.quantity,
        totalAppearances: existingEntry ? (data.totalAppearances || 1) : (data.totalAppearances || 0) + 1,
        lastSeenDate: Timestamp.fromDate(new Date(dateString + 'T00:00:00')),
        firstSeenDate: data.firstSeenDate || Timestamp.fromDate(new Date(dateString + 'T00:00:00')),
        dailyHistory,
      });
    } else {
      batch.set(ref, {
        name: product.name,
        category: product.category,
        totalQuantitySold: product.quantity,
        totalAppearances: 1,
        lastSeenDate: Timestamp.fromDate(new Date(dateString + 'T00:00:00')),
        firstSeenDate: Timestamp.fromDate(new Date(dateString + 'T00:00:00')),
        dailyHistory: [{ date: dateString, quantity: product.quantity }],
      });
    }
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
