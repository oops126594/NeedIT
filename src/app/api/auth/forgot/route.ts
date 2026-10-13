import { createPasswordReset } from "@/lib/records";
import { mailConfigured } from "@/lib/mail";
import { sendPasswordReset } from "@/lib/customer-mail";
import { z } from "zod";

const bodySchema = z.object({
  email: z.string().trim().email(),
  locale: z.enum(["ar", "en"]).optional(),
});

export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "invalid" }, { status: 400 });
  if (!mailConfigured()) return Response.json({ error: "mail" }, { status: 503 });
  const reset = await createPasswordReset(parsed.data.email);
  if (reset) {
    const sent = await sendPasswordReset({
      email: parsed.data.email.toLowerCase(),
      name: reset.name,
      locale: parsed.data.locale ?? "ar",
      token: reset.token,
    });
    if (!sent) return Response.json({ error: "mail" }, { status: 503 });
  }
  return Response.json({ ok: true });
}
