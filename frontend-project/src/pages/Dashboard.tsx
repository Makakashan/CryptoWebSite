import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { fetchAssets } from "../store/slices/assetsSlice";
import { fetchPortfolio } from "../store/slices/portfolioSlice";

const Dashboard = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const { assets, isLoading: assetsLoading } = useAppSelector(
    (state) => state.assets,
  );
  const { portfolio, isLoading: portfolioLoading } = useAppSelector(
    (state) => state.portfolio,
  );

  useEffect(() => {
    // Fetch top assets (public data)
    if (assets.length === 0) {
      dispatch(fetchAssets({ limit: 5, sortBy: "price", sortOrder: "desc" }));
    }

    // Fetch portfolio if authenticated
    if (isAuthenticated && !portfolio) {
      dispatch(fetchPortfolio());
    }
  }, [dispatch, isAuthenticated, assets.length, portfolio]);

  const isLoading = assetsLoading || portfolioLoading;
  const topAssets = assets.slice(0, 5);

  // Calculate stats
  const totalBalance = portfolio?.balance || 0;
  const portfolioValue =
    portfolio?.assets.reduce((sum, asset) => sum + (asset.value || 0), 0) || 0;
  const totalAssets = totalBalance + portfolioValue;

  if (isLoading && assets.length === 0) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* Login prompt for non-authenticated users */}
      {!isAuthenticated && (
        <div className="dashboard-section" style={{ marginBottom: "24px" }}>
          <div className="info-banner">
            <h3>Welcome to MakakaTrade</h3>
            <p>Login to view your portfolio and start trading</p>
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

      {/* Portfolio Stats (authenticated users only) */}
      {isAuthenticated && portfolio && (
        <div className="dashboard-grid">
          <div className="dashboard-card">
            <h3>Total Balance</h3>
            <div className="big-number">${totalAssets.toFixed(2)}</div>
            <div className="text-muted">Cash + Holdings</div>
          </div>

          <div className="dashboard-card">
            <h3>Cash Balance</h3>
            <div className="big-number">${totalBalance.toFixed(2)}</div>
            <div className="text-muted">Available</div>
          </div>

          <div className="dashboard-card">
            <h3>Portfolio Value</h3>
            <div className="big-number">${portfolioValue.toFixed(2)}</div>
            <div className="text-muted">{portfolio.assets.length} assets</div>
          </div>

          <div className="dashboard-card">
            <h3>Total Assets</h3>
            <div className="big-number">{portfolio.assets.length}</div>
            <div className="text-muted">In portfolio</div>
          </div>
        </div>
      )}

      {/* Top Cryptocurrencies */}
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
                  onClick={() => navigate("/markets")}
                  role="button"
                  tabIndex={0}
                >
                  <div className="coin-info">
                    <img
                      src={asset.image_url || defaultIcon}
                      alt={shortName}
                      onError={(e) => {
                        e.currentTarget.src = defaultIcon;
                      }}
                    />
                    <span>{shortName}</span>
                  </div>
                  <span className="coin-price">${price.toFixed(2)}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-muted">No assets available</div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="dashboard-section">
        <h2>Quick Actions</h2>
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
