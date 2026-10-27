import { currentUser } from "@/lib/current-user";
import { deletePushSubscription, savePushSubscription } from "@/lib/records";
import { z } from "zod";

const bodySchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
  locale: z.enum(["ar", "en"]).optional(),
});

export async function POST(request: Request) {
  const user = await currentUser();
  if (!user || (user.role !== "CUSTOMER" && user.role !== "COURIER")) {
    return Response.json({ error: "auth" }, { status: 401 });
  }
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "invalid" }, { status: 400 });
  await savePushSubscription({
    endpoint: parsed.data.endpoint,
    userId: user.id,
    p256dh: parsed.data.keys.p256dh,
    auth: parsed.data.keys.auth,
    locale: parsed.data.locale ?? "ar",
  });
  return Response.json({ ok: true });
}

export async function DELETE(request: Request) {
  const user = await currentUser();
  if (!user) return Response.json({ error: "auth" }, { status: 401 });
  const parsed = z.object({ endpoint: z.string().url() }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "invalid" }, { status: 400 });
  await deletePushSubscription(parsed.data.endpoint, user.id);
  return Response.json({ ok: true });
}
