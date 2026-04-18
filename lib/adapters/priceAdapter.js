/**
 * Price Adapter Interface
 * ----------------------
 * Defines the contract for fetching live prices from external APIs.
 * Implementations: CoinGeckoAdapter (crypto), NSEAdapter (Indian stocks)
 */

export class PriceProviderError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.name = "PriceProviderError";
    this.statusCode = statusCode;
  }
}

/**
 * Fetches current price for a single asset.
 * Returns { price: number, currency: string, lastUpdated: Date }
 * Returns null if price cannot be fetched.
 */
export async function getPrice(provider, symbol) {
  switch (provider) {
    case "coingecko":
      return CoinGeckoAdapter.getPrice(symbol);
    default:
      throw new PriceProviderError(`Unknown provider: ${provider}`);
  }
}

/**
 * Fetches current prices for multiple assets of the same type.
 * Returns Map of symbol -> { price, currency, lastUpdated }
 */
export async function getPrices(provider, symbols) {
  switch (provider) {
    case "coingecko":
      return CoinGeckoAdapter.getPrices(symbols);
    default:
      throw new PriceProviderError(`Unknown provider: ${provider}`);
  }
}

/**
 * CoinGecko Adapter
 * -----------------
 * Fetches crypto prices from CoinGecko free API.
 * API Docs: https://www.coingecko.com/docs/api
 */
export const CoinGeckoAdapter = {
  provider: "coingecko",
  baseUrl: "https://api.coingecko.com/api/v3",

  // Map our internal symbols to CoinGecko IDs
  symbolMap: {
    BTC: "bitcoin",
    ETH: "ethereum",
    SOL: "solana",
    XRP: "ripple",
    ADA: "cardano",
    DOGE: "dogecoin",
    DOT: "polkadot",
    MATIC: "matic-network",
    LINK: "chainlink",
    UNI: "uniswap",
    ATOM: "cosmos",
    LTC: "litecoin",
    BCH: "bitcoin-cash",
    XLM: "stellar",
    ALGO: "algorand",
    VET: "vechain",
    THETA: "theta-token",
    FIL: "filecoin",
    TRX: "tron",
    AVAX: "avalanche-2",
    SHIB: "shiba-inu",
    DOT: "polkadot",
    PEPE: "pepe",
    WIF: "dogwifcoin",
    FLOKI: "floki",
    BOME: "book-of-ethereum",
    SUI: "sui",
    SEI: "sei-network",
    INJ: "injective-protocol",
    AAVE: "aave",
    MKR: "maker",
    CRV: "curve-dao-token",
    SNX: "havven",
    COMP: "compound-governance-token",
    SUSHI: "sushi",
    YFI: "yearn-finance",
    ENS: "ethereum-name-service",
    BAT: "basic-attention-token",
    ZEC: "zcash",
    DASH: "dash",
    NEO: "neo",
    WAVAX: "wrapped-avax",
    WBTC: "wrapped-bitcoin",
    USDT: "tether",
    USDC: "usd-coin",
    BUSD: "binance-usd",
    DAI: "dai",
  },

  /**
   * Get price for a single symbol.
   */
  async getPrice(symbol) {
    const id = this.symbolMap[symbol?.toUpperCase()] || symbol?.toLowerCase();
    if (!id) return null;

    try {
      const response = await fetch(
        `${this.baseUrl}/simple/price?ids=${id}&vs_currencies=inr,usd&include_24hr_change=true`,
        { next: { revalidate: 60 } }
      );

      if (!response.ok) {
        throw new PriceProviderError(`CoinGecko API error: ${response.status}`, response.status);
      }

      const data = await response.json();
      const coinData = data[id];

      if (!coinData) return null;

      return {
        price: coinData.inr || coinData.usd || 0,
        currency: "INR",
        usdPrice: coinData.usd,
        inrPrice: coinData.inr,
        change24h: coinData.inr_24h_change || 0,
        lastUpdated: new Date(),
        provider: this.provider,
      };
    } catch (error) {
      console.error(`[CoinGeckoAdapter] Error fetching price for ${symbol}:`, error);
      return null;
    }
  },

  /**
   * Get prices for multiple symbols in one API call.
   */
  async getPrices(symbols) {
    const ids = symbols
      .map((s) => this.symbolMap[s?.toUpperCase()] || s?.toLowerCase())
      .filter(Boolean);

    if (ids.length === 0) return new Map();

    try {
      const response = await fetch(
        `${this.baseUrl}/simple/price?ids=${ids.join(",")}&vs_currencies=inr,usd&include_24hr_change=true`,
        { next: { revalidate: 60 } }
      );

      if (!response.ok) {
        throw new PriceProviderError(`CoinGecko API error: ${response.status}`, response.status);
      }

      const data = await response.json();
      const prices = new Map();

      for (const symbol of symbols) {
        const id = this.symbolMap[symbol?.toUpperCase()] || symbol?.toLowerCase();
        const coinData = data[id];

        if (coinData) {
          prices.set(symbol.toUpperCase(), {
            price: coinData.inr || coinData.usd || 0,
            currency: "INR",
            usdPrice: coinData.usd,
            inrPrice: coinData.inr,
            change24h: coinData.inr_24h_change || 0,
            lastUpdated: new Date(),
            provider: this.provider,
          });
        }
      }

      return prices;
    } catch (error) {
      console.error(`[CoinGeckoAdapter] Error fetching prices for ${symbols}:`, error);
      return new Map();
    }
  },
};
