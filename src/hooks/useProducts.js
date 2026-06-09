import { useState, useEffect } from 'react';
import { getProducts } from '../firebase/reports';
import { setCache, getCache, isCacheStale } from '../utils/cache';

const CACHE_KEY = 'products';
const CACHE_TTL = 30 * 60 * 1000;

export function useProducts() {
  const [products, setProducts] = useState(() => {
    try { return getCache(CACHE_KEY) || []; } catch { return []; }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts(forceRefresh = false) {
    try {
      const cached = getCache(CACHE_KEY);
      const stale = isCacheStale(CACHE_KEY, CACHE_TTL);

      if (cached && cached.length > 0 && !stale && !forceRefresh) {
        setProducts(cached);
        setLoading(false);
        return;
      }

      if (cached && cached.length > 0 && stale && !forceRefresh) {
        setProducts(cached);
        setLoading(false);
        refreshInBackground();
        return;
      }

      setLoading(true);
      const data = await getProducts();
      setProducts(data);
      setCache(CACHE_KEY, data, CACHE_TTL);
      setError(null);
    } catch (err) {
      setError(err.message);
      const cached = getCache(CACHE_KEY);
      if (cached && cached.length > 0) setProducts(cached);
    } finally {
      setLoading(false);
    }
  }

  async function refreshInBackground() {
    try {
      const data = await getProducts();
      if (data && data.length > 0) {
        setProducts(data);
        setCache(CACHE_KEY, data, CACHE_TTL);
      }
    } catch {}
  }

  return { products, loading, error, refetch: () => loadProducts(true) };
}
