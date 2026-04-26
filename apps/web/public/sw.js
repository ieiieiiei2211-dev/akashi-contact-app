self.addEventListener("push", (event) => {
  let data = {
    title: "明石高専連絡ポータル",
    body: "新しい連絡があります。",
    url: self.registration.scope,
  };

  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      data.body = event.data.text();
    }
  }

  const iconUrl = new URL("icons/icon-192.png", self.registration.scope).href;

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: iconUrl,
      badge: iconUrl,
      data: {
        url: data.url || self.registration.scope,
      },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const url = event.notification.data?.url || self.registration.scope;

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) {
          client.focus();
          return;
        }
      }

      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    }),
  );
});
