import { useNavigate } from "react-router-dom";
import type { Asset } from "../types";

interface AssetCardProps {
  asset: Asset;
}

const AssetCard = ({ asset }: AssetCardProps) => {
  const navigate = useNavigate();

  const shortName = asset.symbol.replace("USDT", "");
  const defaultIcon = `https://ui-avatars.com/api/?name=${shortName}&background=random&size=40`;
  const price = asset.price || asset.current_price || 0;
  const priceChange = asset.price_change_24h;

  const handleClick = () => {
    navigate(`/markets/${asset.symbol}`);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <div
      className="asset-card"
      onClick={handleClick}
      onKeyPress={handleKeyPress}
      role="button"
      tabIndex={0}
      aria-label={`View details for ${shortName}`}
    >
      <div className="asset-header">
        <img
          src={asset.image_url || defaultIcon}
          alt={shortName}
          onError={(e) => {
            e.currentTarget.src = defaultIcon;
          }}
        />
        <div className="asset-info">
          <h3>{shortName}</h3>
          <div className="symbol">{asset.name || asset.symbol}</div>
        </div>
      </div>
      <div className="asset-price">${price.toFixed(2)}</div>
      <div
        className={`asset-change ${
          priceChange && priceChange > 0
            ? "text-green"
            : priceChange && priceChange < 0
              ? "text-red"
              : ""
        }`}
      >
        {priceChange !== undefined && priceChange !== null
          ? `${priceChange > 0 ? "+" : ""}${priceChange.toFixed(2)}%`
          : "—"}
      </div>
    </div>
  );
};

export default AssetCard;
