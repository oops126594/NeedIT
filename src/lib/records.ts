import { PRODUCTS, STORES } from "@/lib/catalog";
import { courierBase, haversineKm, storePoint } from "@/lib/geo";
import { PILOT_ADMIN, PILOT_COURIERS, PILOT_PASSWORD } from "@/lib/pilot-accounts";
import { DELIVERY_FEE_HALALAS, lineTotal } from "@/lib/money";
import { formatOrderId } from "@/lib/orders";
import type {
  DeliveryAddress,
  OrderLine,
  OrderStatus,
  PaymentMethod,
  Product,
  StockStatus,
  Store,
} from "@/lib/types";
import bcrypt from "bcryptjs";
import { createHash, randomBytes, randomUUID } from "crypto";
import { mkdir, readFile, rename, writeFile } from "fs/promises";
import { MongoClient, type Db } from "mongodb";
import path from "path";

export type UserRole = "CUSTOMER" | "MERCHANT" | "ADMIN" | "COURIER";

export type UserRecord = {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  phone: string;
  role: UserRole;
  storeId?: string;
  createdAt: number;
};

export type PublicUser = {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: UserRole;
  storeId?: string;
};

export type SavedNotification = {
  id: string;
  userId: string;
  orderId?: string;
  productId?: string;
  status?: OrderStatus;
  kind?: "order" | "promo" | "cart" | "bill";
  title?: { ar: string; en: string };
  body?: { ar: string; en: string };
  href?: string;
  read: boolean;
  createdAt: number;
};

export type PasswordResetRecord = {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: number;
  createdAt: number;
};

export type SavedCart = {
  userId: string;
  lines: { productId: string; quantity: number }[];
  updatedAt: number;
  remindedAt?: number;
};

export type PromoSend = {
  id: string;
  userId: string;
  slotId: string;
  date: string;
};

export type PushSubscriptionRecord = {
  endpoint: string;
  userId: string;
  p256dh: string;
  auth: string;
  locale: "ar" | "en";
};

export type SavedOrder = {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail?: string;
  createdAt: number;
  updatedAt: number;
  storeId: string;
  storeName: Store["name"];
  lines: OrderLine[];
  subtotalHalalas: number;
  deliveryFeeHalalas: number;
  totalHalalas: number;
  address: DeliveryAddress;
  paymentMethod: PaymentMethod;
  cardLast4?: string;
  etaMinMinutes: number;
  etaMaxMinutes: number;
  courierId?: string;
  courierName?: string;
  courierPhone?: string;
  courierLat?: number;
  courierLng?: number;
  courierUpdatedAt?: number;
  tipHalalas?: number;
  alternatePhone?: string;
  status: OrderStatus;
  rating?: number;
};

type FileShape = {
  users: UserRecord[];
  stores: Store[];
  products: Product[];
  orders: SavedOrder[];
  orderSeq: number;
  notifications: SavedNotification[];
  pushSubscriptions: PushSubscriptionRecord[];
  passwordResets: PasswordResetRecord[];
  carts: SavedCart[];
  promoSends: PromoSend[];
};

const FILE_PATH = path.join(process.cwd(), "data", "needit.json");

const CONNECT_GENERATION = 3;

const globalStore = globalThis as unknown as {
  mongo?: Db;
  mode?: "mongo" | "file";
  fileQueue?: Promise<unknown>;
  generation?: number;
};

function publicUser(user: UserRecord): PublicUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    phone: user.phone,
    role: user.role,
    storeId: user.storeId,
  };
}

function emptyFile(): FileShape {
  return {
    users: [],
    stores: [],
    products: [],
    orders: [],
    orderSeq: 122,
    notifications: [],
    pushSubscriptions: [],
    passwordResets: [],
    carts: [],
    promoSends: [],
  };
}

function scheduleAlert(order: SavedOrder) {
  void import("@/lib/push")
    .then((mod) => mod.publishOrderAlert(order))
    .catch((error: unknown) => {
      console.error("order alert failed", error instanceof Error ? error.message : "unknown");
    });
}

function scheduleReceipt(order: SavedOrder) {
  void clearUserCart(order.customerId);
  void import("@/lib/customer-mail")
    .then((mod) => mod.sendOrderBill(order))
    .catch((error: unknown) => {
      console.error("order bill failed", error instanceof Error ? error.message : "unknown");
    });
}

function ensureJobs() {
  void import("@/lib/jobs")
    .then((mod) => mod.startBackgroundJobs())
    .catch((error: unknown) => {
      console.error("background jobs failed", error instanceof Error ? error.message : "unknown");
    });
}

async function readFileDb(): Promise<FileShape> {
  try {
    const raw = await readFile(FILE_PATH, "utf8");
    const parsed = JSON.parse(raw) as FileShape;
    return { ...emptyFile(), ...parsed };
  } catch {
    return emptyFile();
  }
}

