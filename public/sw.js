self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = {};
  }

  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      const focused = windows.some((client) => client.focused);
      if (focused) {
        for (const client of windows) {
          client.postMessage({ type: "needit-order", payload: data });
        }
        return;
      }
      await self.registration.showNotification(data.title || "NEEDIT", {
        body: data.body || "",
        icon: "/mark.png",
        tag: data.tag || "needit-order",
        data: { url: data.url || "/" },
      });
    })(),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(self.clients.openWindow(url));
});
