import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { setAuthHelpers } from './services/api';
import { useAuthStore } from './store/authStore';

// Initialize API auth helpers
setAuthHelpers(
  () => useAuthStore.getState().accessToken,
  () => useAuthStore.getState().refreshAccessToken()
);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