async function writeFileDb(data: FileShape): Promise<void> {
  await mkdir(path.dirname(FILE_PATH), { recursive: true });
  const temporary = `${FILE_PATH}.tmp`;
  await writeFile(temporary, JSON.stringify(data), "utf8");
  await rename(temporary, FILE_PATH);
}

function withFile<T>(work: (data: FileShape) => Promise<T> | T): Promise<T> {
  const previous = globalStore.fileQueue ?? Promise.resolve();
  const run = previous.then(() => workFromDisk());
  globalStore.fileQueue = run.then(
    () => undefined,
    () => undefined,
  );

  async function workFromDisk(): Promise<T> {
    const data = await readFileDb();
    const result = await work(data);
    await writeFileDb(data);
    return result;
  }

  return run;
}

function mongoUri(raw: string): string {
  const trimmed = raw.trim();
  const schemeIndex = trimmed.indexOf("://");
  if (schemeIndex === -1) return trimmed;
  const scheme = trimmed.slice(0, schemeIndex + 3);
  const rest = trimmed.slice(scheme.length);
  const at = rest.lastIndexOf("@");
  if (at === -1) return trimmed;
  const auth = rest.slice(0, at);
  let hostAndPath = rest.slice(at + 1);
  const colon = auth.indexOf(":");
  if (colon === -1) return trimmed;
  let user = auth.slice(0, colon);
  let pass = auth.slice(colon + 1);
  try {
    user = decodeURIComponent(user);
    pass = decodeURIComponent(pass);
  } catch {
    // Keep the raw user and password when they are not percent-encoded.
  }
  if (!hostAndPath.includes("/")) hostAndPath += "/needit";
  else if (hostAndPath.endsWith("/")) hostAndPath += "needit";
  return `${scheme}${encodeURIComponent(user)}:${encodeURIComponent(pass)}@${hostAndPath}`;
}

function mongoHost(uri: string): string | null {
  const encoded = mongoUri(uri);
  const match = encoded.match(/@([^/?]+)/);
  return match?.[1]?.split(":")[0] ?? null;
}

function canTryMongo(uri: string | undefined): uri is string {
  if (!uri) return false;
  const host = mongoHost(uri);
  if (!host) return false;
  return host === "localhost" || host === "127.0.0.1" || host.endsWith(".mongodb.net");
}

async function connectMongo(): Promise<Db | null> {
  const uri = process.env.MONGO_URI?.trim();
  if (!canTryMongo(uri)) {
    if (uri) {
      console.warn(
        "MONGO_URI host is not a MongoDB Atlas or localhost address. Using the local database in data/needit.json.",
      );
    }
    return null;
  }
  try {
    const client = new MongoClient(mongoUri(uri), { serverSelectionTimeoutMS: 12000 });
    await client.connect();
    return client.db("needit");
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";
    console.warn(`MongoDB did not respond (${message}). Using the local database in data/needit.json.`);
    return null;
  }
}

async function mode(): Promise<"mongo" | "file"> {
  if (globalStore.generation !== CONNECT_GENERATION) {
    globalStore.mongo = undefined;
    globalStore.mode = undefined;
    globalStore.generation = CONNECT_GENERATION;
  }
  if (globalStore.mode === "mongo" && globalStore.mongo) {
    ensureJobs();
    return "mongo";
  }
  if (globalStore.mode === "file") {
    ensureJobs();
    return "file";
  }
  const db = await connectMongo();
  if (db) {
    globalStore.mongo = db;
    globalStore.mode = "mongo";
    await seedMongo(db);
    ensureJobs();
    return "mongo";
  }
  globalStore.mode = "file";
  await seedFile();
  ensureJobs();
  return "file";
}

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

function merchantUsers(): Array<Omit<UserRecord, "passwordHash" | "createdAt"> & { password: string }> {
  return STORES.map((store) => ({
    id: `merchant-${store.id}`,
    email: `merchant.${store.id}@needit.test`,
    password: PILOT_PASSWORD,
    name: store.name.en,
    phone: "0500000000",
    role: "MERCHANT" as const,
    storeId: store.id,
  }));
}

async function seedFile(): Promise<void> {
  await withFile(async (data) => {
    if (data.stores.length === 0) {
      data.stores = STORES;
      data.products = PRODUCTS;
    }
    await ensurePilotUsers(data.users, async (user) => {
      data.users.push(user);
    });
  });
}

