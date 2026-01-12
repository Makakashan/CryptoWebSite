import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { fetchOrders } from "../store/slices/ordersSlice";
import { fetchPortfolio } from "../store/slices/portfolioSlice";
import { formatPrice } from "../utils/formatPrice";

const Orders = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const { orders, isLoading, error } = useAppSelector((state) => state.orders);
  const { portfolio } = useAppSelector((state) => state.portfolio);
  const { assets } = useAppSelector((state) => state.assets);

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

    dispatch(fetchOrders());
    dispatch(fetchPortfolio());
  }, [dispatch, isAuthenticated, navigate]);

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

  return (
    <div className="orders-page">
      <div className="orders-header">
        <h1>Order History</h1>
        <button
          className="btn btn-primary"
          onClick={() => navigate("/markets")}
        >
          Place New Order
        </button>
      </div>

      <div className="orders-stats">
        <div className="stat-card">
          <h3>Total Orders</h3>
          <div className="stat-value">{orders.length}</div>
          <p>All time</p>
        </div>

        <div className="stat-card">
          <h3>Buy Orders</h3>
          <div className="stat-value">{buyOrders.length}</div>
          <p>{formatPrice(totalBuyAmount)} spent</p>
        </div>

        <div className="stat-card">
          <h3>Sell Orders</h3>
          <div className="stat-value">{sellOrders.length}</div>
          <p>{formatPrice(totalSellAmount)} earned</p>
        </div>

        <div className="stat-card">
          <h3>Net Profit</h3>
          <div
            className="stat-value"
            style={{ color: netProfit >= 0 ? "#10b981" : "#ef4444" }}
          >
            {formatPrice(netProfit)}
          </div>
          <p>Total gain/loss</p>
        </div>
      </div>

      <div className="orders-section">
        <h2>Recent Orders</h2>

        {orders.length === 0 ? (
          <div className="empty-state">
            <p>No orders yet</p>
            <button
              className="btn btn-primary"
              onClick={() => navigate("/markets")}
            >
              Start Trading
            </button>
          </div>
        ) : (
          <div className="orders-table-container">
            <table className="orders-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Asset</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Price</th>
                  <th>Total</th>
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
    </div>
  );
};

export default Orders;
