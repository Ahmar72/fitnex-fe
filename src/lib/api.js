/**
 * Fitnex API Client
 * 
 * Provides type-safe REST communication with the NestJS backend
 * for authentication, onboarding, exercise movements, workout builder,
 * training programs, workout history, and nutrition tracking.
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
 * Builds standard URL query parameter string
 */
function toQueryString(params = {}) {
  const query = Object.entries(params)
    .filter(([_, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
  return query ? `?${query}` : '';
}

/**
 * Low-level HTTP client with token injection, automatic refresh token rotation & error extraction
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
    throw new Error(
      'Unable to connect to the Fitnex server. Please check your internet connection or make sure the backend is running.'
    );
  }

  // Automatic refresh token rotation on 401
  if (response.status === 401 && !options._retry && tokenStorage.getRefreshToken()) {
    try {
      const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: tokenStorage.getRefreshToken() }),
      });
      if (refreshRes.ok) {
        const refreshData = await refreshRes.json();
        const tokens = refreshData.data || refreshData;
        if (tokens.accessToken && tokens.refreshToken) {
          tokenStorage.setTokens(tokens.accessToken, tokens.refreshToken);
          headers.Authorization = `Bearer ${tokens.accessToken}`;
          return request(endpoint, { ...options, _retry: true, headers });
        }
      }
    } catch {
      // Refresh failed, proceed to handle original 401
    }
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
  // ----------------------------------------------------------------
  // Auth Module
  // ----------------------------------------------------------------
  auth: {
    register: (data) =>
      request('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    login: (data) =>
      request('/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    verifyEmail: (data) =>
      request('/auth/verify-email', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    resendVerification: (data) =>
      request('/auth/resend-verification', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    forgotPassword: (data) =>
      request('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    resetPassword: (data) =>
      request('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    refreshTokens: (refreshToken) =>
      request('/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      }),

    getMe: () => request('/auth/me'),

    logout: () =>
      request('/auth/logout', {
        method: 'POST',
      }),
  },

  // ----------------------------------------------------------------
  // Users & Settings Module
  // ----------------------------------------------------------------
  users: {
    getMe: () => request('/users/me'),
    getProfile: () => request('/users/profile'),
    updateProfile: (data) =>
      request('/users/profile', {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    updateSettings: (data) =>
      request('/users/me/settings', {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    changePassword: (data) =>
      request('/users/me/password', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
  },

  // ----------------------------------------------------------------
  // Onboarding & Metabolic Engine Module
  // ----------------------------------------------------------------
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

  // ----------------------------------------------------------------
  // Exercises Catalog Module
  // ----------------------------------------------------------------
  exercises: {
    getAll: (params = {}) => request(`/exercises${toQueryString(params)}`),
    getFacets: () => request('/exercises/facets'),
    getById: (id) => request(`/exercises/${id}`),
    getFavorites: () => request('/exercises/favorites/me'),
    toggleFavorite: (id) =>
      request(`/exercises/${id}/favorite`, {
        method: 'POST',
      }),
  },

  // ----------------------------------------------------------------
  // Workout Builder & Live Workouts Module
  // ----------------------------------------------------------------
  workouts: {
    getCurrent: () => request('/workouts/current'),
    saveCurrent: (data) =>
      request('/workouts/current', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    addItem: (data) =>
      request('/workouts/current/items', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    removeItem: (itemId) =>
      request(`/workouts/current/items/${itemId}`, {
        method: 'DELETE',
      }),
    loadRoutine: (data) =>
      request('/workouts/load-routine', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  // ----------------------------------------------------------------
  // Training Programs & Plans Module
  // ----------------------------------------------------------------
  plans: {
    getAll: (params = {}) => request(`/plans${toQueryString(params)}`),
    getById: (id) => request(`/plans/${id}`),
    getActive: () => request('/plans/active/me'),
    enroll: (data) =>
      request('/plans/enroll', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    cancel: () =>
      request('/plans/cancel/me', {
        method: 'POST',
      }),
  },

  // ----------------------------------------------------------------
  // Workout History, Streaks & PRs Module
  // ----------------------------------------------------------------
  history: {
    getSessions: (params = {}) => request(`/history${toQueryString(params)}`),
    logSession: (data) =>
      request('/history', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    getStreak: () => request('/history/streak'),
    getPRs: () => request('/history/prs'),
  },

  // ----------------------------------------------------------------
  // Dashboard Analytics Module
  // ----------------------------------------------------------------
  dashboard: {
    getSummary: () => request('/dashboard/summary'),
  },

  // ----------------------------------------------------------------
  // Nutrition & Meal Planner Module
  // ----------------------------------------------------------------
  meals: {
    getAll: (params = {}) => request(`/meals${toQueryString(params)}`),
    getCategories: () => request('/meals/categories'),
    getById: (id) => request(`/meals/${id}`),
    getFavorites: () => request('/meals/favorites/me'),
    toggleFavorite: (mealId) =>
      request(`/meals/favorites/${mealId}`, {
        method: 'POST',
      }),
    getDailySummary: (dateKey) =>
      request(`/meals/daily-summary${dateKey ? `?dateKey=${dateKey}` : ''}`),
    getLogs: (dateKey) =>
      request(`/meals/logs/me${dateKey ? `?dateKey=${dateKey}` : ''}`),
    logMeal: (data) =>
      request('/meals/logs', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    deleteLog: (logId) =>
      request(`/meals/logs/${logId}`, {
        method: 'DELETE',
      }),
  },
};
