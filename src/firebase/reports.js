import { collection, query, orderBy, getDocs, addDoc, setDoc, doc, getDoc, Timestamp, where } from 'firebase/firestore';
import { db } from './config';
import { categorizeProduct } from '../utils/categorize';

const REPORTS_COLLECTION = 'reports';
const PRODUCTS_COLLECTION = 'products';

export async function getReports() {
  try {
    const q = query(collection(db, REPORTS_COLLECTION), orderBy('dateString', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching reports:', error);
    return [];
  }
}

export async function getReportByDate(dateString) {
  try {
    const q = query(collection(db, REPORTS_COLLECTION), where('dateString', '==', dateString));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    const docSnap = snapshot.docs[0];
    return { id: docSnap.id, ...docSnap.data() };
  } catch (error) {
    console.error('Error fetching report by date:', error);
    return null;
  }
}

export async function saveReport(parsedData) {
  try {
    const existingReport = await getReportByDate(parsedData.dateString);

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

    let reportRef;
    if (existingReport) {
      reportRef = doc(db, REPORTS_COLLECTION, existingReport.id);
      await setDoc(reportRef, reportData, { merge: true });
    } else {
      reportRef = await addDoc(collection(db, REPORTS_COLLECTION), reportData);
    }

    await updateProductRecords(products, parsedData.dateString);

    return { id: existingReport ? existingReport.id : reportRef.id, ...reportData, isUpdate: !!existingReport };
  } catch (error) {
    console.error('Error saving report:', error);
    throw error;
  }
}

async function updateProductRecords(products, dateString) {
  for (const product of products) {
    try {
      const productRef = doc(db, PRODUCTS_COLLECTION, product.name);
      const productSnap = await getDoc(productRef);

      if (productSnap.exists()) {
        const data = productSnap.data();
        const dailyHistory = data.dailyHistory || [];
        const existingEntry = dailyHistory.find(h => h.date === dateString);

        if (existingEntry) {
          existingEntry.quantity += product.quantity;
        } else {
          dailyHistory.push({ date: dateString, quantity: product.quantity });
        }

        await setDoc(productRef, {
          name: product.name,
          category: product.category,
          totalQuantitySold: (data.totalQuantitySold || 0) + product.quantity,
          totalAppearances: existingEntry ? (data.totalAppearances || 1) : (data.totalAppearances || 0) + 1,
          lastSeenDate: Timestamp.fromDate(new Date(dateString + 'T00:00:00')),
          firstSeenDate: data.firstSeenDate || Timestamp.fromDate(new Date(dateString + 'T00:00:00')),
          dailyHistory,
        }, { merge: true });
      } else {
        await setDoc(productRef, {
          name: product.name,
          category: product.category,
          totalQuantitySold: product.quantity,
          totalAppearances: 1,
          lastSeenDate: Timestamp.fromDate(new Date(dateString + 'T00:00:00')),
          firstSeenDate: Timestamp.fromDate(new Date(dateString + 'T00:00:00')),
          dailyHistory: [{ date: dateString, quantity: product.quantity }],
        });
      }
    } catch (error) {
      console.error(`Error updating product ${product.name}:`, error);
    }
  }
}

export async function getProducts() {
  try {
    const snapshot = await getDocs(collection(db, PRODUCTS_COLLECTION));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
}

export async function getReportCount() {
  try {
    const snapshot = await getDocs(collection(db, REPORTS_COLLECTION));
    return snapshot.size;
  } catch (error) {
    console.error('Error counting reports:', error);
    return 0;
  }
}
