import { pushPublicKey } from "@/lib/push";

export async function GET() {
  const publicKey = await pushPublicKey();
  return Response.json({ publicKey });
}
