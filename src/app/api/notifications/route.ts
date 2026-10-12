import { currentUser } from "@/lib/current-user";
import { listNotifications, markNotificationsRead } from "@/lib/records";

export async function GET() {
  const user = await currentUser();
  if (!user) return Response.json({ error: "auth" }, { status: 401 });
  const notifications = await listNotifications(user.id);
  return Response.json({
    notifications: notifications.map(({ userId, ...note }) => {
      void userId;
      return note;
    }),
  });
}

export async function POST() {
  const user = await currentUser();
  if (!user) return Response.json({ error: "auth" }, { status: 401 });
  await markNotificationsRead(user.id);
  return Response.json({ ok: true });
}
