export type Offer = {
  id: string;
  /** 24-hour clock in Riyadh. Five slots is the daily rhythm. */
  time: string;
  title: { en: string; ar: string };
  body: { en: string; ar: string };
  href: string;
};

/**
 * Daily offer calendar. Replace `OFFER_CALENDAR` when the real calendar arrives.
 * A date key in `DATED_OFFERS` (YYYY-MM-DD, Riyadh) replaces the whole day.
 */
export const OFFER_CALENDAR: Offer[] = [
  {
    id: "morning",
    time: "09:00",
    title: { en: "Phone chargers nearby", ar: "شواحن جوال قريبة" },
    body: {
      en: "Need a charger or a cable? Nearby stores have them ready.",
      ar: "تحتاج شاحن أو كيبل؟ المتاجر القريبة جهزتها.",
    },
    href: "/search?q=iPhone%20charger",
  },
  {
    id: "midday",
    time: "12:30",
    title: { en: "School supplies today", ar: "مستلزمات المدرسة اليوم" },
    body: {
      en: "Notebooks, pens, and boards from stores around you.",
      ar: "دفاتر وأقلام ولوحات من متاجر حولك.",
    },
    href: "/categories/school",
  },
  {
    id: "afternoon",
    time: "16:00",
    title: { en: "Home essentials", ar: "أساسيات البيت" },
    body: {
      en: "Organizers, hooks, and tissues without a trip across the city.",
      ar: "منظمات وعلاقات ومناديل بدون ما تقطع المدينة.",
    },
    href: "/categories/home",
  },
  {
    id: "evening",
    time: "19:00",
    title: { en: "Party, sorted", ar: "الحفلة جاهزة" },
    body: {
      en: "Balloons, plates, and bags from a store nearby.",
      ar: "بالونات وأطباق وأكياس من متجر قريب.",
    },
    href: "/search?q=birthday%20balloons",
  },
  {
    id: "night",
    time: "21:30",
    title: { en: "A gift before you sleep", ar: "هدية قبل النوم" },
    body: {
      en: "Gift bags and wrapping paper are still open nearby.",
      ar: "أكياس الهدايا وورق التغليف لسا متوفرة قريب.",
    },
    href: "/categories/gifts",
  },
];

export const DATED_OFFERS: Record<string, Offer[]> = {};

export function offersForDate(date: string): Offer[] {
  return DATED_OFFERS[date] ?? OFFER_CALENDAR;
}

export function riyadhNow(now = new Date()): { date: string; minutes: number } {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Riyadh",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(now)
      .map((part) => [part.type, part.value]),
  );
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    minutes: Number(parts.hour) * 60 + Number(parts.minute),
  };
}

export function slotMinutes(time: string): number {
  const [hour, minute] = time.split(":").map(Number);
  return hour * 60 + minute;
}