async function importFileDatabase(db: Db): Promise<boolean> {
  let parsed: Partial<FileShape>;
  try {
    parsed = JSON.parse(await readFile(FILE_PATH, "utf8")) as Partial<FileShape>;
  } catch {
    return false;
  }
  if (!parsed.stores?.length) return false;
  const copy = async (name: string, docs: unknown[] | undefined) => {
    if (!docs?.length) return;
    if ((await db.collection(name).countDocuments()) > 0) return;
    await db.collection(name).insertMany(docs as never[]);
  };
  await copy("stores", parsed.stores);
  await copy("products", parsed.products);
  await copy("users", parsed.users);
  await copy("orders", parsed.orders);
  await copy("notifications", parsed.notifications);
  await copy("pushSubscriptions", parsed.pushSubscriptions);
  if (typeof parsed.orderSeq === "number" && !(await db.collection("counters").findOne({ name: "order" }))) {
    await db.collection("counters").insertOne({ name: "order", seq: parsed.orderSeq });
  }
  return true;
}

async function seedMongo(db: Db): Promise<void> {
  const stores = db.collection<Store>("stores");
  const users = db.collection<UserRecord>("users");
  await users.createIndex({ email: 1 }, { unique: true });
  await db.collection("orders").createIndex({ id: 1 }, { unique: true });
  if ((await stores.countDocuments()) === 0) {
    const imported = await importFileDatabase(db);
    if (!imported) {
      await stores.insertMany(STORES);
      await db.collection<Product>("products").insertMany(PRODUCTS);
    }
  }
  await ensurePilotUsers([], async (user) => {
    const existing = await users.findOne({ email: user.email });
    if (!existing) await users.insertOne(user);
  });
}

async function ensurePilotUsers(
  existing: UserRecord[],
  insert: (user: UserRecord) => Promise<void>,
): Promise<void> {
  const pilots = [
    {
      id: "admin",
      email: PILOT_ADMIN.email,
      password: PILOT_ADMIN.password,
      name: PILOT_ADMIN.name,
      phone: "0500000001",
      role: "ADMIN" as const,
    },
    ...merchantUsers(),
    ...PILOT_COURIERS.map((courier) => ({
      id: courier.id,
      email: courier.email,
      password: courier.password,
      name: courier.name,
      phone: courier.phone,
      role: "COURIER" as const,
    })),
  ];
  const known = new Set(existing.map((user) => user.email));
  for (const pilot of pilots) {
    if (known.has(pilot.email)) continue;
    await insert({
      id: pilot.id,
      email: pilot.email,
      passwordHash: await hashPassword(pilot.password),
      name: pilot.name,
      phone: pilot.phone,
      role: pilot.role,
      storeId: "storeId" in pilot ? pilot.storeId : undefined,
      createdAt: Date.now(),
    });
  }
}

function stripId<T extends { _id?: unknown }>(doc: T): Omit<T, "_id"> {
  const { _id, ...rest } = doc;
  return rest;
}

export async function readCatalog(): Promise<{ stores: Store[]; products: Product[] }> {
  if ((await mode()) === "mongo" && globalStore.mongo) {
    const db = globalStore.mongo;
    const stores = (await db.collection("stores").find({}).toArray()).map((doc) => stripId(doc) as Store);
    const products = (await db.collection("products").find({}).toArray()).map((doc) => stripId(doc) as Product);
    return { stores, products };
  }
  return withFile(async (data) => ({ stores: data.stores, products: data.products }));
}

export async function updateProductStock(
  storeId: string,
  productId: string,
  stock: StockStatus,
): Promise<Product | null> {
  const updatedAt = new Date().toISOString();
  if ((await mode()) === "mongo" && globalStore.mongo) {
    const products = globalStore.mongo.collection<Product>("products");
    const result = await products.findOneAndUpdate(
      { id: productId, storeId },
      { $set: { stock, inventoryUpdatedAt: updatedAt } },
      { returnDocument: "after" },
    );
    return result ? (stripId(result) as Product) : null;
  }
  return withFile(async (data) => {
    const product = data.products.find((item) => item.id === productId && item.storeId === storeId);
    if (!product) return null;
    product.stock = stock;
    product.inventoryUpdatedAt = updatedAt;
    return product;
  });
}

export async function createUser(input: {
  name: string;
  email: string;
  phone: string;
  password: string;
}): Promise<PublicUser | "exists"> {
  const email = input.email.toLowerCase();
  const user: UserRecord = {
    id: randomUUID(),
    email,
    passwordHash: await hashPassword(input.password),
    name: input.name.trim(),
    phone: input.phone.trim(),
    role: "CUSTOMER",
    createdAt: Date.now(),
  };
  if ((await mode()) === "mongo" && globalStore.mongo) {
    try {
      await globalStore.mongo.collection<UserRecord>("users").insertOne(user);
      return publicUser(user);
    } catch {
      return "exists";
    }
  }
  return withFile(async (data) => {
    if (data.users.some((item) => item.email === email)) return "exists";
    data.users.push(user);
    return publicUser(user);
  });
}

