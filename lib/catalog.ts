/**
 * Catalogue data and the domain types shared across the shop.
 * Everything here is demo data: products, prices and orders are samples.
 */

import { site } from "./site";

export const COLORS = {
  black: { name: "مشکی", hex: "#22221F" },
  white: { name: "سفید", hex: "#F4F2EC" },
  cream: { name: "کرم", hex: "#E1D6C1" },
  grey: { name: "طوسی", hex: "#9A978F" },
  navy: { name: "سرمه‌ای", hex: "#2B3A4A" },
  blue: { name: "آبی", hex: "#7F9CBF" },
  brown: { name: "قهوه‌ای", hex: "#6E4129" },
  camel: { name: "شتری", hex: "#B8875A" },
  olive: { name: "زیتونی", hex: "#5B6B4F" },
  green: { name: "سبز", hex: "#2F6F5E" },
  maroon: { name: "زرشکی", hex: "#7A2E2A" },
  pink: { name: "صورتی", hex: "#E4B9B4" },
} as const;

export type ColorKey = keyof typeof COLORS;
export const COLOR_KEYS = Object.keys(COLORS) as ColorKey[];

export const ONE_SIZE = "تک‌سایز";

export const SIZE_SETS = {
  apparel: ["S", "M", "L", "XL", "XXL"],
  waist: ["30", "32", "34", "36", "38"],
  shoes: ["38", "39", "40", "41", "42", "43", "44", "45"],
  one: [ONE_SIZE],
} as const;

export type SizeSetId = keyof typeof SIZE_SETS;

export const SIZE_SET_LABELS: Record<SizeSetId, string> = {
  apparel: "پوشاک (S تا XXL)",
  waist: "شلوار (سایز کمر)",
  shoes: "کفش (۳۸ تا ۴۵)",
  one: "تک‌سایز",
};

export const CATEGORIES = [
  { id: "men", label: "لباس مردانه", image: "/images/cat-men.webp", sizeSet: "apparel" },
  { id: "women", label: "لباس زنانه", image: "/images/cat-women.webp", sizeSet: "apparel" },
  { id: "shoes", label: "کفش و کتانی", image: "/images/cat-shoes.webp", sizeSet: "shoes" },
  { id: "accessory", label: "اکسسوری", image: "/images/cat-accessory.webp", sizeSet: "one" },
] as const satisfies readonly { id: string; label: string; image: string; sizeSet: SizeSetId }[];

export type CategoryId = (typeof CATEGORIES)[number]["id"];

export const categoryLabel = (id: string) => CATEGORIES.find((c) => c.id === id)?.label ?? "";

export type Product = {
  id: string;
  name: string;
  category: CategoryId;
  /** Base price in toman. */
  price: number;
  /** Discount percentage, 0 when there is none. */
  discount: number;
  colors: ColorKey[];
  sizes: string[];
  /** On-hand quantity per variant, keyed `${color}|${size}`. */
  stock: Record<string, number>;
  /** Bundled paths (`/images/…`). */
  images: string[];
  description: string;
  details: string[];
  isNew: boolean;
  bestseller: boolean;
  /** Units sold — drives the "most popular" sort. */
  sold: number;
  createdAt: number;
};

export type OrderStatus = "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";

export const ORDER_STATUSES: { id: OrderStatus; label: string; hint: string }[] = [
  { id: "pending", label: "در انتظار تایید", hint: "سفارش ثبت شده و منتظر بررسی فروشگاه است." },
  { id: "confirmed", label: "تایید و در حال آماده‌سازی", hint: "سفارش تایید شد و در حال بسته‌بندی است." },
  { id: "shipped", label: "ارسال شده", hint: "مرسوله تحویل پست شده و در راه است." },
  { id: "delivered", label: "تحویل داده شده", hint: "مرسوله به دست مشتری رسید." },
  { id: "cancelled", label: "لغو شده", hint: "این سفارش لغو شده است." },
];

export const statusLabel = (s: OrderStatus) => ORDER_STATUSES.find((x) => x.id === s)?.label ?? s;

