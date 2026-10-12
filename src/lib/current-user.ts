import { findUserById, type PublicUser } from "@/lib/records";
import { readSession } from "@/lib/session";

export async function currentUser(): Promise<PublicUser | null> {
  const session = await readSession();
  if (!session) return null;
  return findUserById(session.sub);
}
