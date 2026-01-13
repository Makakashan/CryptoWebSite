import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { fetchOrders } from "../store/slices/ordersSlice";
import { fetchPortfolio } from "../store/slices/portfolioSlice";
import { fetchAssets } from "../store/slices/assetsSlice";
import { formatPrice } from "../utils/formatPrice";

const Statistics = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const { orders, isLoading: ordersLoading } = useAppSelector(
    (state) => state.orders,
  );
  const { portfolio, isLoading: portfolioLoading } = useAppSelector(
    (state) => state.portfolio,
  );
  const { assets } = useAppSelector((state) => state.assets);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    dispatch(fetchOrders());
    dispatch(fetchPortfolio());
    if (assets.length === 0) {
      dispatch(fetchAssets({ limit: 100 }));
    }
  }, [dispatch, isAuthenticated, navigate, assets.length]);

  // Calculate enriched portfolio assets
  const enrichedAssets = useMemo(() => {
    if (!portfolio) return [];
    return portfolio.assets.map((portfolioAsset) => {
      const assetData = assets.find(
        (a) => a.symbol === portfolioAsset.asset_symbol,
      );
      const currentPrice = assetData?.price || assetData?.current_price || 0;
      return {
        ...portfolioAsset,
        currentPrice,
        value: portfolioAsset.amount * currentPrice,
        name: portfolioAsset.asset_symbol.replace("USDT", ""),
      };
    });
  }, [portfolio, assets]);

  // Asset Distribution for Pie Chart
  const assetDistributionData = enrichedAssets
    .filter((asset) => asset.value > 0)
    .map((asset) => ({
      name: asset.name,
      value: asset.value,
    }));

  // Orders by Type
  const buyOrders = orders.filter((order) => order.order_type === "BUY");
  const sellOrders = orders.filter((order) => order.order_type === "SELL");

  const ordersByTypeData = [
    { name: t("buy"), value: buyOrders.length, fill: "#0ecb81" },
    { name: t("sell"), value: sellOrders.length, fill: "#f6465d" },
  ];

  // Orders over time (last 10 orders)
  const ordersOverTime = orders
    .slice(-10)
    .reverse()
    .map((order) => {
      const date = new Date(order.timestamp);
      const formattedDate = `${date.getDate()}/${date.getMonth() + 1}`;
      const value = order.amount * order.price_at_transaction;
      return {
        date: formattedDate,
        value: order.order_type === "BUY" ? -value : value,
        type: order.order_type,
      };
    });

  // Cumulative profit/loss
  const profitOverTime = ordersOverTime.reduce(
    (acc: { date: string; profit: number }[], order, index) => {
      const cumulativeProfit =
        index === 0 ? order.value : acc[index - 1].profit + order.value;
      acc.push({
        date: order.date,
        profit: cumulativeProfit,
      });
      return acc;
    },
    [],
  );

  // Statistics calculations
  const totalBuyAmount = buyOrders.reduce(
    (sum, order) => sum + order.amount * order.price_at_transaction,
    0,
  );
  const totalSellAmount = sellOrders.reduce(
    (sum, order) => sum + order.amount * order.price_at_transaction,
    0,
  );
  const currentHoldingsValue = enrichedAssets.reduce(
    (sum, asset) => sum + asset.value,
    0,
  );
  const netProfit = currentHoldingsValue - totalBuyAmount + totalSellAmount;

  const COLORS = ["#3861fb", "#0ecb81", "#f6465d", "#ffa500", "#9c27b0"];

  if (ordersLoading || portfolioLoading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>{t("loading")}</p>
      </div>
    );
  }

  return (
    <div className="statistics-page">
      <div className="statistics-header">
        <h1>{t("tradingStatistics")}</h1>
      </div>

      {/* Summary Stats */}
      <div className="statistics-summary">
        <div className="stat-card">
          <h3>{t("totalOrders")}</h3>
          <div className="stat-value">{orders.length}</div>
          <p>{t("allTime")}</p>
        </div>

        <div className="stat-card">
          <h3>{t("netProfit")}</h3>
          <div
            className="stat-value"
            style={{ color: netProfit >= 0 ? "#0ecb81" : "#f6465d" }}
          >
            {formatPrice(netProfit)}
          </div>
          <p>{t("totalGainLoss")}</p>
        </div>

        <div className="stat-card">
          <h3>{t("holdingsValue")}</h3>
          <div className="stat-value">{formatPrice(currentHoldingsValue)}</div>
          <p>
            {enrichedAssets.length} {t("assets")}
          </p>
        </div>

        <div className="stat-card">
          <h3>{t("totalValue")}</h3>
          <div className="stat-value">
            {formatPrice((portfolio?.balance || 0) + currentHoldingsValue)}
          </div>
          <p>{t("cashAndHoldings")}</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="charts-grid">
        {/* Asset Distribution Pie Chart */}
        {assetDistributionData.length > 0 && (
          <div className="chart-card">
            <h2>{t("assetDistribution")}</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={assetDistributionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name}: ${((percent || 0) * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {assetDistributionData.map((_entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => formatPrice(value as number)}
                  contentStyle={{
                    backgroundColor: "#1a1d23",
                    border: "1px solid #2b3139",
                    borderRadius: "8px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Orders by Type Bar Chart */}
        {orders.length > 0 && (
          <div className="chart-card">
            <h2>{t("ordersByType")}</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={ordersByTypeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2b3139" />
                <XAxis dataKey="name" stroke="#848e9c" />
                <YAxis stroke="#848e9c" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1a1d23",
                    border: "1px solid #2b3139",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="value" fill="#3861fb">
                  {ordersByTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Profit/Loss Over Time Line Chart */}
        {profitOverTime.length > 0 && (
          <div className="chart-card full-width">
            <h2>{t("profitLossOverTime")}</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={profitOverTime}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2b3139" />
                <XAxis dataKey="date" stroke="#848e9c" />
                <YAxis stroke="#848e9c" />
                <Tooltip
                  formatter={(value) => formatPrice(value as number)}
                  contentStyle={{
                    backgroundColor: "#1a1d23",
                    border: "1px solid #2b3139",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="profit"
                  stroke="#3861fb"
                  strokeWidth={2}
                  dot={{ fill: "#3861fb" }}
                  name={t("netProfit")}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Top Performers Table */}
      {enrichedAssets.length > 0 && (
        <div className="top-performers">
          <h2>{t("topPerformers")}</h2>
          <div className="performers-list">
            {enrichedAssets
              .filter((asset) => asset.value > 0)
              .sort((a, b) => b.value - a.value)
              .slice(0, 5)
              .map((asset) => (
                <div key={asset.asset_symbol} className="performer-item">
                  <div className="performer-name">{asset.name}</div>
                  <div className="performer-amount">
                    {asset.amount.toFixed(6)}
                  </div>
                  <div className="performer-value">
                    {formatPrice(asset.value)}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {orders.length === 0 && enrichedAssets.length === 0 && (
        <div className="empty-state">
          <p>{t("noOrdersYet")}</p>
          <button
            className="btn btn-primary"
            onClick={() => navigate("/markets")}
          >
            {t("startTrading")}
          </button>
        </div>
      )}
    </div>
  );
};

export default Statistics;
