const CACHE_PREFIX = 'anzaar_cache_';
const CACHE_VERSION = 3;
const VERSION_KEY = CACHE_PREFIX + 'version';
const DEFAULT_TTL = 30 * 60 * 1000;

// Clear old incompatible cache on version change
try {
  const storedVersion = parseInt(localStorage.getItem(VERSION_KEY) || '0');
  if (storedVersion < CACHE_VERSION) {
    Object.keys(localStorage)
      .filter(k => k.startsWith(CACHE_PREFIX) && k !== VERSION_KEY)
      .forEach(k => localStorage.removeItem(k));
    localStorage.setItem(VERSION_KEY, CACHE_VERSION.toString());
  }
} catch {}

function serializeData(data) {
  try {
    return JSON.parse(JSON.stringify(data, (key, value) => {
      if (value && typeof value === 'object' && value.toDate && typeof value.toDate === 'function') {
        return { __ts: value.toDate().toISOString() };
      }
      if (value && typeof value === 'object' && value.seconds !== undefined && value.nanoseconds !== undefined) {
        return { __ts: new Date(value.seconds * 1000 + value.nanoseconds / 1000000).toISOString() };
      }
      return value;
    }));
  } catch {
    return data;
  }
}

function deserializeData(data) {
  try {
    return JSON.parse(JSON.stringify(data), (key, value) => {
      if (value && typeof value === 'object' && value.__ts) {
        return { toDate: () => new Date(value.__ts), seconds: new Date(value.__ts).getTime() / 1000 };
      }
      return value;
    });
  } catch {
    return data;
  }
}

export function setCache(key, data, ttl = DEFAULT_TTL) {
  try {
    if (!data) {
      localStorage.removeItem(CACHE_PREFIX + key);
      return;
    }
    const item = { data: serializeData(data), timestamp: Date.now(), ttl };
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(item));
  } catch (e) {
    // Silent fail - storage full or corrupted
    try { localStorage.removeItem(CACHE_PREFIX + key); } catch {}
  }
}

export function getCache(key) {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const item = JSON.parse(raw);
    if (!item || !item.data || !item.timestamp) {
      localStorage.removeItem(CACHE_PREFIX + key);
      return null;
    }
    if (Date.now() - item.timestamp > (item.ttl || DEFAULT_TTL)) {
      localStorage.removeItem(CACHE_PREFIX + key);
      return null;
    }
    return deserializeData(item.data);
  } catch {
    try { localStorage.removeItem(CACHE_PREFIX + key); } catch {}
    return null;
  }
}

export function clearCache(key) {
  try {
    if (key) {
      localStorage.removeItem(CACHE_PREFIX + key);
    } else {
      Object.keys(localStorage)
        .filter(k => k.startsWith(CACHE_PREFIX))
        .forEach(k => localStorage.removeItem(k));
    }
  } catch {}
}

export function isCacheStale(key, maxAge = DEFAULT_TTL) {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return true;
    const item = JSON.parse(raw);
    return !item || Date.now() - item.timestamp > maxAge;
  } catch {
    return true;
  }
}
