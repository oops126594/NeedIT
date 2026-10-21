import { currentUser } from "@/lib/current-user";
import { hideEmail, updateCustomerDelivery } from "@/lib/records";
import { isSaudiMobile } from "@/lib/validate";
import { z } from "zod";

const bodySchema = z
  .object({
    address: z
      .object({
        recipient: z.string().trim().min(2),
        phone: z.string().trim().refine(isSaudiMobile),
        district: z.string().trim().min(2),
        line: z.string().trim().min(4),
        instructions: z.string().trim().max(200),
        lat: z.number().gte(-90).lte(90).optional(),
        lng: z.number().gte(-180).lte(180).optional(),
      })
      .optional(),
    alternatePhone: z
      .string()
      .trim()
      .refine((value) => value === "" || isSaudiMobile(value))
      .optional(),
    tipHalalas: z.union([z.literal(200), z.literal(500), z.literal(1000)]).optional(),
  })
  .refine((body) => body.address || body.alternatePhone !== undefined || body.tipHalalas !== undefined);

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await currentUser();
  if (!user || user.role !== "CUSTOMER") return Response.json({ error: "auth" }, { status: 401 });
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "invalid" }, { status: 400 });
  const { id } = await context.params;
  const order = await updateCustomerDelivery(id, user.id, parsed.data);
  if (order === "closed") return Response.json({ error: "closed" }, { status: 409 });
  if (!order) return Response.json({ error: "missing" }, { status: 404 });
  return Response.json({ order: hideEmail(order) });
}
