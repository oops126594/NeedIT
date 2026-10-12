import { currentUser } from "@/lib/current-user";
import { hideEmail, listOrders } from "@/lib/records";

export async function GET() {
  const user = await currentUser();
  if (!user || user.role !== "MERCHANT" || !user.storeId) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }
  const orders = await listOrders({ storeId: user.storeId });
  return Response.json({ storeId: user.storeId, orders: orders.map(hideEmail) });
}
