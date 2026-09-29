/**
 * Multi-Currency & Locale-Aware Monetary Formatting
 *
 * All amounts across Flowvo are stored in the smallest currency unit
 * (kobo, pence, cents, etc. where 100 units = 1 standard unit).
 */

export interface CurrencyConfig {
  code: string;
  symbol: string;
  name: string;
  locale: string;
  preferredGateway: "PAYSTACK" | "STRIPE";
  flag: string;
}

export const SUPPORTED_CURRENCIES: Record<string, CurrencyConfig> = {
  NGN: {
    code: "NGN",
    symbol: "₦",
    name: "Nigerian Naira",
    locale: "en-NG",
    preferredGateway: "PAYSTACK",
    flag: "🇳🇬",
  },
  GBP: {
    code: "GBP",
    symbol: "£",
    name: "British Pound",
    locale: "en-GB",
    preferredGateway: "STRIPE",
    flag: "🇬🇧",
  },
  EUR: {
    code: "EUR",
    symbol: "€",
    name: "Euro",
    locale: "en-IE",
    preferredGateway: "STRIPE",
    flag: "🇪🇺",
  },
  USD: {
    code: "USD",
    symbol: "$",
    name: "US Dollar",
    locale: "en-US",
    preferredGateway: "STRIPE",
    flag: "🇺🇸",
  },
  GHS: {
    code: "GHS",
    symbol: "GH₵",
    name: "Ghanaian Cedi",
    locale: "en-GH",
    preferredGateway: "PAYSTACK",
    flag: "🇬🇭",
  },
  ZAR: {
    code: "ZAR",
    symbol: "R",
    name: "South African Rand",
    locale: "en-ZA",
    preferredGateway: "PAYSTACK",
    flag: "🇿🇦",
  },
  KES: {
    code: "KES",
    symbol: "KSh",
    name: "Kenyan Shilling",
    locale: "en-KE",
    preferredGateway: "PAYSTACK",
    flag: "🇰🇪",
  },
};

export const SUPPORTED_COUNTRIES = [
  { code: "NG", name: "Nigeria", defaultCurrency: "NGN", defaultGateway: "PAYSTACK", flag: "🇳🇬" },
  { code: "GB", name: "United Kingdom", defaultCurrency: "GBP", defaultGateway: "STRIPE", flag: "🇬🇧" },
  { code: "IE", name: "Ireland (EU)", defaultCurrency: "EUR", defaultGateway: "STRIPE", flag: "🇮🇪" },
  { code: "DE", name: "Germany (EU)", defaultCurrency: "EUR", defaultGateway: "STRIPE", flag: "🇩🇪" },
  { code: "FR", name: "France (EU)", defaultCurrency: "EUR", defaultGateway: "STRIPE", flag: "🇫🇷" },
  { code: "US", name: "United States", defaultCurrency: "USD", defaultGateway: "STRIPE", flag: "🇺🇸" },
  { code: "CA", name: "Canada", defaultCurrency: "USD", defaultGateway: "STRIPE", flag: "🇨🇦" },
  { code: "GH", name: "Ghana", defaultCurrency: "GHS", defaultGateway: "PAYSTACK", flag: "🇬🇭" },
  { code: "ZA", name: "South Africa", defaultCurrency: "ZAR", defaultGateway: "PAYSTACK", flag: "🇿🇦" },
  { code: "KE", name: "Kenya", defaultCurrency: "KES", defaultGateway: "PAYSTACK", flag: "🇰🇪" },
  { code: "OTHER", name: "Other / Global", defaultCurrency: "USD", defaultGateway: "STRIPE", flag: "🌐" },
];

/**
 * Format an amount in the smallest currency unit (cents, pence, kobo) into a standard formatted currency string.
 * Example:
 *  formatAmount(15000000, "NGN") => "₦150,000.00"
 *  formatAmount(15000, "GBP")    => "£150.00"
 *  formatAmount(15000, "EUR")    => "€150.00"
 */
export function formatAmount(
  amountInSmallestUnit: number,
  currencyCode: string = "GBP"
): string {
  const code = (currencyCode || "GBP").toUpperCase();
  const config = SUPPORTED_CURRENCIES[code];

  const standardUnit = amountInSmallestUnit / 100;

  if (config) {
    try {
      return new Intl.NumberFormat(config.locale, {
        style: "currency",
        currency: config.code,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(standardUnit);
    } catch {
      return `${config.symbol}${standardUnit.toFixed(2)}`;
    }
  }

  // Fallback for unrecognized currencies
  return `${code} ${standardUnit.toFixed(2)}`;
}

/**
 * Get currency symbol (e.g. "₦", "£", "€", "$")
 */
export function getCurrencySymbol(currencyCode: string = "GBP"): string {
  const code = (currencyCode || "GBP").toUpperCase();
  return SUPPORTED_CURRENCIES[code]?.symbol ?? "£";
}
