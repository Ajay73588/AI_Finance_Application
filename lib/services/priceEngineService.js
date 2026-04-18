/**
 * Price Engine Service
 * --------------------
 * Central service for fetching, caching, and updating live asset prices.
 * Uses CoinGeckoAdapter for crypto prices.
 * Supports in-memory caching with TTL.
 *
 * Architecture: All price-related business logic lives here.
 */

import { db } from "@/lib/prisma";
import { CoinGeckoAdapter } from "@/lib/adapters/priceAdapter";

// Cache TTL in milliseconds (5 minutes for live prices)
const CACHE_TTL = 5 * 60 * 1000;

// In-memory price cache
const priceCache = new Map();

/**
 * Gets a user by Clerk auth.
 */
async function getAuthUser() {
  const { auth } = await import("@clerk/nextjs/server");
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });
  if (!user) throw new Error("User not found");
  return user;
}

/**
 * Gets a user by internal ID.
 */
async function getUserById(userId) {
  return db.user.findUnique({
    where: { id: userId },
  });
}

/**
 * Checks if cache entry is valid.
 */
function isCacheValid(entry) {
  if (!entry) return false;
  return Date.now() - entry.timestamp < CACHE_TTL;
}

/**
 * Gets cached price for a symbol.
 */
function getCachedPrice(symbol) {
  const entry = priceCache.get(symbol.toUpperCase());
  if (isCacheValid(entry)) {
    return entry.data;
  }
  return null;
}

/**
 * Sets cached price for a symbol.
 */
function setCachedPrice(symbol, data) {
  priceCache.set(symbol.toUpperCase(), {
    data,
    timestamp: Date.now(),
  });
}

/**
 * Gets current price for a single asset from cache or live source.
 * First checks cache, then fetches from CoinGecko if stale.
 */
export async function getCurrentPrice(symbol) {
  const upperSymbol = symbol?.toUpperCase();
  if (!upperSymbol) return null;

  // Check cache first
  const cached = getCachedPrice(upperSymbol);
  if (cached) return cached;

  // Fetch from CoinGecko
  const price = await CoinGeckoAdapter.getPrice(upperSymbol);
  if (price) {
    setCachedPrice(upperSymbol, price);
  }

  return price;
}

/**
 * Gets current prices for multiple assets.
 * Uses batch API call to CoinGecko for efficiency.
 */
export async function getCurrentPrices(symbols) {
  if (!symbols || symbols.length === 0) return new Map();

  const upperSymbols = symbols.map((s) => s.toUpperCase());
  const result = new Map();
  const toFetch = [];

  // Check cache first
  for (const symbol of upperSymbols) {
    const cached = getCachedPrice(symbol);
    if (cached) {
      result.set(symbol, cached);
    } else {
      toFetch.push(symbol);
    }
  }

  // Fetch stale prices in batch
  if (toFetch.length > 0) {
    const prices = await CoinGeckoAdapter.getPrices(toFetch);
    for (const [symbol, data] of prices) {
      setCachedPrice(symbol, data);
      result.set(symbol, data);
    }
  }

  return result;
}

/**
 * Updates currentPrice for a single asset in the database.
 */
export async function updateAssetPrice(assetId, newPrice) {
  return db.asset.update({
    where: { id: assetId },
    data: { currentPrice: newPrice },
  });
}

/**
 * Refreshes prices for all crypto assets of a user.
 * Fetches live prices from CoinGecko and updates the database.
 * Returns summary of updated assets.
 */
export async function refreshUserPrices(userId) {
  // Get all crypto assets for user
  const cryptoAssets = await db.asset.findMany({
    where: {
      userId,
      type: "crypto",
      symbol: { not: null },
    },
  });

  if (cryptoAssets.length === 0) {
    return { updated: 0, assets: [] };
  }

  // Extract unique symbols
  const symbols = [...new Set(cryptoAssets.map((a) => a.symbol).filter(Boolean))];

  // Fetch current prices in batch
  const prices = await getCurrentPrices(symbols);

  // Update each asset with new price
  const updated = [];
  const errors = [];

  for (const asset of cryptoAssets) {
    const symbol = asset.symbol?.toUpperCase();
    const priceData = prices.get(symbol);

    if (priceData) {
      try {
        const updatedAsset = await db.asset.update({
          where: { id: asset.id },
          data: { currentPrice: priceData.price },
        });
        updated.push({
          id: asset.id,
          name: asset.name,
          symbol,
          oldPrice: asset.currentPrice,
          newPrice: priceData.price,
          change24h: priceData.change24h,
        });
      } catch (error) {
        errors.push({ id: asset.id, symbol, error: error.message });
      }
    }
  }

  return {
    updated: updated.length,
    failed: errors.length,
    assets: updated,
    errors: errors.length > 0 ? errors : undefined,
  };
}

/**
 * Gets price summary for all user assets.
 * Returns current prices and 24h change where available.
 */
export async function getAssetsWithLivePrices(userId) {
  const user = await getUserById(userId);
  if (!user) throw new Error("User not found");

  const assets = await db.asset.findMany({
    where: { userId: user.id },
  });

  // Get unique crypto symbols
  const cryptoSymbols = assets
    .filter((a) => a.type === "crypto" && a.symbol)
    .map((a) => a.symbol);

  // Fetch live prices for crypto
  const prices = cryptoSymbols.length > 0
    ? await getCurrentPrices(cryptoSymbols)
    : new Map();

  return assets.map((asset) => {
    const symbol = asset.symbol?.toUpperCase();
    const priceData = prices.get(symbol);

    return {
      ...asset,
      livePrice: priceData?.price || asset.currentPrice,
      livePriceChange24h: priceData?.change24h || 0,
      currency: priceData?.currency || "INR",
      lastPriceUpdate: priceData?.lastUpdated || null,
    };
  });
}

/**
 * Clears the price cache.
 */
export function clearPriceCache() {
  priceCache.clear();
}

/**
 * Gets cache statistics.
 */
export function getCacheStats() {
  const entries = [];
  for (const [symbol, entry] of priceCache) {
    const age = Date.now() - entry.timestamp;
    entries.push({
      symbol,
      ageMs: age,
      ageSeconds: Math.round(age / 1000),
      isStale: age > CACHE_TTL,
    });
  }
  return {
    size: priceCache.size,
    entries,
    ttlSeconds: CACHE_TTL / 1000,
  };
}
