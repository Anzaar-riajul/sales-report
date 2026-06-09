import { useState, useEffect } from 'react';
import { onAuthChange, isUserAllowed, getUserRole } from '../firebase/auth';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [role, setRole] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        const [allowedStatus, userRole] = await Promise.all([
          isUserAllowed(firebaseUser.uid),
          getUserRole(firebaseUser.uid),
        ]);
        setAllowed(allowedStatus);
        setRole(userRole);
      } else {
        setUser(null);
        setAllowed(false);
        setRole(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return { user, loading, allowed, role, isSuperAdmin: role === 'super_admin', isAdmin: role === 'super_admin' || role === 'admin' };
}
