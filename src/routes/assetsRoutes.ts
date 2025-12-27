import express, { Router, Request, Response } from "express";
import { getDB } from "../database.js";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { AuthRequest, Asset, BinanceTicker } from "../types/types.js";
import {
  parsePagination,
  validateSortField,
  validateSortOrder,
  parseNumericFilter,
  buildPaginationResponse,
  assetToAssetWithPrice,
} from "../utils/helpers.js";
import {
  ALLOWED_ASSET_CATEGORIES,
  ALLOWED_ASSET_SORT_FIELDS,
} from "../utils/constants.js";

const router: Router = express.Router();

// GET /assets - Get Assets with Pagination, Sorting, and Filtering
router.get("/", async (req: Request, res: Response): Promise<void> => {
  const db = getDB();

  // Parse Pagination
  const { page, limit, offset } = parsePagination(
    req.query.page as string,
    req.query.limit as string,
  );
  const sortBy = validateSortField(
    req.query.sortBy as string,
    ALLOWED_ASSET_SORT_FIELDS,
    "symbol",
  );
  const sortOrder = validateSortOrder(req.query.sortOrder as string);
  const sortOrderSQL = sortOrder.toUpperCase();

  // Parse Filters
  const search = req.query.search as string | undefined;
  const category = req.query.category as string | undefined;
  const isActive = req.query.isActive as string | undefined;
  const minPrice = parseNumericFilter(req.query.minPrice as string | undefined);
  const maxPrice = parseNumericFilter(req.query.maxPrice as string | undefined);

  try {
    // Build WHERE clause
    const conditions: string[] = [];
    const params: (string | number)[] = [];

    if (search) {
      conditions.push("(symbol Like ? or name Like ?)");
      params.push(`%${search}%`, `%${search}%`);
    }

    if (category && ALLOWED_ASSET_CATEGORIES.includes(category)) {
      conditions.push("category = ?");
      params.push(category);
    }

    if (isActive !== undefined) {
      conditions.push("is_active = ?");
      params.push(isActive === "true" ? 1 : 0);
    }

    // Price filtering will be handled after fetching data since price is not stored in DB
    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    // Get total count for pagination
    const countResult = await db.get(
      `SELECT COUNT(*) as total FROM assets ${whereClause}`,
      params,
    );
    const total = countResult?.total || 0;

    // Fetch assets
    const isSortingByPrice = sortBy === "price";

    const assets: Asset[] = isSortingByPrice
      ? await db.all(`SELECT * FROM assets ${whereClause}`, params)
      : await db.all(
          `SELECT * FROM assets ${whereClause} ORDER BY ${sortBy} ${sortOrderSQL} LIMIT ? OFFSET ?`,
          [...params, limit, offset],
        );

    let assetsWithPrice = assets.map(assetToAssetWithPrice);

    // Apply Sorting by Price if needed
    if (isSortingByPrice) {
      assetsWithPrice.sort((a, b) =>
        sortOrder === "asc" ? a.price - b.price : b.price - a.price,
      );
      assetsWithPrice = assetsWithPrice.slice(offset, offset + limit);
    }

    // Apply Price Filtering
    if (minPrice !== null || maxPrice !== null) {
      assetsWithPrice = assetsWithPrice.filter((asset) => {
        if (minPrice !== null && asset.price < minPrice) return false;
        if (maxPrice !== null && asset.price > maxPrice) return false;
        return true;
      });
    }

    const response = buildPaginationResponse(
      assetsWithPrice,
      page,
      limit,
      total,
      sortBy,
      sortOrder,
    );

    res.json(response);
  } catch (error) {
    console.error("Error fetching assets:", error);
    res.status(500).json({ message: "Internal server error." });
  }
});

// GET /assets/categories - Get Allowed Asset Categories
router.get("/categories", (_req: Request, res: Response): void => {
  res.json({ categories: ALLOWED_ASSET_CATEGORIES });
});

// POST /assets/sync - Synchronize Assets from External API
router.post(
  "/sync",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const db = getDB();
    const limit = Math.min(
      100,
      Math.max(1, Number(req.body.limit as string) || 20),
    );

    try {
      const response = await fetch(
        "https://api.binance.com/api/v3/ticker/24hr",
      );

      if (!response.ok) {
        res.status(500).json({ message: "Failed to fetch data from Binance." });
        return;
      }

      const tickers: BinanceTicker[] =
        (await response.json()) as BinanceTicker[];

      const stablecoins = [
        "USDT",
        "USDC",
        "BUSD",
        "TUSD",
        "USDP",
        "DAI",
        "FDUSD",
        "USD1",
      ];

      const usdtPairs = tickers
        .filter((ticker) => {
          if (!ticker.symbol.endsWith("USDT")) return false;

          const baseAsset = ticker.symbol.replace("USDT", "");
          // Exclude if base asset is a stablecoin
          return !stablecoins.includes(baseAsset);
        })
        .sort(
          (a: any, b: any) =>
            parseFloat(b.quoteVolume) - parseFloat(a.quoteVolume),
        )
        .slice(0, limit);

      let addedCount = 0;
      let skippedCount = 0;

      for (const ticker of usdtPairs) {
        const symbol = ticker.symbol;

        const existingAsset = await db.get(
          "SELECT * FROM assets WHERE symbol = ?",
          [symbol],
        );

        if (existingAsset) {
          skippedCount++;
          continue;
        }

        await db.run(
          `INSERT INTO assets (symbol, name, category, is_active)
           VALUES (?, ?, ?, ?)`,
          [symbol, symbol, "crypto", 1],
        );

        addedCount++;
      }

      res.json({
        message: "Asset synchronization completed.",
        added: addedCount,
        skipped: skippedCount,
        total: limit,
      });
    } catch (error) {
      console.error("Error synchronizing assets:", error);
      res.status(500).json({ message: "Internal server error." });
    }
  },
);

