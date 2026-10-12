import { readCatalog } from "@/lib/records";

export async function GET() {
  const catalog = await readCatalog();
  return Response.json(catalog);
}
