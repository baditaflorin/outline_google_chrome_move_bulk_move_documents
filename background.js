// background.js
import { setupNotificationClickListener } from './notificationManager.js';

setupNotificationClickListener();

// Global error handling for the service worker (background script)
self.addEventListener('error', (event) => {
    console.error('Global error caught in service worker:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
});
