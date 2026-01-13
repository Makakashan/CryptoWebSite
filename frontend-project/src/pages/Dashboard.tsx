import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { fetchAssets } from "../store/slices/assetsSlice";
import { fetchPortfolio } from "../store/slices/portfolioSlice";
import { formatPrice } from "../utils/formatPrice";

const Dashboard = () => {
  const { t } = useTranslation();
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

  // Calculate portfolio holdings value with current prices
  const portfolioValue = useMemo(() => {
    if (!portfolio) return 0;
    return portfolio.assets.reduce((sum, portfolioAsset) => {
      const assetData = assets.find(
        (a) => a.symbol === portfolioAsset.asset_symbol,
      );
      const currentPrice = assetData?.price || assetData?.current_price || 0;
      return sum + portfolioAsset.amount * currentPrice;
    }, 0);
  }, [portfolio, assets]);

  const totalAssets = totalBalance + portfolioValue;

  if (isLoading && assets.length === 0) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>{t("loading")}</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {!isAuthenticated && (
        <div className="info-banner">
          <h3>{t("welcomeToMakakaTrade")}</h3>
          <p>{t("loginToViewPortfolio")}</p>
          <button
            className="btn btn-primary"
            onClick={() => navigate("/login")}
          >
            {t("login")}
          </button>
        </div>
      )}

      {isAuthenticated && portfolio && (
        <div className="dashboard-grid">
          <div className="dashboard-card">
            <h3>{t("totalBalance")}</h3>
            <div className="big-number">{formatPrice(totalAssets)}</div>
            <p>{t("cashAndHoldings")}</p>
          </div>

          <div className="dashboard-card">
            <h3>{t("cashBalance")}</h3>
            <div className="big-number">{formatPrice(totalBalance)}</div>
            <p>{t("available")}</p>
          </div>

          <div className="dashboard-card">
            <h3>{t("portfolioValue")}</h3>
            <div className="big-number">{formatPrice(portfolioValue)}</div>
            <p>
              {portfolio.assets.length} {t("assets")}
            </p>
          </div>

          <div className="dashboard-card">
            <h3>{t("totalAssets")}</h3>
            <div className="big-number">{portfolio.assets.length}</div>
            <p>{t("inPortfolio")}</p>
          </div>
        </div>
      )}

      <div className="dashboard-section">
        <h2>{t("topCryptocurrencies")}</h2>
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
          <p>{t("noAssetsAvailable")}</p>
        )}
      </div>

      <div className="dashboard-section">
        <h2>{t("quickActions")}</h2>
        <div className="quick-actions">
          <button
            className="btn btn-primary"
            onClick={() => navigate("/markets")}
          >
            {t("viewMarkets")}
          </button>
          <button className="btn" onClick={() => navigate("/portfolio")}>
            {t("myPortfolio")}
          </button>
          <button className="btn" onClick={() => navigate("/orders")}>
            {t("orderHistory")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
