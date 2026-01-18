import { useNavigate } from "react-router-dom";
import type { Asset } from "../store/types";
import { formatPrice } from "../utils/formatPrice";

interface AssetCardProps {
  asset: Asset;
}

const AssetCard = ({ asset }: AssetCardProps) => {
  const navigate = useNavigate();

  const shortName = asset.symbol.replace("USDT", "");
  const defaultIcon = `https://ui-avatars.com/api/?name=${shortName}&background=random&size=40`;
  const price = asset.price || asset.current_price || 0;

  const handleClick = () => {
    navigate(`/markets/${asset.symbol}`);
  };

  return (
    <div className="asset-card" onClick={handleClick}>
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
      <div className="asset-price">{formatPrice(price)}</div>
    </div>
  );
};

export default AssetCard;
