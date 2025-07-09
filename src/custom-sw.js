// src/custom-sw.js

self.addEventListener('push', event => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Новое уведомление';
  const options = {
    body: data.body || '',
    icon: data.icon || '/assets/icons/icon-192x192.png'
  };

  event.waitUntil(self.registration.showNotification(title, options));
});
