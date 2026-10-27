export type ServiceRequestStatus = "REQUESTED" | "REVIEWING" | "CONFIRMED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

export type ServicePlace = {
  label: string;
  district: string;
  lat: number;
  lng: number;
};

export type DeliverySubtype = "GROCERIES" | "PARCEL" | "GIFT" | "DOCUMENTS" | "PHARMACY" | "STORE_PICKUP";
export type FuelType = "PETROL_91" | "PETROL_95" | "DIESEL";

type ServiceRequestBase = {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  createdAt: number;
  scheduledFor?: string;
  notes?: string;
  status: ServiceRequestStatus;
  serviceFeeHalalas: number;
  estimatedTotalHalalas: number;
};

export type DeliveryServiceRequest = ServiceRequestBase & {
  kind: "HOME_DELIVERY";
  subtype: DeliverySubtype;
  pickup: ServicePlace;
  dropoff: ServicePlace;
  recipientName: string;
  recipientPhone: string;
  itemDescription: string;
};

export type FuelServiceRequest = ServiceRequestBase & {
  kind: "FUEL_REFILL";
  fuelType: FuelType;
  liters: number;
  vehicleMake: string;
  vehicleModel: string;
  vehicleColor: string;
  plateNumber: string;
  location: ServicePlace;
  fuelEstimateHalalas: number;
  safetyAccepted: true;
};

export type ServiceRequest = DeliveryServiceRequest | FuelServiceRequest;
