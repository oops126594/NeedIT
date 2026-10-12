import { currentUser } from "@/lib/current-user";

export async function GET() {
  const user = await currentUser();
  if (!user) return Response.json({ user: null }, { status: 401 });
  return Response.json({ user });
}
