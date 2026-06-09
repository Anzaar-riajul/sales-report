import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './config';

const provider = new GoogleAuthProvider();

export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback);
}

export async function loginWithGoogle() {
  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error) {
    console.error('Login error:', error);
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
