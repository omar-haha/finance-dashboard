import Constants from 'expo-constants';

const local = 'http://127.0.1.1:4000/api/transactions';
const production = 'https://REPLACE_WITH_RAILWAY_URL/api/transactions';

export const BACKEND_URL =
  Constants.expoConfig?.extra?.backendUrl ?? (__DEV__ ? local : production);
