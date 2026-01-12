import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { fetchPortfolio } from "../store/slices/portfolioSlice";
import { formatPrice } from "../utils/formatPrice";

const Portfolio = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const { portfolio, isLoading, error } = useAppSelector(
    (state) => state.portfolio,
  );
  const { assets } = useAppSelector((state) => state.assets);

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
        <h1>My Portfolio</h1>
        <button
          className="btn btn-primary"
          onClick={() => navigate("/markets")}
        >
          Trade Assets
        </button>
      </div>

      <div className="portfolio-stats">
        <div className="stat-card">
          <h3>Total Value</h3>
          <div className="stat-value">{formatPrice(totalValue)}</div>
          <p>Cash + Holdings</p>
        </div>

        <div className="stat-card">
          <h3>Available Balance</h3>
          <div className="stat-value">{formatPrice(totalBalance)}</div>
          <p>Ready to trade</p>
        </div>

        <div className="stat-card">
          <h3>Holdings Value</h3>
          <div className="stat-value">{formatPrice(portfolioValue)}</div>
          <p>{enrichedAssets.length} assets</p>
        </div>

        <div className="stat-card">
          <h3>Total Assets</h3>
          <div className="stat-value">{enrichedAssets.length}</div>
          <p>In portfolio</p>
        </div>
      </div>

      <div className="portfolio-section">
        <h2>Your Assets</h2>

        {enrichedAssets.length === 0 ? (
          <div className="empty-state">
            <p>You don't have any assets yet</p>
            <button
              className="btn btn-primary"
              onClick={() => navigate("/markets")}
            >
              Browse Markets
            </button>
          </div>
        ) : (
          <div className="portfolio-table-container">
            <table className="portfolio-table">
              <thead>
                <tr>
                  <th>Asset</th>
                  <th>Amount</th>
                  <th>Current Price</th>
                  <th>Total Value</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {enrichedAssets.map((asset) => {
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
                        <div className="amount">{asset.amount.toFixed(6)}</div>
                      </td>
                      <td>
                        <div className="price">{formatPrice(currentPrice)}</div>
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
                          Trade
                        </button>
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

export default Portfolio;