export type PaymentMethod = "online" | "cod";
export const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  online: "پرداخت آنلاین",
  cod: "پرداخت در محل",
};

export type OrderItem = {
  productId: string;
  name: string;
  image: string;
  color: ColorKey;
  size: string;
  qty: number;
  unitPrice: number;
};

export type Order = {
  code: string;
  createdAt: number;
  customer: { name: string; phone: string; city: string; address: string; postal?: string };
  note?: string;
  payment: PaymentMethod;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
  status: OrderStatus;
  history: { status: OrderStatus; at: number }[];
};

/* ─── Helpers ─────────────────────────────────────────────────────────── */

export const variantKey = (color: string, size: string) => `${color}|${size}`;

/** Price after discount, rounded to the nearest 1,000 toman. */
export function finalPrice(p: Pick<Product, "price" | "discount">): number {
  if (!p.discount) return p.price;
  return Math.round((p.price * (1 - p.discount / 100)) / 1000) * 1000;
}

export function stockOf(p: Product, color: string, size: string): number {
  return p.stock[variantKey(color, size)] ?? 0;
}

export function totalStock(p: Product): number {
  let n = 0;
  for (const c of p.colors) for (const s of p.sizes) n += stockOf(p, c, s);
  return n;
}

export function sizeSetFor(sizes: readonly string[]): SizeSetId {
  const hit = (Object.keys(SIZE_SETS) as SizeSetId[]).find((id) =>
    sizes.every((s) => (SIZE_SETS[id] as readonly string[]).includes(s)),
  );
  return hit ?? "apparel";
}

/** Fills a variant stock table from a repeating pattern of quantities. */
function stockTable(colors: ColorKey[], sizes: readonly string[], pattern: number[]) {
  const table: Record<string, number> = {};
  let i = 0;
  for (const c of colors) for (const s of sizes) table[variantKey(c, s)] = pattern[i++ % pattern.length];
  return table;
}

/* ─── Seed products ───────────────────────────────────────────────────── */

// A fixed epoch keeps server and client renders identical.
const EPOCH = 1_757_000_000_000;
const DAY = 86_400_000;

type Seed = Omit<Product, "stock" | "createdAt" | "isNew" | "bestseller" | "discount" | "details"> &
  Partial<Pick<Product, "isNew" | "bestseller" | "discount" | "details">> & { pattern: number[] };

