'use client';

import { useEffect } from 'react';

export default function PWARegister() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            // Check for service worker updates immediately on page load
            registration.update();
            console.log('Service Worker registration successful with scope: ', registration.scope);
          })
          .catch((err) => {
            console.log('Service Worker registration failed: ', err);
          });
      });
    }
  }, []);

  return null;
}
