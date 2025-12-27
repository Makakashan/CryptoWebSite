// Asset constants
export const ALLOWED_ASSET_CATEGORIES = [
  "currency",
  "defi",
  "nft",
  "meme",
  "other",
];
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
