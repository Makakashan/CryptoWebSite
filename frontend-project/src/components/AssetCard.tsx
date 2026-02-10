import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { memo } from "react";
import type { AssetCardProps } from "../store/types/components.types";
import { formatPrice } from "../utils/formatPrice";
import Card from "./ui/card";
import MiniChart from "./MiniChart";
import { TrendingUp, TrendingDown } from "lucide-react";
import { useAppSelector } from "../store/hooks";

const AssetCard = memo(({ asset }: AssetCardProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const chartData = useAppSelector(
    (state) => state.assets.chartData[asset.symbol] || [],
  );

  const shortName = asset.symbol.replace("USDT", "");
  const defaultIcon = `https://ui-avatars.com/api/?name=${shortName}&background=random&size=48`;
  const price = asset.price || asset.current_price || 0;
  const priceChange = asset.price_change_24h || 0;
  const isPositive = priceChange >= 0;

  // Use actual price change to determine chart color
  const chartColor = isPositive ? "#10b981" : "#ef4444";

  const handleClick = () => {
    navigate(`/markets/${asset.symbol}`);
  };

  return (
    <Card
      className="cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:border-blue hover:shadow-[0_8px_24px_rgba(56,97,251,0.25)] overflow-hidden p-5"
      onClick={handleClick}
    >
      <div className="flex items-start justify-between gap-4 h-full">
        {/* Left side - Info */}
        <div className="flex flex-col justify-between min-w-0 flex-1">
          {/* Asset header */}
          <div className="flex items-center gap-3 mb-3">
            <img
              src={asset.image_url || defaultIcon}
              alt={shortName}
              className="w-10 h-10 rounded-full object-cover ring-2 ring-bg-hover shrink-0"
              onError={(e) => {
                e.currentTarget.src = defaultIcon;
              }}
            />
            <div className="min-w-0">
              <h3 className="text-base font-bold text-text-primary m-0 truncate">
                {shortName}
              </h3>
              <div className="text-xs text-text-secondary truncate">
                {asset.symbol}
              </div>
            </div>
          </div>

          {/* Price */}
          <div className="mb-2">
            <div className="text-xl font-bold text-text-primary mb-1">
              {formatPrice(price)}
            </div>

            {/* Price change badge */}
            {priceChange !== 0 && (
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-1">
                  <div
                    className={`flex items-center gap-1 px-2 py-0.5 rounded-md ${
                      isPositive
                        ? "bg-green/10 text-green"
                        : "bg-red/10 text-red"
                    }`}
                  >
                    {isPositive ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    <span className="text-xs font-semibold">
                      {isPositive ? "+" : ""}
                      {priceChange.toFixed(2)}%
                    </span>
                  </div>
                </div>
                <span className="text-[10px] text-text-secondary/70 ml-0.5">
                  {t("last24h")}
                </span>
              </div>
            )}
          </div>

          {/* Category badge */}
          {asset.category && (
            <div className="mt-auto">
              <span className="text-xs px-2 py-1 rounded-md bg-bg-hover text-text-secondary inline-block">
                {asset.category}
              </span>
            </div>
          )}
        </div>

        {/* Right side - Chart */}
        <div className="w-32 h-24 shrink-0">
          {chartData.length > 0 ? (
            <MiniChart data={chartData} color={chartColor} />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-bg-hover/30 rounded-lg">
              <div className="w-4 h-4 border-2 border-text-secondary/30 border-t-text-secondary rounded-full animate-spin"></div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
});

AssetCard.displayName = "AssetCard";

export default AssetCard;