// GET /assets/search/:symbol - Search for asset (auto-create if not exists)
router.get(
  "/search/:symbol",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const db = getDB();
    let symbol = req.params.symbol.toUpperCase();

    if (!symbol.endsWith("USDT")) {
      symbol = `${symbol}USDT`;
    }

    try {
      // Check if asset exists in DB
      const existingAsset = await db.get(
        "SELECT * FROM assets WHERE symbol = ?",
        [symbol],
      );

      // If asset exists, return it with price
      if (existingAsset) {
        const assetWithPrice = assetToAssetWithPrice(existingAsset);
        res.json({
          asset: assetWithPrice,
          created: false,
        });
        return;
      }

      // Asset does not exist, fetch price from Binance API
      const binanceResponse = await fetch(
        `https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`,
      );

      if (!binanceResponse.ok) {
        res.status(400).json({
          message: "Asset not found in database.",
        });
        return;
      }

      await binanceResponse.json();

      await db.run(
        `INSERT INTO assets (symbol, name, category, is_active)
         VALUES (?, ?, ?, ?)`,
        [symbol, symbol, "crypto", 1],
      );

      const newAsset = await db.get("SELECT * FROM assets WHERE symbol = ?", [
        symbol,
      ]);

      const assetWithPrice = assetToAssetWithPrice(newAsset);

      res.status(201).json({
        asset: assetWithPrice,
        created: true,
        message: `Asset ${symbol} created successfully.`,
      });
    } catch (error) {
      console.error("Error searching/creating asset:", error);
      res.status(500).json({ message: "Internal server error." });
    }
  },
);

// POST /api/assets - Create New Asset
router.post(
  "/",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const db = getDB();
    const { symbol, name, image_url, category, description, is_active } =
      req.body;

    if (!symbol || !name) {
      res.status(400).json({ message: "Symbol and name are required." });
      return;
    }

    if (category && !ALLOWED_ASSET_CATEGORIES.includes(category)) {
      res.status(400).json({ message: "Invalid category." });
      return;
    }

    const normalizedSymbol = symbol.toUpperCase();

    try {
      const existingAsset = await db.get(
        "SELECT * FROM assets WHERE symbol = ?",
        [normalizedSymbol],
      );

      if (existingAsset) {
        res
          .status(400)
          .json({ message: "Asset with this symbol already exists." });
        return;
      }

      await db.run(
        `INSERT INTO assets (symbol, name, image_url, category, description, is_active)
       VALUES (?, ?, ?, ?, ?, ?)`,
        [
          normalizedSymbol,
          name,
          image_url || null,
          category || "other",
          description || null,
          is_active != false ? 1 : 0,
        ],
      );

      const newAsset = await db.get("SELECT * FROM assets WHERE symbol = ?", [
        normalizedSymbol,
      ]);

      res.status(201).json({
        message: "Asset created successfully.",
        asset: assetToAssetWithPrice(newAsset),
      });
    } catch (error) {
      console.error("Error creating asset:", error);
      res.status(500).json({ message: "Internal server error." });
    }
  },
);

// PUT /api/assets/:symbol - Update Existing Asset
router.put(
  "/:symbol",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const db = getDB();
    const symbol = req.params.symbol.toUpperCase();

    if (
      req.body.category &&
      !ALLOWED_ASSET_CATEGORIES.includes(req.body.category)
    ) {
      res.status(400).json({
        message: `Invalid category. Allowed: ${ALLOWED_ASSET_CATEGORIES.join(", ")}`,
      });
      return;
    }

    try {
      const existingAsset = await db.get(
        "SELECT * FROM assets WHERE symbol = ?",
        [symbol],
      );

      if (!existingAsset) {
        res.status(404).json({ message: "Asset not found." });
        return;
      }

      const updates: string[] = [];
      const params: (string | number | null)[] = [];

      const fieldsToUpdate: (keyof Asset)[] = [
        "name",
        "image_url",
        "category",
        "description",
        "is_active",
      ];

      fieldsToUpdate.forEach((field) => {
        const value = req.body[field];

        if (value !== undefined) {
          updates.push(`${field} = ?`);
          if (field === "is_active") {
            params.push(value != false ? 1 : 0);
          } else {
            params.push(value);
          }
        }
      });

      if (updates.length === 0) {
        res.status(400).json({ message: "No valid fields to update." });
        return;
      }

      params.push(symbol);
      await db.run(
        `UPDATE assets SET ${updates.join(", ")} WHERE symbol = ?`,
        params,
      );

      const updatedAsset = await db.get(
        "SELECT * FROM assets WHERE symbol = ?",
        [symbol],
      );

      res.json({
        message: "Asset updated successfully.",
        asset: assetToAssetWithPrice(updatedAsset),
      });
    } catch (error) {
      console.error("Error updating asset:", error);
      res.status(500).json({ message: "Internal server error." });
    }
  },
);

router.delete(
  "/:symbol",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const db = getDB();
    const symbol = req.params.symbol.toUpperCase();

    try {
      const result = await db.run("DELETE FROM assets WHERE symbol = ?", [
        symbol,
      ]);

      if (result.changes === 0) {
        res.status(404).json({ message: "Asset not found." });
        return;
      }

      res.json({ message: "Asset deleted successfully." });
    } catch (error) {
      console.error("Error deleting asset:", error);
      res.status(500).json({ message: "Internal server error." });
    }
  },
);

export default router;
