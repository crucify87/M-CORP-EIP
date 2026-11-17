import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const { VITE_FIREBASE_API_KEY: apiKey, VITE_FIREBASE_AUTH_DOMAIN: authDomain,
  VITE_FIREBASE_PROJECT_ID: projectId, VITE_FIREBASE_APP_ID: appId } = import.meta.env;
const app = apiKey && authDomain && projectId && appId
  ? initializeApp({ apiKey, authDomain, projectId, appId })
  : null;

export const auth = app ? getAuth(app) : null;