export async function authenticate(email: string, password: string): Promise<PublicUser | null> {
  const normalized = email.toLowerCase();
  const user = await findUserRecord(normalized);
  if (!user) return null;
  const matches = await bcrypt.compare(password, user.passwordHash);
  return matches ? publicUser(user) : null;
}

async function findUserRecord(emailOrId: string, by: "email" | "id" = "email"): Promise<UserRecord | null> {
  if ((await mode()) === "mongo" && globalStore.mongo) {
    const query = by === "email" ? { email: emailOrId } : { id: emailOrId };
    const doc = await globalStore.mongo.collection<UserRecord>("users").findOne(query);
    return doc ? stripId(doc) : null;
  }
  return withFile(async (data) => {
    return data.users.find((user) => (by === "email" ? user.email === emailOrId : user.id === emailOrId)) ?? null;
  });
}

export async function findUserById(id: string): Promise<PublicUser | null> {
  const user = await findUserRecord(id, "id");
  return user ? publicUser(user) : null;
}

export async function createSavedOrder(input: {
  customer: PublicUser;
  lines: { productId: string; quantity: number }[];
  address: DeliveryAddress;
  paymentMethod: PaymentMethod;
  cardLast4?: string;
}): Promise<{ ok: true; order: SavedOrder } | { ok: false; reason: "empty" | "mixed" | "closed" | "unavailable" }> {
  const catalog = await readCatalog();
  const detailed = input.lines.flatMap((line) => {
    const product = catalog.products.find((item) => item.id === line.productId);
    if (!product || line.quantity < 1) return [];
    return [{ product, quantity: Math.min(8, line.quantity) }];
  });
  if (detailed.length === 0) return { ok: false, reason: "empty" };
  const storeIds = new Set(detailed.map((item) => item.product.storeId));
  if (storeIds.size !== 1) return { ok: false, reason: "mixed" };
  const store = catalog.stores.find((item) => item.id === detailed[0]?.product.storeId);
  if (!store || !store.isOpen) return { ok: false, reason: "closed" };
  if (detailed.some((item) => item.product.stock === "OUT_OF_STOCK")) return { ok: false, reason: "unavailable" };

  const subtotal = detailed.reduce((sum, item) => sum + lineTotal(item.product.priceHalalas, item.quantity), 0);
  const now = Date.now();
  const build = (sequence: number): SavedOrder => ({
    id: formatOrderId(sequence),
    customerId: input.customer.id,
    customerName: input.customer.name,
    customerEmail: input.customer.email,
    createdAt: now,
    updatedAt: now,
    storeId: store.id,
    storeName: store.name,
    lines: detailed.map((item) => ({
      productId: item.product.id,
      name: item.product.name,
      quantity: item.quantity,
      priceHalalas: item.product.priceHalalas,
    })),
    subtotalHalalas: subtotal,
    deliveryFeeHalalas: DELIVERY_FEE_HALALAS,
    totalHalalas: subtotal + DELIVERY_FEE_HALALAS,
    address: input.address,
    paymentMethod: input.paymentMethod,
    cardLast4: input.paymentMethod === "CARD" ? input.cardLast4 : undefined,
    etaMinMinutes: store.deliveryMinMinutes,
    etaMaxMinutes: store.deliveryMaxMinutes,
    status: "PLACED",
  });

  if ((await mode()) === "mongo" && globalStore.mongo) {
    const counters = globalStore.mongo.collection<{ name: string; seq: number }>("counters");
    if (!(await counters.findOne({ name: "order" }))) {
      await counters.insertOne({ name: "order", seq: 122 });
    }
    const counter = await counters.findOneAndUpdate(
      { name: "order" },
      { $inc: { seq: 1 } },
      { returnDocument: "after" },
    );
    const order = build(counter?.seq ?? 123);
    await globalStore.mongo.collection<SavedOrder>("orders").insertOne(order);
    scheduleAlert(order);
    scheduleReceipt(order);
    return { ok: true, order };
  }

  const order = await withFile(async (data) => {
    data.orderSeq += 1;
    const saved = build(data.orderSeq);
    data.orders.unshift(saved);
    return saved;
  });
  scheduleAlert(order);
  scheduleReceipt(order);
  return { ok: true, order };
}

export async function listOrders(filter: { customerId?: string; storeId?: string }): Promise<SavedOrder[]> {
  if ((await mode()) === "mongo" && globalStore.mongo) {
    const query: Record<string, string> = {};
    if (filter.customerId) query.customerId = filter.customerId;
    if (filter.storeId) query.storeId = filter.storeId;
    const docs = await globalStore.mongo.collection("orders").find(query).sort({ createdAt: -1 }).toArray();
    return docs.map((doc) => stripId(doc) as SavedOrder);
  }
  return withFile(async (data) =>
    data.orders.filter((order) => {
      if (filter.customerId && order.customerId !== filter.customerId) return false;
      if (filter.storeId && order.storeId !== filter.storeId) return false;
      return true;
    }),
  );
}

