import { getCurrentPrice } from "../services/priceService.js";
export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 10;
export const MAX_LIMIT = 100;
// Helper function to parse pagination parameters
export const parsePagination = (page, limit) => {
    const parsedPage = Math.max(DEFAULT_PAGE, parseInt(page || "") || DEFAULT_PAGE);
    const parsedLimit = Math.min(MAX_LIMIT, Math.max(1, parseInt(limit || "") || DEFAULT_LIMIT));
    const offset = (parsedPage - 1) * parsedLimit;
    return { page: parsedPage, limit: parsedLimit, offset };
};
// Helper function to validate and sanitize sort field
export const validateSortField = (field, allowed, defaultField) => {
    return field && allowed.includes(field) ? field : defaultField;
};
// Helper function to validate and sanitize sort order
export const validateSortOrder = (order) => {
    return order === "desc" ? "desc" : "asc";
};
// Helper function to parse numeric filters
export const parseNumericFilter = (value) => {
    const parsed = parseFloat(value || "");
    return isNaN(parsed) ? null : parsed;
};
// Helper function to parse date filters
export const parseDateFilter = (value) => {
    if (!value)
        return null;
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date.toISOString();
};
// Helper function to parse boolean filters
export const parseBooleanFilter = (value) => {
    if (value === "true")
        return true;
    if (value === "false")
        return false;
    return null;
};
// Helper function to build paginated response
export const buildPaginationResponse = (data, page, limit, total, sortBy, sortOrder) => ({
    data,
    pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
    },
    sort: {
        sortBy,
        sortOrder,
    },
});
// Helper to convert Asset to AssetWithPrice
export const assetToAssetWithPrice = (asset) => {
    // Remove USDT suffix to match MQTT topic format (e.g., "BTCUSDT" -> "BTC")
    const priceSymbol = asset.symbol.replace(/USDT$/, "");
    return {
        ...asset,
        is_active: Boolean(asset.is_active),
        price: getCurrentPrice(priceSymbol) || 0,
    };
};
//# sourceMappingURL=helpers.js.map