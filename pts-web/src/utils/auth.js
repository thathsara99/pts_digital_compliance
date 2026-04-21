// utils/auth.js

// Token management utilities
export const TOKEN_EXPIRY_HOURS = 8;

export const setAuthToken = (token) => {
  const expiryTime = Date.now() + (TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);
  localStorage.setItem('token', token);
  localStorage.setItem('tokenExpiry', expiryTime.toString());
  localStorage.setItem('isAuthenticated', 'true');
};

export const getAuthToken = () => {
  return localStorage.getItem('token');
};

export const isTokenValid = () => {
  const token = localStorage.getItem('token');
  const expiry = localStorage.getItem('tokenExpiry');
  
  if (!token || !expiry) {
    return false;
  }
  
  const now = Date.now();
  return now < parseInt(expiry, 10);
};

export const clearAuthToken = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('tokenExpiry');
  localStorage.removeItem('isAuthenticated');
};

export const getTokenExpiryTime = () => {
  const expiry = localStorage.getItem('tokenExpiry');
  return expiry ? parseInt(expiry, 10) : null;
};

export const getTimeUntilExpiry = () => {
  const expiry = getTokenExpiryTime();
  if (!expiry) return 0;
  
  const now = Date.now();
  return Math.max(0, expiry - now);
};

// Format time remaining in a human-readable format
export const formatTimeRemaining = (milliseconds) => {
  const hours = Math.floor(milliseconds / (1000 * 60 * 60));
  const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}; 

const decodeJwtPayload = (token) => {
  if (!token) return null;
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized + '='.repeat((4 - (normalized.length % 4 || 4)) % 4);
    return JSON.parse(atob(padded));
  } catch (error) {
    return null;
  }
};

export const getCurrentUser = () => {
  const token = getAuthToken();
  return decodeJwtPayload(token);
};

export const getCurrentUserRole = () => {
  const user = getCurrentUser();
  return user?.role || null;
};