export async function findOrder(id: string): Promise<SavedOrder | null> {
  const orders = await listOrders({});
  return orders.find((order) => order.id === id) ?? null;
}

const MERCHANT_MOVES: Record<string, { from: OrderStatus[]; to: OrderStatus }> = {
  accept: { from: ["PLACED"], to: "ACCEPTED" },
  reject: { from: ["PLACED"], to: "REJECTED" },
  preparing: { from: ["ACCEPTED"], to: "PREPARING" },
  ready: { from: ["PREPARING"], to: "READY_FOR_PICKUP" },
};

const DELIVERY_MOVES: Partial<Record<OrderStatus, OrderStatus>> = {
  READY_FOR_PICKUP: "COURIER_ASSIGNED",
  COURIER_ASSIGNED: "PICKED_UP",
  PICKED_UP: "OUT_FOR_DELIVERY",
  OUT_FOR_DELIVERY: "DELIVERED",
};

export async function merchantMove(
  orderId: string,
  storeId: string,
  action: string,
): Promise<SavedOrder | null> {
  const move = MERCHANT_MOVES[action];
  if (!move) return null;
  return changeOrder(orderId, (order) => {
    if (order.storeId !== storeId || !move.from.includes(order.status)) return null;
    return { ...order, status: move.to, updatedAt: Date.now() };
  });
}

const COURIER_ACTIVE = new Set<OrderStatus>(["COURIER_ASSIGNED", "PICKED_UP", "OUT_FOR_DELIVERY"]);
const CUSTOMER_CAN_EDIT = new Set<OrderStatus>([
  "PLACED",
  "ACCEPTED",
  "PREPARING",
  "READY_FOR_PICKUP",
  "COURIER_ASSIGNED",
  "PICKED_UP",
  "OUT_FOR_DELIVERY",
]);

async function listUserRecords(): Promise<UserRecord[]> {
  if ((await mode()) === "mongo" && globalStore.mongo) {
    const docs = await globalStore.mongo.collection<UserRecord>("users").find({}).toArray();
    return docs.map((doc) => stripId(doc) as UserRecord);
  }
  return withFile(async (data) => data.users);
}

async function pickCourier(storeId: string): Promise<UserRecord | null> {
  const couriers = (await listUserRecords()).filter((user) => user.role === "COURIER");
  if (couriers.length === 0) return null;
  const orders = await listOrders({});
  const busy = new Set(
    orders.flatMap((order) => (order.courierId && COURIER_ACTIVE.has(order.status) ? [order.courierId] : [])),
  );
  const origin = storePoint(storeId);
  return [...couriers].sort((left, right) => {
    const leftBusy = busy.has(left.id) ? 1 : 0;
    const rightBusy = busy.has(right.id) ? 1 : 0;
    if (leftBusy !== rightBusy) return leftBusy - rightBusy;
    return haversineKm(courierBase(left.id), origin) - haversineKm(courierBase(right.id), origin);
  })[0] ?? null;
}

function withCourier(order: SavedOrder, courier: UserRecord): SavedOrder {
  const base = courierBase(courier.id);
  return {
    ...order,
    courierId: courier.id,
    courierName: courier.name,
    courierPhone: courier.phone,
    courierLat: order.courierLat ?? base.lat,
    courierLng: order.courierLng ?? base.lng,
    courierUpdatedAt: order.courierUpdatedAt ?? Date.now(),
  };
}

export async function advanceDelivery(orderId: string): Promise<SavedOrder | null> {
  const current = await findOrder(orderId);
  if (!current) return null;
  const nextStatus = DELIVERY_MOVES[current.status];
  if (!nextStatus) return null;
  const needsCourier =
    !current.courierId &&
    (nextStatus === "COURIER_ASSIGNED" ||
      nextStatus === "PICKED_UP" ||
      nextStatus === "OUT_FOR_DELIVERY" ||
      nextStatus === "DELIVERED");
  const courier = needsCourier ? await pickCourier(current.storeId) : null;
  return changeOrder(orderId, (order) => {
    if (order.status !== current.status) return null;
    const next: SavedOrder = { ...order, status: nextStatus, updatedAt: Date.now() };
    return courier && !next.courierId ? withCourier(next, courier) : next;
  });
}

export async function courierJobs(courierId: string): Promise<{ open: SavedOrder[]; mine: SavedOrder[] }> {
  const orders = await listOrders({});
  return {
    open: orders.filter((order) => order.status === "READY_FOR_PICKUP" && !order.courierId),
    mine: orders.filter((order) => order.courierId === courierId && order.status !== "CANCELLED" && order.status !== "REJECTED"),
  };
}

