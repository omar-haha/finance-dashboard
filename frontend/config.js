import Constants from 'expo-constants';

const localBase = 'http://127.0.1.1:4000/api';
const productionBase = 'https://finance-dashboard-souu.onrender.com/api';

export const API_BASE =
  Constants.expoConfig?.extra?.apiBase ?? (__DEV__ ? localBase : productionBase);

export const BACKEND_URL = `${API_BASE}/transactions`;
export const CATEGORIES_URL = `${API_BASE}/categories`;
