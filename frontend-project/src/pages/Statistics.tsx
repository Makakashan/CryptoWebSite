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
import type { RootState } from "../store";
import { fetchOrders } from "../store/slices/ordersSlice";
import { fetchPortfolio } from "../store/slices/portfolioSlice";
import { fetchAssets } from "../store/slices/assetsSlice";
import { formatPrice } from "../utils/formatPrice";
import type { Order } from "../store/types/orders.types";
import type { Asset } from "../store/types/assets.types";

const CHART_COLORS = ["#3861fb", "#0ecb81", "#f6465d", "#ffa500", "#9c27b0"];
const STARTING_BALANCE = 10000;

interface EnrichedAsset {
  asset_symbol: string;
  amount: number;
  currentPrice: number;
  value: number;
  name: string;
}

// Calculate holdings value at a given point
const calculateHoldingsValue = (
  ordersUpToNow: Order[],
  assets: Asset[],
): number => {
  const holdingsMap = new Map<string, number>();

  ordersUpToNow.forEach((order) => {
    const current = holdingsMap.get(order.asset_symbol) || 0;
    const newAmount =
      order.order_type === "BUY"
        ? current + order.amount
        : current - order.amount;
    holdingsMap.set(order.asset_symbol, newAmount);
  });

  let totalValue = 0;
  holdingsMap.forEach((amount, symbol) => {
    if (amount > 0) {
      const asset = assets.find((a) => a.symbol === symbol);
      const price = asset?.price || asset?.current_price || 0;
      totalValue += amount * price;
    }
  });

  return totalValue;
};

// Calculate profit/loss history from orders
const calculateProfitHistory = (orders: Order[], assets: Asset[]) => {
  const sortedOrders = [...orders].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );

  const last10Orders = sortedOrders.slice(-10);

  return last10Orders.map((order) => {
    const date = new Date(order.timestamp);
    const timeStr = `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
    const formattedDate = `${date.getDate()}/${date.getMonth() + 1} ${timeStr}`;

    const orderIndex = sortedOrders.findIndex((o) => o.id === order.id);
    const ordersUpToNow = sortedOrders.slice(0, orderIndex + 1);

    const totalSpent = ordersUpToNow
      .filter((o) => o.order_type === "BUY")
      .reduce((sum, o) => sum + o.amount * o.price_at_transaction, 0);

    const totalEarned = ordersUpToNow
      .filter((o) => o.order_type === "SELL")
      .reduce((sum, o) => sum + o.amount * o.price_at_transaction, 0);

    const holdingsValue = calculateHoldingsValue(ordersUpToNow, assets);
    const currentBalance = STARTING_BALANCE - totalSpent + totalEarned;
    const totalAccountValue = currentBalance + holdingsValue;
    const profit = totalAccountValue - STARTING_BALANCE;

    return { date: formattedDate, profit };
  });
};

const Statistics = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const { isAuthenticated } = useAppSelector((state: RootState) => state.auth);
  const { orders, isLoading: ordersLoading } = useAppSelector(
    (state: RootState) => state.orders,
  );
  const { portfolio, isLoading: portfolioLoading } = useAppSelector(
    (state: RootState) => state.portfolio,
  );
  const { assets } = useAppSelector((state: RootState) => state.assets);

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

  const enrichedAssets = useMemo<EnrichedAsset[]>(() => {
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

  const assetDistributionData = useMemo(() => {
    return enrichedAssets
      .filter((asset) => asset.value > 0)
      .map((asset) => ({
        name: asset.name,
        value: asset.value,
      }));
  }, [enrichedAssets]);

  const ordersByTypeData = useMemo(() => {
    const buyCount = orders.filter(
      (order) => order.order_type === "BUY",
    ).length;
    const sellCount = orders.filter(
      (order) => order.order_type === "SELL",
    ).length;

    return [
      { name: t("buy"), value: buyCount, fill: "#0ecb81" },
      { name: t("sell"), value: sellCount, fill: "#f6465d" },
    ];
  }, [orders, t]);

  const profitOverTime = useMemo(() => {
    return calculateProfitHistory(orders, assets);
  }, [orders, assets]);

  const currentHoldingsValue = useMemo(() => {
    return enrichedAssets.reduce((sum, asset) => sum + asset.value, 0);
  }, [enrichedAssets]);

  const totalAccountValue = useMemo(() => {
    return (portfolio?.balance || 0) + currentHoldingsValue;
  }, [portfolio, currentHoldingsValue]);

  if (ordersLoading || portfolioLoading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>{t("loading")}</p>
      </div>
    );
  }

  const hasNoData = orders.length === 0 && enrichedAssets.length === 0;

  return (
    <div className="statistics-page">
      <div className="statistics-header">
        <h1>{t("tradingStatistics")}</h1>
      </div>

      <div className="statistics-summary">
        <div className="stat-card">
          <h3>{t("totalOrders")}</h3>
          <div className="stat-value">{orders.length}</div>
          <p>{t("allTime")}</p>
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
          <div className="stat-value">{formatPrice(totalAccountValue)}</div>
          <p>{t("cashAndHoldings")}</p>
        </div>
      </div>

      {hasNoData ? (
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
        <>
          <div className="charts-grid">
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
                      dataKey="value"
                    >
                      {assetDistributionData.map((_entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={CHART_COLORS[index % CHART_COLORS.length]}
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
                    <Bar dataKey="value">
                      {ordersByTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

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
        </>
      )}
    </div>
  );
};

export default Statistics;