export async function claimDelivery(orderId: string, courier: PublicUser): Promise<SavedOrder | null> {
  return changeOrder(orderId, (order) => {
    if (order.status !== "READY_FOR_PICKUP" || order.courierId) return null;
    const base = courierBase(courier.id);
    return {
      ...order,
      status: "COURIER_ASSIGNED",
      courierId: courier.id,
      courierName: courier.name,
      courierPhone: courier.phone,
      courierLat: base.lat,
      courierLng: base.lng,
      courierUpdatedAt: Date.now(),
      updatedAt: Date.now(),
    };
  });
}

const COURIER_MOVES: Record<string, { from: OrderStatus; to: OrderStatus }> = {
  pickup: { from: "COURIER_ASSIGNED", to: "PICKED_UP" },
  enroute: { from: "PICKED_UP", to: "OUT_FOR_DELIVERY" },
  deliver: { from: "OUT_FOR_DELIVERY", to: "DELIVERED" },
};

export async function courierMove(orderId: string, courierId: string, action: string): Promise<SavedOrder | null> {
  const move = COURIER_MOVES[action];
  if (!move) return null;
  return changeOrder(orderId, (order) => {
    if (order.courierId !== courierId || order.status !== move.from) return null;
    return { ...order, status: move.to, updatedAt: Date.now() };
  });
}

export async function courierLocate(
  orderId: string,
  courierId: string,
  lat: number,
  lng: number,
): Promise<SavedOrder | null> {
  return changeOrder(orderId, (order) => {
    if (order.courierId !== courierId || !COURIER_ACTIVE.has(order.status)) return null;
    return { ...order, courierLat: lat, courierLng: lng, courierUpdatedAt: Date.now(), updatedAt: Date.now() };
  });
}

export async function updateCustomerDelivery(
  orderId: string,
  customerId: string,
  patch: {
    address?: DeliveryAddress;
    alternatePhone?: string;
    tipHalalas?: number;
  },
): Promise<SavedOrder | "closed" | null> {
  const current = await findOrder(orderId);
  if (!current || current.customerId !== customerId) return null;
  if (!CUSTOMER_CAN_EDIT.has(current.status)) return "closed";
  return changeOrder(orderId, (order) => {
    if (order.customerId !== customerId || !CUSTOMER_CAN_EDIT.has(order.status)) return null;
    return {
      ...order,
      address: patch.address ?? order.address,
      alternatePhone: patch.alternatePhone === undefined ? order.alternatePhone : patch.alternatePhone || undefined,
      tipHalalas: patch.tipHalalas ?? order.tipHalalas,
      updatedAt: Date.now(),
    };
  });
}

export async function cancelSavedOrder(orderId: string, customerId: string): Promise<SavedOrder | "too-late" | null> {
  const current = await findOrder(orderId);
  if (!current || current.customerId !== customerId) return null;
  if (current.status !== "PLACED" && current.status !== "ACCEPTED") return "too-late";
  return changeOrder(orderId, (order) => ({ ...order, status: "CANCELLED", updatedAt: Date.now() }));
}

export async function rateSavedOrder(
  orderId: string,
  customerId: string,
  rating: number,
): Promise<SavedOrder | null> {
  if (rating < 1 || rating > 5) return null;
  return changeOrder(orderId, (order) => {
    if (order.customerId !== customerId || order.status !== "DELIVERED" || order.rating) return null;
    return { ...order, rating, updatedAt: Date.now() };
  });
}

async function changeOrder(
  orderId: string,
  update: (order: SavedOrder) => SavedOrder | null,
): Promise<SavedOrder | null> {
  if ((await mode()) === "mongo" && globalStore.mongo) {
    const orders = globalStore.mongo.collection<SavedOrder>("orders");
    const current = await orders.findOne({ id: orderId });
    if (!current) return null;
    const before = (stripId(current) as SavedOrder).status;
    const next = update(stripId(current) as SavedOrder);
    if (!next) return null;
    await orders.updateOne({ id: orderId }, { $set: next });
    if (next.status !== before) scheduleAlert(next);
    return next;
  }
  const changed = await withFile(async (data) => {
    const index = data.orders.findIndex((order) => order.id === orderId);
    const current = data.orders[index];
    if (!current) return null;
    const next = update(current);
    if (!next) return null;
    data.orders[index] = next;
    return { next, alert: next.status !== current.status };
  });
  if (changed?.alert) scheduleAlert(changed.next);
  return changed ? changed.next : null;
}

export async function saveNotification(note: SavedNotification): Promise<void> {
  if ((await mode()) === "mongo" && globalStore.mongo) {
    await globalStore.mongo.collection<SavedNotification>("notifications").updateOne(
      { id: note.id },
      { $setOnInsert: note },
      { upsert: true },
    );
    return;
  }
  await withFile(async (data) => {
    data.notifications = data.notifications ?? [];
    if (!data.notifications.some((item) => item.id === note.id)) {
      data.notifications.unshift(note);
      data.notifications = data.notifications.slice(0, 200);
    }
  });
}

