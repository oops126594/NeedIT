import { currentUser } from "@/lib/current-user";
import { createServiceRequest, listServiceRequests } from "@/lib/records";
import type { ServiceRequest } from "@/lib/service-types";
import { isSaudiMobile } from "@/lib/validate";
import { randomUUID } from "crypto";
import { z } from "zod";

const place = z.object({
  label: z.string().trim().min(3).max(240),
  district: z.string().trim().max(100),
  lat: z.number().gte(-90).lte(90),
  lng: z.number().gte(-180).lte(180),
});

const common = {
  scheduledFor: z.string().datetime().optional(),
  notes: z.string().trim().max(500).optional(),
};

const bodySchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("HOME_DELIVERY"),
    subtype: z.enum(["GROCERIES", "PARCEL", "GIFT", "DOCUMENTS", "PHARMACY", "STORE_PICKUP"]),
    pickup: place,
    dropoff: place,
    recipientName: z.string().trim().min(2).max(80),
    recipientPhone: z.string().trim().refine(isSaudiMobile),
    itemDescription: z.string().trim().min(3).max(500),
    ...common,
  }),
  z.object({
    kind: z.literal("FUEL_REFILL"),
    fuelType: z.enum(["PETROL_91", "PETROL_95", "DIESEL"]),
    liters: z.number().int().min(5).max(60),
    vehicleMake: z.string().trim().min(2).max(60),
    vehicleModel: z.string().trim().min(1).max(60),
    vehicleColor: z.string().trim().min(2).max(40),
    plateNumber: z.string().trim().min(3).max(20),
    location: place,
    safetyAccepted: z.literal(true),
    ...common,
  }),
]);

const DELIVERY_FEES = { GROCERIES: 1500, PARCEL: 1800, GIFT: 1800, DOCUMENTS: 1200, PHARMACY: 1500, STORE_PICKUP: 1500 } as const;
const FUEL_RATES = {
  PETROL_91: Number(process.env.FUEL_91_HALALAS_PER_LITER || 218),
  PETROL_95: Number(process.env.FUEL_95_HALALAS_PER_LITER || 233),
  DIESEL: Number(process.env.DIESEL_HALALAS_PER_LITER || 179),
} as const;

export async function GET() {
  const user = await currentUser();
  if (!user || user.role !== "CUSTOMER") return Response.json({ error: "auth" }, { status: 401 });
  return Response.json({ requests: await listServiceRequests(user.id) });
}

export async function POST(request: Request) {
  const user = await currentUser();
  if (!user || user.role !== "CUSTOMER") return Response.json({ error: "auth" }, { status: 401 });
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "invalid" }, { status: 400 });
  const now = Date.now();
  const base = {
    id: `SR-${now.toString(36).toUpperCase()}-${randomUUID().slice(0, 4).toUpperCase()}`,
    customerId: user.id,
    customerName: user.name,
    customerPhone: user.phone,
    createdAt: now,
    status: "REQUESTED" as const,
    scheduledFor: parsed.data.scheduledFor,
    notes: parsed.data.notes,
  };
  let saved: ServiceRequest;
  if (parsed.data.kind === "HOME_DELIVERY") {
    const serviceFeeHalalas = DELIVERY_FEES[parsed.data.subtype];
    saved = { ...base, ...parsed.data, serviceFeeHalalas, estimatedTotalHalalas: serviceFeeHalalas };
  } else {
    const serviceFeeHalalas = 2000;
    const fuelEstimateHalalas = Math.round(FUEL_RATES[parsed.data.fuelType] * parsed.data.liters);
    saved = { ...base, ...parsed.data, serviceFeeHalalas, fuelEstimateHalalas, estimatedTotalHalalas: serviceFeeHalalas + fuelEstimateHalalas };
  }
  await createServiceRequest(saved);
  return Response.json({ request: saved }, { status: 201 });
}
