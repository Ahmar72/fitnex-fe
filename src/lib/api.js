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
 * Low-level HTTP client with token injection, automatic refresh token rotation & rich console logging
 */
async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const method = (options.method || 'GET').toUpperCase();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const accessToken = tokenStorage.getAccessToken();
  if (accessToken && !headers.Authorization) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  let parsedPayload = null;
  if (options.body) {
    try {
      parsedPayload = typeof options.body === 'string' ? JSON.parse(options.body) : options.body;
    } catch {
      parsedPayload = options.body;
    }
  }

  // Visual request banner in console
  console.log(
    `%c[FITNEX API REQUEST] %c${method} %c${endpoint}`,
    'color: #ff5e1a; font-weight: 800; padding: 2px 4px; border-radius: 3px;',
    'color: #fbbf24; font-weight: 700;',
    'color: #38bdf8; font-weight: 600;',
    parsedPayload ? { payload: parsedPayload } : ''
  );

  let response;
  const startTime = performance.now();
  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch (netErr) {
    console.error(
      `%c[FITNEX NETWORK ERROR] %c${method} %c${endpoint}`,
      'color: #ef4444; font-weight: 800;',
      'color: #fbbf24; font-weight: 700;',
      'color: #fff;',
      netErr
    );
    throw new Error(
      'Unable to connect to the Fitnex server. Please check your internet connection or make sure the backend is running.'
    );
  }
  const durationMs = Math.round(performance.now() - startTime);

  // Automatic refresh token rotation on 401
  if (
    response.status === 401 &&
    !options._retry &&
    !endpoint.includes('/auth/login') &&
    !endpoint.includes('/auth/refresh') &&
    tokenStorage.getRefreshToken()
  ) {
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
      } else {
        tokenStorage.clearTokens();
      }
    } catch {
      tokenStorage.clearTokens();
    }
  }

  const json = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMsg = json?.message || json?.error || `Request failed with status ${response.status}`;
    console.error(
      `%c[FITNEX API ERROR ${response.status}] %c${method} %c${endpoint} %c(${durationMs}ms)`,
      'color: #ef4444; font-weight: 800; padding: 2px 4px; border-radius: 3px;',
      'color: #fbbf24; font-weight: 700;',
      'color: #38bdf8; font-weight: 600;',
      'color: #94a3b8;',
      json
    );
    const err = new Error(errorMsg);
    err.statusCode = response.status;
    err.payload = json;
    throw err;
  }

  const dataToReturn = json?.data !== undefined ? json.data : json;

  // Prominently display fetched data in browser console
  console.log(
    `%c[FITNEX DATA FETCHED] %c${method} %c${endpoint} %c(${response.status} · ${durationMs}ms)`,
    'color: #10b981; font-weight: 800; padding: 2px 4px; border-radius: 3px;',
    'color: #fbbf24; font-weight: 700;',
    'color: #38bdf8; font-weight: 600;',
    'color: #a3e635; font-weight: 600;',
    dataToReturn
  );

  return dataToReturn;
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
        body: JSON.stringify({
          oldPassword: data.oldPassword || data.currentPassword,
          currentPassword: data.currentPassword || data.oldPassword,
          newPassword: data.newPassword,
        }),
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
      request('/plans/active/cancel', {
        method: 'POST',
      }),
    updateProgress: (data) =>
      request('/plans/active/progress', {
        method: 'POST',
        body: JSON.stringify(data),
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
  // Nutrition & Recipes Catalog Module
  // ----------------------------------------------------------------
  meals: {
    getAll: (params = {}) => request(`/meals${toQueryString(params)}`),
    getCategories: () => request('/meals/categories'),
    getById: (id) => request(`/meals/${id}`),
  },
};
