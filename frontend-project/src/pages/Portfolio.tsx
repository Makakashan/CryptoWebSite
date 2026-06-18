import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Landmark, Layers, PieChart, Wallet } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchPortfolio } from "@/store/slices/portfolioSlice";
import { fetchOrders } from "@/store/slices/ordersSlice";
import { fetchAssets } from "@/store/slices/assetsSlice";
import { useBinanceWebSocket } from "@/hooks/useBinanceWebSocket";
import { binanceWebSocketService } from "@/services/binanceWebSocket";
import { formatPrice } from "@/utils/formatPrice";
import type { SortKey, SortOrder } from "@/store/types/portfolio.types";
import StatCardSkeleton from "@/components/skeletons/StatCardSkeleton";
import TableSkeleton from "@/components/skeletons/TableSkeleton";
import Button from "@/components/ui/button";
import { PortfolioHero } from "./portfolio/PortfolioHero";
import { PortfolioSummaryCard } from "./portfolio/PortfolioSummaryCard";
import { AllocationPreview } from "./portfolio/AllocationPreview";
import { PositionHealth } from "./portfolio/PositionHealth";
import { AssetsTable } from "./portfolio/AssetsTable";
import { usePnlBySymbol } from "./portfolio/usePnlBySymbol";

const ITEMS_PER_PAGE = 10;

