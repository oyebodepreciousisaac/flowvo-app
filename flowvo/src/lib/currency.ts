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

/**
 * FX Baseline Exchange Rates (Relative to 1.0 USD)
 * Used to normalize and convert multi-currency metrics across workspaces.
 *
 * 1 USD = 1,600 NGN
 * 1 GBP = 0.77 USD (1 GBP ≈ 2,078 NGN)
 * 1 EUR = 0.92 USD (1 EUR ≈ 1,739 NGN)
 * 1 GHS = 15.5 USD (1 GHS ≈ 103 NGN)
 * 1 ZAR = 18.2 USD (1 ZAR ≈ 88 NGN)
 * 1 KES = 129.0 USD (1 KES ≈ 12.4 NGN)
 */
export const FX_RATES_TO_USD: Record<string, number> = {
  USD: 1.0,
  NGN: 1600.0,
  GBP: 0.77,
  EUR: 0.92,
  GHS: 15.5,
  ZAR: 18.2,
  KES: 129.0,
};

/**
 * Convert an amount in smallest units from one currency to another.
 * Example:
 *   convertCurrency(4000, "GBP", "NGN") => ~8311688 kobo (₦83,116.88)
 *   convertCurrency(4000, "EUR", "NGN") => ~6956522 kobo (₦69,565.22)
 */
export function convertCurrency(
  amountInSmallestUnit: number,
  fromCurrency: string,
  toCurrency: string
): number {
  if (!amountInSmallestUnit || isNaN(amountInSmallestUnit)) return 0;
  const from = (fromCurrency || "USD").toUpperCase();
  const to = (toCurrency || "USD").toUpperCase();

  if (from === to) return Math.round(amountInSmallestUnit);

  const fromRate = FX_RATES_TO_USD[from] || 1.0;
  const toRate = FX_RATES_TO_USD[to] || 1.0;

  // Convert from source currency to USD standard unit
  const amountInUSD = amountInSmallestUnit / 100 / fromRate;
  // Convert from USD to target currency standard unit
  const targetStandard = amountInUSD * toRate;
  // Return in target smallest unit (cents/pence/kobo)
  return Math.round(targetStandard * 100);
}

export interface MultiCurrencyBreakdown {
  convertedTotal: number; // in target currency's smallest unit
  byCurrency: Record<string, number>; // currencyCode -> total in its smallest unit
  hasMultipleCurrencies: boolean;
  currencies: string[];
}

/**
 * Accurately calculate totals across multiple items that may have different currencies.
 * Prevents summing raw numbers of different currencies (e.g. 70,000 NGN + 40 EUR != 70,040 NGN).
 */
export function calculateMultiCurrencyTotals(
  items: Array<{ total: number; currency?: string | null }>,
  targetCurrency: string = "NGN"
): MultiCurrencyBreakdown {
  const target = (targetCurrency || "NGN").toUpperCase();
  const byCurrency: Record<string, number> = {};
  let convertedTotal = 0;

  for (const item of items) {
    const itemCurrency = (item.currency || target).toUpperCase();
    const itemTotal = Number(item.total) || 0;

    byCurrency[itemCurrency] = (byCurrency[itemCurrency] || 0) + itemTotal;
    convertedTotal += convertCurrency(itemTotal, itemCurrency, target);
  }

  const currencies = Object.keys(byCurrency);
  const hasMultipleCurrencies = currencies.length > 1;

  return {
    convertedTotal,
    byCurrency,
    hasMultipleCurrencies,
    currencies,
  };
}

