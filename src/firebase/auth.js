import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { doc, getDoc, collection, addDoc, getDocs, deleteDoc, updateDoc, arrayUnion, serverTimestamp, query, orderBy, setDoc } from 'firebase/firestore';
import { auth, db } from './config';

export const SUPER_ADMIN_UID = 'uYdY8bst0MNxhNwj4lRnNshp71F2';

export function isSuperAdmin(uid) {
  return uid === SUPER_ADMIN_UID;
}

export async function getUserRole(uid) {
  if (!uid) return null;
  if (uid === SUPER_ADMIN_UID) return 'super_admin';
  try {
    const docRef = doc(db, 'config', 'allowedUsers');
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    const data = snap.data();
    return data.roles?.[uid] || null;
  } catch {
    return null;
  }
}

export async function isUserAllowed(uid) {
  if (!uid) return false;
  if (uid === SUPER_ADMIN_UID) return true;
  try {
    const docRef = doc(db, 'config', 'allowedUsers');
    const snap = await getDoc(docRef);
    if (!snap.exists()) return false;
    const data = snap.data();
    return data.uids?.includes(uid) && !!data.roles?.[uid];
  } catch {
    return false;
  }
}

export async function getAllUsers() {
  try {
    const docRef = doc(db, 'config', 'allowedUsers');
    const snap = await getDoc(docRef);
    if (!snap.exists()) return [];
    const data = snap.data();
    const uids = data.uids || [];
    const roles = data.roles || {};
    const profiles = data.profiles || {};
    return uids.map(uid => ({
      uid,
      role: roles[uid] || 'viewer',
      ...(profiles[uid] || {}),
    }));
  } catch {
    return [];
  }
}

export async function updateUserRole(uid, newRole) {
  try {
    const docRef = doc(db, 'config', 'allowedUsers');
    await updateDoc(docRef, {
      [`roles.${uid}`]: newRole,
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating role:', error);
    throw error;
  }
}

/* ─── Signup Request System ─── */

export async function createSignupRequest(uid, email) {
  try {
    const existing = await getSignupRequests();
    if (existing.find(r => r.uid === uid)) return { success: false, message: 'Request already pending.' };
    await addDoc(collection(db, 'signupRequests'), {
      uid,
      email,
      createdAt: serverTimestamp(),
      status: 'pending',
    });
    return { success: true };
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
  } catch {
    return [];
  }
}

export async function approveRequest(requestId, uid, email) {
  try {
    const allowedRef = doc(db, 'config', 'allowedUsers');
    await updateDoc(allowedRef, {
      uids: arrayUnion(uid),
      [`roles.${uid}`]: 'viewer',
      [`profiles.${uid}.email`]: email || '',
      [`profiles.${uid}.addedAt`]: new Date().toISOString(),
    });
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

export async function addUserDirectly(uid, email, role = 'viewer') {
  try {
    const allowedRef = doc(db, 'config', 'allowedUsers');
    await updateDoc(allowedRef, {
      uids: arrayUnion(uid),
      [`roles.${uid}`]: role,
      [`profiles.${uid}.email`]: email || '',
      [`profiles.${uid}.addedAt`]: new Date().toISOString(),
    });
    return { success: true };
  } catch (error) {
    console.error('Error adding user directly:', error);
    throw error;
  }
}

export async function removeUser(uid) {
  try {
    const allowedRef = doc(db, 'config', 'allowedUsers');
    const snap = await getDoc(allowedRef);
    if (!snap.exists()) return { success: true };
    const data = snap.data();
    const uids = (data.uids || []).filter(u => u !== uid);
    const roles = { ...(data.roles || {}) };
    const profiles = { ...(data.profiles || {}) };
    delete roles[uid];
    delete profiles[uid];
    await setDoc(allowedRef, { uids, roles, profiles });
    return { success: true };
  } catch (error) {
    console.error('Error removing user:', error);
    throw error;
  }
}

/* ─── Auth ─── */

export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback);
}

export async function loginWithEmail(email, password) {
  const result = await signInWithEmailAndPassword(auth, email, password);
  return result.user;
}

export async function signUpWithEmail(email, password) {
  const result = await createUserWithEmailAndPassword(auth, email, password);
  return result.user;
}

export async function resetPassword(email) {
  await sendPasswordResetEmail(auth, email);
}

export async function loginWithGoogle() {
  const result = await signInWithPopup(auth, new GoogleAuthProvider());
  return result.user;
}

export async function logout() {
  await signOut(auth);
}
