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
    <div
      className="card p-6 cursor-pointer transition-all duration-300 border-transparent hover:-translate-y-1 hover:border-blue hover:shadow-[0_4px_20px_rgba(56,97,251,0.2)]"
      onClick={handleClick}
    >
      <div className="flex items-center gap-3 mb-4">
        <img
          src={asset.image_url || defaultIcon}
          alt={shortName}
          className="w-10 h-10 rounded-full object-cover"
          onError={(e) => {
            e.currentTarget.src = defaultIcon;
          }}
        />
        <div className="flex-1">
          <h3 className="text-base mb-1 text-text-primary">{shortName}</h3>
          <div className="text-xs text-text-secondary">
            {asset.name || asset.symbol}
          </div>
        </div>
      </div>
      <div className="text-2xl font-semibold text-text-primary">
        {formatPrice(price)}
      </div>
    </div>
  );
};

export default AssetCard;
