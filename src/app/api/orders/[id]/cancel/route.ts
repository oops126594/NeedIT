import { currentUser } from "@/lib/current-user";
import { cancelSavedOrder, hideEmail } from "@/lib/records";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const user = await currentUser();
  if (!user) return Response.json({ error: "auth" }, { status: 401 });
  const { id } = await context.params;
  const result = await cancelSavedOrder(id, user.id);
  if (result === "too-late") return Response.json({ error: "too-late" }, { status: 409 });
  if (!result) return Response.json({ error: "missing" }, { status: 404 });
  return Response.json({ order: hideEmail(result) });
}
