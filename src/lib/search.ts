import { getStore, PRODUCTS } from "@/lib/catalog";
import { normalize, tokenize } from "@/lib/text";
import type { CategoryId, Product, Store } from "@/lib/types";

const CATEGORY_TERMS: Record<CategoryId, string[]> = {
  school: ["school", "مدرسة", "مستلزمات مدرسية"],
  home: ["home", "منزل", "بيت"],
  tech: ["tech", "تقنية", "الكترونيات", "إلكترونيات"],
  car: ["car", "سيارة", "سيارات"],
  gifts: ["gifts", "gift", "هدية", "هدايا"],
  party: ["party", "حفلة", "احتفال"],
  pets: ["pets", "pet", "حيوانات", "كلب", "قط"],
  stationery: ["stationery", "قرطاسية", "ادوات مكتبية", "أدوات مكتبية"],
};

const SYNONYM_GROUPS = [
  ["usbc", "usb c", "usb-c", "type c", "type-c", "typec", "تايب سي"],
  ["charger", "charge", "شاحن"],
  ["iphone", "ايفون", "آيفون"],
  ["cable", "كابل", "كيبل", "سلك"],
  ["headphone", "headphones", "سماعة", "سماعات"],
  ["notebook", "دفتر", "كراسة"],
  ["balloon", "balloons", "بالون", "بالونات"],
  ["gift", "هدية", "هدايا"],
  ["adapter", "adaptor", "محول"],
];

const STOPWORDS = new Set(
  [
    "i",
    "a",
    "an",
    "the",
    "for",
    "my",
    "to",
    "of",
    "and",
    "me",
    "need",
    "something",
    "some",
    "it",
    "this",
    "with",
    "everything",
    "احتاج",
    "ابغى",
    "أبغى",
    "ابغي",
    "عايز",
    "في",
    "من",
    "على",
    "عشان",
    "شيء",
    "شي",
    "حق",
    "لي",
    "و",
    "الى",
    "إلى",
  ].flatMap((word) => tokenize(word)),
);

const NEED_PATTERN =
  /\b(need|everything)\b|احتاج|أبغى|ابغى|ابغي|مستلزمات/i;

type IndexedProduct = {
  product: Product;
  store: Store;
  nameTokens: string[];
  otherTokens: string[];
  nameNorm: string;
};

function unique(tokens: string[]): string[] {
  return [...new Set(tokens)];
}

function expandToken(token: string): string[] {
  const extras = new Set<string>([token]);
  for (const group of SYNONYM_GROUPS) {
    const normalizedGroup = unique(group.flatMap((entry) => tokenize(entry)));
    if (!normalizedGroup.includes(token)) continue;
    for (const candidate of normalizedGroup) {
      if (candidate.length >= 3) extras.add(candidate);
    }
  }
  return [...extras];
}

function sameScript(a: string, b: string): boolean {
  const arabic = /[\u0600-\u06FF]/;
  return arabic.test(a) === arabic.test(b);
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > 2) return 3;
  let previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i += 1) {
    const current = [i];
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      current[j] = Math.min(
        (current[j - 1] ?? i) + 1,
        (previous[j] ?? i) + 1,
        (previous[j - 1] ?? i) + cost,
      );
    }
    previous = current;
  }
  return previous[b.length] ?? 3;
}

function tokenScore(queryToken: string, nameTokens: string[], otherTokens: string[]): number {
  let best = 0;
  for (const candidate of expandToken(queryToken)) {
    if (nameTokens.includes(candidate)) best = Math.max(best, candidate === queryToken ? 28 : 24);
    else if (otherTokens.includes(candidate)) best = Math.max(best, candidate === queryToken ? 16 : 14);
    else if (candidate.length >= 3 && nameTokens.some((token) => token.startsWith(candidate))) {
      best = Math.max(best, 12);
    } else if (candidate.length >= 3 && otherTokens.some((token) => token.startsWith(candidate))) {
      best = Math.max(best, 8);
    }
  }

  if (best === 0 && queryToken.length >= 4) {
    const limit = queryToken.length >= 8 ? 2 : 1;
    const fuzzyName = nameTokens.some(
      (token) => sameScript(token, queryToken) && levenshtein(token, queryToken) <= limit,
    );
    const fuzzyOther = otherTokens.some(
      (token) => sameScript(token, queryToken) && levenshtein(token, queryToken) <= 1,
    );
    if (fuzzyName) best = 10;
    else if (fuzzyOther) best = 6;
  }

  return best;
}

const INDEX: IndexedProduct[] = PRODUCTS.flatMap((product) => {
  const store = getStore(product.storeId);
  if (!store) return [];
  const nameTokens = unique([
    ...tokenize(product.name.en),
    ...tokenize(product.name.ar),
    ...tokenize(product.brand.en),
    ...tokenize(product.brand.ar),
  ]);
  const otherTokens = unique([
    ...tokenize(product.description.en),
    ...tokenize(product.description.ar),
    ...product.keywords.flatMap((keyword) => tokenize(keyword)),
    ...CATEGORY_TERMS[product.categoryId].flatMap((term) => tokenize(term)),
    ...tokenize(store.name.en),
    ...tokenize(store.name.ar),
  ]);
  return [
    {
      product,
      store,
      nameTokens,
      otherTokens,
      nameNorm: normalize(`${product.name.en} ${product.name.ar}`),
    },
  ];
});

export type SearchHit = {
  product: Product;
  store: Store;
  relevance: number;
  score: number;
};

export type SearchResult = {
  query: string;
  hits: SearchHit[];
  needPhrase: boolean;
};

function situationalScore(product: Product, store: Store): number {
  const availability = product.stock === "IN_STOCK" ? 10 : product.stock === "LOW_STOCK" ? 4 : -15;
  const distance = Math.max(0, 10 - store.distanceKm * 2);
  const speed = Math.max(0, 10 - store.deliveryMinMinutes / 3);
  const reliability = store.reliability * 8;
  return availability + distance + speed + reliability;
}

export function searchCatalog(rawQuery: string): SearchResult {
  const query = rawQuery.trim().slice(0, 80);
  const meaningful = tokenize(query).filter((token) => !STOPWORDS.has(token));
  const needPhrase = NEED_PATTERN.test(query) || meaningful.length >= 6;

  if (meaningful.length === 0) {
    return { query, hits: [], needPhrase };
  }

  const requiredMatches =
    meaningful.length <= 3 ? meaningful.length : Math.max(2, Math.ceil(meaningful.length * 0.6));
  const phrase = normalize(query);

  const hits = INDEX.flatMap((entry) => {
    const scores = meaningful.map((token) =>
      tokenScore(token, entry.nameTokens, entry.otherTokens),
    );
    const matched = scores.filter((score) => score > 0).length;
    if (matched < requiredMatches) return [];

    let relevance = scores.reduce((sum, score) => sum + score, 0);
    if (phrase.length > 2 && entry.nameNorm.includes(phrase)) relevance += 20;
    relevance = Math.min(100, relevance);

    return [
      {
        product: entry.product,
        store: entry.store,
        relevance,
        score: relevance * 4 + situationalScore(entry.product, entry.store),
      },
    ];
  }).sort(
    (a, b) => b.score - a.score || a.product.priceHalalas - b.product.priceHalalas,
  );

  return { query, hits: hits.slice(0, 30), needPhrase };
}
