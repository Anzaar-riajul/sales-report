import { useState, useEffect } from 'react';
import { onAuthChange, isUserAllowed, isSuperAdmin } from '../firebase/auth';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [superAdmin, setSuperAdmin] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        const allowedStatus = await isUserAllowed(firebaseUser.uid);
        setAllowed(allowedStatus);
        setSuperAdmin(isSuperAdmin(firebaseUser.uid));
      } else {
        setUser(null);
        setAllowed(false);
        setSuperAdmin(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { user, loading, allowed, superAdmin };
}
