import { useEffect, useState } from "react";
import { assetsApi } from "../api/assetsApi";
import { type Asset } from "../types/index";
import AssetCard from "../components/AssetCard";

const Markets = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAssets = async () => {
      try {
        setLoading(true);
        const response = await assetsApi.getAssets();
        setAssets(response.data);
        setLoading(false);
      } catch (err) {
        setError("Failed to fetch assets");
        console.error("Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAssets();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div className="text-red">{error}</div>;
  }

  return (
    <div>
      <h1 style={{ marginBottom: "20px" }}>Markets</h1>
      <div className="assets-grid">
        {assets.map((asset) => (
          <AssetCard key={asset.symbol} asset={asset} />
        ))}
      </div>
    </div>
  );
};

export default Markets;
