import { resetPasswordWithToken } from "@/lib/records";
import { z } from "zod";

const bodySchema = z.object({
  token: z.string().min(20),
  password: z.string().min(8),
});

export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "invalid" }, { status: 400 });
  const ok = await resetPasswordWithToken(parsed.data.token, parsed.data.password);
  if (!ok) return Response.json({ error: "invalid" }, { status: 400 });
  return Response.json({ ok: true });
}
