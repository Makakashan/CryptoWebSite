import { Asset, AssetWithPrice } from "../types/types.js";
export declare const DEFAULT_PAGE = 1;
export declare const DEFAULT_LIMIT = 10;
export declare const MAX_LIMIT = 100;
export declare const parsePagination: (page: string | undefined, limit: string | undefined) => {
    page: number;
    limit: number;
    offset: number;
};
export declare const validateSortField: (field: string | undefined, allowed: string[], defaultField: string) => string;
export declare const validateSortOrder: (order: string | undefined) => "asc" | "desc";
export declare const parseNumericFilter: (value: string | undefined) => number | null;
export declare const parseDateFilter: (value: string | undefined) => string | null;
export declare const parseBooleanFilter: (value: string | undefined) => boolean | null;
export declare const buildPaginationResponse: <T>(data: T[], page: number, limit: number, total: number, sortBy: string, sortOrder: "asc" | "desc") => {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
    sort: {
        sortBy: string;
        sortOrder: "asc" | "desc";
    };
};
export declare const assetToAssetWithPrice: (asset: Asset) => AssetWithPrice;
//# sourceMappingURL=helpers.d.ts.map