import { useState, useEffect } from 'react';
import { onAuthChange, isUserAllowed } from '../firebase/auth';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        const allowedStatus = await isUserAllowed(firebaseUser.uid);
        setAllowed(allowedStatus);
      } else {
        setUser(null);
        setAllowed(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { user, loading, allowed };
}
