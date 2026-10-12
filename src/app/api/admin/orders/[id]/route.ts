import { currentUser } from "@/lib/current-user";
import { advanceDelivery } from "@/lib/records";

export async function PATCH(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const user = await currentUser();
  if (!user || user.role !== "ADMIN") return Response.json({ error: "forbidden" }, { status: 403 });
  const { id } = await context.params;
  const order = await advanceDelivery(id);
  if (!order) return Response.json({ error: "conflict" }, { status: 409 });
  return Response.json({ order });
}