const Portfolio = () => {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const dispatch = useAppDispatch();

	const { isAuthenticated } = useAppSelector((state) => state.auth);
	const { portfolio, isLoading, error } = useAppSelector((state) => state.portfolio);
	const { assets } = useAppSelector((state) => state.assets);
	const { orders } = useAppSelector((state) => state.orders);

	const [searchAsset, setSearchAsset] = useState("");
	const [sortBy, setSortBy] = useState<SortKey>("value");
	const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
	const [currentPage, setCurrentPage] = useState(1);

	useEffect(() => {
		if (!isAuthenticated) {
			navigate("/login");
			return;
		}
		dispatch(fetchPortfolio());
		dispatch(fetchAssets({ page: 1, limit: 200, sortBy: "price", sortOrder: "desc" }));
		if (orders.length === 0) {
			dispatch(fetchOrders({ page: 1, limit: 500, sortBy: "timestamp", sortOrder: "asc" }));
		}
	}, [dispatch, isAuthenticated, navigate, orders.length]);

	const wsSymbols = useMemo(() => assets.map((asset) => asset.symbol), [assets]);
	useBinanceWebSocket({ symbols: wsSymbols, enabled: wsSymbols.length > 0 });

	const pnlBySymbol = usePnlBySymbol(orders);

	const enrichedAssets = useMemo(() => {
		if (!portfolio) return [];
		return portfolio.assets.map((portfolioAsset) => {
			const assetData = assets.find((a) => a.symbol === portfolioAsset.asset_symbol);
			const symbol = portfolioAsset.asset_symbol;
			const livePrice = binanceWebSocketService.getPrice(symbol);
			const currentPrice = livePrice ?? assetData?.price ?? assetData?.current_price ?? 0;

			const value = portfolioAsset.amount * currentPrice;
			const pnl = pnlBySymbol[symbol];
			const avgCost = pnl && pnl.currentAmount > 0 ? pnl.invested / pnl.currentAmount : 0;
			const effectiveInvested = avgCost * portfolioAsset.amount;

			let netProfit = 0;
			let netProfitPercent = 0;
			if (pnl) {
				netProfit = value - effectiveInvested;
				const basis = Math.max(1e-9, effectiveInvested);
				netProfitPercent = (netProfit / basis) * 100;
			}

			return {
				...portfolioAsset,
				currentPrice,
				value,
				avgBuyPrice: avgCost,
				name: assetData?.name || portfolioAsset.asset_symbol,
				image_url: assetData?.image_url,
				netProfit,
				netProfitPercent,
			};
		});
	}, [portfolio, assets, pnlBySymbol]);

	const cashBalance = portfolio?.balance || 0;
	const holdingsValue = useMemo(
		() => enrichedAssets.reduce((sum, asset) => sum + asset.value, 0),
		[enrichedAssets],
	);
	const totalValue = cashBalance + holdingsValue;
	const hasAssets = enrichedAssets.length > 0;

	const topHoldings = useMemo(
		() =>
			[...enrichedAssets]
				.sort((a, b) => b.value - a.value)
				.filter((a) => a.value > 0)
				.slice(0, 5),
		[enrichedAssets],
	);

	const bestPerformer = useMemo(
		() =>
			enrichedAssets.length
				? [...enrichedAssets].sort((a, b) => b.netProfitPercent - a.netProfitPercent)[0]
				: null,
		[enrichedAssets],
	);
	const worstPerformer = useMemo(
		() =>
			enrichedAssets.length
				? [...enrichedAssets].sort((a, b) => a.netProfitPercent - b.netProfitPercent)[0]
				: null,
		[enrichedAssets],
	);

	const concentrationRisk = useMemo(() => {
		if (!enrichedAssets.length || totalValue <= 0) return 0;
		return (Math.max(...enrichedAssets.map((a) => a.value)) / totalValue) * 100;
	}, [enrichedAssets, totalValue]);

	const cashRatio = useMemo(
		() => (totalValue <= 0 ? 100 : (cashBalance / totalValue) * 100),
		[cashBalance, totalValue],
	);

	const filteredAndSortedAssets = useMemo(() => {
		let filtered = [...enrichedAssets];
		if (searchAsset) {
			const q = searchAsset.toLowerCase();
			filtered = filtered.filter(
				(asset) =>
					asset.asset_symbol.toLowerCase().includes(q) || asset.name.toLowerCase().includes(q),
			);
		}
		filtered.sort((a, b) => {
			let compare = 0;
			if (sortBy === "symbol") compare = a.asset_symbol.localeCompare(b.asset_symbol);
			if (sortBy === "amount") compare = a.amount - b.amount;
			if (sortBy === "value") compare = a.value - b.value;
			if (sortBy === "pnl") compare = a.netProfit - b.netProfit;
			return sortOrder === "asc" ? compare : -compare;
		});
		return filtered;
	}, [enrichedAssets, searchAsset, sortBy, sortOrder]);

	const totalPages = Math.ceil(filteredAndSortedAssets.length / ITEMS_PER_PAGE);
	const effectiveCurrentPage = useMemo(
		() => (currentPage > totalPages && totalPages > 0 ? 1 : currentPage),
		[currentPage, totalPages],
	);
	const paginatedAssets = useMemo(() => {
		const start = (effectiveCurrentPage - 1) * ITEMS_PER_PAGE;
		return filteredAndSortedAssets.slice(start, start + ITEMS_PER_PAGE);
	}, [filteredAndSortedAssets, effectiveCurrentPage]);

	const resetFilters = () => {
		setSearchAsset("");
		setSortBy("value");
		setSortOrder("desc");
		setCurrentPage(1);
	};

	const handlePageChange = (page: number) => {
		window.scrollTo({ top: 0, behavior: "smooth" });
		setCurrentPage(page);
	};

	const bestPerformerTone = bestPerformer
		? bestPerformer.netProfitPercent < 0
			? "portfolio-status-text-unusual"
			: "portfolio-status-text-positive"
		: "text-text-secondary";
	const worstPerformerTone = worstPerformer
		? worstPerformer.netProfitPercent > 0
			? "portfolio-status-text-unusual"
			: "portfolio-status-text-negative"
		: "text-text-secondary";

	if (isLoading) {
		return (
			<div className="space-y-6">
				<div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
					<StatCardSkeleton />
					<StatCardSkeleton />
					<StatCardSkeleton />
					<StatCardSkeleton />
				</div>
				<TableSkeleton rows={8} columns={6} />
			</div>
		);
	}

	if (error) {
		return (
			<div className="flex flex-col items-center justify-center gap-4 p-14 text-center">
				<p className="text-red text-base">{error}</p>
				<Button onClick={() => dispatch(fetchPortfolio())}>Retry</Button>
			</div>
		);
	}

	if (!portfolio) return null;

	const summaryCards = [
		{
			title: t("totalValue"),
			value: formatPrice(totalValue),
			description: t("cashAndHoldings"),
			icon: Wallet,
		},
		{
			title: t("availableBalance"),
			value: formatPrice(cashBalance),
			description: t("available"),
			icon: Landmark,
		},
		{
			title: t("holdingsValue"),
			value: formatPrice(holdingsValue),
			description: `${enrichedAssets.length} ${t("assets")}`,
			icon: PieChart,
		},
		{
			title: t("totalAssets"),
			value: enrichedAssets.length,
			description: t("inPortfolio"),
			icon: Layers,
		},
	];

	return (
		<div className="relative isolate overflow-hidden rounded-[40px] bg-[#020202]">
			<div className="relative z-10 space-y-6 px-1 py-2">
				<PortfolioHero />

				<div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
					{summaryCards.map((card) => (
						<PortfolioSummaryCard
							key={card.title}
							title={card.title}
							value={card.value}
							description={card.description}
							Icon={card.icon}
						/>
					))}
				</div>

				<div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
					<AllocationPreview topHoldings={topHoldings} totalValue={totalValue} />
					<PositionHealth
						bestPerformer={bestPerformer}
						worstPerformer={worstPerformer}
						bestPerformerTone={bestPerformerTone}
						worstPerformerTone={worstPerformerTone}
						concentrationRisk={concentrationRisk}
						cashRatio={cashRatio}
					/>
				</div>

				<AssetsTable
					assets={paginatedAssets}
					hasAssets={hasAssets}
					searchAsset={searchAsset}
					setSearchAsset={setSearchAsset}
					sortBy={sortBy}
					setSortBy={setSortBy}
					sortOrder={sortOrder}
					setSortOrder={setSortOrder}
					onReset={resetFilters}
					currentPage={effectiveCurrentPage}
					totalPages={totalPages}
					onPageChange={handlePageChange}
				/>
			</div>
		</div>
	);
};

export default Portfolio;