export async function listNotifications(userId: string): Promise<SavedNotification[]> {
  if ((await mode()) === "mongo" && globalStore.mongo) {
    const docs = await globalStore.mongo
      .collection<SavedNotification>("notifications")
      .find({ userId })
      .sort({ createdAt: -1 })
      .limit(40)
      .toArray();
    return docs.map((doc) => stripId(doc) as SavedNotification);
  }
  return withFile(async (data) =>
    (data.notifications ?? [])
      .filter((note) => note.userId === userId)
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 40),
  );
}

export async function markNotificationsRead(userId: string): Promise<void> {
  if ((await mode()) === "mongo" && globalStore.mongo) {
    await globalStore.mongo.collection<SavedNotification>("notifications").updateMany({ userId }, { $set: { read: true } });
    return;
  }
  await withFile(async (data) => {
    data.notifications = (data.notifications ?? []).map((note) =>
      note.userId === userId ? { ...note, read: true } : note,
    );
  });
}

export async function savePushSubscription(record: PushSubscriptionRecord): Promise<void> {
  if ((await mode()) === "mongo" && globalStore.mongo) {
    await globalStore.mongo
      .collection<PushSubscriptionRecord>("pushSubscriptions")
      .updateOne({ endpoint: record.endpoint }, { $set: record }, { upsert: true });
    return;
  }
  await withFile(async (data) => {
    data.pushSubscriptions = data.pushSubscriptions ?? [];
    data.pushSubscriptions = [
      record,
      ...data.pushSubscriptions.filter((item) => item.endpoint !== record.endpoint),
    ].slice(0, 200);
  });
}

export async function listPushSubscriptions(userId: string): Promise<PushSubscriptionRecord[]> {
  if ((await mode()) === "mongo" && globalStore.mongo) {
    const docs = await globalStore.mongo
      .collection<PushSubscriptionRecord>("pushSubscriptions")
      .find({ userId })
      .toArray();
    return docs.map((doc) => stripId(doc) as PushSubscriptionRecord);
  }
  return withFile(async (data) => (data.pushSubscriptions ?? []).filter((item) => item.userId === userId));
}

export async function deletePushSubscription(endpoint: string): Promise<void> {
  if ((await mode()) === "mongo" && globalStore.mongo) {
    await globalStore.mongo.collection("pushSubscriptions").deleteOne({ endpoint });
    return;
  }
  await withFile(async (data) => {
    data.pushSubscriptions = (data.pushSubscriptions ?? []).filter((item) => item.endpoint !== endpoint);
  });
}