const SEEDS: Seed[] = [
  {
    id: "hoodie-oversize",
    name: "هودی اورسایز مینیمال",
    category: "men",
    price: 890_000,
    discount: 15,
    colors: ["grey", "cream"],
    sizes: ["M", "L", "XL"],
    images: ["/images/hoodie-1.webp", "/images/hoodie-2.webp"],
    description: "هودی دورس سه‌نخ پنبه با برش اورسایز و کلاه دولایه؛ مناسب پاییز و زمستان با دوخت تمیز و مقاوم.",
    details: ["جنس: دورس سه‌نخ پنبه", "برش: اورسایز", "شست‌وشو با آب سرد، پشت‌ورو"],
    isNew: true,
    sold: 64,
    pattern: [6, 8, 3, 5, 0, 4],
  },
  {
    id: "oxford-shirt",
    name: "پیراهن آکسفورد یقه‌دکمه‌دار",
    category: "men",
    price: 1_180_000,
    colors: ["white"],
    sizes: ["S", "M", "L", "XL"],
    images: ["/images/oxford-1.webp", "/images/oxford-2.webp"],
    description: "پیراهن آکسفورد نخی با یقه‌ی دکمه‌دار؛ هم با شلوار پارچه‌ای رسمی می‌نشیند هم با جین.",
    details: ["جنس: آکسفورد نخی", "برش: جذب ملایم", "اتوی آسان"],
    bestseller: true,
    sold: 88,
    pattern: [4, 7, 7, 2],
  },
  {
    id: "cotton-tee",
    name: "تی‌شرت پنبه‌ای ساده",
    category: "men",
    price: 420_000,
    colors: ["white", "black"],
    sizes: ["S", "M", "L", "XL", "XXL"],
    images: ["/images/tee-1.webp", "/images/tee-2.webp"],
    description: "تی‌شرت یقه‌گرد از پنبه‌ی نرم و خنک؛ پایه‌ی هر استایل روزمره.",
    details: ["جنس: ۱۰۰٪ پنبه", "یقه‌ی گرد ریب‌دار", "بدون آبرفت"],
    bestseller: true,
    sold: 142,
    pattern: [10, 12, 9, 6, 4],
  },
  {
    id: "straight-jeans",
    name: "شلوار جین راسته",
    category: "men",
    price: 1_350_000,
    colors: ["blue"],
    sizes: ["30", "32", "34", "36", "38"],
    images: ["/images/jeans-1.webp", "/images/jeans-2.webp"],
    description: "جین راسته با پارچه‌ی ضخیم و دوخت دوبل؛ برای استفاده‌ی هرروزه ساخته شده.",
    details: ["جنس: جین ۱۲ اونس", "برش: راسته", "پنج جیب"],
    sold: 57,
    pattern: [3, 6, 5, 2, 1],
  },
  {
    id: "bomber-jacket",
    name: "کاپشن بامبر سبک",
    category: "men",
    price: 2_150_000,
    discount: 15,
    colors: ["camel", "olive"],
    sizes: ["M", "L", "XL"],
    images: ["/images/bomber-1.webp", "/images/bomber-2.webp"],
    description: "بامبر سبک با آستر نرم و کشِ ریب در یقه و مچ؛ لایه‌ی مناسب روزهای خنک.",
    details: ["رویه: پارچه‌ی ضدآب سبک", "آستر: ساتن", "زیپ فلزی"],
    isNew: true,
    sold: 31,
    pattern: [2, 4, 1, 3, 0, 2],
  },
  {
    id: "knit-cardigan",
    name: "ژاکت بافت زنانه",
    category: "women",
    price: 680_000,
    discount: 13,
    colors: ["cream"],
    sizes: ["S", "M", "L"],
    images: ["/images/sweater-1.webp"],
    description: "ژاکت بافت نرم و لطیف بدون حساسیت پوستی؛ مناسب استایل‌های کژوال.",
    details: ["جنس: اکریلیک و پشم", "دکمه‌دار", "شست‌وشوی دستی"],
    sold: 49,
    pattern: [5, 8, 3],
  },
  {
    id: "linen-shirt",
    name: "شومیز لینن آستین‌بلند",
    category: "women",
    price: 960_000,
    colors: ["white"],
    sizes: ["S", "M", "L"],
    images: ["/images/linen-1.webp"],
    description: "شومیز لینن سبک با افتادگی طبیعی پارچه؛ خنک برای روزهای گرم.",
    details: ["جنس: لینن", "یقه‌ی پیراهنی", "دکمه‌ی صدفی"],
    isNew: true,
    sold: 22,
    pattern: [4, 6, 2],
  },
  {
    id: "pleated-skirt",
    name: "دامن پلیسه بلند",
    category: "women",
    price: 1_090_000,
    colors: ["cream"],
    sizes: ["S", "M", "L"],
    images: ["/images/skirt-1.webp", "/images/skirt-2.webp"],
    description: "دامن پلیسه با افتادگی زیبا و کمر کش‌دار؛ با بیشتر بالاتنه‌ها هماهنگ می‌شود.",
    details: ["جنس: کرپ حریر", "کمر کش‌دار", "آستردار"],
    bestseller: true,
    sold: 76,
    pattern: [3, 5, 4],
  },
  {
    id: "maxi-dress",
    name: "پیراهن ماکسی حریر",
    category: "women",
    price: 1_890_000,
    discount: 20,
    colors: ["green"],
    sizes: ["S", "M", "L"],
    images: ["/images/dress-1.webp"],
    description: "پیراهن بلند حریر با آستین پفی و کمر چین‌دار؛ برای مهمانی‌های روز.",
    details: ["جنس: حریر", "آستر: ساتن", "بند کمر"],
    sold: 18,
    pattern: [2, 3, 1],
  },
  {
    id: "floral-midi",
    name: "پیراهن میدی گلدار",
    category: "women",
    price: 1_450_000,
    colors: ["black"],
    sizes: ["S", "M", "L"],
    images: ["/images/dress-2.webp"],
    description: "پیراهن میدی با طرح گل ریز و آستین بلند؛ هم رسمی هم روزمره.",
    details: ["جنس: ویسکوز", "یقه‌ی گرد", "زیپ پشت"],
    sold: 27,
    pattern: [3, 4, 2],
  },
  {
    id: "belted-coat",
    name: "پالتو بلند کمربنددار",
    category: "women",
    price: 3_450_000,
    colors: ["camel"],
    sizes: ["S", "M", "L", "XL"],
    images: ["/images/coat-1.webp", "/images/coat-2.webp"],
    description: "پالتوی بلند با پارچه‌ی پشمی و کمربند هم‌رنگ؛ برشی کلاسیک که هر سال به تن می‌نشیند.",
    details: ["جنس: مخلوط پشم", "آستر: ساتن", "دو جیب پهلو"],
    bestseller: true,
    sold: 39,
    pattern: [2, 3, 3, 1],
  },
  {
    id: "knit-runner",
    name: "کتانی رانینگ بافتی",
    category: "shoes",
    price: 1_450_000,
    colors: ["grey"],
    sizes: ["40", "41", "42", "43", "44"],
    images: ["/images/runner-1.webp"],
    description: "کتانی سبک با رویه‌ی بافتی تنفسی و زیره‌ی نرم؛ برای پیاده‌روی طولانی و استفاده‌ی روزمره.",
    details: ["رویه: بافت تنفسی", "زیره: فوم سبک", "کفی طبی قابل تعویض"],
    isNew: true,
    sold: 44,
    pattern: [3, 5, 6, 4, 2],
  },
  {
    id: "canvas-plimsoll",
    name: "کتانی کتان کلاسیک",
    category: "shoes",
    price: 980_000,
    discount: 10,
    colors: ["maroon"],
    sizes: ["38", "39", "40", "41", "42", "43"],
    images: ["/images/plimsoll-1.webp"],
    description: "کتانی کتان با زیره‌ی لاستیکی و طراحی کلاسیک؛ سبک و راحت.",
    details: ["رویه: کتان ضخیم", "زیره: لاستیک طبیعی", "بند گرد"],
    sold: 53,
    pattern: [2, 4, 5, 3, 1, 0],
  },
  {
    id: "lace-boots",
    name: "بوت چرمی بنددار",
    category: "shoes",
    price: 2_890_000,
    colors: ["brown", "camel"],
    sizes: ["40", "41", "42", "43", "44", "45"],
    images: ["/images/boots-1.webp", "/images/boots-2.webp"],
    description: "بوت چرم طبیعی با دوخت دستی و زیره‌ی آج‌دار؛ مقاوم در برابر سرما و رطوبت.",
    details: ["رویه: چرم طبیعی گاوی", "زیره: لاستیک آج‌دار", "آستر: چرم"],
    bestseller: true,
    sold: 36,
    pattern: [1, 3, 2, 2, 1, 0],
  },
  {
    id: "leather-loafers",
    name: "کفش کالج چرم",
    category: "shoes",
    price: 1_950_000,
    colors: ["brown", "black"],
    sizes: ["40", "41", "42", "43", "44"],
    images: ["/images/loafers-1.webp", "/images/loafers-2.webp"],
    description: "کفش کالج چرم با برش کلاسیک؛ هم با کت‌وشلوار هم با جین.",
    details: ["رویه: چرم طبیعی", "زیره: چرم و لاستیک", "بدون بند"],
    sold: 29,
    pattern: [2, 3, 4, 2, 1],
  },
  {
    id: "color-sneakers",
    name: "کتانی اسپرت رنگی",
    category: "shoes",
    price: 1_250_000,
    discount: 25,
    colors: ["white"],
    sizes: ["38", "39", "40", "41", "42"],
    images: ["/images/runner-2.webp"],
    description: "کتانی اسپرت با ترکیب رنگ شاد و زیره‌ی ضخیم؛ برای استایل‌های خیابانی.",
    details: ["رویه: چرم مصنوعی و مش", "زیره: EVA", "وزن سبک"],
    sold: 21,
    pattern: [1, 2, 0, 3, 2],
  },
  {
    id: "leather-tote",
    name: "کیف توت چرمی",
    category: "accessory",
    price: 1_690_000,
    colors: ["camel"],
    sizes: [ONE_SIZE],
    images: ["/images/bag-1.webp"],
    description: "کیف توت از چرم طبیعی با دسته‌ی بلند و فضای جادار؛ برای کار و خرید روزانه.",
    details: ["جنس: چرم طبیعی", "ابعاد: ۳۸ × ۳۲ سانتی‌متر", "جیب داخلی زیپ‌دار"],
    bestseller: true,
    sold: 47,
    pattern: [7],
  },
  {
    id: "croc-crossbody",
    name: "کیف دوشی طرح کروکو",
    category: "accessory",
    price: 1_390_000,
    colors: ["brown"],
    sizes: [ONE_SIZE],
    images: ["/images/bag-2.webp"],
    description: "کیف دوشی کوچک با طرح پوست کروکو و بند قابل تنظیم.",
    details: ["جنس: چرم با پرس کروکو", "بند قابل تنظیم", "قفل مغناطیسی"],
    isNew: true,
    sold: 15,
    pattern: [3],
  },
  {
    id: "knit-beanie",
    name: "کلاه بافت زمستانی",
    category: "accessory",
    price: 290_000,
    discount: 20,
    colors: ["black", "pink"],
    sizes: [ONE_SIZE],
    images: ["/images/beanie-1.webp", "/images/beanie-2.webp"],
    description: "کلاه بافت گرم با لبه‌ی برگشته؛ مناسب روزهای سرد سال.",
    details: ["جنس: اکریلیک نرم", "لبه‌ی دولایه", "کشسان"],
    sold: 91,
    pattern: [12, 0],
  },
  {
    id: "braided-belt",
    name: "کمربند چرم بافت",
    category: "accessory",
    price: 450_000,
    colors: ["brown"],
    sizes: [ONE_SIZE],
    images: ["/images/belt-2.webp"],
    description: "کمربند چرم بافته‌شده با سگک فلزی مینیمال؛ بدون نیاز به سوراخ.",
    details: ["جنس: چرم طبیعی", "طول: ۱۱۰ سانتی‌متر", "سگک: فلز مات"],
    sold: 33,
    pattern: [9],
  },
  {
    id: "classic-sunglasses",
    name: "عینک آفتابی کلاسیک",
    category: "accessory",
    price: 780_000,
    colors: ["black"],
    sizes: [ONE_SIZE],
    images: ["/images/sunglasses-1.webp"],
    description: "عینک آفتابی با فریم کلاسیک و عدسی UV400؛ همراه با جلد.",
    details: ["فریم: استات", "عدسی: UV400", "همراه جلد و دستمال"],
    sold: 26,
    pattern: [2],
  },
];

