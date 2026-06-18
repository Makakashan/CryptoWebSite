import { useCallback, useEffect, useState, useRef, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchAssets, setFilters, fetchChartData } from "@/store/slices/assetsSlice";
import type { AssetsFilters } from "@/store/types/assets.types";
import { useBinanceWebSocket } from "@/hooks/useBinanceWebSocket";
import { iconLoaderService } from "@/services/iconLoader";
import { MarketsHero } from "./markets/MarketsHero";
import { MarketsFilters } from "./markets/MarketsFilters";
import { MarketsGrid } from "./markets/MarketsGrid";
import { MarketsPagination } from "./markets/MarketsPagination";

const Markets = () => {
	const location = useLocation();
	const dispatch = useAppDispatch();
	const { assets, isLoading, error, filters, pagination, chartData } = useAppSelector(
		(state) => state.assets,
	);

	// Backend WebSocket for real-time price updates
	const symbols = useMemo(() => assets.map((asset) => asset.symbol), [assets]);
	useBinanceWebSocket({ symbols, enabled: assets.length > 0 });

	const [search, setSearch] = useState("");
	const [category, setCategory] = useState("");
	const [sortBy, setSortBy] = useState("price");
	const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
	const [showFilters, setShowFilters] = useState(false);
	const fetchInProgress = useRef(false);
	const chartRequestsInFlight = useRef<Set<string>>(new Set());

	const fetchChartBatch = useCallback(
		(symbolsToFetch: string[]) => {
			const batch = symbolsToFetch.filter(
				(symbol) => !chartRequestsInFlight.current.has(symbol),
			);
			if (batch.length === 0) return;
			batch.forEach((symbol) => chartRequestsInFlight.current.add(symbol));
			dispatch(fetchChartData(batch)).finally(() => {
				batch.forEach((symbol) => chartRequestsInFlight.current.delete(symbol));
			});
		},
		[dispatch],
	);

	// Initial fetch on mount — ensure limit is 12
	useEffect(() => {
		const shouldFetch = assets.length === 0 || (pagination?.limit ?? filters.limit) !== 12;
		if (shouldFetch) {
			const initialFilters = { ...filters, limit: 12, page: 1 };
			dispatch(setFilters(initialFilters));
			dispatch(fetchAssets(initialFilters));
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [location.key, filters.limit, pagination?.limit]);

	// Lazy-load missing chart data in batches of 4
	useEffect(() => {
		if (assets.length === 0) return;
		const BATCH_SIZE = 4;
		const symbolsNeedingData = assets
			.filter(
				(asset) =>
					(!chartData[asset.symbol] || chartData[asset.symbol].length === 0) &&
					!chartRequestsInFlight.current.has(asset.symbol),
			)
			.map((asset) => asset.symbol);
		if (symbolsNeedingData.length === 0) return;

		const timeoutIds: ReturnType<typeof setTimeout>[] = [];
		const loadBatch = (startIndex: number) => {
			if (startIndex >= symbolsNeedingData.length) return;
			const batch = symbolsNeedingData.slice(startIndex, startIndex + BATCH_SIZE);
			fetchChartBatch(batch);
			if (startIndex + BATCH_SIZE < symbolsNeedingData.length) {
				const timeoutId = setTimeout(() => loadBatch(startIndex + BATCH_SIZE), 500);
				timeoutIds.push(timeoutId);
			}
		};
		loadBatch(0);
		return () => timeoutIds.forEach((id) => clearTimeout(id));
	}, [assets, chartData, fetchChartBatch]);

	// Preload icons for assets missing image_url
	useEffect(() => {
		if (assets.length === 0) return;
		const assetsNeedingIcons = assets
			.filter((asset) => !asset.image_url)
			.map((asset) => asset.symbol);
		if (assetsNeedingIcons.length > 0) iconLoaderService.preloadIcons(assetsNeedingIcons);
	}, [assets]);

	// Periodic chart refresh (every 60s while page is visible)
	useEffect(() => {
		if (assets.length === 0) return;
		const timeoutIds: ReturnType<typeof setTimeout>[] = [];
		const intervalId = setInterval(() => {
			if (document.hidden || assets.length === 0) return;
			const syms = assets.map((asset) => asset.symbol);
			const BATCH_SIZE = 6;
			for (let i = 0; i < syms.length; i += BATCH_SIZE) {
				const batch = syms.slice(i, i + BATCH_SIZE);
				const timeoutId = setTimeout(() => fetchChartBatch(batch), (i / BATCH_SIZE) * 1000);
				timeoutIds.push(timeoutId);
			}
		}, 60000);
		return () => {
			clearInterval(intervalId);
			timeoutIds.forEach((id) => clearTimeout(id));
		};
	}, [fetchChartBatch, assets]);

	const handleApplyFilters = () => {
		if (fetchInProgress.current) return;
		fetchInProgress.current = true;
		const newFilters = {
			search: search || undefined,
			category: category || undefined,
			sortBy,
			sortOrder,
			page: 1,
			limit: filters.limit,
		};
		dispatch(setFilters(newFilters));
		dispatch(fetchAssets(newFilters)).finally(() => {
			fetchInProgress.current = false;
		});
		setShowFilters(false);
	};

	const handleReset = () => {
		if (fetchInProgress.current) return;
		fetchInProgress.current = true;
		setSearch("");
		setCategory("");
		setSortBy("price");
		setSortOrder("desc");
		const newFilters: AssetsFilters = {
			page: 1,
			limit: 12,
			sortBy: "price",
			sortOrder: "desc" as "asc" | "desc",
		};
		dispatch(setFilters(newFilters));
		dispatch(fetchAssets(newFilters)).finally(() => {
			fetchInProgress.current = false;
		});
	};

	const handlePageChange = (page: number) => {
		if (fetchInProgress.current) return;
		fetchInProgress.current = true;
		window.scrollTo({ top: 0, behavior: "smooth" });
		const newFilters = { ...filters, page };
		dispatch(setFilters(newFilters));
		dispatch(fetchAssets(newFilters)).finally(() => {
			fetchInProgress.current = false;
		});
	};

	const currentPage = pagination?.page || 1;
	const totalPages = pagination?.totalPages || 1;
	const hasActiveFilters =
		Boolean(search) || Boolean(category) || sortBy !== "price" || sortOrder !== "desc";

	return (
		<div className="glass-page-shell">
			<div className="glass-page-body">
				<MarketsHero />
				<MarketsFilters
					search={search}
					setSearch={setSearch}
					category={category}
					setCategory={setCategory}
					sortBy={sortBy}
					setSortBy={setSortBy}
					sortOrder={sortOrder}
					setSortOrder={setSortOrder}
					showFilters={showFilters}
					setShowFilters={setShowFilters}
					hasActiveFilters={hasActiveFilters}
					onApply={handleApplyFilters}
					onReset={handleReset}
				/>
				<MarketsGrid
					assets={assets}
					isLoading={isLoading}
					error={error}
					onReset={handleReset}
				/>
				<MarketsPagination
					currentPage={currentPage}
					totalPages={totalPages}
					onChange={handlePageChange}
				/>
			</div>
		</div>
	);
};

export default Markets;
