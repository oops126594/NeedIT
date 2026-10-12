declare module "web-push" {
  export type PushSubscription = {
    endpoint: string;
    keys: { p256dh: string; auth: string };
  };

  export function setVapidDetails(subject: string, publicKey: string, privateKey: string): void;

  export function sendNotification(
    subscription: PushSubscription,
    payload?: string | Buffer | null,
    options?: { TTL?: number },
  ): Promise<{ statusCode: number; body: string; headers: Record<string, string> }>;

  export function generateVAPIDKeys(): { publicKey: string; privateKey: string };

  export class WebPushError extends Error {
    statusCode: number;
  }
}
