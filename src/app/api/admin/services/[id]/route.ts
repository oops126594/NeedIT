import { currentUser } from "@/lib/current-user";
import { updateServiceRequestStatus } from "@/lib/records";
import { z } from "zod";

const bodySchema = z.object({ status: z.enum(["REQUESTED", "REVIEWING", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED"]) });

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await currentUser();
  if (!user || user.role !== "ADMIN") return Response.json({ error: "forbidden" }, { status: 403 });
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "invalid" }, { status: 400 });
  const { id } = await context.params;
  const service = await updateServiceRequestStatus(id, parsed.data.status);
  if (!service) return Response.json({ error: "missing" }, { status: 404 });
  return Response.json({ service });
}
