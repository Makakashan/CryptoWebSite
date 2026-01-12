import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { fetchAssets } from "../store/slices/assetsSlice";
import { fetchPortfolio } from "../store/slices/portfolioSlice";
import { formatPrice } from "../utils/formatPrice";

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
    if (assets.length === 0) {
      dispatch(fetchAssets({ limit: 5, sortBy: "price", sortOrder: "desc" }));
    }

    if (isAuthenticated && !portfolio) {
      dispatch(fetchPortfolio());
    }
  }, [dispatch, isAuthenticated, assets.length, portfolio]);

  const isLoading = assetsLoading || portfolioLoading;
  const topAssets = assets.slice(0, 5);

  const totalBalance = portfolio?.balance || 0;
  const portfolioValue =
    portfolio?.assets.reduce((sum, asset) => sum + (asset.value || 0), 0) || 0;
  const totalAssets = totalBalance + portfolioValue;

  if (isLoading && assets.length === 0) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {!isAuthenticated && (
        <div className="info-banner">
          <h3>Welcome to MakakaTrade</h3>
          <p>Login to view your portfolio and start trading</p>
          <button
            className="btn btn-primary"
            onClick={() => navigate("/login")}
          >
            Login
          </button>
        </div>
      )}

      {isAuthenticated && portfolio && (
        <div className="dashboard-grid">
          <div className="dashboard-card">
            <h3>Total Balance</h3>
            <div className="big-number">{formatPrice(totalAssets)}</div>
            <p>Cash + Holdings</p>
          </div>

          <div className="dashboard-card">
            <h3>Cash Balance</h3>
            <div className="big-number">{formatPrice(totalBalance)}</div>
            <p>Available</p>
          </div>

          <div className="dashboard-card">
            <h3>Portfolio Value</h3>
            <div className="big-number">{formatPrice(portfolioValue)}</div>
            <p>{portfolio.assets.length} assets</p>
          </div>

          <div className="dashboard-card">
            <h3>Total Assets</h3>
            <div className="big-number">{portfolio.assets.length}</div>
            <p>In portfolio</p>
          </div>
        </div>
      )}

      <div className="dashboard-section">
        <h2>Top Cryptocurrencies</h2>
        {topAssets.length > 0 ? (
          <div className="top-coins">
            {topAssets.map((asset) => {
              const shortName = asset.symbol.replace("USDT", "");
              const defaultIcon = `https://ui-avatars.com/api/?name=${shortName}&background=random&size=32`;
              const price = asset.price || asset.current_price || 0;

              return (
                <div
                  key={asset.symbol}
                  className="coin-row"
                  onClick={() => navigate("/markets")}
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
                  <span className="coin-price">{formatPrice(price)}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <p>No assets available</p>
        )}
      </div>

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
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
