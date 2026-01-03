import { useNavigate } from "react-router-dom";
import type { Asset } from "../types";

const AssetCard = ({ asset }: { asset: Asset }) => {
  const navigate = useNavigate();

  const defaultIcon = `https://ui-avatars.com/api/?name=${asset.symbol}&background=random&size=40`;

  return (
    <div
      className="asset-card"
      onClick={() => navigate(`/markets/${asset.symbol}`)}
    >
      <div className="asset-header">
        <img src={asset.image_url || defaultIcon} alt={asset.name} />
        <div className="asset-info">
          <h3>{asset.symbol.replace("USDT", "")}</h3>
          <div className="symbol">{asset.symbol}</div>
        </div>
      </div>
      <div className="asset-price">${(asset.price || 0).toFixed(2)}</div>
      <div className="asset-change">
        {asset.price_change_24h?.toFixed(2) || "N/A"}
      </div>
    </div>
  );
};

export default AssetCard;
