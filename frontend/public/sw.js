// GoEats Service Worker for Native Push Notifications
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Handle incoming push events (for Web Push Protocol if used)
self.addEventListener('push', (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: 'GoEats Cocina', body: event.data.text() };
    }
  }

  const title = data.title || '🛎️ GoEats - Notificación de Cocina';
  const options = {
    body: data.body || 'Nuevo aviso de la cocina',
    icon: '/icons/goeats-192.png',
    badge: '/icons/goeats-192.png',
    tag: data.tag || 'goeats-notification',
    renotify: true,
    requireInteraction: true,
    vibrate: [300, 100, 300, 100, 300],
    data: {
      url: data.url || '/pos'
    }
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Handle user clicking on the notification in Windows/Android system tray
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = (event.notification.data && event.notification.data.url) 
    ? event.notification.data.url 
    : '/pos';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a tab is already open, focus it and navigate
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          client.navigate(urlToOpen);
          return client.focus();
        }
      }
      // Otherwise open a new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});
