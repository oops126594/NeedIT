import { sendCartReminder, sendOfferMail } from "@/lib/customer-mail";
import { offersForDate, riyadhNow, slotMinutes } from "@/lib/offer-calendar";
import {
  cartsReadyForReminder,
  listCustomers,
  markCartReminded,
  markPromoSent,
  promoWasSent,
  saveNotification,
} from "@/lib/records";

const SLOT_WINDOW_MINUTES = 20;
const started = { current: false };

export function startBackgroundJobs() {
  if (started.current) return;
  started.current = true;
  const timer = setInterval(() => {
    void runDueJobs();
  }, 60_000);
  timer.unref?.();
  void runDueJobs();
}

async function runDueJobs() {
  await remindAbandonedCarts();
  await sendDueOffers();
}

async function remindAbandonedCarts() {
  const carts = await cartsReadyForReminder(Date.now() - 2 * 60 * 60 * 1000);
  const customers = await listCustomers();
  for (const cart of carts) {
    const customer = customers.find((item) => item.id === cart.userId);
    if (!customer) {
      await markCartReminded(cart.userId);
      continue;
    }
    await saveNotification({
      id: `cart:${cart.userId}:${cart.updatedAt}`,
      userId: cart.userId,
      kind: "cart",
      title: { en: "Your cart is still here", ar: "سلتك لسا هنا" },
      body: {
        en: "You added something and did not check out.",
        ar: "أضفت أغراض وما أكملت الطلب.",
      },
      href: "/cart",
      read: false,
      createdAt: Date.now(),
    });
    await sendCartReminder({ email: customer.email, name: customer.name, cart });
    await markCartReminded(cart.userId);
  }
}

async function sendDueOffers() {
  const clock = riyadhNow();
  const due = offersForDate(clock.date).filter((offer) => {
    const start = slotMinutes(offer.time);
    return clock.minutes >= start && clock.minutes < start + SLOT_WINDOW_MINUTES;
  });
  if (due.length === 0) return;
  const customers = await listCustomers();
  for (const offer of due) {
    for (const customer of customers) {
      const id = `${clock.date}:${offer.id}:${customer.id}`;
      if (await promoWasSent(id)) continue;
      await markPromoSent({ id, userId: customer.id, slotId: offer.id, date: clock.date });
      await saveNotification({
        id: `promo:${id}`,
        userId: customer.id,
        kind: "promo",
        title: offer.title,
        body: offer.body,
        href: offer.href,
        read: false,
        createdAt: Date.now(),
      });
      await sendOfferMail({ email: customer.email, offer });
    }
  }
}
