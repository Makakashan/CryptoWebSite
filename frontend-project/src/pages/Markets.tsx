import { useEffect, useState, useRef, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { fetchAssets, setFilters, fetchChartData } from "../store/slices/assetsSlice";
import type { AssetsFilters } from "../store/types/assets.types";
import { useBinanceWebSocket } from "../hooks/useBinanceWebSocket";
import AssetCard from "../components/AssetCard";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import Select from "@/components/ui/select";
import Card, { CardContent } from "@/components/ui/card";
import { Search, SlidersHorizontal, X, Plus } from "lucide-react";
import AssetCardSkeleton from "../components/skeletons/AssetCardSkeleton";
import { iconLoaderService } from "../services/iconLoader";

const Markets = () => {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const location = useLocation();
	const dispatch = useAppDispatch();
	const { assets, isLoading, error, filters, pagination, chartData } = useAppSelector(
		(state) => state.assets,
	);

	// Use backend WebSocket for real-time price updates
	const symbols = useMemo(() => assets.map((asset) => asset.symbol), [assets]);
	useBinanceWebSocket({ symbols, enabled: assets.length > 0 });

	const [search, setSearch] = useState("");
	const [category, setCategory] = useState("");
	const [sortBy, setSortBy] = useState("price");
	const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
	const [showFilters, setShowFilters] = useState(false);
	const fetchInProgress = useRef(false);

	const categories = [
		"Layer 1",
		"DeFi",
		"Smart Contract Platform",
		"Exchange Token",
		"Meme",
		"Gaming",
	];

	useEffect(() => {
		// Always fetch assets on mount to ensure we have the correct limit (12)
		const shouldFetch = assets.length === 0 || (pagination?.limit ?? filters.limit) !== 12;

		if (shouldFetch) {
			const initialFilters = {
				...filters,
				limit: 12,
				page: 1,
			};
			dispatch(setFilters(initialFilters));
			dispatch(fetchAssets(initialFilters));
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [location.key, filters.limit, pagination?.limit]);

	useEffect(() => {
		if (assets.length === 0) return;

		const BATCH_SIZE = 4;
		const symbolsNeedingData = assets
			.filter((asset) => !chartData[asset.symbol] || chartData[asset.symbol].length === 0)
			.map((asset) => asset.symbol);

		if (symbolsNeedingData.length === 0) return;

		const loadBatch = (startIndex: number) => {
			if (startIndex >= symbolsNeedingData.length) return;

			const batch = symbolsNeedingData.slice(startIndex, startIndex + BATCH_SIZE);
			dispatch(fetchChartData(batch));

			if (startIndex + BATCH_SIZE < symbolsNeedingData.length) {
				setTimeout(() => loadBatch(startIndex + BATCH_SIZE), 500);
			}
		};

		loadBatch(0);
	}, [assets, chartData, dispatch]);

	useEffect(() => {
		if (assets.length === 0) return;

		const assetsNeedingIcons = assets
			.filter((asset) => !asset.image_url)
			.map((asset) => asset.symbol);

		if (assetsNeedingIcons.length > 0) {
			iconLoaderService.preloadIcons(assetsNeedingIcons);
		}
	}, [assets]);

	useEffect(() => {
		if (assets.length === 0) return;

		const intervalId = setInterval(() => {
			if (!document.hidden && assets.length > 0) {
				const symbols = assets.map((asset) => asset.symbol);
				const BATCH_SIZE = 6;
				for (let i = 0; i < symbols.length; i += BATCH_SIZE) {
					const batch = symbols.slice(i, i + BATCH_SIZE);
					setTimeout(
						() => {
							dispatch(fetchChartData(batch));
						},
						(i / BATCH_SIZE) * 1000,
					);
				}
			}
		}, 60000);

		return () => {
			clearInterval(intervalId);
		};
	}, [dispatch, assets]);

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

	const showSkeletons = isLoading;

	const currentPage = pagination?.page || 1;
	const totalPages = pagination?.totalPages || 1;
	const hasActiveFilters = search || category || sortBy !== "price" || sortOrder !== "desc";

	return (
		<div className="glass-page-shell">
			<div className="glass-page-body">
				<div className="glass-hero-glass px-6 py-5">
					<div aria-hidden className="glass-panel-highlight" />
					<div className="glass-panel-inner flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
						<div className="max-w-2xl">
							<h1 className="text-3xl font-bold tracking-tight text-text-primary">
								{t("markets")}
							</h1>
							<p className="mt-1.5 max-w-xl text-sm text-text-secondary">
								Discover and track your favorite assets
							</p>
						</div>
						<Button
							onClick={() => navigate("/markets/add")}
							className="glass-cta-button gap-2 shrink-0 self-start lg:self-center"
						>
							<Plus className="w-4 h-4" />
							{t("addNewAsset")}
						</Button>
					</div>
				</div>

				<Card className="glass-filter-panel">
					<div aria-hidden className="glass-panel-highlight" />
					<CardContent className="glass-panel-inner p-4">
						<div className="glass-filter-grid">
							<div className="flex flex-col sm:flex-row gap-3">
								<div className="flex-1 relative">
									<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-secondary" />
									<Input
										type="text"
										placeholder={t("searchAssets")}
										value={search}
										onChange={(e) => setSearch(e.target.value)}
										onKeyPress={(e) => e.key === "Enter" && handleApplyFilters()}
										className="pl-10"
									/>
								</div>

								<div className="flex gap-2">
									<Button
										variant="outline"
										size="sm"
										onClick={() => setShowFilters(!showFilters)}
										className={`glass-muted-button gap-2 ${hasActiveFilters ? "border-white/20 text-white" : ""}`}
									>
										<SlidersHorizontal className="w-4 h-4" />
										{t("filters")}
										{hasActiveFilters && (
											<span className="ml-1 h-2 w-2 rounded-full bg-white/80" />
										)}
									</Button>
									<Button
										size="sm"
										className="glass-cta-button"
										onClick={handleApplyFilters}
									>
										{t("apply")}
									</Button>
									{hasActiveFilters && (
										<Button
											variant="ghost"
											size="sm"
											onClick={handleReset}
											className="glass-muted-button gap-1"
										>
											<X className="w-4 h-4" />
										</Button>
									)}
								</div>
							</div>

							{showFilters && (
								<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-3 border-t border-white/8 animate-in fade-in slide-in-from-top-2 duration-200">
									<div className="flex flex-col gap-1.5">
										<label className="text-xs font-medium text-text-secondary">
											{t("category")}
										</label>
										<Select
											value={category}
											onChange={(e) => setCategory(e.target.value)}
										>
											<option value="">{t("all")}</option>
											{categories.map((cat) => (
												<option key={cat} value={cat}>
													{cat}
												</option>
											))}
										</Select>
									</div>

									<div className="flex flex-col gap-1.5">
										<label className="text-xs font-medium text-text-secondary">
											{t("sortBy")}
										</label>
										<Select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
											<option value="price">{t("price")}</option>
											<option value="symbol">{t("symbol")}</option>
											<option value="name">{t("name")}</option>
										</Select>
									</div>

									<div className="flex flex-col gap-1.5">
										<label className="text-xs font-medium text-text-secondary">
											{t("order")}
										</label>
										<Select
											value={sortOrder}
											onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}
										>
											<option value="desc">{t("highToLow")}</option>
											<option value="asc">{t("lowToHigh")}</option>
										</Select>
									</div>
								</div>
							)}
						</div>
					</CardContent>
				</Card>

				{error && (
					<Card className="glass-empty-panel border-white/10">
						<div aria-hidden className="glass-panel-highlight" />
						<CardContent className="glass-panel-inner p-6 text-center">
							<p className="text-red text-base">{error}</p>
						</CardContent>
					</Card>
				)}

				{!error && (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
						{showSkeletons
							? Array.from({ length: 12 }).map((_, index) => (
									<AssetCardSkeleton key={`skeleton-${index}`} />
								))
							: assets.map((asset) => <AssetCard key={asset.symbol} asset={asset} />)}
					</div>
				)}

				{!error && !showSkeletons && assets.length === 0 && (
					<Card className="glass-empty-panel">
						<div aria-hidden className="glass-panel-highlight" />
						<CardContent className="glass-panel-inner p-14 text-center">
							<div className="flex flex-col items-center gap-3">
								<div className="glass-inline-metric w-16 h-16 rounded-full flex items-center justify-center">
									<Search className="w-8 h-8 text-text-secondary" />
								</div>
								<p className="text-text-secondary text-lg">{t("noAssetsAvailable")}</p>
								<Button
									variant="outline"
									size="sm"
									className="glass-muted-button"
									onClick={handleReset}
								>
									{t("resetFilters")}
								</Button>
							</div>
						</CardContent>
					</Card>
				)}

				{totalPages > 1 && (
					<div className="flex justify-center items-center gap-4 pt-6">
						<Button
							variant="outline"
							size="sm"
							className="glass-muted-button"
							onClick={() => handlePageChange(currentPage - 1)}
							disabled={currentPage === 1}
						>
							{t("previous")}
						</Button>
						<span className="text-text-secondary text-sm font-medium px-4">
							{t("page")} {currentPage} {t("of")} {totalPages}
						</span>
						<Button
							variant="outline"
							size="sm"
							className="glass-muted-button"
							onClick={() => handlePageChange(currentPage + 1)}
							disabled={currentPage === totalPages}
						>
							{t("next")}
						</Button>
					</div>
				)}
			</div>
		</div>
	);
};

export default Markets;