function tokenHash(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createPasswordReset(email: string): Promise<{ token: string; name: string } | null> {
  const user = await findUserRecord(email.toLowerCase());
  if (!user) return null;
  const token = randomBytes(32).toString("hex");
  const record: PasswordResetRecord = {
    id: randomUUID(),
    userId: user.id,
    tokenHash: tokenHash(token),
    expiresAt: Date.now() + 30 * 60 * 1000,
    createdAt: Date.now(),
  };
  if ((await mode()) === "mongo" && globalStore.mongo) {
    const resets = globalStore.mongo.collection<PasswordResetRecord>("passwordResets");
    await resets.deleteMany({ userId: user.id });
    await resets.insertOne(record);
    return { token, name: user.name };
  }
  await withFile(async (data) => {
    data.passwordResets = (data.passwordResets ?? []).filter((item) => item.userId !== user.id);
    data.passwordResets.unshift(record);
  });
  return { token, name: user.name };
}

export async function resetPasswordWithToken(token: string, password: string): Promise<boolean> {
  const hash = tokenHash(token);
  const now = Date.now();
  const nextHash = await hashPassword(password);
  if ((await mode()) === "mongo" && globalStore.mongo) {
    const resets = globalStore.mongo.collection<PasswordResetRecord>("passwordResets");
    const record = await resets.findOne({ tokenHash: hash });
    if (!record || record.expiresAt < now) return false;
    await globalStore.mongo.collection<UserRecord>("users").updateOne({ id: record.userId }, { $set: { passwordHash: nextHash } });
    await resets.deleteMany({ userId: record.userId });
    return true;
  }
  return withFile(async (data) => {
    const record = (data.passwordResets ?? []).find((item) => item.tokenHash === hash);
    if (!record || record.expiresAt < now) return false;
    const user = data.users.find((item) => item.id === record.userId);
    if (!user) return false;
    user.passwordHash = nextHash;
    data.passwordResets = data.passwordResets.filter((item) => item.userId !== record.userId);
    return true;
  });
}

export async function saveUserCart(userId: string, lines: SavedCart["lines"]): Promise<void> {
  const cleaned = lines.filter((line) => line.quantity > 0).slice(0, 20);
  if ((await mode()) === "mongo" && globalStore.mongo) {
    const carts = globalStore.mongo.collection<SavedCart>("carts");
    if (cleaned.length === 0) {
      await carts.deleteOne({ userId });
      return;
    }
    const current = await carts.findOne({ userId });
    const same = current && JSON.stringify(current.lines) === JSON.stringify(cleaned);
    if (same) return;
    await carts.updateOne(
      { userId },
      { $set: { userId, lines: cleaned, updatedAt: Date.now() }, $unset: { remindedAt: "" } },
      { upsert: true },
    );
    return;
  }
  await withFile(async (data) => {
    data.carts = data.carts ?? [];
    if (cleaned.length === 0) {
      data.carts = data.carts.filter((cart) => cart.userId !== userId);
      return;
    }
    const current = data.carts.find((cart) => cart.userId === userId);
    const same = current && JSON.stringify(current.lines) === JSON.stringify(cleaned);
    const next: SavedCart = {
      userId,
      lines: cleaned,
      updatedAt: same ? current.updatedAt : Date.now(),
      remindedAt: same ? current.remindedAt : undefined,
    };
    data.carts = [next, ...data.carts.filter((cart) => cart.userId !== userId)];
  });
}

export async function getUserCart(userId: string): Promise<SavedCart | null> {
  if ((await mode()) === "mongo" && globalStore.mongo) {
    const cart = await globalStore.mongo.collection<SavedCart>("carts").findOne({ userId });
    return cart ? stripId(cart) : null;
  }
  return withFile(async (data) => data.carts?.find((cart) => cart.userId === userId) ?? null);
}

export async function clearUserCart(userId: string): Promise<void> {
  if ((await mode()) === "mongo" && globalStore.mongo) {
    await globalStore.mongo.collection("carts").deleteOne({ userId });
    return;
  }
  await withFile(async (data) => {
    data.carts = (data.carts ?? []).filter((cart) => cart.userId !== userId);
  });
}

export async function cartsReadyForReminder(olderThan: number): Promise<SavedCart[]> {
  if ((await mode()) === "mongo" && globalStore.mongo) {
    const docs = await globalStore.mongo
      .collection<SavedCart>("carts")
      .find({ updatedAt: { $lt: olderThan } })
      .toArray();
    return docs
      .map((doc) => stripId(doc))
      .filter((cart) => cart.lines.length > 0 && (!cart.remindedAt || cart.remindedAt < cart.updatedAt));
  }
  return withFile(async (data) =>
    (data.carts ?? []).filter(
      (cart) => cart.lines.length > 0 && cart.updatedAt < olderThan && (!cart.remindedAt || cart.remindedAt < cart.updatedAt),
    ),
  );
}

export async function markCartReminded(userId: string): Promise<void> {
  const remindedAt = Date.now();
  if ((await mode()) === "mongo" && globalStore.mongo) {
    await globalStore.mongo.collection("carts").updateOne({ userId }, { $set: { remindedAt } });
    return;
  }
  await withFile(async (data) => {
    const cart = data.carts?.find((item) => item.userId === userId);
    if (cart) cart.remindedAt = remindedAt;
  });
}

export async function listCustomers(): Promise<Array<{ id: string; email: string; name: string }>> {
  if ((await mode()) === "mongo" && globalStore.mongo) {
    const docs = await globalStore.mongo.collection<UserRecord>("users").find({ role: "CUSTOMER" }).toArray();
    return docs.map((user) => ({ id: user.id, email: user.email, name: user.name }));
  }
  return withFile(async (data) =>
    data.users.filter((user) => user.role === "CUSTOMER").map((user) => ({ id: user.id, email: user.email, name: user.name })),
  );
}

export async function promoWasSent(id: string): Promise<boolean> {
  if ((await mode()) === "mongo" && globalStore.mongo) {
    const found = await globalStore.mongo.collection<PromoSend>("promoSends").findOne({ id });
    return Boolean(found);
  }
  return withFile(async (data) => (data.promoSends ?? []).some((item) => item.id === id));
}

export async function markPromoSent(record: PromoSend): Promise<void> {
  if ((await mode()) === "mongo" && globalStore.mongo) {
    await globalStore.mongo.collection<PromoSend>("promoSends").updateOne({ id: record.id }, { $setOnInsert: record }, { upsert: true });
    return;
  }
  await withFile(async (data) => {
    data.promoSends = data.promoSends ?? [];
    if (!data.promoSends.some((item) => item.id === record.id)) data.promoSends.push(record);
  });
}

export function hideEmail(order: SavedOrder): SavedOrder {
  const { customerEmail, ...rest } = order;
  void customerEmail;
  return rest;
}
