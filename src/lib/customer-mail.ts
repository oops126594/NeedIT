import { appOrigin, sendMail } from "@/lib/mail";
import { formatSar } from "@/lib/money";
import type { Offer } from "@/lib/offer-calendar";
import type { SavedCart, SavedOrder } from "@/lib/records";
import { readCatalog } from "@/lib/records";

function money(halalas: number): string {
  return formatSar(halalas, "en");
}

export async function sendOrderBill(order: SavedOrder): Promise<void> {
  if (!order.customerEmail) return;
  const lines = order.lines
    .map((line) => {
      const amount = money(line.priceHalalas * line.quantity);
      return `${line.quantity} × ${line.name.en} / ${line.name.ar} — ${amount}`;
    })
    .join("\n");
  const origin = appOrigin();
  const text = [
    "NEEDIT",
    `Bill / فاتورة ${order.id}`,
    "",
    lines,
    "",
    `Delivery / التوصيل: ${money(order.deliveryFeeHalalas)}`,
    `Total / الإجمالي: ${money(order.totalHalalas)}`,
    `Payment / الدفع: ${order.paymentMethod === "COD" ? "Cash on delivery / عند الاستلام" : `Card / بطاقة ${order.cardLast4 ?? ""}`}`,
    "",
    `${order.address.recipient}`,
    `${order.address.line}, ${order.address.district}`,
    "",
    `${origin}/ar/orders/${order.id}`,
    `${origin}/en/orders/${order.id}`,
  ].join("\n");
  await sendMail({
    to: order.customerEmail,
    subject: `NEEDIT bill ${order.id}`,
    text,
  });
}

export async function sendCartReminder(input: {
  email: string;
  name: string;
  cart: SavedCart;
}): Promise<void> {
  const catalog = await readCatalog();
  const lines = input.cart.lines
    .map((line) => {
      const product = catalog.products.find((item) => item.id === line.productId);
      if (!product) return `${line.quantity} × ${line.productId}`;
      return `${line.quantity} × ${product.name.en} / ${product.name.ar}`;
    })
    .join("\n");
  const origin = appOrigin();
  const text = [
    `Hi ${input.name},`,
    "Your cart is still waiting. / سلتك لسا تنتظرك.",
    "",
    lines,
    "",
    `${origin}/ar/cart`,
    `${origin}/en/cart`,
  ].join("\n");
  await sendMail({
    to: input.email,
    subject: "NEEDIT — your cart is still here / سلتك لسا هنا",
    text,
  });
}

export async function sendOfferMail(input: { email: string; offer: Offer }): Promise<void> {
  const origin = appOrigin();
  const path = input.offer.href.startsWith("/") ? input.offer.href : `/${input.offer.href}`;
  const text = [
    input.offer.title.ar,
    input.offer.body.ar,
    "",
    input.offer.title.en,
    input.offer.body.en,
    "",
    `${origin}/ar${path}`,
    `${origin}/en${path}`,
  ].join("\n");
  await sendMail({
    to: input.email,
    subject: `NEEDIT — ${input.offer.title.ar}`,
    text,
  });
}

export async function sendPasswordReset(input: { email: string; name: string; locale: "ar" | "en"; token: string }): Promise<boolean> {
  const origin = appOrigin();
  const link = `${origin}/${input.locale}/reset-password?token=${encodeURIComponent(input.token)}`;
  const text =
    input.locale === "ar"
      ? `مرحباً ${input.name}\nلإعادة تعيين كلمة المرور افتح هذا الرابط خلال 30 دقيقة:\n${link}\nإذا ما طلبت ذلك، تجاهل الرسالة.`
      : `Hi ${input.name}\nReset your NEEDIT password within 30 minutes:\n${link}\nIf you did not ask for this, ignore this email.`;
  return sendMail({
    to: input.email,
    subject: input.locale === "ar" ? "NEEDIT — إعادة تعيين كلمة المرور" : "NEEDIT — reset your password",
    text,
  });
}
