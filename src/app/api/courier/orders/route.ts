import { currentUser } from "@/lib/current-user";
import { courierJobs, hideEmail } from "@/lib/records";

export async function GET() {
  const user = await currentUser();
  if (!user || user.role !== "COURIER") return Response.json({ error: "forbidden" }, { status: 403 });
  const jobs = await courierJobs(user.id);
  return Response.json({
    open: jobs.open.map(hideEmail),
    mine: jobs.mine.map(hideEmail),
  });
}
