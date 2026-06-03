import AsyncStorage from '@react-native-async-storage/async-storage';
import API_URL from './config';

const TOKEN_KEY = '@job_token';
const USER_KEY = '@job_user';

async function getToken() {
  try { return await AsyncStorage.getItem(TOKEN_KEY); }
  catch { return null; }
}

async function request(method, path, body) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  const token = await getToken();
  if (token) opts.headers['Authorization'] = `Bearer ${token}`;
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(`${API_URL}/api${path}`, opts);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const api = {
  login: (email, password) => request('POST', '/auth/login', { email, password }),
  verify2fa: (temp_token, code) => request('POST', '/auth/verify-2fa', { temp_token, code }),

  getDashboard: () => request('GET', '/dashboard'),
  getJobs: () => request('GET', '/jobs'),
  getJob: (id) => request('GET', `/jobs/${id}`),
  createJob: (data) => request('POST', '/jobs', data),
  updateJob: (id, data) => request('PUT', `/jobs/${id}`, data),
  startTimer: (id) => request('POST', `/jobs/${id}/start-timer`),
  pauseTimer: (id) => request('POST', `/jobs/${id}/pause-timer`),
  completeWork: (id, data) => request('POST', `/jobs/${id}/complete-work`, data),
  clientSignoff: (id, data) => request('POST', `/jobs/${id}/client-signoff`, data),
  techSignoff: (id, data) => request('POST', `/jobs/${id}/tech-signoff`, data),
  getJobLogs: (id) => request('GET', `/jobs/${id}/logs`),

  getUsers: () => request('GET', '/users'),
  getCompanies: () => request('GET', '/companies'),
  getNotifications: () => request('GET', '/notifications'),
  markRead: (id) => request('POST', `/notifications/${id}/read`),
  reportFault: (data) => request('POST', '/client/fault', data),
  getMyCompany: () => request('GET', '/client/my-company'),

  saveToken: async (token) => AsyncStorage.setItem(TOKEN_KEY, token),
  saveUser: async (user) => AsyncStorage.setItem(USER_KEY, JSON.stringify(user)),
  getSavedUser: async () => JSON.parse(await AsyncStorage.getItem(USER_KEY) || 'null'),
  clearAuth: async () => { await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]); },
};