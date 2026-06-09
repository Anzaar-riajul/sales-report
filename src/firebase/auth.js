import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { doc, getDoc, collection, addDoc, getDocs, deleteDoc, updateDoc, arrayUnion, arrayRemove, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { auth, db } from './config';

export const SUPER_ADMIN_UID = 'uYdY8bst0MNxhNwj4lRnNshp71F2';

export function isSuperAdmin(uid) {
  return uid === SUPER_ADMIN_UID;
}

const provider = new GoogleAuthProvider();

export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback);
}

export async function loginWithEmail(email, password) {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
  } catch (error) {
    console.error('Email login error:', error);
    throw error;
  }
}

export async function signUpWithEmail(email, password) {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    return result.user;
  } catch (error) {
    console.error('Email signup error:', error);
    throw error;
  }
}

export async function resetPassword(email) {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    console.error('Password reset error:', error);
    throw error;
  }
}

export async function loginWithGoogle() {
  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error) {
    console.error('Google login error:', error);
    throw error;
  }
}

export async function logout() {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Logout error:', error);
    throw error;
  }
}

export async function isUserAllowed(uid) {
  if (!uid) return false;
  try {
    const docRef = doc(db, 'config', 'allowedUsers');
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return false;
    const data = docSnap.data();
    return data.uids && data.uids.includes(uid);
  } catch (error) {
    console.error('Error checking user access:', error);
    return false;
  }
}

/* ─── Signup Request System ─── */

export async function createSignupRequest(uid, email) {
  try {
    const existing = await getSignupRequests();
    if (existing.find(r => r.uid === uid)) return { success: false, message: 'Request already pending.' };
    const ref = await addDoc(collection(db, 'signupRequests'), {
      uid,
      email,
      createdAt: serverTimestamp(),
      status: 'pending',
    });
    return { success: true, id: ref.id };
  } catch (error) {
    console.error('Error creating signup request:', error);
    throw error;
  }
}

export async function getSignupRequests() {
  try {
    const q = query(collection(db, 'signupRequests'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.error('Error getting signup requests:', error);
    return [];
  }
}

export async function approveRequest(requestId, uid) {
  try {
    const allowedRef = doc(db, 'config', 'allowedUsers');
    await updateDoc(allowedRef, { uids: arrayUnion(uid) });
    await deleteDoc(doc(db, 'signupRequests', requestId));
    return { success: true };
  } catch (error) {
    console.error('Error approving request:', error);
    throw error;
  }
}

export async function rejectRequest(requestId) {
  try {
    await deleteDoc(doc(db, 'signupRequests', requestId));
    return { success: true };
  } catch (error) {
    console.error('Error rejecting request:', error);
    throw error;
  }
}

export async function addUserDirectly(uid, email) {
  try {
    const allowedRef = doc(db, 'config', 'allowedUsers');
    await updateDoc(allowedRef, { uids: arrayUnion(uid) });
    return { success: true, uid, email };
  } catch (error) {
    console.error('Error adding user directly:', error);
    throw error;
  }
}

export async function getSuperAdminEmail() {
  try {
    const docRef = doc(db, 'config', 'allowedUsers');
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    const data = snap.data();
    return data.superAdminEmail || null;
  } catch {
    return null;
  }
}
