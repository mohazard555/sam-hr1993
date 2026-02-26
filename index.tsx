
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import LicenseGuard from './components/LicenseGuard';
import TrialLock from './components/TrialLock';

// تسجيل Service Worker للعمل أوفلاين
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => console.log('SAM Service Worker Registered'))
      .catch(err => console.log('SW Registration Failed', err));
  });
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = createRoot(rootElement);
root.render(
  <React.StrictMode>
    <TrialLock>
      <LicenseGuard>
        <App />
      </LicenseGuard>
    </TrialLock>
  </React.StrictMode>
);
