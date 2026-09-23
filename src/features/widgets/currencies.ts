export interface CurrencyItem {
  symbol: string;
  name: string;
  glyph: string;
  rateVsUsd: number; // 1 unit of this currency in USD
  decimals: number;
  category: "fiat" | "crypto";
  tone: string;
  country?: string;
}

export const CURRENCIES: Record<string, CurrencyItem> = {
  // --- Major Fiat Currencies ---
  USD: {
    symbol: "USD",
    name: "US Dollar",
    glyph: "$",
    rateVsUsd: 1.0,
    decimals: 2,
    category: "fiat",
    tone: "usd",
    country: "United States",
  },
  EUR: {
    symbol: "EUR",
    name: "Euro",
    glyph: "€",
    rateVsUsd: 1.09,
    decimals: 2,
    category: "fiat",
    tone: "eur",
    country: "European Union",
  },
  GBP: {
    symbol: "GBP",
    name: "British Pound",
    glyph: "£",
    rateVsUsd: 1.30,
    decimals: 2,
    category: "fiat",
    tone: "gbp",
    country: "United Kingdom",
  },
  JPY: {
    symbol: "JPY",
    name: "Japanese Yen",
    glyph: "¥",
    rateVsUsd: 0.0064,
    decimals: 0,
    category: "fiat",
    tone: "jpy",
    country: "Japan",
  },

  // --- Asian & Southeast Asian Currencies ---
  VND: {
    symbol: "VND",
    name: "Vietnamese Dong",
    glyph: "₫",
    rateVsUsd: 0.0000385, // ~25,970 VND per USD
    decimals: 0,
    category: "fiat",
    tone: "vnd",
    country: "Vietnam",
  },
  HKD: {
    symbol: "HKD",
    name: "Hong Kong Dollar",
    glyph: "HK$",
    rateVsUsd: 0.1275, // ~7.84 HKD per USD
    decimals: 2,
    category: "fiat",
    tone: "hkd",
    country: "Hong Kong",
  },
  SGD: {
    symbol: "SGD",
    name: "Singapore Dollar",
    glyph: "S$",
    rateVsUsd: 0.784,
    decimals: 2,
    category: "fiat",
    tone: "fiat",
    country: "Singapore",
  },
  TWD: {
    symbol: "TWD",
    name: "New Taiwan Dollar",
    glyph: "NT$",
    rateVsUsd: 0.0315,
    decimals: 2,
    category: "fiat",
    tone: "fiat",
    country: "Taiwan",
  },
  THB: {
    symbol: "THB",
    name: "Thai Baht",
    glyph: "฿",
    rateVsUsd: 0.0302,
    decimals: 2,
    category: "fiat",
    tone: "fiat",
    country: "Thailand",
  },
  MYR: {
    symbol: "MYR",
    name: "Malaysian Ringgit",
    glyph: "RM",
    rateVsUsd: 0.232,
    decimals: 2,
    category: "fiat",
    tone: "fiat",
    country: "Malaysia",
  },
  IDR: {
    symbol: "IDR",
    name: "Indonesian Rupiah",
    glyph: "Rp",
    rateVsUsd: 0.000063, // ~15,870 IDR per USD
    decimals: 0,
    category: "fiat",
    tone: "fiat",
    country: "Indonesia",
  },
  PHP: {
    symbol: "PHP",
    name: "Philippine Peso",
    glyph: "₱",
    rateVsUsd: 0.0175,
    decimals: 2,
    category: "fiat",
    tone: "fiat",
    country: "Philippines",
  },
  KRW: {
    symbol: "KRW",
    name: "South Korean Won",
    glyph: "₩",
    rateVsUsd: 0.00072,
    decimals: 0,
    category: "fiat",
    tone: "fiat",
    country: "South Korea",
  },
  CNY: {
    symbol: "CNY",
    name: "Chinese Yuan",
    glyph: "¥",
    rateVsUsd: 0.141,
    decimals: 2,
    category: "fiat",
    tone: "fiat",
    country: "China",
  },
  INR: {
    symbol: "INR",
    name: "Indian Rupee",
    glyph: "₹",
    rateVsUsd: 0.0119,
    decimals: 2,
    category: "fiat",
    tone: "fiat",
    country: "India",
  },

  // --- Americas & Oceania ---
  AUD: {
    symbol: "AUD",
    name: "Australian Dollar",
    glyph: "A$",
    rateVsUsd: 0.67,
    decimals: 2,
    category: "fiat",
    tone: "fiat",
    country: "Australia",
  },
  CAD: {
    symbol: "CAD",
    name: "Canadian Dollar",
    glyph: "C$",
    rateVsUsd: 0.73,
    decimals: 2,
    category: "fiat",
    tone: "fiat",
    country: "Canada",
  },
  NZD: {
    symbol: "NZD",
    name: "New Zealand Dollar",
    glyph: "NZ$",
    rateVsUsd: 0.61,
    decimals: 2,
    category: "fiat",
    tone: "fiat",
    country: "New Zealand",
  },
  BRL: {
    symbol: "BRL",
    name: "Brazilian Real",
    glyph: "R$",
    rateVsUsd: 0.18,
    decimals: 2,
    category: "fiat",
    tone: "fiat",
    country: "Brazil",
  },
  MXN: {
    symbol: "MXN",
    name: "Mexican Peso",
    glyph: "Mex$",
    rateVsUsd: 0.052,
    decimals: 2,
    category: "fiat",
    tone: "fiat",
    country: "Mexico",
  },
  ARS: {
    symbol: "ARS",
    name: "Argentine Peso",
    glyph: "$",
    rateVsUsd: 0.0010,
    decimals: 2,
    category: "fiat",
    tone: "fiat",
    country: "Argentina",
  },
  CLP: {
    symbol: "CLP",
    name: "Chilean Peso",
    glyph: "CLP$",
    rateVsUsd: 0.00108,
    decimals: 0,
    category: "fiat",
    tone: "fiat",
    country: "Chile",
  },
  COP: {
    symbol: "COP",
    name: "Colombian Peso",
    glyph: "COL$",
    rateVsUsd: 0.00024,
    decimals: 0,
    category: "fiat",
    tone: "fiat",
    country: "Colombia",
  },

  // --- Europe & Middle East & Africa ---
  CHF: {
    symbol: "CHF",
    name: "Swiss Franc",
    glyph: "Fr",
    rateVsUsd: 1.15,
    decimals: 2,
    category: "fiat",
    tone: "fiat",
    country: "Switzerland",
  },
  SEK: {
    symbol: "SEK",
    name: "Swedish Krona",
    glyph: "kr",
    rateVsUsd: 0.096,
    decimals: 2,
    category: "fiat",
    tone: "fiat",
    country: "Sweden",
  },
  NOK: {
    symbol: "NOK",
    name: "Norwegian Krone",
    glyph: "kr",
    rateVsUsd: 0.094,
    decimals: 2,
    category: "fiat",
    tone: "fiat",
    country: "Norway",
  },
  DKK: {
    symbol: "DKK",
    name: "Danish Krone",
    glyph: "kr",
    rateVsUsd: 0.146,
    decimals: 2,
    category: "fiat",
    tone: "fiat",
    country: "Denmark",
  },
  PLN: {
    symbol: "PLN",
    name: "Polish Zloty",
    glyph: "zł",
    rateVsUsd: 0.255,
    decimals: 2,
    category: "fiat",
    tone: "fiat",
    country: "Poland",
  },
  CZK: {
    symbol: "CZK",
    name: "Czech Koruna",
    glyph: "Kč",
    rateVsUsd: 0.043,
    decimals: 2,
    category: "fiat",
    tone: "fiat",
    country: "Czechia",
  },
  HUF: {
    symbol: "HUF",
    name: "Hungarian Forint",
    glyph: "Ft",
    rateVsUsd: 0.0027,
    decimals: 0,
    category: "fiat",
    tone: "fiat",
    country: "Hungary",
  },
  RON: {
    symbol: "RON",
    name: "Romanian Leu",
    glyph: "lei",
    rateVsUsd: 0.22,
    decimals: 2,
    category: "fiat",
    tone: "fiat",
    country: "Romania",
  },
  TRY: {
    symbol: "TRY",
    name: "Turkish Lira",
    glyph: "₺",
    rateVsUsd: 0.029,
    decimals: 2,
    category: "fiat",
    tone: "fiat",
    country: "Turkey",
  },
  AED: {
    symbol: "AED",
    name: "UAE Dirham",
    glyph: "د.إ",
    rateVsUsd: 0.272,
    decimals: 2,
    category: "fiat",
    tone: "fiat",
    country: "United Arab Emirates",
  },
  SAR: {
    symbol: "SAR",
    name: "Saudi Riyal",
    glyph: "﷼",
    rateVsUsd: 0.266,
    decimals: 2,
    category: "fiat",
    tone: "fiat",
    country: "Saudi Arabia",
  },
  QAR: {
    symbol: "QAR",
    name: "Qatari Riyal",
    glyph: "QR",
    rateVsUsd: 0.274,
    decimals: 2,
    category: "fiat",
    tone: "fiat",
    country: "Qatar",
  },
  KWD: {
    symbol: "KWD",
    name: "Kuwaiti Dinar",
    glyph: "KD",
    rateVsUsd: 3.26,
    decimals: 3,
    category: "fiat",
    tone: "fiat",
    country: "Kuwait",
  },
  ILS: {
    symbol: "ILS",
    name: "Israeli Shekel",
    glyph: "₪",
    rateVsUsd: 0.27,
    decimals: 2,
    category: "fiat",
    tone: "fiat",
    country: "Israel",
  },
  ZAR: {
    symbol: "ZAR",
    name: "South African Rand",
    glyph: "R",
    rateVsUsd: 0.057,
    decimals: 2,
    category: "fiat",
    tone: "fiat",
    country: "South Africa",
  },
  EGP: {
    symbol: "EGP",
    name: "Egyptian Pound",
    glyph: "E£",
    rateVsUsd: 0.021,
    decimals: 2,
    category: "fiat",
    tone: "fiat",
    country: "Egypt",
  },
  PKR: {
    symbol: "PKR",
    name: "Pakistani Rupee",
    glyph: "₨",
    rateVsUsd: 0.0036,
    decimals: 2,
    category: "fiat",
    tone: "fiat",
    country: "Pakistan",
  },
  BDT: {
    symbol: "BDT",
    name: "Bangladeshi Taka",
    glyph: "৳",
    rateVsUsd: 0.0084,
    decimals: 2,
    category: "fiat",
    tone: "fiat",
    country: "Bangladesh",
  },
  NGN: {
    symbol: "NGN",
    name: "Nigerian Naira",
    glyph: "₦",
    rateVsUsd: 0.00065,
    decimals: 2,
    category: "fiat",
    tone: "fiat",
    country: "Nigeria",
  },

  // --- Cryptocurrencies ---
  BTC: {
    symbol: "BTC",
    name: "Bitcoin",
    glyph: "₿",
    rateVsUsd: 86450.00,
    decimals: 6,
    category: "crypto",
    tone: "btc",
  },
  ETH: {
    symbol: "ETH",
    name: "Ethereum",
    glyph: "Ξ",
    rateVsUsd: 3214.10,
    decimals: 4,
    category: "crypto",
    tone: "eth",
  },
  SOL: {
    symbol: "SOL",
    name: "Solana",
    glyph: "◎",
    rateVsUsd: 152.40,
    decimals: 4,
    category: "crypto",
    tone: "sol",
  },
  BNB: {
    symbol: "BNB",
    name: "BNB",
    glyph: "BNB",
    rateVsUsd: 580.00,
    decimals: 3,
    category: "crypto",
    tone: "crypto",
  },
  XRP: {
    symbol: "XRP",
    name: "Ripple",
    glyph: "✕",
    rateVsUsd: 0.58,
    decimals: 4,
    category: "crypto",
    tone: "crypto",
  },
  DOGE: {
    symbol: "DOGE",
    name: "Dogecoin",
    glyph: "Ð",
    rateVsUsd: 0.12,
    decimals: 4,
    category: "crypto",
    tone: "crypto",
  },
  ADA: {
    symbol: "ADA",
    name: "Cardano",
    glyph: "₳",
    rateVsUsd: 0.35,
    decimals: 4,
    category: "crypto",
    tone: "crypto",
  },
  AVAX: {
    symbol: "AVAX",
    name: "Avalanche",
    glyph: "AVAX",
    rateVsUsd: 28.00,
    decimals: 3,
    category: "crypto",
    tone: "crypto",
  },
  DOT: {
    symbol: "DOT",
    name: "Polkadot",
    glyph: "●",
    rateVsUsd: 4.50,
    decimals: 3,
    category: "crypto",
    tone: "crypto",
  },
  USDC: {
    symbol: "USDC",
    name: "USD Coin",
    glyph: "$",
    rateVsUsd: 1.0,
    decimals: 2,
    category: "crypto",
    tone: "usd",
  },
  USDT: {
    symbol: "USDT",
    name: "Tether",
    glyph: "₮",
    rateVsUsd: 1.0,
    decimals: 2,
    category: "crypto",
    tone: "usd",
  },
};

