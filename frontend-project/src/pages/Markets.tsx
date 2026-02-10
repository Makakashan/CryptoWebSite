import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import {
  fetchAssets,
  setFilters,
  fetchChartData,
} from "../store/slices/assetsSlice";
import { useWebSocket } from "../hooks/useWebSocket";
import AssetCard from "../components/AssetCard";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import Select from "@/components/ui/select";
import Card, { CardContent } from "@/components/ui/card";
import { Search, SlidersHorizontal, X, Plus } from "lucide-react";
import { assetsApi } from "../api/assetsApi";

const Markets = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  useWebSocket();
  const dispatch = useAppDispatch();
  const { assets, isLoading, error, filters, pagination } = useAppSelector(
    (state) => state.assets,
  );

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [sortBy, setSortBy] = useState("price");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [showFilters, setShowFilters] = useState(false);
  const metadataUpdateProcessed = useRef<Set<string>>(new Set());

  const categories = [
    "Layer 1",
    "DeFi",
    "Smart Contract Platform",
    "Exchange Token",
    "Meme",
    "Gaming",
  ];

  useEffect(() => {
    dispatch(fetchAssets(filters));
  }, [dispatch, filters]);

  // Load chart data for assets on current page
  useEffect(() => {
    if (assets.length > 0) {
      const symbols = assets.map((asset) => asset.symbol);
      dispatch(fetchChartData(symbols));
    }
  }, [assets, dispatch]);

  // Auto-update metadata for assets with missing images or descriptions
  useEffect(() => {
    const updateMetadata = async () => {
      if (assets.length > 0) {
        // Find assets that need metadata updates and haven't been processed yet
        const assetsNeedingUpdate = assets.filter(
          (asset) =>
            (!asset.image_url ||
              !asset.description ||
              asset.description === "") &&
            !metadataUpdateProcessed.current.has(asset.symbol),
        );

        if (assetsNeedingUpdate.length > 0) {
          const symbols = assetsNeedingUpdate.map((asset) => asset.symbol);

          // Mark these assets as processed to avoid duplicate updates
          symbols.forEach((symbol) =>
            metadataUpdateProcessed.current.add(symbol),
          );

          try {
            console.log(`Updating metadata for ${symbols.length} assets...`);
            const result = await assetsApi.updateMetadata(symbols);
            console.log(`Updated ${result.updated} assets successfully`);

            // Refresh assets immediately after metadata update
            dispatch(fetchAssets(filters));
          } catch (error) {
            console.error("Failed to update metadata:", error);
            // Remove from processed set on error so it can be retried
            symbols.forEach((symbol) =>
              metadataUpdateProcessed.current.delete(symbol),
            );
          }
        }
      }
    };

    // Run when assets are loaded
    updateMetadata();
  }, [assets, dispatch, filters]);

  // Auto-refresh prices and charts every second (only when tab is visible)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Refresh immediately when tab becomes visible
        dispatch(fetchAssets(filters));
        if (assets.length > 0) {
          const symbols = assets.map((asset) => asset.symbol);
          dispatch(fetchChartData(symbols));
        }
      }
    };

    const intervalId = setInterval(() => {
      if (!document.hidden) {
        // Only refresh when tab is visible
        dispatch(fetchAssets(filters));
        if (assets.length > 0) {
          const symbols = assets.map((asset) => asset.symbol);
          dispatch(fetchChartData(symbols));
        }
      }
    }, 1000); // Update every 1 second

    // Listen for visibility changes
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [dispatch, filters, assets]);

  const handleApplyFilters = () => {
    dispatch(
      setFilters({
        search: search || undefined,
        category: category || undefined,
        sortBy,
        sortOrder,
        page: 1,
      }),
    );
    setShowFilters(false);
  };

  const handleReset = () => {
    setSearch("");
    setCategory("");
    setSortBy("price");
    setSortOrder("desc");
    dispatch(
      setFilters({
        page: 1,
        limit: 12,
        sortBy: "price",
        sortOrder: "desc",
      }),
    );
  };

  const handlePageChange = (page: number) => {
    dispatch(setFilters({ ...filters, page }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (isLoading && assets.length === 0) {
    return (
      <div className="loading-container">
        <div className="loading-spinner mb-4"></div>
        <p className="text-text-secondary">{t("loading")}</p>
      </div>
    );
  }

  const currentPage = pagination?.page || 1;
  const totalPages = pagination?.totalPages || 1;
  const hasActiveFilters =
    search || category || sortBy !== "price" || sortOrder !== "desc";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-text-primary text-3xl font-bold m-0 mb-1">
            {t("markets")}
          </h1>
          <p className="text-text-secondary text-sm">
            Discover and track your favorite assets
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => navigate("/markets/add")} className="gap-2">
            <Plus className="w-4 h-4" />
            {t("addNewAsset")}
          </Button>
        </div>
      </div>

      {/* Compact Filters Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4">
            {/* Quick Filter Row */}
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-secondary" />
                <Input
                  type="text"
                  placeholder={t("searchAssets")}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleApplyFilters()}
                  className="pl-10"
                />
              </div>

              {/* Filter Toggle & Apply */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className={`gap-2 ${hasActiveFilters ? "border-blue text-blue" : ""}`}
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  {t("filters")}
                  {hasActiveFilters && (
                    <span className="ml-1 px-1.5 py-0.5 text-xs bg-blue text-white rounded">
                      •
                    </span>
                  )}
                </Button>
                <Button size="sm" onClick={handleApplyFilters}>
                  {t("apply")}
                </Button>
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleReset}
                    className="gap-1"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Expandable Advanced Filters */}
            {showFilters && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-3 border-t border-bg-hover animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-text-secondary">
                    {t("category")}
                  </label>
                  <Select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    <option value="">{t("all")}</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </Select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-text-secondary">
                    {t("sortBy")}
                  </label>
                  <Select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <option value="price">{t("price")}</option>
                    <option value="symbol">{t("symbol")}</option>
                    <option value="name">{t("name")}</option>
                  </Select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-text-secondary">
                    {t("order")}
                  </label>
                  <Select
                    value={sortOrder}
                    onChange={(e) =>
                      setSortOrder(e.target.value as "asc" | "desc")
                    }
                  >
                    <option value="desc">{t("highToLow")}</option>
                    <option value="asc">{t("lowToHigh")}</option>
                  </Select>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Error State */}
      {error && (
        <Card className="border-red/50 bg-red/5">
          <CardContent className="p-6 text-center">
            <p className="text-red text-base">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Assets Grid - Responsive 3-4 columns */}
      {!error && assets.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {assets.map((asset) => (
            <AssetCard key={asset.symbol} asset={asset} />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!error && !isLoading && assets.length === 0 && (
        <Card>
          <CardContent className="p-14 text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 rounded-full bg-bg-hover flex items-center justify-center">
                <Search className="w-8 h-8 text-text-secondary" />
              </div>
              <p className="text-text-secondary text-lg">
                {t("noAssetsAvailable")}
              </p>
              <Button variant="outline" size="sm" onClick={handleReset}>
                {t("resetFilters")}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 pt-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            {t("previous")}
          </Button>
          <span className="text-text-secondary text-sm font-medium px-4">
            {t("page")} {currentPage} {t("of")} {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            {t("next")}
          </Button>
        </div>
      )}
    </div>
  );
};

export default Markets;