export const SEED_PRODUCTS: Product[] = SEEDS.map(({ pattern, ...s }, i) => ({
  discount: 0,
  details: [],
  isNew: false,
  bestseller: false,
  ...s,
  stock: stockTable(s.colors, s.sizes, pattern),
  createdAt: EPOCH - i * DAY,
}));

/* ─── Seed orders ─────────────────────────────────────────────────────── */

type OrderSeed = [
  daysAgo: number,
  hour: number,
  name: string,
  city: string,
  items: [productId: string, color: ColorKey, size: string, qty: number][],
  payment: PaymentMethod,
  status: OrderStatus,
];

const ORDER_SEEDS: OrderSeed[] = [
  [0, 10, "رضا محمدی", "تهران", [["hoodie-oversize", "grey", "L", 1]], "online", "pending"],
  [0, 9, "سارا کریمی", "اصفهان", [["pleated-skirt", "cream", "M", 1], ["knit-cardigan", "cream", "M", 1]], "cod", "pending"],
  [1, 18, "علی رضایی", "شیراز", [["lace-boots", "brown", "42", 1]], "online", "confirmed"],
  [1, 12, "مریم احمدی", "مشهد", [["belted-coat", "camel", "M", 1]], "online", "confirmed"],
  [2, 20, "نگار حسینی", "تبریز", [["cotton-tee", "white", "M", 2], ["classic-sunglasses", "black", ONE_SIZE, 1]], "online", "shipped"],
  [3, 11, "امیر جعفری", "کرج", [["oxford-shirt", "white", "L", 1], ["straight-jeans", "blue", "32", 1]], "cod", "shipped"],
  [4, 16, "زهرا موسوی", "رشت", [["leather-tote", "camel", ONE_SIZE, 1]], "online", "delivered"],
  [5, 13, "حسین قاسمی", "تهران", [["knit-runner", "grey", "43", 1]], "online", "delivered"],
  [6, 19, "فاطمه صادقی", "قم", [["maxi-dress", "green", "S", 1]], "online", "cancelled"],
  [7, 15, "محمد نوری", "اهواز", [["bomber-jacket", "olive", "L", 1], ["knit-beanie", "black", ONE_SIZE, 2]], "online", "delivered"],
  [9, 10, "الهام رستمی", "کرمان", [["floral-midi", "black", "M", 1]], "cod", "delivered"],
  [10, 17, "کیان تهرانی", "تهران", [["leather-loafers", "brown", "42", 1], ["braided-belt", "brown", ONE_SIZE, 1]], "online", "delivered"],
  [12, 14, "پریسا اکبری", "اصفهان", [["croc-crossbody", "brown", ONE_SIZE, 1], ["linen-shirt", "white", "S", 1]], "online", "delivered"],
  [13, 21, "مهدی کاظمی", "شیراز", [["canvas-plimsoll", "maroon", "41", 2]], "online", "delivered"],
];

