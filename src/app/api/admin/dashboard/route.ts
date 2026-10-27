import { currentUser } from "@/lib/current-user";
import { listAllServiceRequests, listCustomers, listOrders, readCatalog } from "@/lib/records";

function cost(name: string, fallback: number) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value >= 0 ? Math.round(value) : fallback;
}

export async function GET() {
  const user = await currentUser();
  if (!user || user.role !== "ADMIN") return Response.json({ error: "forbidden" }, { status: 403 });
  const [orders, services, customers, catalog] = await Promise.all([
    listOrders({}), listAllServiceRequests(), listCustomers(), readCatalog(),
  ]);
  const terminal = new Set(["DELIVERED", "CANCELLED", "REJECTED", "FAILED"]);
  const serviceTerminal = new Set(["COMPLETED", "CANCELLED"]);
  const costs = {
    infrastructure: cost("MONTHLY_INFRA_COST_HALALAS", 45000),
    maps: cost("MONTHLY_MAPS_COST_HALALAS", 15000),
    messaging: cost("MONTHLY_MESSAGING_COST_HALALAS", 10000),
    operations: cost("MONTHLY_OPERATIONS_COST_HALALAS", 30000),
  };
  const estimatedMonthlyCostHalalas = Object.values(costs).reduce((sum, value) => sum + value, 0);
  const orderValueHalalas = orders.reduce((sum, order) => sum + order.totalHalalas, 0);
  const serviceValueHalalas = services.reduce((sum, request) => sum + request.estimatedTotalHalalas, 0);
  const deliveryFeesHalalas = orders.reduce((sum, order) => sum + order.deliveryFeeHalalas, 0);
  const serviceFeesHalalas = services.reduce((sum, request) => sum + request.serviceFeeHalalas, 0);
  return Response.json({
    orders,
    services,
    customers,
    summary: {
      orders: orders.length,
      openOrders: orders.filter((order) => !terminal.has(order.status)).length,
      services: services.length,
      openServices: services.filter((request) => !serviceTerminal.has(request.status)).length,
      customers: customers.length,
      stores: catalog.stores.length,
      products: catalog.products.length,
    },
    billing: { orderValueHalalas, serviceValueHalalas, deliveryFeesHalalas, serviceFeesHalalas },
    costs: { ...costs, estimatedMonthlyCostHalalas },
  });
}
