import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
	PieChart,
	Wallet,
	Landmark,
	Layers,
	ArrowUpRight,
	TrendingUp,
	TrendingDown,
	ShieldAlert,
	Coins,
	type LucideIcon,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { fetchPortfolio } from "../store/slices/portfolioSlice";
import { fetchOrders } from "../store/slices/ordersSlice";
import { fetchAssets } from "../store/slices/assetsSlice";
import { useBinanceWebSocket } from "../hooks/useBinanceWebSocket";
import { binanceWebSocketService } from "../services/binanceWebSocket";
import { formatPrice } from "../utils/formatPrice";
import type { SortKey, SortOrder, AssetPnl } from "../store/types/portfolio.types";
import StatCardSkeleton from "../components/skeletons/StatCardSkeleton";
import TableSkeleton from "../components/skeletons/TableSkeleton";
import Card, { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Button from "@/components/ui/button";

const PortfolioGlassHighlight = ({
	rimClassName,
	glowClassName,
	showOrbs = false,
}: {
	rimClassName: string;
	glowClassName: string;
	showOrbs?: boolean;
}) => (
	<div
		aria-hidden
		className="portfolio-glass-highlight pointer-events-none absolute inset-0 overflow-hidden"
	>
		<div className={`portfolio-glass-highlight__rim ${rimClassName}`} />
		<div className={`portfolio-glass-highlight__glow ${glowClassName}`} />
		{showOrbs ? (
			<>
				<div className="portfolio-glass-highlight__orb portfolio-glass-highlight__orb--left" />
				<div className="portfolio-glass-highlight__orb portfolio-glass-highlight__orb--right" />
			</>
		) : null}
	</div>
);

const PortfolioSummaryCard = ({
	title,
	value,
	description,
	Icon,
}: {
	title: string;
	value: string | number;
	description: string;
	Icon: LucideIcon;
}) => (
	<Card className="portfolio-glass-card">
		<PortfolioGlassHighlight
			rimClassName="portfolio-glass-highlight__rim--card"
			glowClassName="portfolio-glass-highlight__glow--card"
		/>
		<CardHeader className="pb-2">
			<CardDescription>{title}</CardDescription>
			<CardTitle className="text-2xl">{value}</CardTitle>
		</CardHeader>
		<CardContent>
			<p className="flex items-center gap-2 text-xs text-text-secondary">
				<Icon className="h-3.5 w-3.5" />
				{description}
			</p>
		</CardContent>
	</Card>
);

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
	const itemsPerPage = 10;

	useEffect(() => {
		if (!isAuthenticated) {
			navigate("/login");
			return;
		}
		dispatch(fetchPortfolio());

		dispatch(
			fetchAssets({
				page: 1,
				limit: 200,
				sortBy: "price",
				sortOrder: "desc",
			}),
		);

		if (orders.length === 0) {
			dispatch(
				fetchOrders({
					page: 1,
					limit: 500,
					sortBy: "timestamp",
					sortOrder: "asc",
				}),
			);
		}
	}, [dispatch, isAuthenticated, navigate, orders.length]);

	const wsSymbols = useMemo(() => assets.map((asset) => asset.symbol), [assets]);
	useBinanceWebSocket({ symbols: wsSymbols, enabled: wsSymbols.length > 0 });

	const pnlBySymbol = useMemo<Record<string, AssetPnl>>(() => {
		const sortedOrders = [...orders].sort(
			(a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
		);

		const state: Record<
			string,
			{
				amount: number;
				cost: number;
				realized: number;
			}
		> = {};

		for (const order of sortedOrders) {
			const symbol = order.asset_symbol;
			if (!state[symbol]) {
				state[symbol] = { amount: 0, cost: 0, realized: 0 };
			}
			const s = state[symbol];
			const qty = order.amount;
			const px = order.price_at_transaction;

			if (order.order_type === "BUY") {
				s.amount += qty;
				s.cost += qty * px;
			} else {
				const avgCost = s.amount > 0 ? s.cost / s.amount : 0;
				const soldCost = avgCost * qty;
				const proceeds = qty * px;
				s.realized += proceeds - soldCost;

				s.amount = Math.max(0, s.amount - qty);
				s.cost = Math.max(0, s.cost - soldCost);
			}
		}

		const result: Record<string, AssetPnl> = {};
		Object.entries(state).forEach(([symbol, s]) => {
			result[symbol] = {
				invested: s.cost,
				realized: s.realized,
				currentAmount: s.amount,
				netProfit: 0,
				netProfitPercent: 0,
			};
		});

		return result;
	}, [orders]);

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
				const unrealized = value - effectiveInvested;
				netProfit = unrealized;
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

	const topHoldings = useMemo(() => {
		return [...enrichedAssets]
			.sort((a, b) => b.value - a.value)
			.filter((a) => a.value > 0)
			.slice(0, 5);
	}, [enrichedAssets]);

	const bestPerformer = useMemo(() => {
		if (!enrichedAssets.length) return null;
		return [...enrichedAssets].sort((a, b) => b.netProfitPercent - a.netProfitPercent)[0];
	}, [enrichedAssets]);

	const worstPerformer = useMemo(() => {
		if (!enrichedAssets.length) return null;
		return [...enrichedAssets].sort((a, b) => a.netProfitPercent - b.netProfitPercent)[0];
	}, [enrichedAssets]);

	const concentrationRisk = useMemo(() => {
		if (!enrichedAssets.length || totalValue <= 0) return 0;
		const maxValue = Math.max(...enrichedAssets.map((a) => a.value));
		return (maxValue / totalValue) * 100;
	}, [enrichedAssets, totalValue]);

	const cashRatio = useMemo(() => {
		if (totalValue <= 0) return 100;
		return (cashBalance / totalValue) * 100;
	}, [cashBalance, totalValue]);

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

	const totalPages = Math.ceil(filteredAndSortedAssets.length / itemsPerPage);
	const effectiveCurrentPage = useMemo(() => {
		if (currentPage > totalPages && totalPages > 0) return 1;
		return currentPage;
	}, [currentPage, totalPages]);

	const paginatedAssets = useMemo(() => {
		const start = (effectiveCurrentPage - 1) * itemsPerPage;
		return filteredAndSortedAssets.slice(start, start + itemsPerPage);
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
				<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
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
			<div className="flex flex-col items-center justify-center p-14 text-center gap-4">
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
				<div className="portfolio-hero-glass px-6 py-5">
					<PortfolioGlassHighlight
						rimClassName="portfolio-glass-highlight__rim--wide"
						glowClassName="portfolio-glass-highlight__glow--wide"
						showOrbs
					/>
					<div className="relative z-10 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
						<div className="max-w-2xl">
							<h1 className="text-3xl font-bold tracking-tight text-text-primary">
								{t("myPortfolio")}
							</h1>
							<p className="mt-1.5 max-w-xl text-sm text-text-secondary">
								Your command center for capital, allocation, and execution.
							</p>
						</div>
						<Button
							variant="outline"
							className="glass-cta-button shrink-0 self-start lg:self-center"
							onClick={() => navigate("/markets")}
						>
							{t("tradeAssets")}
						</Button>
					</div>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
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

				<div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
					<Card className="portfolio-glass-panel xl:col-span-1">
						<div
							aria-hidden
							className="portfolio-glass-highlight pointer-events-none absolute inset-0 overflow-hidden"
						>
							<div className="portfolio-glass-highlight__rim portfolio-glass-highlight__rim--wide" />
							<div className="portfolio-glass-highlight__glow portfolio-glass-highlight__glow--wide" />
						</div>
						<CardHeader>
							<CardTitle className="text-xl">Allocation preview</CardTitle>
							<CardDescription>Largest positions by portfolio value</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							{topHoldings.length > 0 ? (
								topHoldings.map((asset) => {
									const short = asset.asset_symbol.replace("USDT", "");
									const share = totalValue > 0 ? (asset.value / totalValue) * 100 : 0;
									const defaultIcon = `https://ui-avatars.com/api/?name=${short}&background=random&size=32`;

									return (
										<div key={asset.asset_symbol} className="space-y-2">
											<div className="flex items-center justify-between">
												<div className="flex items-center gap-2">
													<img
														src={asset.image_url || defaultIcon}
														alt={short}
														className="w-7 h-7 rounded-full"
														onError={(e) => {
															e.currentTarget.src = defaultIcon;
														}}
													/>
													<div>
														<p className="text-sm font-semibold text-text-primary">
															{short}
														</p>
														<p className="text-xs text-text-secondary">
															{formatPrice(asset.value)}
														</p>
													</div>
												</div>
												<span className="text-xs text-text-secondary">
													{share.toFixed(1)}%
												</span>
											</div>
											<div className="h-2 overflow-hidden rounded-full border border-white/6 bg-white/4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
												<div
													className="h-full rounded-full bg-linear-to-r from-white/85 via-white/45 to-white/18 shadow-[0_0_16px_rgba(255,255,255,0.14)]"
													style={{
														width: `${Math.min(share, 100)}%`,
													}}
												/>
											</div>
										</div>
									);
								})
							) : (
								<p className="text-sm text-text-secondary">{t("noAssetsYet")}</p>
							)}
						</CardContent>
					</Card>

					<Card className="portfolio-glass-panel xl:col-span-2">
						<div
							aria-hidden
							className="portfolio-glass-highlight pointer-events-none absolute inset-0 overflow-hidden"
						>
							<div className="portfolio-glass-highlight__rim portfolio-glass-highlight__rim--wide" />
							<div className="portfolio-glass-highlight__glow portfolio-glass-highlight__glow--wide" />
						</div>
						<CardHeader>
							<CardTitle className="text-xl">Position Health</CardTitle>
							<CardDescription>
								Performance and risk snapshot of your holdings
							</CardDescription>
						</CardHeader>
						<CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
							<div className="portfolio-glass-metric">
								<div
									aria-hidden
									className="portfolio-glass-highlight pointer-events-none absolute inset-0 overflow-hidden"
								>
									<div className="portfolio-glass-highlight__rim portfolio-glass-highlight__rim--metric" />
									<div className="portfolio-glass-highlight__glow portfolio-glass-highlight__glow--metric" />
								</div>
								<div className="text-xs text-text-secondary mb-1 flex items-center gap-2">
									<TrendingUp className={`h-3.5 w-3.5 ${bestPerformerTone}`} />
									Best performer
									{bestPerformer && bestPerformer.netProfitPercent < 0 && (
										<span className="portfolio-status-chip portfolio-status-chip-unusual ml-1">
											Unusual
										</span>
									)}
								</div>
								<div className="text-sm font-semibold text-text-primary">
									{bestPerformer ? bestPerformer.asset_symbol.replace("USDT", "") : "-"}
								</div>
								<div className={`text-xs ${bestPerformerTone}`}>
									{bestPerformer
										? `${bestPerformer.netProfitPercent.toFixed(2)}%`
										: "0.00%"}
								</div>
							</div>

							<div className="portfolio-glass-metric">
								<div
									aria-hidden
									className="portfolio-glass-highlight pointer-events-none absolute inset-0 overflow-hidden"
								>
									<div className="portfolio-glass-highlight__rim portfolio-glass-highlight__rim--metric" />
									<div className="portfolio-glass-highlight__glow portfolio-glass-highlight__glow--metric" />
								</div>
								<div className="text-xs text-text-secondary mb-1 flex items-center gap-2">
									<TrendingDown className={`h-3.5 w-3.5 ${worstPerformerTone}`} />
									Worst performer
									{worstPerformer && worstPerformer.netProfitPercent > 0 && (
										<span className="portfolio-status-chip portfolio-status-chip-unusual ml-1">
											Unusual
										</span>
									)}
								</div>
								<div className="text-sm font-semibold text-text-primary">
									{worstPerformer ? worstPerformer.asset_symbol.replace("USDT", "") : "-"}
								</div>
								<div className={`text-xs ${worstPerformerTone}`}>
									{worstPerformer
										? `${worstPerformer.netProfitPercent.toFixed(2)}%`
										: "0.00%"}
								</div>
							</div>

							<div className="portfolio-glass-metric">
								<div
									aria-hidden
									className="portfolio-glass-highlight pointer-events-none absolute inset-0 overflow-hidden"
								>
									<div className="portfolio-glass-highlight__rim portfolio-glass-highlight__rim--metric" />
									<div className="portfolio-glass-highlight__glow portfolio-glass-highlight__glow--metric" />
								</div>
								<div className="text-xs text-text-secondary mb-1 flex items-center gap-2">
									<ShieldAlert className="h-3.5 w-3.5 text-white/75" />
									Concentration risk
								</div>
								<div className="text-sm font-semibold text-text-primary">
									{concentrationRisk.toFixed(1)}%
								</div>
								<div className="text-xs text-text-secondary">
									Largest single position share
								</div>
							</div>

							<div className="portfolio-glass-metric">
								<div
									aria-hidden
									className="portfolio-glass-highlight pointer-events-none absolute inset-0 overflow-hidden"
								>
									<div className="portfolio-glass-highlight__rim portfolio-glass-highlight__rim--metric" />
									<div className="portfolio-glass-highlight__glow portfolio-glass-highlight__glow--metric" />
								</div>
								<div className="text-xs text-text-secondary mb-1 flex items-center gap-2">
									<Coins className="h-3.5 w-3.5 text-white/75" />
									Cash ratio
								</div>
								<div className="text-sm font-semibold text-text-primary">
									{cashRatio.toFixed(1)}%
								</div>
								<div className="text-xs text-text-secondary">Unallocated liquidity</div>
							</div>
						</CardContent>
					</Card>
				</div>

				<Card className="portfolio-glass-panel portfolio-glass-panel-assets">
					<div
						aria-hidden
						className="portfolio-glass-highlight pointer-events-none absolute inset-0 overflow-hidden"
					>
						<div className="portfolio-glass-highlight__rim portfolio-glass-highlight__rim--wide" />
						<div className="portfolio-glass-highlight__glow portfolio-glass-highlight__glow--wide" />
					</div>
					<CardHeader className="pb-3">
						<CardTitle className="text-xl">{t("yourAssets")}</CardTitle>
						<CardDescription>Manage positions and monitor per-asset PnL</CardDescription>
					</CardHeader>

					<CardContent>
						{!hasAssets ? (
							<div className="flex flex-col items-center justify-center py-12 text-center gap-4">
								<p className="text-text-secondary">{t("noAssetsYet")}</p>
								<Button onClick={() => navigate("/markets")}>{t("browseMarkets")}</Button>
							</div>
						) : (
							<>
								<div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
									<input
										type="text"
										placeholder={t("searchAssets")}
										value={searchAsset}
										onChange={(e) => setSearchAsset(e.target.value)}
										className="input md:col-span-2"
									/>
									<select
										value={sortBy}
										onChange={(e) => setSortBy(e.target.value as SortKey)}
										className="select"
									>
										<option value="value">{t("totalValue")}</option>
										<option value="pnl">Net Profit</option>
										<option value="symbol">{t("symbol")}</option>
										<option value="amount">{t("amount")}</option>
									</select>
									<select
										value={sortOrder}
										onChange={(e) => setSortOrder(e.target.value as SortOrder)}
										className="select"
									>
										<option value="desc">{t("highToLow")}</option>
										<option value="asc">{t("lowToHigh")}</option>
									</select>
								</div>

								<div className="flex justify-end mb-4">
									<Button
										variant="secondary"
										className="portfolio-assets-reset rounded-full text-text-primary"
										onClick={resetFilters}
									>
										{t("reset")}
									</Button>
								</div>

								<div className="portfolio-assets-table overflow-x-auto">
									<table className="w-full border-collapse">
										<thead>
											<tr>
												<th className="p-3 text-left text-xs font-semibold uppercase text-text-secondary">
													{t("asset")}
												</th>
												<th className="p-3 text-left text-xs font-semibold uppercase text-text-secondary">
													{t("amount")}
												</th>
												<th className="p-3 text-left text-xs font-semibold uppercase text-text-secondary">
													{t("currentPrice")}
												</th>
												<th className="p-3 text-left text-xs font-semibold uppercase text-text-secondary">
													{t("avgBuyPrice")}
												</th>
												<th className="p-3 text-left text-xs font-semibold uppercase text-text-secondary">
													{t("totalValue")}
												</th>
												<th className="p-3 text-left text-xs font-semibold uppercase text-text-secondary">
													Net Profit
												</th>
												<th className="p-3 text-left text-xs font-semibold uppercase text-text-secondary">
													{t("actions")}
												</th>
											</tr>
										</thead>
										<tbody>
											{paginatedAssets.map((asset) => {
												const short = asset.asset_symbol.replace("USDT", "");
												const defaultIcon = `https://ui-avatars.com/api/?name=${short}&background=random&size=32`;

												const positive = asset.netProfit > 0;
												const negative = asset.netProfit < 0;

												return (
													<tr key={asset.asset_symbol}>
														<td className="p-3">
															<div className="flex items-center gap-3">
																<img
																	src={asset.image_url || defaultIcon}
																	alt={short}
																	className="w-8 h-8 rounded-full"
																	onError={(e) => {
																		e.currentTarget.src = defaultIcon;
																	}}
																/>
																<div>
																	<p className="text-sm font-semibold text-text-primary">
																		{short}
																	</p>
																	<p className="text-xs text-text-secondary">
																		{asset.name}
																	</p>
																</div>
															</div>
														</td>
														<td className="p-3 text-sm text-text-primary">
															{asset.amount.toFixed(6)}
														</td>
														<td className="p-3 text-sm text-text-primary">
															{formatPrice(asset.currentPrice)}
														</td>
														<td className="p-3 text-sm text-text-primary">
															{formatPrice(asset.avgBuyPrice)}
														</td>
														<td className="p-3 text-sm font-semibold text-text-primary">
															{formatPrice(asset.value)}
														</td>
														<td className="p-3">
															<div
																className={`portfolio-status-chip ${
																	positive
																		? "portfolio-status-chip-positive"
																		: negative
																			? "portfolio-status-chip-negative"
																			: "portfolio-status-chip-neutral"
																}`}
															>
																{asset.netProfit > 0 ? "+" : ""}
																{formatPrice(asset.netProfit)} (
																{asset.netProfitPercent.toFixed(2)}
																%)
															</div>
														</td>
														<td className="p-3">
															<Button
																variant="outline"
																size="sm"
																className="portfolio-assets-action rounded-full text-text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]"
																onClick={() =>
																	navigate(`/markets/${asset.asset_symbol}`)
																}
															>
																{t("trade")}
																<ArrowUpRight className="w-4 h-4" />
															</Button>
														</td>
													</tr>
												);
											})}
										</tbody>
									</table>
								</div>

								{totalPages > 1 && (
									<div className="flex items-center justify-center gap-3 mt-5">
										<Button
											variant="secondary"
											size="sm"
											className="rounded-full border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.1),rgba(255,255,255,0.025))] shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.14),rgba(255,255,255,0.03))]"
											disabled={effectiveCurrentPage === 1}
											onClick={() => handlePageChange(effectiveCurrentPage - 1)}
										>
											{t("previous")}
										</Button>
										<span className="text-sm text-text-secondary">
											{t("page")} {effectiveCurrentPage} {t("of")} {totalPages}
										</span>
										<Button
											variant="secondary"
											size="sm"
											className="rounded-full border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.1),rgba(255,255,255,0.025))] shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.14),rgba(255,255,255,0.03))]"
											disabled={effectiveCurrentPage === totalPages}
											onClick={() => handlePageChange(effectiveCurrentPage + 1)}
										>
											{t("next")}
										</Button>
									</div>
								)}
							</>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
};

export default Portfolio;
