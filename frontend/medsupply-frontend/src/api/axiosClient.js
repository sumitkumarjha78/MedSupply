import axios from 'axios';

const UUID_REGEX =
  /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;
const SKU_CACHE_KEY = 'medsupply_product_skus';

const productSkuCache = new Map();

// Hydrate known productId -> SKU mappings so errors stay readable even after a page refresh
try {
  const saved = sessionStorage.getItem(SKU_CACHE_KEY);
  if (saved) {
    Object.entries(JSON.parse(saved)).forEach(([id, sku]) => {
      productSkuCache.set(id.toLowerCase(), sku);
    });
  }
} catch {
  // Ignore sessionStorage restrictions
}

function cacheProductSkus(data) {
  if (!data) return;
  const items = Array.isArray(data) ? data : [data];
  let updated = false;

  for (const item of items) {
    if (item && typeof item === 'object' && item.id && item.sku) {
      productSkuCache.set(String(item.id).toLowerCase(), String(item.sku));
      updated = true;
    }
  }

  if (updated) {
    try {
      sessionStorage.setItem(
        SKU_CACHE_KEY,
        JSON.stringify(Object.fromEntries(productSkuCache))
      );
    } catch {
      // Ignore sessionStorage restrictions
    }
  }
}

function sanitizeErrorMessage(message) {
  if (!message || typeof message !== 'string') {
    return 'Unexpected server error';
  }

  let sanitized = message.replace(
    /(?:\s+with\s+id)?\s*:?\s*([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/gi,
    (_, uuid) => {
      const sku = productSkuCache.get(uuid.toLowerCase());
      return sku ? ` (SKU: ${sku})` : '';
    }
  );

  // Final safety net so no raw UUID can ever slip through
  sanitized = sanitized
    .replace(UUID_REGEX, '')
    .replace(/\bfor\s+\(SKU:\s*([^)]+)\)/gi, 'for SKU $1')
    .replace(/\s+(?:for|with|id|by)\s*$/i, '')
    .replace(/[:\-,]\s*$/, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

  return sanitized || 'Unexpected server error';
}

const axiosClient = axios.create({
  baseURL: 'http://localhost:8080',
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('medsupply_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axiosClient.interceptors.response.use(
  (response) => {
    if (response.config?.url?.includes('/api/products')) {
      cacheProductSkus(response.data);
    }
    return response;
  },
  (error) => {
    const fieldErrors = error.response?.data?.errors || error.response?.data?.fieldErrors;
    const fieldMsg =
      fieldErrors && typeof fieldErrors === 'object'
        ? Object.values(fieldErrors).join(', ')
        : null;

    const rawServerMsg =
      fieldMsg ||
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'Unexpected server error';

    if (error.response?.status === 401 && !error.config?.url?.includes('/api/auth/')) {
      localStorage.removeItem('medsupply_token');
      localStorage.removeItem('medsupply_user');
      window.dispatchEvent(new Event('medsupply:unauthorized'));
    }

    return Promise.reject(new Error(sanitizeErrorMessage(rawServerMsg)));
  }
);

export default axiosClient;