import { currentUser } from "@/lib/current-user";
import { findOrder, hideEmail } from "@/lib/records";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const user = await currentUser();
  if (!user) return Response.json({ error: "auth" }, { status: 401 });
  const { id } = await context.params;
  const order = await findOrder(id);
  if (!order) return Response.json({ error: "missing" }, { status: 404 });
  const allowed =
    user.role === "ADMIN" ||
    order.customerId === user.id ||
    (user.role === "MERCHANT" && user.storeId === order.storeId);
  if (!allowed) return Response.json({ error: "missing" }, { status: 404 });
  return Response.json({ order: user.role === "ADMIN" ? order : hideEmail(order) });
}
