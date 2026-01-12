import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { fetchAssets, setFilters } from "../store/slices/assetsSlice";
import AssetCard from "../components/AssetCard";

const Markets = () => {
  const dispatch = useAppDispatch();
  const { assets, isLoading, error, filters, pagination } = useAppSelector(
    (state) => state.assets,
  );

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [sortBy, setSortBy] = useState("price");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const categories = [
    "Layer 1",
    "DeFi",
    "Smart Contract Platform",
    "Exchange Token",
    "Meme",
    "Gaming",
  ];

  useEffect(() => {
    dispatch(fetchAssets(filters));
  }, [dispatch, filters]);

  const handleApplyFilters = () => {
    dispatch(
      setFilters({
        search: search || undefined,
        category: category || undefined,
        sortBy,
        sortOrder,
        page: 1,
      }),
    );
  };

  const handleReset = () => {
    setSearch("");
    setCategory("");
    setSortBy("price");
    setSortOrder("desc");
    dispatch(
      setFilters({
        page: 1,
        limit: 12,
        sortBy: "price",
        sortOrder: "desc",
      }),
    );
  };

  const handlePageChange = (page: number) => {
    dispatch(setFilters({ ...filters, page }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (isLoading && assets.length === 0) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading markets...</p>
      </div>
    );
  }

  const currentPage = pagination?.page || 1;
  const totalPages = pagination?.totalPages || 1;

  return (
    <div className="markets-page">
      <div className="markets-header">
        <h1>Markets</h1>
        <button
          className="btn btn-secondary"
          onClick={() => dispatch(fetchAssets(filters))}
          disabled={isLoading}
        >
          {isLoading ? "Loading..." : "Refresh"}
        </button>
      </div>

      <div className="filters-card">
        <h3>Filters</h3>
        <div className="filters-grid">
          <div className="filter-group">
            <label>Search</label>
            <input
              type="text"
              placeholder="Search assets..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label>Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">All</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Sort By</label>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="price">Price</option>
              <option value="symbol">Symbol</option>
              <option value="name">Name</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Order</label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}
            >
              <option value="desc">High to Low</option>
              <option value="asc">Low to High</option>
            </select>
          </div>
        </div>

        <div className="filter-actions">
          <button className="btn btn-primary" onClick={handleApplyFilters}>
            Apply
          </button>
          <button className="btn" onClick={handleReset}>
            Reset
          </button>
        </div>
      </div>

      {error && (
        <div className="error-container">
          <p>{error}</p>
        </div>
      )}

      {!error && assets.length > 0 && (
        <div className="assets-grid">
          {assets.map((asset) => (
            <AssetCard key={asset.symbol} asset={asset} />
          ))}
        </div>
      )}

      {!error && !isLoading && assets.length === 0 && (
        <div className="empty-state">
          <p>No assets found</p>
        </div>
      )}

      {totalPages > 1 && (
        <div className="pagination">
          <button
            className="btn"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          <span className="page-info">
            Page {currentPage} of {totalPages}
          </span>
          <button
            className="btn"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default Markets;