export const CURRENCY_LIST = Object.values(CURRENCIES);

// Global in-memory cache for live rates
let liveRatesCache: Record<string, number> | null = null;
let lastFetchTimestamp: number = 0;

/**
 * Fetch live exchange rates from open public API if network available,
 * with seamless fallback to static rates.
 */
export async function fetchLiveExchangeRates(): Promise<Record<string, number>> {
  const now = Date.now();
  // Cache for 5 minutes
  if (liveRatesCache && now - lastFetchTimestamp < 300_000) {
    return liveRatesCache;
  }

  const rates: Record<string, number> = {};
  for (const [sym, c] of Object.entries(CURRENCIES)) {
    rates[sym] = c.rateVsUsd;
  }

  // 1. Fetch fiat rates against USD
  try {
    const fiatRes = await fetch("https://open.er-api.com/v6/latest/USD", {
      signal: AbortSignal.timeout(3500),
    });
    if (fiatRes.ok) {
      const data = await fiatRes.json();
      if (data && data.rates) {
        for (const [code, rateAgainstUsd] of Object.entries<number>(data.rates)) {
          if (rates[code] !== undefined && rateAgainstUsd > 0) {
            // open.er-api rates are "units of currency per 1 USD" (e.g. VND: ~25970, JPY: ~157)
            // our rateVsUsd is "value of 1 unit in USD", which is 1 / rateAgainstUsd
            rates[code] = 1 / rateAgainstUsd;
          }
        }
      }
    }
  } catch {
    // Graceful offline fallback
  }

  // 2. Fetch crypto rates from Coinbase public API
  try {
    const cryptoRes = await fetch("https://api.coinbase.com/v2/exchange-rates?currency=USD", {
      signal: AbortSignal.timeout(3500),
    });
    if (cryptoRes.ok) {
      const data = await cryptoRes.json();
      if (data?.data?.rates) {
        const cRates = data.data.rates;
        for (const [sym, c] of Object.entries(CURRENCIES)) {
          if (c.category === "crypto" && cRates[sym]) {
            const coinPerUsd = parseFloat(cRates[sym]);
            if (coinPerUsd > 0) {
              rates[sym] = 1 / coinPerUsd;
            }
          }
        }
      }
    }
  } catch {
    // Graceful crypto fallback
  }

  liveRatesCache = rates;
  lastFetchTimestamp = now;
  return rates;
}

