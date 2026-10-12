import { createUser } from "@/lib/records";
import { signSession, writeSessionCookie } from "@/lib/session";
import { isSaudiMobile } from "@/lib/validate";
import { z } from "zod";

const bodySchema = z.object({
  name: z.string().trim().min(2),
  email: z.string().trim().email(),
  phone: z.string().trim().refine(isSaudiMobile),
  password: z.string().min(8),
});

export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "invalid" }, { status: 400 });
  const user = await createUser(parsed.data);
  if (user === "exists") return Response.json({ error: "exists" }, { status: 409 });
  const token = await signSession({ sub: user.id, role: user.role, storeId: user.storeId });
  await writeSessionCookie(token);
  return Response.json({ user });
}
