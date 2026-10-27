import { alertCopy } from "@/lib/alert-copy";
import {
  deletePushSubscription,
  listCouriers,
  listPushSubscriptions,
  saveNotification,
  type SavedOrder,
} from "@/lib/records";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import webpush, { WebPushError } from "web-push";

type VapidKeys = { publicKey: string; privateKey: string };

const globalKeys = globalThis as unknown as { needitVapid?: VapidKeys };

async function vapidKeys(): Promise<VapidKeys> {
  const fromEnv = process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY;
  if (fromEnv) {
    return { publicKey: process.env.VAPID_PUBLIC_KEY as string, privateKey: process.env.VAPID_PRIVATE_KEY as string };
  }
  if (globalKeys.needitVapid) return globalKeys.needitVapid;
  const file = path.join(process.cwd(), "data", "vapid.json");
  try {
    const parsed = JSON.parse(await readFile(file, "utf8")) as VapidKeys;
    if (parsed.publicKey && parsed.privateKey) {
      globalKeys.needitVapid = parsed;
      return parsed;
    }
  } catch {
    // Generate a local key pair the first time alerts are used.
  }
  const generated = webpush.generateVAPIDKeys();
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, JSON.stringify(generated), "utf8");
  globalKeys.needitVapid = generated;
  return generated;
}

export async function pushPublicKey(): Promise<string> {
  const keys = await vapidKeys();
  return keys.publicKey;
}

export async function publishOrderAlert(order: SavedOrder): Promise<void> {
  const note = {
    id: `${order.id}:${order.status}`,
    userId: order.customerId,
    orderId: order.id,
    productId: order.lines[0]?.productId,
    status: order.status,
    read: false,
    createdAt: Date.now(),
  };
  await saveNotification(note);
  const subscriptions = await listPushSubscriptions(order.customerId);

  const keys = await vapidKeys();
  webpush.setVapidDetails("mailto:admin@needit.test", keys.publicKey, keys.privateKey);

  await Promise.all(
    subscriptions.map(async (subscription) => {
      const copy = alertCopy(subscription.locale, order.status);
      const store = order.storeName[subscription.locale] ?? order.storeName.ar;
      const payload = JSON.stringify({
        title: copy.title,
        body: `${order.id} · ${store}. ${copy.body}`,
        url: `/${subscription.locale}/orders/${order.id}`,
        tag: note.id,
      });
      try {
        await webpush.sendNotification(
          { endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } },
          payload,
          { TTL: 60 * 60 },
        );
      } catch (error) {
        const status = error instanceof WebPushError ? error.statusCode : 0;
        if (status === 404 || status === 410) await deletePushSubscription(subscription.endpoint);
      }
    }),
  );

  const courierRecipients = order.status === "READY_FOR_PICKUP"
    ? await listCouriers()
    : order.courierId
      ? (await listCouriers()).filter((courier) => courier.id === order.courierId)
      : [];
  await Promise.all(courierRecipients.map(async (courier) => {
    const courierNote = {
      id: `courier:${courier.id}:${order.id}:${order.status}`,
      userId: courier.id,
      orderId: order.id,
      status: order.status,
      kind: "order" as const,
      title: { en: order.status === "READY_FOR_PICKUP" ? "New delivery available" : "Delivery updated", ar: order.status === "READY_FOR_PICKUP" ? "توصيلة جديدة متاحة" : "تم تحديث التوصيلة" },
      body: { en: `${order.id} · ${order.storeName.en}`, ar: `${order.id} · ${order.storeName.ar}` },
      href: "/courier",
      read: false,
      createdAt: Date.now(),
    };
    await saveNotification(courierNote);
    const courierSubscriptions = await listPushSubscriptions(courier.id);
    await Promise.all(courierSubscriptions.map(async (subscription) => {
      const payload = JSON.stringify({
        title: courierNote.title[subscription.locale],
        body: courierNote.body[subscription.locale],
        url: `/${subscription.locale}/courier`,
        tag: courierNote.id,
      });
      try {
        await webpush.sendNotification(
          { endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } },
          payload,
          { TTL: 60 * 60 },
        );
      } catch (error) {
        const status = error instanceof WebPushError ? error.statusCode : 0;
        if (status === 404 || status === 410) await deletePushSubscription(subscription.endpoint);
      }
    }));
  }));
}
