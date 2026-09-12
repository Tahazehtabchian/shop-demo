/**
 * Shop identity and settings — every value here is a PLACEHOLDER.
 * The shop has no name yet: `name` is a plain descriptor, not a brand.
 * When the real name is decided, change it here and it updates everywhere.
 */
export const site = {
  name: "فروشگاه",
  descriptor: "فروشگاه اینترنتی پوشاک",
  description:
    "خرید آنلاین پوشاک مردانه، زنانه، کفش و اکسسوری — بدون ثبت‌نام اجباری، سازگار با اینستاگرام و بدون نیاز به خاموش کردن فیلترشکن.",

  phone: "۰۲۱ ـ ۰۰۰۰ ۰۰۰۰",
  phoneHref: "tel:+982100000000",
  email: "info@example.com",
  address: "نشانی فروشگاه در این قسمت قرار می‌گیرد",

  social: {
    instagram: "#",
    telegram: "#",
  },

  /** Shipping rule shown at checkout. */
  shippingFee: 90_000,
  freeShippingOver: 2_000_000,
  /** Days added to the order date for the estimated delivery. */
  deliveryDays: 3,
} as const;
