import { currentUser } from "@/lib/current-user";
import { getUserCart, saveUserCart } from "@/lib/records";
import { z } from "zod";

const bodySchema = z.object({
  lines: z.array(z.object({ productId: z.string().min(1), quantity: z.number().int().min(1).max(8) })).max(20),
});

export async function GET() {
  const user = await currentUser();
  if (!user) return Response.json({ error: "auth" }, { status: 401 });
  const cart = await getUserCart(user.id);
  return Response.json({ cart });
}

export async function PUT(request: Request) {
  const user = await currentUser();
  if (!user || user.role !== "CUSTOMER") return Response.json({ error: "auth" }, { status: 401 });
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "invalid" }, { status: 400 });
  await saveUserCart(user.id, parsed.data.lines);
  return Response.json({ ok: true });
}
