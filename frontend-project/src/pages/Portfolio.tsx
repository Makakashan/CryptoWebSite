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
	CircleDollarSign,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { fetchPortfolio } from "../store/slices/portfolioSlice";
import { fetchOrders } from "../store/slices/ordersSlice";
import { fetchAssets } from "../store/slices/assetsSlice";
import { useBinanceWebSocket } from "../hooks/useBinanceWebSocket";
import { formatPrice } from "../utils/formatPrice";
import StatCardSkeleton from "../components/skeletons/StatCardSkeleton";
import TableSkeleton from "../components/skeletons/TableSkeleton";
import Card, {
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import Button from "@/components/ui/button";

type SortKey = "symbol" | "amount" | "value" | "pnl";
type SortOrder = "asc" | "desc";

type AssetPnl = {
	invested: number;
	realized: number;
	currentAmount: number;
	netProfit: number;
	netProfitPercent: number;
};

const Portfolio = () => {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const dispatch = useAppDispatch();

	const { isAuthenticated } = useAppSelector((state) => state.auth);
	const { portfolio, isLoading, error } = useAppSelector(
		(state) => state.portfolio,
	);
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

	const wsSymbols = useMemo(
		() => assets.map((asset) => asset.symbol),
		[assets],
	);
	useBinanceWebSocket({ symbols: wsSymbols, enabled: wsSymbols.length > 0 });

	const pnlBySymbol = useMemo<Record<string, AssetPnl>>(() => {
		// Weighted-average cost model from orders
		const state: Record<
			string,
			{
				amount: number;
				cost: number;
				realized: number;
			}
		> = {};

		for (const order of orders) {
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
				// SELL
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
			const assetData = assets.find(
				(a) => a.symbol === portfolioAsset.asset_symbol,
			);
			const symbol = portfolioAsset.asset_symbol;
			const currentPrice = assetData?.price || assetData?.current_price || 0;
			const value = portfolioAsset.amount * currentPrice;
			const pnl = pnlBySymbol[symbol];

			let netProfit = 0;
			let netProfitPercent = 0;

			if (pnl) {
				const unrealized = value - pnl.invested;
				netProfit = unrealized + pnl.realized;
				const basis = Math.max(1e-9, pnl.invested);
				netProfitPercent = (netProfit / basis) * 100;
			}

			return {
				...portfolioAsset,
				currentPrice,
				value,
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
		return [...enrichedAssets].sort(
			(a, b) => b.netProfitPercent - a.netProfitPercent,
		)[0];
	}, [enrichedAssets]);

	const worstPerformer = useMemo(() => {
		if (!enrichedAssets.length) return null;
		return [...enrichedAssets].sort(
			(a, b) => a.netProfitPercent - b.netProfitPercent,
		)[0];
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
					asset.asset_symbol.toLowerCase().includes(q) ||
					asset.name.toLowerCase().includes(q),
			);
		}

		filtered.sort((a, b) => {
			let compare = 0;
			if (sortBy === "symbol")
				compare = a.asset_symbol.localeCompare(b.asset_symbol);
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

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold text-text-primary">
						{t("myPortfolio")}
					</h1>
					<p className="text-sm text-text-secondary">
						Your command center for capital, allocation, and execution.
					</p>
				</div>
				<Button onClick={() => navigate("/markets")}>
					{t("tradeAssets")}
				</Button>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
				<Card className="relative overflow-hidden border border-white/10 bg-linear-to-br from-[#241512]/92 via-[#1a1412]/90 to-[#120f0d]/92">
					<CardHeader className="pb-2">
						<CardDescription>{t("totalValue")}</CardDescription>
						<CardTitle className="text-2xl">
							{formatPrice(totalValue)}
						</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-xs text-text-secondary flex items-center gap-2">
							<Wallet className="w-3.5 h-3.5" />
							{t("cashAndHoldings")}
						</p>
					</CardContent>
				</Card>

				<Card className="relative overflow-hidden border border-white/10 bg-linear-to-br from-[#241512]/92 via-[#1a1412]/90 to-[#120f0d]/92">
					<CardHeader className="pb-2">
						<CardDescription>{t("availableBalance")}</CardDescription>
						<CardTitle className="text-2xl">
							{formatPrice(cashBalance)}
						</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-xs text-text-secondary flex items-center gap-2">
							<Landmark className="w-3.5 h-3.5" />
							{t("available")}
						</p>
					</CardContent>
				</Card>

				<Card className="relative overflow-hidden border border-white/10 bg-linear-to-br from-[#241512]/92 via-[#1a1412]/90 to-[#120f0d]/92">
					<CardHeader className="pb-2">
						<CardDescription>{t("holdingsValue")}</CardDescription>
						<CardTitle className="text-2xl">
							{formatPrice(holdingsValue)}
						</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-xs text-text-secondary flex items-center gap-2">
							<PieChart className="w-3.5 h-3.5" />
							{enrichedAssets.length} {t("assets")}
						</p>
					</CardContent>
				</Card>

				<Card className="relative overflow-hidden border border-white/10 bg-linear-to-br from-[#241512]/92 via-[#1a1412]/90 to-[#120f0d]/92">
					<CardHeader className="pb-2">
						<CardDescription>{t("totalAssets")}</CardDescription>
						<CardTitle className="text-2xl">
							{enrichedAssets.length}
						</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-xs text-text-secondary flex items-center gap-2">
							<Layers className="w-3.5 h-3.5" />
							{t("inPortfolio")}
						</p>
					</CardContent>
				</Card>
			</div>

			<div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
				<Card className="xl:col-span-1 relative overflow-hidden border border-white/10 bg-linear-to-br from-[#221510]/92 via-[#181310]/91 to-[#120f0d]/93">
					<CardHeader>
						<CardTitle className="text-xl">Allocation preview</CardTitle>
						<CardDescription>
							Largest positions by portfolio value
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						{topHoldings.length > 0 ? (
							topHoldings.map((asset) => {
								const short = asset.asset_symbol.replace("USDT", "");
								const share =
									totalValue > 0
										? (asset.value / totalValue) * 100
										: 0;
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
										<div className="h-2 rounded-full bg-bg-hover overflow-hidden">
											<div
												className="h-full bg-linear-to-r from-yellow-300/70 to-red-400/70"
												style={{
													width: `${Math.min(share, 100)}%`,
												}}
											/>
										</div>
									</div>
								);
							})
						) : (
							<p className="text-sm text-text-secondary">
								{t("noAssetsYet")}
							</p>
						)}
					</CardContent>
				</Card>

				<Card className="xl:col-span-2 relative overflow-hidden border border-white/10 bg-linear-to-br from-[#221510]/92 via-[#181310]/91 to-[#120f0d]/93">
					<CardHeader>
						<CardTitle className="text-xl">Position Health</CardTitle>
						<CardDescription>
							Performance and risk snapshot of your holdings
						</CardDescription>
					</CardHeader>
					<CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
						<div className="rounded-xl border border-white/10 bg-white/3 p-4">
							<div className="text-xs text-text-secondary mb-1 flex items-center gap-2">
								<TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
								Best performer
							</div>
							<div className="text-sm font-semibold text-text-primary">
								{bestPerformer
									? bestPerformer.asset_symbol.replace("USDT", "")
									: "-"}
							</div>
							<div className="text-xs text-emerald-400">
								{bestPerformer
									? `${bestPerformer.netProfitPercent.toFixed(2)}%`
									: "0.00%"}
							</div>
						</div>

						<div className="rounded-xl border border-white/10 bg-white/3 p-4">
							<div className="text-xs text-text-secondary mb-1 flex items-center gap-2">
								<TrendingDown className="w-3.5 h-3.5 text-rose-400" />
								Worst performer
							</div>
							<div className="text-sm font-semibold text-text-primary">
								{worstPerformer
									? worstPerformer.asset_symbol.replace("USDT", "")
									: "-"}
							</div>
							<div className="text-xs text-rose-400">
								{worstPerformer
									? `${worstPerformer.netProfitPercent.toFixed(2)}%`
									: "0.00%"}
							</div>
						</div>

						<div className="rounded-xl border border-white/10 bg-white/3 p-4">
							<div className="text-xs text-text-secondary mb-1 flex items-center gap-2">
								<ShieldAlert className="w-3.5 h-3.5 text-amber-300" />
								Concentration risk
							</div>
							<div className="text-sm font-semibold text-text-primary">
								{concentrationRisk.toFixed(1)}%
							</div>
							<div className="text-xs text-text-secondary">
								Largest single position share
							</div>
						</div>

						<div className="rounded-xl border border-white/10 bg-white/3 p-4">
							<div className="text-xs text-text-secondary mb-1 flex items-center gap-2">
								<CircleDollarSign className="w-3.5 h-3.5 text-cyan-300" />
								Cash ratio
							</div>
							<div className="text-sm font-semibold text-text-primary">
								{cashRatio.toFixed(1)}%
							</div>
							<div className="text-xs text-text-secondary">
								Unallocated liquidity
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			<Card className="relative overflow-hidden border border-white/10 bg-linear-to-br from-[#221510]/92 via-[#181310]/91 to-[#120f0d]/93">
				<CardHeader className="pb-3">
					<CardTitle className="text-xl">{t("yourAssets")}</CardTitle>
					<CardDescription>
						Manage positions and monitor per-asset PnL
					</CardDescription>
				</CardHeader>

				<CardContent>
					{!hasAssets ? (
						<div className="flex flex-col items-center justify-center py-12 text-center gap-4">
							<p className="text-text-secondary">{t("noAssetsYet")}</p>
							<Button onClick={() => navigate("/markets")}>
								{t("browseMarkets")}
							</Button>
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
									onChange={(e) =>
										setSortBy(e.target.value as SortKey)
									}
									className="select"
								>
									<option value="value">{t("totalValue")}</option>
									<option value="pnl">Net Profit</option>
									<option value="symbol">{t("symbol")}</option>
									<option value="amount">{t("amount")}</option>
								</select>
								<select
									value={sortOrder}
									onChange={(e) =>
										setSortOrder(e.target.value as SortOrder)
									}
									className="select"
								>
									<option value="desc">{t("highToLow")}</option>
									<option value="asc">{t("lowToHigh")}</option>
								</select>
							</div>

							<div className="flex justify-end mb-4">
								<Button variant="secondary" onClick={resetFilters}>
									{t("reset")}
								</Button>
							</div>

							<div className="overflow-x-auto rounded-xl border border-white/10 bg-white/2">
								<table className="w-full border-collapse">
									<thead>
										<tr className="border-b border-white/10 bg-white/4]">
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
											const short = asset.asset_symbol.replace(
												"USDT",
												"",
											);
											const defaultIcon = `https://ui-avatars.com/api/?name=${short}&background=random&size=32`;

											const positive = asset.netProfit > 0;
											const negative = asset.netProfit < 0;

											return (
												<tr
													key={asset.asset_symbol}
													className="border-b border-white/5 hover:bg-white/3 transition-colors"
												>
													<td className="p-3">
														<div className="flex items-center gap-3">
															<img
																src={
																	asset.image_url ||
																	defaultIcon
																}
																alt={short}
																className="w-8 h-8 rounded-full"
																onError={(e) => {
																	e.currentTarget.src =
																		defaultIcon;
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
													<td className="p-3 text-sm font-semibold text-text-primary">
														{formatPrice(asset.value)}
													</td>
													<td className="p-3">
														<div
															className={
																positive
																	? "inline-flex items-center rounded-full border border-emerald-400/35 bg-linear-to-r from-emerald-500/20 to-green-500/18 px-2.5 py-1 text-xs font-semibold text-emerald-300 shadow-[0_0_16px_rgba(16,185,129,0.16)]"
																	: negative
																		? "inline-flex items-center rounded-full border border-rose-400/35 bg-linear-to-r from-rose-500/20 to-red-500/18 px-2.5 py-1 text-xs font-semibold text-rose-300 shadow-[0_0_16px_rgba(244,63,94,0.16)]"
																		: "inline-flex items-center rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-xs font-semibold text-text-secondary"
															}
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
															onClick={() =>
																navigate(
																	`/markets/${asset.asset_symbol}`,
																)
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
										disabled={effectiveCurrentPage === 1}
										onClick={() =>
											handlePageChange(effectiveCurrentPage - 1)
										}
									>
										{t("previous")}
									</Button>
									<span className="text-sm text-text-secondary">
										{t("page")} {effectiveCurrentPage} {t("of")}{" "}
										{totalPages}
									</span>
									<Button
										variant="secondary"
										size="sm"
										disabled={effectiveCurrentPage === totalPages}
										onClick={() =>
											handlePageChange(effectiveCurrentPage + 1)
										}
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
	);
};

export default Portfolio;
