import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { fetchPortfolio } from "../store/slices/portfolioSlice";
import { formatPrice } from "../utils/formatPrice";
import StatCardSkeleton from "../components/skeletons/StatCardSkeleton";
import TableSkeleton from "../components/skeletons/TableSkeleton";

const Portfolio = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const { portfolio, isLoading, error } = useAppSelector(
    (state) => state.portfolio,
  );
  const { assets } = useAppSelector((state) => state.assets);

  // Filter and pagination state
  const [searchAsset, setSearchAsset] = useState("");
  const [sortBy, setSortBy] = useState<"symbol" | "amount" | "value">("value");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Enrich portfolio assets with current prices from assets state
  const enrichedAssets = useMemo(() => {
    if (!portfolio) return [];
    return portfolio.assets.map((portfolioAsset) => {
      const assetData = assets.find(
        (a) => a.symbol === portfolioAsset.asset_symbol,
      );
      return {
        ...portfolioAsset,
        currentPrice: assetData?.price || assetData?.current_price || 0,
        name: assetData?.name || portfolioAsset.asset_symbol,
        image_url: assetData?.image_url,
      };
    });
  }, [portfolio, assets]);

  // Filter and sort assets
  const filteredAndSortedAssets = useMemo(() => {
    let filtered = [...enrichedAssets];

    // Apply search filter
    if (searchAsset) {
      const searchLower = searchAsset.toLowerCase();
      filtered = filtered.filter(
        (asset) =>
          asset.asset_symbol.toLowerCase().includes(searchLower) ||
          (asset.name && asset.name.toLowerCase().includes(searchLower)),
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let compareValue = 0;

      switch (sortBy) {
        case "symbol":
          compareValue = a.asset_symbol.localeCompare(b.asset_symbol);
          break;
        case "amount":
          compareValue = a.amount - b.amount;
          break;
        case "value": {
          const aValue = a.amount * a.currentPrice;
          const bValue = b.amount * b.currentPrice;
          compareValue = aValue - bValue;
          break;
        }
      }

      return sortOrder === "asc" ? compareValue : -compareValue;
    });

    return filtered;
  }, [enrichedAssets, searchAsset, sortBy, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedAssets.length / itemsPerPage);

  // Reset to page 1 when filters change
  const effectiveCurrentPage = useMemo(() => {
    if (currentPage > totalPages && totalPages > 0) {
      return 1;
    }
    return currentPage;
  }, [currentPage, totalPages]);

  const paginatedAssets = useMemo(() => {
    const startIndex = (effectiveCurrentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredAndSortedAssets.slice(startIndex, endIndex);
  }, [filteredAndSortedAssets, effectiveCurrentPage, itemsPerPage]);

  const totalBalance = portfolio?.balance || 0;
  const portfolioValue =
    enrichedAssets.reduce((sum, asset) => {
      const value = asset.currentPrice ? asset.amount * asset.currentPrice : 0;
      return sum + value;
    }, 0) || 0;
  const totalValue = totalBalance + portfolioValue;

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    dispatch(fetchPortfolio());
  }, [dispatch, isAuthenticated, navigate]);

  const handleResetFilters = () => {
    setSearchAsset("");
    setSortBy("value");
    setSortOrder("desc");
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setCurrentPage(page);
  };

  // Всегда показываем скелетоны при загрузке - моментальная реакция
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-text-primary text-3xl font-bold m-0 mb-1">
            {t("portfolio")}
          </h1>
          <p className="text-text-secondary text-sm">{t("yourAssets")}</p>
        </div>

        {/* Skeleton for stats */}
        <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-4">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>

        {/* Skeleton for table */}
        <TableSkeleton rows={10} columns={5} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-14 text-center gap-4">
        <p className="text-red text-base">{error}</p>
        <button
          className="btn-primary"
          onClick={() => dispatch(fetchPortfolio())}
        >
          Retry
        </button>
      </div>
    );
  }

  if (!portfolio) {
    return null;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-text-primary text-2xl font-bold m-0">
          {t("myPortfolio")}
        </h1>
        <button className="btn-primary" onClick={() => navigate("/markets")}>
          {t("tradeAssets")}
        </button>
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-4 mb-8">
        <div className="stat-card">
          <h3 className="stat-title">{t("totalValue")}</h3>
          <div className="stat-value">{formatPrice(totalValue)}</div>
          <p className="stat-subtitle">{t("cashAndHoldings")}</p>
        </div>

        <div className="stat-card">
          <h3 className="stat-title">{t("availableBalance")}</h3>
          <div className="stat-value">{formatPrice(totalBalance)}</div>
          <p className="stat-subtitle">{t("available")}</p>
        </div>

        <div className="stat-card">
          <h3 className="stat-title">{t("holdingsValue")}</h3>
          <div className="stat-value">{formatPrice(portfolioValue)}</div>
          <p className="stat-subtitle">
            {enrichedAssets.length} {t("assets")}
          </p>
        </div>

        <div className="stat-card">
          <h3 className="stat-title">{t("totalAssets")}</h3>
          <div className="stat-value">{enrichedAssets.length}</div>
          <p className="stat-subtitle">{t("inPortfolio")}</p>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-xl mb-4 text-text-primary">{t("yourAssets")}</h2>

        {enrichedAssets.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-14 text-center">
            <p className="text-text-secondary mb-4">{t("noAssetsYet")}</p>
            <button
              className="btn-primary"
              onClick={() => navigate("/markets")}
            >
              {t("browseMarkets")}
            </button>
          </div>
        ) : (
          <>
            <div className="card-padded mb-6">
              <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4 mb-4">
                <div className="flex flex-col gap-2">
                  <label className="filter-label">{t("search")}</label>
                  <input
                    type="text"
                    placeholder={t("search")}
                    value={searchAsset}
                    onChange={(e) => setSearchAsset(e.target.value)}
                    className="input"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="filter-label">{t("sortBy")}</label>
                  <select
                    value={sortBy}
                    onChange={(e) =>
                      setSortBy(e.target.value as "symbol" | "amount" | "value")
                    }
                    className="select"
                  >
                    <option value="value">{t("totalValue")}</option>
                    <option value="symbol">{t("symbol")}</option>
                    <option value="amount">{t("amount")}</option>
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="filter-label">{t("sortOrder")}</label>
                  <select
                    value={sortOrder}
                    onChange={(e) =>
                      setSortOrder(e.target.value as "asc" | "desc")
                    }
                    className="select"
                  >
                    <option value="desc">{t("highToLow")}</option>
                    <option value="asc">{t("lowToHigh")}</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <button
                  className="btn-secondary hover:-translate-y-px"
                  onClick={handleResetFilters}
                >
                  {t("reset")}
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-bg-hover">
                    <th className="p-4 text-left text-text-secondary text-xs font-semibold uppercase tracking-wider">
                      {t("asset")}
                    </th>
                    <th className="p-4 text-left text-text-secondary text-xs font-semibold uppercase tracking-wider">
                      {t("amount")}
                    </th>
                    <th className="p-4 text-left text-text-secondary text-xs font-semibold uppercase tracking-wider">
                      {t("currentPrice")}
                    </th>
                    <th className="p-4 text-left text-text-secondary text-xs font-semibold uppercase tracking-wider">
                      {t("totalValue")}
                    </th>
                    <th className="p-4 text-left text-text-secondary text-xs font-semibold uppercase tracking-wider">
                      {t("actions")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedAssets.map((asset) => {
                    const shortName = asset.asset_symbol.replace("USDT", "");
                    const defaultIcon = `https://ui-avatars.com/api/?name=${shortName}&background=random&size=32`;
                    const currentPrice = asset.currentPrice || 0;
                    const totalValue = asset.amount * currentPrice;

                    return (
                      <tr
                        key={asset.asset_symbol}
                        className="border-b border-bg-hover transition-colors duration-200 hover:bg-bg-hover"
                      >
                        <td className="p-4 text-text-primary text-sm">
                          <div className="flex items-center gap-3">
                            <img
                              src={asset.image_url || defaultIcon}
                              alt={shortName}
                              className="w-8 h-8 rounded-full"
                              onError={(e) => {
                                e.currentTarget.src = defaultIcon;
                              }}
                            />
                            <div>
                              <div className="font-semibold text-text-primary">
                                {shortName}
                              </div>
                              <div className="text-xs text-text-secondary">
                                {asset.name || asset.asset_symbol}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-text-primary text-sm">
                          <div className="font-medium">
                            {asset.amount.toFixed(6)}
                          </div>
                        </td>
                        <td className="p-4 text-text-primary text-sm">
                          <div className="font-medium">
                            {formatPrice(currentPrice)}
                          </div>
                        </td>
                        <td className="p-4 text-text-primary text-sm">
                          <div className="font-semibold">
                            {formatPrice(totalValue)}
                          </div>
                        </td>
                        <td className="p-4 text-text-primary text-sm">
                          <button
                            className="btn-secondary px-4 py-2 text-xs"
                            onClick={() =>
                              navigate(`/markets/${asset.asset_symbol}`)
                            }
                          >
                            {t("trade")}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 mt-8 pt-6">
                <button
                  className="btn-secondary btn-small min-w-120"
                  onClick={() => handlePageChange(effectiveCurrentPage - 1)}
                  disabled={effectiveCurrentPage === 1}
                >
                  {t("previous")}
                </button>
                <span className="text-text-secondary text-sm font-medium px-4">
                  {t("page")} {effectiveCurrentPage} {t("of")} {totalPages}
                </span>
                <button
                  className="btn-secondary btn-small min-w-120"
                  onClick={() => handlePageChange(effectiveCurrentPage + 1)}
                  disabled={effectiveCurrentPage === totalPages}
                >
                  {t("next")}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Portfolio;
