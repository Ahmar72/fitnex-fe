/**
 * Fitnex API Client
 * 
 * Provides type-safe REST communication with the NestJS backend
 * for authentication, email verification, and profile management.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

const TOKEN_KEY = 'fx:access_token';
const REFRESH_KEY = 'fx:refresh_token';

export const tokenStorage = {
  getAccessToken: () => localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY),
  getRefreshToken: () => localStorage.getItem(REFRESH_KEY) || sessionStorage.getItem(REFRESH_KEY),
  setTokens: (accessToken, refreshToken, remember = true) => {
    const storage = remember ? localStorage : sessionStorage;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(REFRESH_KEY);

    if (accessToken) storage.setItem(TOKEN_KEY, accessToken);
    if (refreshToken) storage.setItem(REFRESH_KEY, refreshToken);
  },
  clearTokens: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(REFRESH_KEY);
  },
};

/**
 * Low-level HTTP client with token injection & error extraction
 */
async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const accessToken = tokenStorage.getAccessToken();
  if (accessToken && !headers.Authorization) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  let response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch (netErr) {
    throw new Error('Unable to connect to the Fitnex server. Please check your internet connection or make sure the backend is running.');
  }

  const json = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMsg = json?.message || json?.error || `Request failed with status ${response.status}`;
    const err = new Error(errorMsg);
    err.statusCode = response.status;
    err.payload = json;
    throw err;
  }

  return json?.data !== undefined ? json.data : json;
}

export const api = {
  auth: {
    /**
     * Registers a new account and triggers Mailtrap verification code
     */
    register: (data) =>
      request('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    /**
     * Authenticates with email and password
     */
    login: (data) =>
      request('/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    /**
     * Verifies 6-digit OTP code received via email
     */
    verifyEmail: (data) =>
      request('/auth/verify-email', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    /**
     * Resends fresh 6-digit OTP code via Mailtrap
     */
    resendVerification: (data) =>
      request('/auth/resend-verification', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    /**
     * Requests a password reset token via email
     */
    forgotPassword: (data) =>
      request('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    /**
     * Resets password using token
     */
    resetPassword: (data) =>
      request('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    /**
     * Retrieves currently authenticated user
     */
    getMe: () => request('/auth/me'),

    /**
     * Logs out the user
     */
    logout: () =>
      request('/auth/logout', {
        method: 'POST',
      }),
  },

  onboarding: {
    calculate: (data) =>
      request('/onboarding/calculate', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    save: (data) =>
      request('/onboarding/save', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    getProfile: () => request('/onboarding/me'),
  },

  users: {
    getProfile: () => request('/users/profile'),
    updateProfile: (data) =>
      request('/users/profile', {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
  },
};
