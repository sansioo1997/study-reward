const API_BASE = '/api';

let authToken = localStorage.getItem('study_auth_token') || null;

async function request(url, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(authToken ? { 'x-auth-token': authToken } : {}),
    ...options.headers
  };

  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers
  });

  const data = await res.json();
  
  if (res.status === 401) {
    localStorage.removeItem('study_auth_token');
    authToken = null;
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

  isAuthenticated: () => !!authToken,

  logout: () => {
    authToken = null;
    localStorage.removeItem('study_auth_token');
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
};
