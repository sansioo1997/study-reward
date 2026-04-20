const API_BASE = '/api';

let authToken = localStorage.getItem('study_auth_token') || null;
let adminToken = localStorage.getItem('study_admin_token') || null;

async function request(url, options = {}, authMode = 'user') {
  const tokenHeader =
    authMode === 'admin'
      ? (adminToken ? { 'x-admin-token': adminToken } : {})
      : (authToken ? { 'x-auth-token': authToken } : {});

  const headers = {
    'Content-Type': 'application/json',
    ...tokenHeader,
    ...options.headers
  };

  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers
  });

  const data = await res.json();
  
  if (res.status === 401) {
    if (authMode === 'admin') {
      localStorage.removeItem('study_admin_token');
      adminToken = null;
    } else {
      localStorage.removeItem('study_auth_token');
      authToken = null;
    }
    window.location.reload();
    throw new Error('未授权');
  }
  
  if (!res.ok) {
    throw new Error(data.error || '请求失败');
  }
  
  return data;
}

export const api = {
  // Auth
  verify: async (passphrase) => {
    const data = await request('/auth/verify', {
      method: 'POST',
      body: JSON.stringify({ passphrase })
    });
    if (data.success) {
      authToken = data.token;
      localStorage.setItem('study_auth_token', data.token);
    }
    return data;
  },
  verifyAdmin: async (passphrase) => {
    const data = await request('/admin/auth/verify', {
      method: 'POST',
      body: JSON.stringify({ passphrase })
    });
    if (data.success) {
      adminToken = data.token;
      localStorage.setItem('study_admin_token', data.token);
    }
    return data;
  },

  isAuthenticated: () => !!authToken,
  isAdminAuthenticated: () => !!adminToken,

  logout: () => {
    authToken = null;
    localStorage.removeItem('study_auth_token');
  },
  logoutAdmin: () => {
    adminToken = null;
    localStorage.removeItem('study_admin_token');
  },

  // Checkin
  getTodayStatus: () => request('/checkin/today'),
  getStats: () => request('/stats'),
  checkin: (studyHours, mood, message) => 
    request('/checkin', {
      method: 'POST',
      body: JSON.stringify({ studyHours, mood, message })
    }),
  checkinMakeup: (date, studyHours, mood, message) =>
    request('/checkin/makeup', {
      method: 'POST',
      body: JSON.stringify({ date, studyHours, mood, message })
    }),
  getRecordByDate: (date) => request(`/records/by-date?date=${encodeURIComponent(date)}`),

  // Lottery
  lottery: (checkinId) =>
    request('/lottery', {
      method: 'POST',
      body: JSON.stringify({ checkinId })
    }),

  // Records
  getRecords: () => request('/records'),
  deleteRecord: (id) =>
    request(`/records/${id}`, {
      method: 'DELETE'
    }),

  // Admin
  getAdminInspiration: () => request('/admin/inspiration', {}, 'admin'),
  updateAdminInspiration: (items, preferredId) =>
    request('/admin/inspiration', {
      method: 'PUT',
      body: JSON.stringify({ items, preferredId })
    }, 'admin'),
  getAdminPrizeConfig: () => request('/admin/prize-config', {}, 'admin'),
  updateAdminPrizeConfig: (mode, cashAmount) =>
    request('/admin/prize-config', {
      method: 'PUT',
      body: JSON.stringify({ mode, cashAmount })
    }, 'admin'),
  getAdminGifts: () => request('/admin/gifts', {}, 'admin'),
  updateAdminGiftStatus: (id, giftStatus) =>
    request(`/admin/gifts/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ giftStatus })
    }, 'admin'),
};
