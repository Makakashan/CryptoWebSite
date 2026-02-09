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
        <div className="loading-spinner mb-4"></div>
        <p className="text-text-secondary">{t("loading")}</p>
      </div>
    );
  }

  return (
    <div>
      {!isAuthenticated && (
        <div className="card-padded text-center mb-8">
          <h3 className="text-2xl mb-3 text-text-primary">
            {t("welcomeToMakakaTrade")}
          </h3>
          <p className="text-text-secondary mb-5">
            {t("loginToViewPortfolio")}
          </p>
          <button className="btn-primary" onClick={() => navigate("/login")}>
            {t("login")}
          </button>
        </div>
      )}

      {isAuthenticated && portfolio && (
        <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-4 mb-8">
          <div className="stat-card-hover">
            <h3 className="stat-title">{t("totalBalance")}</h3>
            <div className="stat-value">{formatPrice(totalAssets)}</div>
            <p className="stat-subtitle">{t("cashAndHoldings")}</p>
          </div>

          <div className="stat-card-hover">
            <h3 className="stat-title">{t("cashBalance")}</h3>
            <div className="stat-value">{formatPrice(totalBalance)}</div>
            <p className="stat-subtitle">{t("available")}</p>
          </div>

          <div className="stat-card-hover">
            <h3 className="stat-title">{t("portfolioValue")}</h3>
            <div className="stat-value">{formatPrice(portfolioValue)}</div>
            <p className="stat-subtitle">
              {portfolio.assets.length} {t("assets")}
            </p>
          </div>

          <div className="stat-card-hover">
            <h3 className="stat-title">{t("totalAssets")}</h3>
            <div className="stat-value">{portfolio.assets.length}</div>
            <p className="text-text-secondary text-xs m-0">
              {t("inPortfolio")}
            </p>
          </div>
        </div>
      )}

      <div className="mb-8">
        <h2 className="text-xl mb-4 text-text-primary">
          {t("topCryptocurrencies")}
        </h2>
        {topAssets.length > 0 ? (
          <div className="card p-0 overflow-hidden">
            {topAssets.map((asset, index) => {
              const shortName = asset.symbol.replace("USDT", "");
              const defaultIcon = `https://ui-avatars.com/api/?name=${shortName}&background=random&size=32`;
              const price = asset.price || asset.current_price || 0;

              return (
                <div
                  key={asset.symbol}
                  className={`flex justify-between items-center px-6 py-4 transition-colors duration-200 cursor-pointer hover:bg-bg-hover ${
                    index !== topAssets.length - 1
                      ? "border-b border-bg-hover"
                      : ""
                  }`}
                  onClick={() => navigate("/markets")}
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={asset.image_url || defaultIcon}
                      alt={shortName}
                      className="w-8 h-8 rounded-full"
                      onError={(e) => {
                        e.currentTarget.src = defaultIcon;
                      }}
                    />
                    <span className="font-semibold text-text-primary">
                      {shortName}
                    </span>
                  </div>
                  <span className="font-semibold text-text-primary">
                    {formatPrice(price)}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-text-secondary">{t("noAssetsAvailable")}</p>
        )}
      </div>

      <div className="mb-8">
        <h2 className="text-xl mb-4 text-text-primary">{t("quickActions")}</h2>
        <div className="flex gap-4 flex-wrap">
          <button
            className="btn-primary flex-1 min-w-150"
            onClick={() => navigate("/markets")}
          >
            {t("viewMarkets")}
          </button>
          <button
            className="btn-secondary flex-1 min-w-150 hover:-translate-y-px"
            onClick={() => navigate("/portfolio")}
          >
            {t("myPortfolio")}
          </button>
          <button
            className="btn-secondary flex-1 min-w-150 hover:-translate-y-px"
            onClick={() => navigate("/orders")}
          >
            {t("orderHistory")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
