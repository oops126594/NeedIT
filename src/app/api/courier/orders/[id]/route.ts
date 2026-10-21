import { currentUser } from "@/lib/current-user";
import { claimDelivery, courierLocate, courierMove, hideEmail } from "@/lib/records";
import { z } from "zod";

const bodySchema = z.union([
  z.object({ action: z.enum(["claim", "pickup", "enroute", "deliver"]) }),
  z.object({ lat: z.number().gte(-90).lte(90), lng: z.number().gte(-180).lte(180) }),
]);

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await currentUser();
  if (!user || user.role !== "COURIER") return Response.json({ error: "forbidden" }, { status: 403 });
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "invalid" }, { status: 400 });
  const { id } = await context.params;
  const order =
    "action" in parsed.data
      ? parsed.data.action === "claim"
        ? await claimDelivery(id, user)
        : await courierMove(id, user.id, parsed.data.action)
      : await courierLocate(id, user.id, parsed.data.lat, parsed.data.lng);
  if (!order) return Response.json({ error: "conflict" }, { status: 409 });
  return Response.json({ order: hideEmail(order) });
}
