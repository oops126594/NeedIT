import { currentUser } from "@/lib/current-user";
import { listOrders, readCatalog } from "@/lib/records";

export async function GET() {
  const user = await currentUser();
  if (!user || user.role !== "ADMIN") return Response.json({ error: "forbidden" }, { status: 403 });
  const [orders, catalog] = await Promise.all([listOrders({}), readCatalog()]);
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const today = orders.filter((order) => order.createdAt >= todayStart.getTime());
  return Response.json({
    orders,
    summary: {
      ordersToday: today.length,
      openOrders: orders.filter((order) => !["DELIVERED", "CANCELLED", "REJECTED", "FAILED"].includes(order.status)).length,
      stores: catalog.stores.length,
      products: catalog.products.length,
    },
  });
}
