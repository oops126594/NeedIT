import { currentUser } from "@/lib/current-user";
import { hideEmail, merchantMove } from "@/lib/records";
import { z } from "zod";

const bodySchema = z.object({
  action: z.enum(["accept", "reject", "preparing", "ready"]),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const user = await currentUser();
  if (!user || user.role !== "MERCHANT" || !user.storeId) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "invalid" }, { status: 400 });
  const { id } = await context.params;
  const order = await merchantMove(id, user.storeId, parsed.data.action);
  if (!order) return Response.json({ error: "conflict" }, { status: 409 });
  return Response.json({ order: hideEmail(order) });
}