const STEP_ORDER: OrderStatus[] = ["pending", "confirmed", "shipped", "delivered"];

export function orderTotals(subtotal: number) {
  const shipping = subtotal === 0 || subtotal >= site.freeShippingOver ? 0 : site.shippingFee;
  return { shipping, total: subtotal + shipping };
}

/** Sample orders dated relative to `now`, so the dashboard always has recent activity. */
export function seedOrders(now: number): Order[] {
  return ORDER_SEEDS.map(([daysAgo, hour, name, city, lines, payment, status], i) => {
    const day = new Date(now - daysAgo * DAY);
    day.setHours(hour, (i * 17) % 60, 0, 0);
    const createdAt = Math.min(day.getTime(), now - 5 * 60_000);

    const items: OrderItem[] = lines.map(([productId, color, size, qty]) => {
      const p = SEED_PRODUCTS.find((x) => x.id === productId)!;
      return { productId, name: p.name, image: p.images[0], color, size, qty, unitPrice: finalPrice(p) };
    });
    const subtotal = items.reduce((s, it) => s + it.unitPrice * it.qty, 0);
    const { shipping, total } = orderTotals(subtotal);

    const reached = status === "cancelled" ? ["pending", "cancelled"] : STEP_ORDER.slice(0, STEP_ORDER.indexOf(status) + 1);
    const history = (reached as OrderStatus[]).map((s, k) => ({
      status: s,
      at: Math.min(createdAt + k * (daysAgo > 1 ? 20 : 3) * 3_600_000, now - 60_000),
    }));

    return {
      code: `ORD-${String(48213 + i * 731).slice(-5)}`,
      createdAt,
      customer: {
        name,
        phone: `0912${String(3456789 + i * 104729).slice(-7)}`,
        city,
        address: `${city}، خیابان نمونه، پلاک ${i + 3}، واحد ${(i % 4) + 1}`,
      },
      payment,
      items,
      subtotal,
      shipping,
      total,
      status,
      history,
    };
  });
}
