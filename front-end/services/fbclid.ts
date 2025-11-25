/**
 * Facebook Click ID (fbclid) tracking utility
 * Persists fbclid across routes for ad conversion tracking
 */

const FBCLID_KEY = 'fbclid';
const FBCLID_EXPIRY_KEY = 'fbclid_expiry';
const FBCLID_EXPIRY_DAYS = 7; // Facebook attribution window

/**
 * Extract fbclid from URL query parameters
 */
export function getFbclidFromUrl(): string | null {
  if (typeof window === 'undefined') return null;
  
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(FBCLID_KEY);
}

/**
 * Save fbclid to localStorage with expiry
 */
export function saveFbclid(fbclid: string): void {
  if (typeof window === 'undefined') return;
  
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + FBCLID_EXPIRY_DAYS);
  
  localStorage.setItem(FBCLID_KEY, fbclid);
  localStorage.setItem(FBCLID_EXPIRY_KEY, expiryDate.getTime().toString());
}

/**
 * Get stored fbclid from localStorage if not expired
 */
export function getStoredFbclid(): string | null {
  if (typeof window === 'undefined') return null;
  
  const fbclid = localStorage.getItem(FBCLID_KEY);
  const expiry = localStorage.getItem(FBCLID_EXPIRY_KEY);
  
  if (!fbclid || !expiry) return null;
  
  // Check if expired
  const expiryDate = parseInt(expiry, 10);
  if (Date.now() > expiryDate) {
    // Clean up expired data
    localStorage.removeItem(FBCLID_KEY);
    localStorage.removeItem(FBCLID_EXPIRY_KEY);
    return null;
  }
  
  return fbclid;
}

/**
 * Get fbclid from URL or localStorage
 */
export function getFbclid(): string | null {
  // First try URL
  const urlFbclid = getFbclidFromUrl();
  if (urlFbclid) {
    saveFbclid(urlFbclid);
    return urlFbclid;
  }
  
  // Fallback to stored
  return getStoredFbclid();
}

/**
 * Clear stored fbclid
 */
export function clearFbclid(): void {
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem(FBCLID_KEY);
  localStorage.removeItem(FBCLID_EXPIRY_KEY);
}

/**
 * Append fbclid to a URL if available
 */
export function appendFbclidToUrl(url: string): string {
  const fbclid = getStoredFbclid();
  if (!fbclid) return url;
  
  const urlObj = new URL(url, window.location.origin);
  urlObj.searchParams.set(FBCLID_KEY, fbclid);
  
  return urlObj.pathname + urlObj.search;
}

