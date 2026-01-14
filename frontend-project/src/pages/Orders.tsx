import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { fetchOrders, setOrdersFilters } from "../store/slices/ordersSlice";
import { fetchPortfolio } from "../store/slices/portfolioSlice";
import { formatPrice } from "../utils/formatPrice";

const Orders = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const { orders, isLoading, error, filters, pagination } = useAppSelector(
    (state) => state.orders,
  );
  const { portfolio } = useAppSelector((state) => state.portfolio);
  const { assets } = useAppSelector((state) => state.assets);

  const [assetSymbol, setAssetSymbol] = useState("");
  const [orderType, setOrderType] = useState<"" | "BUY" | "SELL">("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortBy, setSortBy] = useState("timestamp");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Calculate current holdings value (must be before early returns)
  const currentHoldingsValue = useMemo(() => {
    if (!portfolio) return 0;
    return portfolio.assets.reduce((sum, portfolioAsset) => {
      const assetData = assets.find(
        (a) => a.symbol === portfolioAsset.asset_symbol,
      );
      const currentPrice = assetData?.price || assetData?.current_price || 0;
      return sum + portfolioAsset.amount * currentPrice;
    }, 0);
  }, [portfolio, assets]);

  const buyOrders = orders.filter((order) => order.order_type === "BUY");
  const sellOrders = orders.filter((order) => order.order_type === "SELL");
  const totalBuyAmount = buyOrders.reduce(
    (sum, order) => sum + order.amount * order.price_at_transaction,
    0,
  );
  const totalSellAmount = sellOrders.reduce(
    (sum, order) => sum + order.amount * order.price_at_transaction,
    0,
  );

  // This shows the actual profit/loss from trading
  const netProfit = currentHoldingsValue - totalBuyAmount + totalSellAmount;

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    dispatch(fetchOrders(filters));
    dispatch(fetchPortfolio());
  }, [dispatch, isAuthenticated, navigate, filters]);

  const handleApplyFilters = () => {
    dispatch(
      setOrdersFilters({
        asset_symbol: assetSymbol || undefined,
        order_type: orderType || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        sortBy,
        sortOrder,
        page: 1,
      }),
    );
  };

  const handleResetFilters = () => {
    setAssetSymbol("");
    setOrderType("");
    setDateFrom("");
    setDateTo("");
    setSortBy("timestamp");
    setSortOrder("desc");
    dispatch(
      setOrdersFilters({
        page: 1,
        limit: 20,
        sortBy: "timestamp",
        sortOrder: "desc",
      }),
    );
  };

  const handlePageChange = (page: number) => {
    dispatch(setOrdersFilters({ ...filters, page }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const uniqueAssetSymbols = useMemo(() => {
    const symbols = new Set(orders.map((order) => order.asset_symbol));
    return Array.from(symbols).sort();
  }, [orders]);

  if (isLoading && orders.length === 0) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading orders...</p>
      </div>
    );
  }

  if (error && orders.length === 0) {
    return (
      <div className="error-container">
        <p>{error}</p>
        <button
          className="btn btn-primary"
          onClick={() => dispatch(fetchOrders())}
        >
          Retry
        </button>
      </div>
    );
  }

  const currentPage = pagination?.page || 1;
  const totalPages = pagination?.totalPages || 1;

  return (
    <div className="orders-page">
      <div className="orders-header">
        <h1>{t("orderHistory")}</h1>
        <button
          className="btn btn-primary"
          onClick={() => navigate("/markets")}
        >
          {t("placeNewOrder")}
        </button>
      </div>

      <div className="filters-card">
        <h3>{t("filter")}</h3>
        <div className="filters-grid">
          <div className="filter-group">
            <label>{t("asset")}</label>
            <select
              value={assetSymbol}
              onChange={(e) => setAssetSymbol(e.target.value)}
            >
              <option value="">{t("allAssets")}</option>
              {uniqueAssetSymbols.map((symbol) => (
                <option key={symbol} value={symbol}>
                  {symbol.replace("USDT", "")}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>{t("orderType")}</label>
            <select
              value={orderType}
              onChange={(e) =>
                setOrderType(e.target.value as "" | "BUY" | "SELL")
              }
            >
              <option value="">{t("allAssets")}</option>
              <option value="BUY">{t("buy")}</option>
              <option value="SELL">{t("sell")}</option>
            </select>
          </div>

          <div className="filter-group">
            <label>{t("dateFrom")}</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label>{t("dateTo")}</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label>{t("sortBy")}</label>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="timestamp">{t("date")}</option>
              <option value="amount">{t("amount")}</option>
              <option value="asset_symbol">{t("asset")}</option>
              <option value="price_at_transaction">{t("price")}</option>
            </select>
          </div>

          <div className="filter-group">
            <label>{t("sortOrder")}</label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}
            >
              <option value="desc">{t("descending")}</option>
              <option value="asc">{t("ascending")}</option>
            </select>
          </div>
        </div>

        <div className="filter-actions">
          <button className="btn btn-primary" onClick={handleApplyFilters}>
            {t("apply")}
          </button>
          <button className="btn" onClick={handleResetFilters}>
            {t("reset")}
          </button>
        </div>
      </div>

      <div className="orders-stats">
        <div className="stat-card">
          <h3>{t("totalOrders")}</h3>
          <div className="stat-value">{pagination?.total || orders.length}</div>
          <p>{t("allTime")}</p>
        </div>

        <div className="stat-card">
          <h3>{t("buyOrders")}</h3>
          <div className="stat-value">{buyOrders.length}</div>
          <p>
            {formatPrice(totalBuyAmount)} {t("spent")}
          </p>
        </div>

        <div className="stat-card">
          <h3>{t("sellOrders")}</h3>
          <div className="stat-value">{sellOrders.length}</div>
          <p>
            {formatPrice(totalSellAmount)} {t("earned")}
          </p>
        </div>

        <div className="stat-card">
          <h3>{t("netProfit")}</h3>
          <div
            className="stat-value"
            style={{ color: netProfit >= 0 ? "#10b981" : "#ef4444" }}
          >
            {formatPrice(netProfit)}
          </div>
          <p>{t("totalGainLoss")}</p>
        </div>
      </div>

      <div className="orders-section">
        <h2>{t("recentOrders")}</h2>

        {orders.length === 0 ? (
          <div className="empty-state">
            <p>{t("noOrdersYet")}</p>
            <button
              className="btn btn-primary"
              onClick={() => navigate("/markets")}
            >
              {t("startTrading")}
            </button>
          </div>
        ) : (
          <div className="orders-table-container">
            <table className="orders-table">
              <thead>
                <tr>
                  <th>{t("date")}</th>
                  <th>{t("asset")}</th>
                  <th>{t("type")}</th>
                  <th>{t("amount")}</th>
                  <th>{t("price")}</th>
                  <th>{t("total")}</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  const shortName = order.asset_symbol.replace("USDT", "");
                  const total = order.amount * order.price_at_transaction;
                  const date = new Date(order.timestamp).toLocaleString();

                  return (
                    <tr key={order.id}>
                      <td>
                        <div className="order-date">{date}</div>
                      </td>
                      <td>
                        <div className="asset-name">{shortName}</div>
                      </td>
                      <td>
                        <span
                          className={`order-type ${order.order_type === "BUY" ? "buy" : "sell"}`}
                        >
                          {order.order_type}
                        </span>
                      </td>
                      <td>
                        <div className="amount">{order.amount.toFixed(6)}</div>
                      </td>
                      <td>
                        <div className="price">
                          {formatPrice(order.price_at_transaction)}
                        </div>
                      </td>
                      <td>
                        <div className="total">{formatPrice(total)}</div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button
            className="btn"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            {t("previous")}
          </button>
          <span className="page-info">
            {t("page")} {currentPage} {t("of")} {totalPages}
          </span>
          <button
            className="btn"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            {t("next")}
          </button>
        </div>
      )}
    </div>
  );
};

export default Orders;
