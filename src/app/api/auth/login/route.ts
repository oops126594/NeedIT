import { authenticate } from "@/lib/records";
import { signSession, writeSessionCookie } from "@/lib/session";
import { z } from "zod";

const bodySchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8),
});

export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "invalid" }, { status: 400 });
  const user = await authenticate(parsed.data.email, parsed.data.password);
  if (!user) return Response.json({ error: "invalid" }, { status: 401 });
  const token = await signSession({ sub: user.id, role: user.role, storeId: user.storeId });
  await writeSessionCookie(token);
  return Response.json({ user });
}
