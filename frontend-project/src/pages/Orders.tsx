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
      <div className="flex flex-col items-center justify-center p-14 text-center">
        <div className="w-10 h-10 border-4 border-bg-hover border-t-blue rounded-full animate-spin mb-4"></div>
        <p className="text-text-secondary">Loading orders...</p>
      </div>
    );
  }

  if (error && orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-14 text-center gap-4">
        <p className="text-red text-base">{error}</p>
        <button className="btn-primary" onClick={() => dispatch(fetchOrders())}>
          Retry
        </button>
      </div>
    );
  }

  const currentPage = pagination?.page || 1;
  const totalPages = pagination?.totalPages || 1;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-text-primary text-2xl font-bold m-0">
          {t("orderHistory")}
        </h1>
        <button className="btn-primary" onClick={() => navigate("/markets")}>
          {t("placeNewOrder")}
        </button>
      </div>

      <div className="card-padded mb-6">
        <h3 className="m-0 mb-4 text-lg text-text-primary">{t("filter")}</h3>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4 mb-4">
          <div className="flex flex-col gap-2">
            <label className="filter-label">{t("asset")}</label>
            <select
              value={assetSymbol}
              onChange={(e) => setAssetSymbol(e.target.value)}
              className="select"
            >
              <option value="">{t("allAssets")}</option>
              {uniqueAssetSymbols.map((symbol) => (
                <option key={symbol} value={symbol}>
                  {symbol.replace("USDT", "")}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="filter-label">{t("orderType")}</label>
            <select
              value={orderType}
              onChange={(e) =>
                setOrderType(e.target.value as "" | "BUY" | "SELL")
              }
              className="select"
            >
              <option value="">{t("allAssets")}</option>
              <option value="BUY">{t("buy")}</option>
              <option value="SELL">{t("sell")}</option>
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
              {t("dateFrom")}
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="input"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
              {t("dateTo")}
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="input"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="filter-label">{t("sortBy")}</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="select"
            >
              <option value="timestamp">{t("date")}</option>
              <option value="amount">{t("amount")}</option>
              <option value="asset_symbol">{t("asset")}</option>
              <option value="price_at_transaction">{t("price")}</option>
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="filter-label">{t("sortOrder")}</label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}
              className="select"
            >
              <option value="desc">{t("descending")}</option>
              <option value="asc">{t("ascending")}</option>
            </select>
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <button className="btn-primary" onClick={handleApplyFilters}>
            {t("apply")}
          </button>
          <button
            className="btn-secondary hover:-translate-y-px"
            onClick={handleResetFilters}
          >
            {t("reset")}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-4 mb-8">
        <div className="bg-bg-card rounded-xl p-6 border border-bg-hover text-center">
          <h3 className="text-text-secondary text-sm font-medium mb-2 uppercase tracking-wider">
            {t("totalOrders")}
          </h3>
          <div className="text-[32px] font-bold text-text-primary my-4">
            {pagination?.total || orders.length}
          </div>
          <p className="text-text-secondary text-xs m-0">{t("allTime")}</p>
        </div>

        <div className="bg-bg-card rounded-xl p-6 border border-bg-hover text-center">
          <h3 className="text-text-secondary text-sm font-medium mb-2 uppercase tracking-wider">
            {t("buyOrders")}
          </h3>
          <div className="text-[32px] font-bold text-text-primary my-4">
            {buyOrders.length}
          </div>
          <p className="text-text-secondary text-xs m-0">
            {formatPrice(totalBuyAmount)} {t("spent")}
          </p>
        </div>

        <div className="bg-bg-card rounded-xl p-6 border border-bg-hover text-center">
          <h3 className="text-text-secondary text-sm font-medium mb-2 uppercase tracking-wider">
            {t("sellOrders")}
          </h3>
          <div className="text-[32px] font-bold text-text-primary my-4">
            {sellOrders.length}
          </div>
          <p className="text-text-secondary text-xs m-0">
            {formatPrice(totalSellAmount)} {t("earned")}
          </p>
        </div>

        <div className="bg-bg-card rounded-xl p-6 border border-bg-hover text-center">
          <h3 className="text-text-secondary text-sm font-medium mb-2 uppercase tracking-wider">
            {t("netProfit")}
          </h3>
          <div
            className="text-[32px] font-bold my-4"
            style={{ color: netProfit >= 0 ? "#0ecb81" : "#f6465d" }}
          >
            {formatPrice(netProfit)}
          </div>
          <p className="text-text-secondary text-xs m-0">
            {t("totalGainLoss")}
          </p>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-xl mb-4 text-text-primary">{t("recentOrders")}</h2>

        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-14 text-center">
            <p className="text-text-secondary mb-4">{t("noOrdersYet")}</p>
            <button
              className="btn-primary"
              onClick={() => navigate("/markets")}
            >
              {t("startTrading")}
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-bg-hover">
                  <th className="p-4 text-left text-text-secondary text-xs font-semibold uppercase tracking-wider">
                    {t("date")}
                  </th>
                  <th className="p-4 text-left text-text-secondary text-xs font-semibold uppercase tracking-wider">
                    {t("asset")}
                  </th>
                  <th className="p-4 text-left text-text-secondary text-xs font-semibold uppercase tracking-wider">
                    {t("type")}
                  </th>
                  <th className="p-4 text-left text-text-secondary text-xs font-semibold uppercase tracking-wider">
                    {t("amount")}
                  </th>
                  <th className="p-4 text-left text-text-secondary text-xs font-semibold uppercase tracking-wider">
                    {t("price")}
                  </th>
                  <th className="p-4 text-left text-text-secondary text-xs font-semibold uppercase tracking-wider">
                    {t("total")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  const shortName = order.asset_symbol.replace("USDT", "");
                  const total = order.amount * order.price_at_transaction;
                  const date = new Date(order.timestamp).toLocaleString();

                  return (
                    <tr
                      key={order.id}
                      className="border-b border-bg-hover transition-colors duration-200 hover:bg-bg-hover"
                    >
                      <td className="p-4 text-text-primary text-sm">
                        <div className="text-xs">{date}</div>
                      </td>
                      <td className="p-4 text-text-primary text-sm">
                        <div className="font-semibold">{shortName}</div>
                      </td>
                      <td className="p-4 text-text-primary text-sm">
                        <span
                          className={`inline-block px-3 py-1 rounded-xl text-xs font-semibold ${order.order_type === "BUY" ? "bg-green/20 text-green" : "bg-red/20 text-red"}`}
                        >
                          {order.order_type}
                        </span>
                      </td>
                      <td className="p-4 text-text-primary text-sm">
                        <div className="font-medium">
                          {order.amount.toFixed(6)}
                        </div>
                      </td>
                      <td className="p-4 text-text-primary text-sm">
                        <div className="font-medium">
                          {formatPrice(order.price_at_transaction)}
                        </div>
                      </td>
                      <td className="p-4 text-text-primary text-sm">
                        <div className="font-semibold">
                          {formatPrice(total)}
                        </div>
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
        <div className="flex justify-center items-center gap-4 mt-8">
          <button
            className="btn-secondary btn-small min-w-120"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            {t("previous")}
          </button>
          <span className="text-text-secondary text-sm">
            {t("page")} {currentPage} {t("of")} {totalPages}
          </span>
          <button
            className="btn-secondary btn-small min-w-120"
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
