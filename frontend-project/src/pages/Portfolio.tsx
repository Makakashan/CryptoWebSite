import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { fetchPortfolio } from "../store/slices/portfolioSlice";
import { formatPrice } from "../utils/formatPrice";

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
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading portfolio...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <p>{error}</p>
        <button
          className="btn btn-primary"
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
    <div className="portfolio-page">
      <div className="portfolio-header">
        <h1>{t("myPortfolio")}</h1>
        <button
          className="btn btn-primary"
          onClick={() => navigate("/markets")}
        >
          {t("tradeAssets")}
        </button>
      </div>

      <div className="portfolio-stats">
        <div className="stat-card">
          <h3>{t("totalValue")}</h3>
          <div className="stat-value">{formatPrice(totalValue)}</div>
          <p>{t("cashAndHoldings")}</p>
        </div>

        <div className="stat-card">
          <h3>{t("availableBalance")}</h3>
          <div className="stat-value">{formatPrice(totalBalance)}</div>
          <p>{t("readyToTrade")}</p>
        </div>

        <div className="stat-card">
          <h3>{t("holdingsValue")}</h3>
          <div className="stat-value">{formatPrice(portfolioValue)}</div>
          <p>
            {enrichedAssets.length} {t("assets")}
          </p>
        </div>

        <div className="stat-card">
          <h3>{t("totalAssets")}</h3>
          <div className="stat-value">{enrichedAssets.length}</div>
          <p>{t("inPortfolio")}</p>
        </div>
      </div>

      <div className="portfolio-section">
        <h2>{t("yourAssets")}</h2>

        {enrichedAssets.length === 0 ? (
          <div className="empty-state">
            <p>{t("noAssetsYet")}</p>
            <button
              className="btn btn-primary"
              onClick={() => navigate("/markets")}
            >
              {t("browseMarkets")}
            </button>
          </div>
        ) : (
          <>
            <div className="filters-card">
              <div className="filters-grid">
                <div className="filter-group">
                  <label>{t("search")}</label>
                  <input
                    type="text"
                    placeholder={t("search")}
                    value={searchAsset}
                    onChange={(e) => setSearchAsset(e.target.value)}
                  />
                </div>

                <div className="filter-group">
                  <label>{t("sortBy")}</label>
                  <select
                    value={sortBy}
                    onChange={(e) =>
                      setSortBy(e.target.value as "symbol" | "amount" | "value")
                    }
                  >
                    <option value="value">{t("totalValue")}</option>
                    <option value="symbol">{t("symbol")}</option>
                    <option value="amount">{t("amount")}</option>
                  </select>
                </div>

                <div className="filter-group">
                  <label>{t("sortOrder")}</label>
                  <select
                    value={sortOrder}
                    onChange={(e) =>
                      setSortOrder(e.target.value as "asc" | "desc")
                    }
                  >
                    <option value="desc">{t("highToLow")}</option>
                    <option value="asc">{t("lowToHigh")}</option>
                  </select>
                </div>
              </div>

              <div className="filter-actions">
                <button className="btn" onClick={handleResetFilters}>
                  {t("reset")}
                </button>
              </div>
            </div>

            <div className="portfolio-table-container">
              <table className="portfolio-table">
                <thead>
                  <tr>
                    <th>{t("asset")}</th>
                    <th>{t("amount")}</th>
                    <th>{t("currentPrice")}</th>
                    <th>{t("totalValue")}</th>
                    <th>{t("actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedAssets.map((asset) => {
                    const shortName = asset.asset_symbol.replace("USDT", "");
                    const defaultIcon = `https://ui-avatars.com/api/?name=${shortName}&background=random&size=32`;
                    const currentPrice = asset.currentPrice || 0;
                    const totalValue = asset.amount * currentPrice;

                    return (
                      <tr key={asset.asset_symbol}>
                        <td>
                          <div className="asset-info">
                            <img
                              src={asset.image_url || defaultIcon}
                              alt={shortName}
                              onError={(e) => {
                                e.currentTarget.src = defaultIcon;
                              }}
                            />
                            <div>
                              <div className="asset-name">{shortName}</div>
                              <div className="asset-symbol">
                                {asset.name || asset.asset_symbol}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="amount">
                            {asset.amount.toFixed(6)}
                          </div>
                        </td>
                        <td>
                          <div className="price">
                            {formatPrice(currentPrice)}
                          </div>
                        </td>
                        <td>
                          <div className="value">{formatPrice(totalValue)}</div>
                        </td>
                        <td>
                          <button
                            className="btn btn-sm"
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
              <div className="pagination">
                <button
                  className="btn"
                  onClick={() => handlePageChange(effectiveCurrentPage - 1)}
                  disabled={effectiveCurrentPage === 1}
                >
                  {t("previous")}
                </button>
                <span className="page-info">
                  {t("page")} {effectiveCurrentPage} {t("of")} {totalPages}
                </span>
                <button
                  className="btn"
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
