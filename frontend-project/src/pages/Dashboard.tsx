import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AxiosError } from "axios";
import axios from "../api/axiosConfig";
import type { UserStats, PortfolioResponse, Asset } from "../types";

const Dashboard = () => {
  const navigate = useNavigate();
  const [portfolio, setPortfolio] = useState<PortfolioResponse | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [topAssets, setTopAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const assetsRes = await axios.get(
          "/assets?limit=5&sortBy=price&sortOrder=desc",
        );
        setTopAssets(assetsRes.data.data || []);

        try {
          const portfolioRes = await axios.get("/portfolio");
          setPortfolio(portfolioRes.data);

          const statsRes = await axios.get("/stats/user");
          setStats(statsRes.data);
        } catch (authError) {
          if (
            authError instanceof AxiosError &&
            authError.response?.status === 401
          ) {
            console.log("Not authenticated - showing public data only");
          } else {
            throw authError;
          }
        }

        setLoading(false);
      } catch (error) {
        if (error instanceof AxiosError) {
          console.error("Error fetching dashboard data:", error.response?.data);
          setError("Failed to load data");
        } else {
          console.error("Unexpected error:", error);
          setError("An unexpected error occurred");
        }
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <h2>Loading dashboard...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <h2 className="text-red">{error}</h2>
        <button
          className="btn btn-primary"
          onClick={() => navigate("/markets")}
        >
          Go to Markets
        </button>
      </div>
    );
  }

  const totalAssets =
    (portfolio?.balance || 0) + (stats?.portfolio.totalValue || 0);
  const profitLoss = stats?.performance.profitLoss || 0;
  const profitLossPercent = stats?.performance.profitPercentage || 0;

  return (
    <div className="dashboard">
      {!portfolio && (
        <div className="dashboard-section" style={{ marginBottom: "24px" }}>
          <div
            style={{
              background: "rgba(56, 97, 251, 0.1)",
              padding: "20px",
              borderRadius: "12px",
              border: "1px solid rgba(56, 97, 251, 0.3)",
            }}
          >
            <h3>Login to see your portfolio</h3>
            <p style={{ color: "#848e9c", marginTop: "8px" }}>
              You need to be logged in to view personal statistics
            </p>
            <button
              className="btn btn-primary"
              style={{ marginTop: "16px" }}
              onClick={() => navigate("/login")}
            >
              Login
            </button>
          </div>
        </div>
      )}

      {portfolio && stats && (
        <div className="dashboard-grid">
          <div className="dashboard-card">
            <h3>Total Balance</h3>
            <div className="big-number">${totalAssets.toFixed(2)}</div>
            <div className={profitLoss >= 0 ? "text-green" : "text-red"}>
              {profitLoss >= 0 ? "+" : ""}
              {profitLossPercent.toFixed(2)}% (All time)
            </div>
          </div>

          <div className="dashboard-card">
            <h3>Portfolio Value</h3>
            <div className="big-number">
              ${stats?.portfolio.totalValue.toFixed(2) || "0.00"}
            </div>
            <div className="text-muted">
              {stats?.portfolio.assetsCount || 0} assets
            </div>
          </div>

          <div className="dashboard-card">
            <h3>Profit/Loss</h3>
            <div
              className={`big-number ${profitLoss >= 0 ? "text-green" : "text-red"}`}
            >
              {profitLoss >= 0 ? "+" : ""}${profitLoss.toFixed(2)}
            </div>
            <div className="text-muted">
              {profitLoss >= 0 ? "+" : ""}
              {profitLossPercent.toFixed(2)}%
            </div>
          </div>

          <div className="dashboard-card">
            <h3>🛒 Total Orders</h3>
            <div className="big-number">{stats?.orders.total || 0}</div>
            <div className="text-muted">
              {stats?.orders.buyOrders || 0} buy /{" "}
              {stats?.orders.sellOrders || 0} sell
            </div>
          </div>
        </div>
      )}

      <div className="dashboard-section">
        <h2>Top Cryptocurrencies by Price</h2>
        {topAssets.length > 0 ? (
          <div className="top-coins">
            {topAssets.map((asset) => {
              const defaultIcon = `https://ui-avatars.com/api/?name=${asset.symbol}&background=random&size=32`;
              const shortName = asset.symbol.replace("USDT", "");
              const price = asset.price || asset.current_price || 0;

              return (
                <div
                  key={asset.symbol}
                  className="coin-row"
                  onClick={() => navigate(`/markets/${asset.symbol}`)}
                  style={{ cursor: "pointer" }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                    }}
                  >
                    <img
                      src={asset.image_url || defaultIcon}
                      alt={shortName}
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "50%",
                      }}
                    />
                    <span>{shortName}</span>
                  </div>
                  <span className="text-green">${price.toFixed(2)}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-muted">No assets available</div>
        )}
      </div>

      <div className="dashboard-section">
        <h2>⚡ Quick Actions</h2>
        <div className="quick-actions">
          <button
            className="btn btn-primary"
            onClick={() => navigate("/markets")}
          >
            View Markets
          </button>
          <button className="btn" onClick={() => navigate("/portfolio")}>
            My Portfolio
          </button>
          <button className="btn" onClick={() => navigate("/orders")}>
            Order History
          </button>
          <button className="btn" onClick={() => navigate("/stats")}>
            Statistics
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
