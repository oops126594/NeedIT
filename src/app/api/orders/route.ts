import { currentUser } from "@/lib/current-user";
import { createSavedOrder, hideEmail, listOrders } from "@/lib/records";
import { isSaudiMobile } from "@/lib/validate";
import { z } from "zod";

const bodySchema = z.object({
  lines: z.array(z.object({ productId: z.string(), quantity: z.number().int().min(1).max(8) })).min(1),
  address: z.object({
    recipient: z.string().trim().min(2),
    phone: z.string().trim().refine(isSaudiMobile),
    district: z.string().trim().min(2),
    line: z.string().trim().min(4),
    instructions: z.string().trim().max(200),
  }),
  paymentMethod: z.enum(["COD", "CARD"]),
  cardLast4: z.string().regex(/^\d{4}$/).optional(),
});

export async function GET() {
  const user = await currentUser();
  if (!user) return Response.json({ error: "auth" }, { status: 401 });
  const orders = await listOrders({ customerId: user.id });
  return Response.json({ orders: orders.map(hideEmail) });
}

export async function POST(request: Request) {
  const user = await currentUser();
  if (!user || user.role !== "CUSTOMER") return Response.json({ error: "auth" }, { status: 401 });
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "invalid" }, { status: 400 });
  if (parsed.data.paymentMethod === "CARD" && !parsed.data.cardLast4) {
    return Response.json({ error: "invalid" }, { status: 400 });
  }
  const result = await createSavedOrder({
    customer: user,
    lines: parsed.data.lines,
    address: parsed.data.address,
    paymentMethod: parsed.data.paymentMethod,
    cardLast4: parsed.data.cardLast4,
  });
  if (!result.ok) return Response.json({ error: result.reason }, { status: 409 });
  return Response.json({ order: hideEmail(result.order) });
}
