const cache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000;
const MAX_CACHE_ENTRIES = 50;

export const fetchWithAuth = async (url, options = {}) => {
  const token = sessionStorage.getItem("access_token");
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
  
  // Prepends base URL if url is a relative path
  const fullUrl = url.startsWith("http") ? url : `${API_URL}${url.startsWith("/") ? "" : "/"}${url}`;

  // Simple caching logic with TTL and max size bound
  const cacheKey = `${fullUrl}-${JSON.stringify(options)}`;
  if (options.useCache && cache.has(cacheKey)) {
    const cachedEntry = cache.get(cacheKey);
    if (Date.now() - cachedEntry.timestamp < CACHE_TTL_MS) {
      return {
        ok: true,
        status: 200,
        json: async () => JSON.parse(JSON.stringify(cachedEntry.data)),
        clone: () => ({ json: async () => JSON.parse(JSON.stringify(cachedEntry.data)) })
      };
    }
    cache.delete(cacheKey);
  }

  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(fullUrl, {
    ...options,
    headers,
  });

  if (response.status === 401 && !url.includes("/auth/login")) {
    sessionStorage.clear();
    localStorage.removeItem("user");
    localStorage.removeItem("access_token");
    window.location.href = "/linelogin";
    return null;
  }

  // Store in cache if requested and response is OK
  if (options.useCache && response.ok) {
    const clonedResponse = response.clone();
    const data = await clonedResponse.json();
    if (cache.size >= MAX_CACHE_ENTRIES) {
      const oldestKey = cache.keys().next().value;
      cache.delete(oldestKey);
    }
    cache.set(cacheKey, { data, timestamp: Date.now() });
  }

  return response;
};

// Function to clear cache if needed (e.g., after an update)
export const clearApiCache = () => {
  cache.clear();
};
