// Asset constants
export const ALLOWED_ASSET_CATEGORIES = [
  "currency",
  "defi",
  "nft",
  "meme",
  "other",
];

// CoinGecko category mapping
export const COINGECKO_CATEGORY_MAP: Record<string, string> = {
  "Decentralized Finance (DeFi)": "defi",
  DeFi: "defi",
  "Decentralized Finance": "defi",
  "Non-Fungible Tokens (NFT)": "nft",
  NFT: "nft",
  "Non-Fungible Token": "nft",
  "Collectibles & NFTs": "nft",
  Meme: "meme",
  "Meme Tokens": "meme",
  Stablecoins: "currency",
  Stablecoin: "currency",
  Cryptocurrency: "currency",
  "Layer 1 (L1)": "currency",
  "Layer 2 (L2)": "currency",
};

// Helper function to map CoinGecko categories to our categories
export function mapCoinGeckoCategory(categories?: string[]): string {
  if (!categories || categories.length === 0) {
    return "other";
  }

  // Check each category in order of priority
  for (const category of categories) {
    if (COINGECKO_CATEGORY_MAP[category]) {
      return COINGECKO_CATEGORY_MAP[category];
    }
  }

  // Default to "other" if no match found
  return "other";
}

export const ALLOWED_ASSET_SORT_FIELDS = [
  "symbol",
  "name",
  "category",
  "created_at",
  "price",
];

// Order constants
export const ALLOWED_ORDER_TYPES = ["BUY", "SELL"];
export const ALLOWED_ORDER_SORT_FIELDS = [
  "timestamp",
  "amount",
  "price_at_transaction",
  "asset_symbol",
];

// User constants
export const ALLOWED_USER_SORT_FIELDS = ["id", "username", "balance"];

// Portfolio constants
export const ALLOWED_PORTFOLIO_SORT_FIELDS = ["asset_symbol", "amount"];
