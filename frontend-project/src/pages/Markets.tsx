import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { fetchAssets } from "../store/slices/assetsSlice";
import AssetCard from "../components/AssetCard";

const Markets = () => {
  const dispatch = useAppDispatch();
  const { assets, isLoading, error, filters } = useAppSelector(
    (state) => state.assets,
  );

  useEffect(() => {
    // Fetch assets only if we don't have any cached or filters changed
    if (assets.length === 0) {
      dispatch(fetchAssets(filters));
    }
  }, [dispatch, filters, assets.length]);

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading markets...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <p className="text-red">{error}</p>
        <button
          className="btn btn-primary"
          onClick={() => dispatch(fetchAssets(filters))}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="markets-header">
        <h1>Markets</h1>
        <button
          className="btn btn-secondary"
          onClick={() => dispatch(fetchAssets(filters))}
          disabled={isLoading}
        >
          Refresh
        </button>
      </div>
      <div className="assets-grid">
        {assets.length === 0 ? (
          <p>No assets found</p>
        ) : (
          assets.map((asset) => <AssetCard key={asset.symbol} asset={asset} />)
        )}
      </div>
    </div>
  );
};

export default Markets;
