/* global clients */
// src/custom-sw.js

self.addEventListener('push', event => {
  console.log('[Service Worker] Push получен', event);
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Новое уведомление';
  const options = {
    body: data.body || '',
    icon: data.icon || '/assets/favicon/android-chrome-192x192.png',
    data: {
      streamId: data.streamId || null
    }
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();

  const data = event.notification.data;
  const streamId = data?.streamId;
  const urlToOpen = streamId ? `/stream/${streamId}` : '/trusted-streams';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      for (const client of clientList) {
        if (client.url.includes(urlToOpen) && 'focus' in client) {
          return client.focus();
        }
      }
      return clients.openWindow(urlToOpen);
    })
  );
});
