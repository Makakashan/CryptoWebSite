import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { fetchAssets, setFilters } from "../store/slices/assetsSlice";
import { useWebSocket } from "../hooks/useWebSocket";
import AssetCard from "../components/AssetCard";

const Markets = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  useWebSocket();
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
        <div className="loading-spinner mb-4"></div>
        <p className="text-text-secondary">Loading markets...</p>
      </div>
    );
  }

  const currentPage = pagination?.page || 1;
  const totalPages = pagination?.totalPages || 1;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-text-primary text-2xl font-bold m-0">
          {t("markets")}
        </h1>
        <div className="flex gap-4">
          <button
            className="btn-primary"
            onClick={() => navigate("/markets/add")}
          >
            {t("addNewAsset")}
          </button>
          <button
            className="btn-outline btn-small"
            onClick={() => dispatch(fetchAssets(filters))}
            disabled={isLoading}
          >
            {isLoading ? t("loading") : "Refresh"}
          </button>
        </div>
      </div>

      <div className="card-padded mb-6">
        <h3 className="m-0 mb-4 text-lg text-text-primary">Filters</h3>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4 mb-4">
          <div className="flex flex-col gap-2">
            <label className="filter-label">Search</label>
            <input
              type="text"
              placeholder="Search assets..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="filter-label">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="select"
            >
              <option value="">All</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="filter-label">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="select"
            >
              <option value="price">Price</option>
              <option value="symbol">Symbol</option>
              <option value="name">Name</option>
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="filter-label">Order</label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}
              className="select"
            >
              <option value="desc">High to Low</option>
              <option value="asc">Low to High</option>
            </select>
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <button className="btn-primary" onClick={handleApplyFilters}>
            Apply
          </button>
          <button
            className="btn-secondary hover:-translate-y-px"
            onClick={handleReset}
          >
            Reset
          </button>
        </div>
      </div>

      {error && (
        <div className="flex flex-col items-center justify-center p-14 text-center gap-4">
          <p className="text-red text-base">{error}</p>
        </div>
      )}

      {!error && assets.length > 0 && (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
          {assets.map((asset) => (
            <AssetCard key={asset.symbol} asset={asset} />
          ))}
        </div>
      )}

      {!error && !isLoading && assets.length === 0 && (
        <div className="flex flex-col items-center justify-center p-14 text-center">
          <p className="text-text-secondary">No assets found</p>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-8 pt-6">
          <button
            className="btn-secondary btn-small min-w-120"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          <span className="text-text-secondary text-sm font-medium px-4">
            Page {currentPage} of {totalPages}
          </span>
          <button
            className="btn-secondary btn-small min-w-120"
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
