import { currentUser } from "@/lib/current-user";
import { updateProductStock } from "@/lib/records";
import { z } from "zod";

const bodySchema = z.object({
  stock: z.enum(["IN_STOCK", "LOW_STOCK", "OUT_OF_STOCK"]),
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
  const product = await updateProductStock(user.storeId, id, parsed.data.stock);
  if (!product) return Response.json({ error: "missing" }, { status: 404 });
  return Response.json({ product });
}
