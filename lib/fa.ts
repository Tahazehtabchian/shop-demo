const FA_DIGITS = "۰۱۲۳۴۵۶۷۸۹";

/** Latin digits → Persian digits. */
export function toFa(value: string | number): string {
  return String(value).replace(/\d/g, (d) => FA_DIGITS[Number(d)]);
}

/** Persian/Arabic-Indic digits → Latin digits (for validating user input). */
export function toLatin(value: string): string {
  return value
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660));
}

/** 1250000 → «۱٬۲۵۰٬۰۰۰» */
export function faNumber(n: number): string {
  return toFa(Math.round(n).toLocaleString("en-US")).replace(/,/g, "٬");
}

/** 1250000 → «۱٬۲۵۰٬۰۰۰ تومان» */
export function toman(amount: number): string {
  return `${faNumber(amount)} تومان`;
}

/** 1250000 → «۱٫۲۵ میلیون» — for dashboard tiles where space is tight. */
export function tomanShort(amount: number): string {
  if (amount >= 1_000_000_000) return `${toFa((amount / 1_000_000_000).toFixed(2).replace(/\.?0+$/, "")).replace(".", "٫")} میلیارد`;
  if (amount >= 1_000_000) return `${toFa((amount / 1_000_000).toFixed(1).replace(/\.0$/, "")).replace(".", "٫")} میلیون`;
  return faNumber(amount);
}

/** Solar Hijri date, e.g. «۱۴۰۵/۰۶/۲۰». */
export function faDate(value: number | Date): string {
  return new Date(value).toLocaleDateString("fa-IR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

/** «۲۰ شهریور» */
export function faDayMonth(value: number | Date): string {
  return new Date(value).toLocaleDateString("fa-IR", { day: "numeric", month: "long" });
}

/** «۱۴:۰۵» */
export function faTime(value: number | Date): string {
  return new Date(value).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" });
}

/** Normalise Arabic letter variants and digits so search works on any keyboard. */
export function normalizeFa(text: string): string {
  return toLatin(text)
    .replace(/ي/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/[‌‏]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/** Iranian mobile number check: 09xxxxxxxxx after digit normalisation. */
export function isMobile(value: string): boolean {
  return /^09\d{9}$/.test(toLatin(value).replace(/[\s-]/g, ""));
}
