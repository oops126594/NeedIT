import { currentUser } from "@/lib/current-user";
import { hideEmail, rateSavedOrder } from "@/lib/records";
import { z } from "zod";

const bodySchema = z.object({ rating: z.number().int().min(1).max(5) });

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const user = await currentUser();
  if (!user) return Response.json({ error: "auth" }, { status: 401 });
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "invalid" }, { status: 400 });
  const { id } = await context.params;
  const order = await rateSavedOrder(id, user.id, parsed.data.rating);
  if (!order) return Response.json({ error: "missing" }, { status: 404 });
  return Response.json({ order: hideEmail(order) });
}