/**
 * Format currency number according to its decimal specificity
 */
export function formatCurrencyAmount(num: number, decimals: number = 2): string {
  if (isNaN(num) || num === 0) {
    return decimals === 0 ? "0" : "0.00";
  }
  // If the number is very small (e.g. 1 VND = 0.0022 PHP), standard 2 decimals would show "0.00"
  // Provide up to 6 decimals so tiny conversions are accurate and visible:
  if (num > 0 && num < 0.01) {
    return num.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6,
    });
  }
  return num.toLocaleString("en-US", {
    minimumFractionDigits: Math.min(decimals, 2),
    maximumFractionDigits: decimals,
  });
}

/**
 * Format USD equivalent value
 */
export function formatUsdValue(num: number): string {
  if (isNaN(num) || num === 0) return "0.00";
  if (num < 0.01 && num > 0) {
    return num < 0.0001 ? "< 0.01" : num.toFixed(4);
  }
  return num.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Format rate display in the currency selection picker modal
 */
export function formatRateInPicker(rateVsUsd: number, symbol: string): string {
  if (!rateVsUsd || rateVsUsd <= 0) return "-";
  if (rateVsUsd >= 1000) {
    return `$${rateVsUsd.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
  }
  if (rateVsUsd >= 1) {
    return `$${rateVsUsd.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`;
  }
  if (rateVsUsd >= 0.01) {
    return `$${rateVsUsd.toFixed(4)}`;
  }
  // For small currencies like VND, IDR, KRW:
  const perUsd = Math.round(1 / rateVsUsd);
  return `1$ = ${perUsd.toLocaleString("en-US")} ${symbol}`;
}
