import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowUpRight, Clock3, Filter, RefreshCcw, Search } from "lucide-react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { fetchOrders, setOrdersFilters } from "../store/slices/ordersSlice";
import type { OrdersFilters } from "../store/types/orders.types";
import { fetchPortfolio } from "../store/slices/portfolioSlice";
import { fetchAssets } from "../store/slices/assetsSlice";
import { useBinanceWebSocket } from "../hooks/useBinanceWebSocket";
import { formatPrice } from "../utils/formatPrice";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import Select from "@/components/ui/select";
import Card, { CardContent } from "@/components/ui/card";
import StatCardSkeleton from "../components/skeletons/StatCardSkeleton";
import TableSkeleton from "../components/skeletons/TableSkeleton";

const AUTO_REFRESH_MS = 30000;

const Orders = () => {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const dispatch = useAppDispatch();

	const { isAuthenticated } = useAppSelector((state) => state.auth);
	const { orders, isLoading, error, filters, pagination } = useAppSelector(
		(state) => state.orders,
	);
	const { portfolio } = useAppSelector((state) => state.portfolio);
	const { assets } = useAppSelector((state) => state.assets);

	const [assetSymbol, setAssetSymbol] = useState(filters.asset_symbol ?? "");
	const [orderType, setOrderType] = useState<"" | "BUY" | "SELL">(
		(filters.order_type as "" | "BUY" | "SELL") ?? "",
	);
	const [dateFrom, setDateFrom] = useState(filters.dateFrom ?? "");
	const [dateTo, setDateTo] = useState(filters.dateTo ?? "");
	const [sortBy, setSortBy] = useState(filters.sortBy ?? "timestamp");
	const [sortOrder, setSortOrder] = useState<"asc" | "desc">(
		(filters.sortOrder as "asc" | "desc") ?? "desc",
	);

	const fetchInProgress = useRef(false);

	const showSkeletons = isLoading && orders.length === 0;

	const wsSymbols = useMemo(() => {
		if (!portfolio?.assets?.length) return [];
		return Array.from(
			new Set(
				portfolio.assets
					.map((item) => item.asset_symbol)
					.filter((symbol): symbol is string => Boolean(symbol)),
			),
		);
	}, [portfolio]);

	useBinanceWebSocket({
		symbols: wsSymbols,
		enabled: wsSymbols.length > 0,
	});

	const currentHoldingsValue = useMemo(() => {
		if (!portfolio) return 0;

		return portfolio.assets.reduce((sum, portfolioAsset) => {
			const assetData = assets.find(
				(a) => a.symbol === portfolioAsset.asset_symbol,
			);
			const currentPrice = assetData?.price || assetData?.current_price || 0;
			return sum + portfolioAsset.amount * currentPrice;
		}, 0);
	}, [portfolio, assets]);

	const buyOrders = useMemo(
		() => orders.filter((order) => order.order_type === "BUY"),
		[orders],
	);

	const sellOrders = useMemo(
		() => orders.filter((order) => order.order_type === "SELL"),
		[orders],
	);

	const totalBuyAmount = useMemo(
		() =>
			buyOrders.reduce(
				(sum, order) => sum + order.amount * order.price_at_transaction,
				0,
			),
		[buyOrders],
	);

	const totalSellAmount = useMemo(
		() =>
			sellOrders.reduce(
				(sum, order) => sum + order.amount * order.price_at_transaction,
				0,
			),
		[sellOrders],
	);

	const netProfit = currentHoldingsValue - totalBuyAmount + totalSellAmount;

	const hasActiveFilters =
		Boolean(assetSymbol) ||
		Boolean(orderType) ||
		Boolean(dateFrom) ||
		Boolean(dateTo) ||
		sortBy !== "timestamp" ||
		sortOrder !== "desc";

	const uniqueAssetSymbols = useMemo(() => {
		const symbols = new Set(orders.map((order) => order.asset_symbol));
		return Array.from(symbols).sort();
	}, [orders]);

	const currentPage = pagination?.page || 1;
	const totalPages = pagination?.totalPages || 1;

	useEffect(() => {
		if (!isAuthenticated) {
			navigate("/login");
			return;
		}

		dispatch(fetchOrders(filters));
		dispatch(fetchPortfolio());
		dispatch(
			fetchAssets({
				page: 1,
				limit: 100,
				sortBy: "price",
				sortOrder: "desc",
			}),
		);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [dispatch, isAuthenticated, navigate]);

	useEffect(() => {
		if (!isAuthenticated) return;

		const intervalId = setInterval(() => {
			if (!document.hidden && !fetchInProgress.current) {
				dispatch(fetchOrders(filters));
				dispatch(fetchPortfolio());
			}
		}, AUTO_REFRESH_MS);

		return () => {
			clearInterval(intervalId);
		};
	}, [dispatch, filters, isAuthenticated]);

	const handleApplyFilters = () => {
		if (fetchInProgress.current) return;
		fetchInProgress.current = true;

		const newFilters: OrdersFilters = {
			asset_symbol: assetSymbol || undefined,
			order_type: orderType || undefined,
			dateFrom: dateFrom || undefined,
			dateTo: dateTo || undefined,
			sortBy,
			sortOrder,
			page: 1,
			limit: filters.limit,
		};

		dispatch(setOrdersFilters(newFilters));
		dispatch(fetchOrders(newFilters)).finally(() => {
			fetchInProgress.current = false;
		});
	};

	const handleResetFilters = () => {
		if (fetchInProgress.current) return;
		fetchInProgress.current = true;

		setAssetSymbol("");
		setOrderType("");
		setDateFrom("");
		setDateTo("");
		setSortBy("timestamp");
		setSortOrder("desc");

		const newFilters: OrdersFilters = {
			page: 1,
			limit: 20,
			sortBy: "timestamp",
			sortOrder: "desc",
		};

		dispatch(setOrdersFilters(newFilters));
		dispatch(fetchOrders(newFilters)).finally(() => {
			fetchInProgress.current = false;
		});
	};

	const handleManualRefresh = () => {
		if (fetchInProgress.current) return;
		fetchInProgress.current = true;

		Promise.all([dispatch(fetchOrders(filters)), dispatch(fetchPortfolio())]).finally(
			() => {
				fetchInProgress.current = false;
			},
		);
	};

	const handlePageChange = (page: number) => {
		if (fetchInProgress.current) return;
		fetchInProgress.current = true;

		window.scrollTo({ top: 0, behavior: "smooth" });
		const newFilters = { ...filters, page };

		dispatch(setOrdersFilters(newFilters));
		dispatch(fetchOrders(newFilters)).finally(() => {
			fetchInProgress.current = false;
		});
	};

	if (showSkeletons) {
		return (
			<div className="glass-page-shell">
				<div className="glass-page-body space-y-6">
					<div className="glass-hero-glass px-6 py-5">
						<div aria-hidden className="glass-panel-highlight" />
						<div className="glass-panel-inner flex items-center justify-between">
							<div>
								<h1 className="text-3xl font-bold tracking-tight text-text-primary">
									{t("orderHistory")}
								</h1>
								<p className="mt-1.5 text-sm text-text-secondary">
									Track and analyze all your trade activity
								</p>
							</div>
						</div>
					</div>

					<div className="glass-metric-grid glass-metric-grid--four">
						<StatCardSkeleton />
						<StatCardSkeleton />
						<StatCardSkeleton />
						<StatCardSkeleton />
					</div>

					<TableSkeleton rows={8} columns={6} />
				</div>
			</div>
		);
	}

	if (error && orders.length === 0) {
		return (
			<div className="glass-page-shell">
				<div className="glass-page-body">
					<Card className="glass-empty-panel border-white/10">
						<div aria-hidden className="glass-panel-highlight" />
						<CardContent className="glass-panel-inner p-10 text-center">
							<p className="text-red text-base">{error}</p>
							<Button
								className="glass-cta-button mt-4"
								onClick={handleManualRefresh}
							>
								{t("retry")}
							</Button>
						</CardContent>
					</Card>
				</div>
			</div>
		);
	}

	return (
		<div className="glass-page-shell">
			<div className="glass-page-body">
				<div className="glass-hero-glass px-6 py-5">
					<div aria-hidden className="glass-panel-highlight" />
					<div className="glass-panel-inner flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
						<div className="max-w-2xl">
							<h1 className="text-3xl font-bold tracking-tight text-text-primary">
								{t("orderHistory")}
							</h1>
							<p className="mt-1.5 max-w-xl text-sm text-text-secondary">
								Analyze your execution flow, timing and profit footprint
							</p>
						</div>

						<div className="flex flex-wrap items-center gap-2">
							<Button
								variant="outline"
								size="sm"
								onClick={handleManualRefresh}
								className="glass-muted-button gap-2"
							>
								<RefreshCcw className="w-4 h-4" />
								{t("refresh")}
							</Button>
							<Button
								onClick={() => navigate("/markets")}
								className="glass-cta-button gap-2"
							>
								<ArrowUpRight className="w-4 h-4" />
								{t("placeNewOrder")}
							</Button>
						</div>
					</div>
				</div>

				<Card className="glass-filter-panel">
					<div aria-hidden className="glass-panel-highlight" />
					<CardContent className="glass-panel-inner p-4">
						<div className="glass-filter-grid">
							<div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
								<div className="lg:col-span-3 flex flex-col gap-1.5">
									<label className="text-xs font-medium text-text-secondary">
										{t("asset")}
									</label>
									<div className="relative">
										<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
										<Select
											value={assetSymbol}
											onChange={(e) => setAssetSymbol(e.target.value)}
											className="pl-10"
										>
											<option value="">{t("allAssets")}</option>
											{uniqueAssetSymbols.map((symbol) => (
												<option key={symbol} value={symbol}>
													{symbol.replace("USDT", "")}
												</option>
											))}
										</Select>
									</div>
								</div>

								<div className="lg:col-span-2 flex flex-col gap-1.5">
									<label className="text-xs font-medium text-text-secondary">
										{t("orderType")}
									</label>
									<Select
										value={orderType}
										onChange={(e) =>
											setOrderType(e.target.value as "" | "BUY" | "SELL")
										}
									>
										<option value="">{t("all")}</option>
										<option value="BUY">{t("buy")}</option>
										<option value="SELL">{t("sell")}</option>
									</Select>
								</div>

								<div className="lg:col-span-2 flex flex-col gap-1.5">
									<label className="text-xs font-medium text-text-secondary">
										{t("dateFrom")}
									</label>
									<Input
										type="date"
										value={dateFrom}
										onChange={(e) => setDateFrom(e.target.value)}
									/>
								</div>

								<div className="lg:col-span-2 flex flex-col gap-1.5">
									<label className="text-xs font-medium text-text-secondary">
										{t("dateTo")}
									</label>
									<Input
										type="date"
										value={dateTo}
										onChange={(e) => setDateTo(e.target.value)}
									/>
								</div>

								<div className="lg:col-span-3 grid grid-cols-2 gap-3">
									<div className="flex flex-col gap-1.5">
										<label className="text-xs font-medium text-text-secondary">
											{t("sortBy")}
										</label>
										<Select
											value={sortBy}
											onChange={(e) => setSortBy(e.target.value)}
										>
											<option value="timestamp">{t("date")}</option>
											<option value="amount">{t("amount")}</option>
											<option value="asset_symbol">{t("asset")}</option>
											<option value="price_at_transaction">{t("price")}</option>
										</Select>
									</div>
									<div className="flex flex-col gap-1.5">
										<label className="text-xs font-medium text-text-secondary">
											{t("sortOrder")}
										</label>
										<Select
											value={sortOrder}
											onChange={(e) =>
												setSortOrder(e.target.value as "asc" | "desc")
											}
										>
											<option value="desc">{t("descending")}</option>
											<option value="asc">{t("ascending")}</option>
										</Select>
									</div>
								</div>
							</div>

							<div className="flex flex-wrap justify-end gap-2 pt-1">
								<Button
									variant="outline"
									size="sm"
									className="glass-muted-button gap-2"
									onClick={handleResetFilters}
								>
									<Filter className="w-4 h-4" />
									{t("reset")}
								</Button>
								<Button
									size="sm"
									className="glass-cta-button"
									onClick={handleApplyFilters}
								>
									{t("apply")}
								</Button>
							</div>
						</div>
					</CardContent>
				</Card>

				<div className="glass-metric-grid glass-metric-grid--four">
					<Card className="glass-metric-card">
						<div aria-hidden className="glass-panel-highlight" />
						<CardContent className="p-5">
							<p className="text-xs uppercase tracking-wider text-text-secondary">
								{t("totalOrders")}
							</p>
							<div className="mt-3 text-3xl font-bold text-text-primary">
								{pagination?.total || orders.length}
							</div>
							<div className="mt-2 text-xs text-text-secondary flex items-center gap-1.5">
								<Clock3 className="w-3.5 h-3.5" />
								{t("allTime")}
							</div>
						</CardContent>
					</Card>

					<Card className="glass-metric-card">
						<div aria-hidden className="glass-panel-highlight" />
						<CardContent className="p-5">
							<p className="text-xs uppercase tracking-wider text-text-secondary">
								{t("buyOrders")}
							</p>
							<div className="mt-3 text-3xl font-bold text-text-primary">
								{buyOrders.length}
							</div>
							<div className="mt-2 text-xs text-text-secondary">
								{formatPrice(totalBuyAmount)} {t("spent")}
							</div>
						</CardContent>
					</Card>

					<Card className="glass-metric-card">
						<div aria-hidden className="glass-panel-highlight" />
						<CardContent className="p-5">
							<p className="text-xs uppercase tracking-wider text-text-secondary">
								{t("sellOrders")}
							</p>
							<div className="mt-3 text-3xl font-bold text-text-primary">
								{sellOrders.length}
							</div>
							<div className="mt-2 text-xs text-text-secondary">
								{formatPrice(totalSellAmount)} {t("earned")}
							</div>
						</CardContent>
					</Card>

					<Card className="glass-metric-card">
						<div aria-hidden className="glass-panel-highlight" />
						<CardContent className="p-5">
							<p className="text-xs uppercase tracking-wider text-text-secondary">
								{t("netProfit")}
							</p>
							<div
								className="mt-3 text-3xl font-bold"
								style={{ color: netProfit >= 0 ? "#0ecb81" : "#f6465d" }}
							>
								{formatPrice(netProfit)}
							</div>
							<div className="mt-2 text-xs text-text-secondary">
								{t("totalGainLoss")}
							</div>
						</CardContent>
					</Card>
				</div>

				<Card className="glass-table-panel">
					<div aria-hidden className="glass-panel-highlight" />
					<CardContent className="glass-panel-inner p-0">
						<div className="px-6 pt-5 pb-3 flex items-center justify-between">
							<h2 className="text-xl font-semibold text-text-primary">
								{t("recentOrders")}
							</h2>
							{hasActiveFilters && (
								<span className="glass-market-chip text-xs">{t("filters")}</span>
							)}
						</div>

						{orders.length === 0 ? (
							<div className="p-14 text-center">
								<p className="text-text-secondary mb-4">{t("noOrdersYet")}</p>
								<Button
									className="glass-cta-button"
									onClick={() => navigate("/markets")}
								>
									{t("startTrading")}
								</Button>
							</div>
						) : (
							<div className="overflow-x-auto">
								<table className="w-full border-collapse">
									<thead>
										<tr className="border-b border-white/10">
											<th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-text-secondary">
												{t("date")}
											</th>
											<th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-text-secondary">
												{t("asset")}
											</th>
											<th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-text-secondary">
												{t("type")}
											</th>
											<th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-text-secondary">
												{t("amount")}
											</th>
											<th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-text-secondary">
												{t("price")}
											</th>
											<th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-text-secondary">
												{t("total")}
											</th>
										</tr>
									</thead>
									<tbody>
										{orders.map((order) => {
											const shortName = order.asset_symbol.replace("USDT", "");
											const total = order.amount * order.price_at_transaction;
											const date = new Date(order.timestamp).toLocaleString();
											const isBuy = order.order_type === "BUY";

											return (
												<tr
													key={order.id}
													className="border-b border-white/6 transition-colors duration-200 hover:bg-white/2"
												>
													<td className="px-6 py-4 text-sm text-text-primary">
														{date}
													</td>
													<td className="px-6 py-4 text-sm text-text-primary font-semibold">
														{shortName}
													</td>
													<td className="px-6 py-4 text-sm">
														<span
															className={`glass-market-chip ${isBuy ? "text-green border-green/30 bg-green/10" : "text-red border-red/30 bg-red/10"}`}
														>
															{order.order_type}
														</span>
													</td>
													<td className="px-6 py-4 text-sm text-text-primary">
														{order.amount.toFixed(6)}
													</td>
													<td className="px-6 py-4 text-sm text-text-primary">
														{formatPrice(order.price_at_transaction)}
													</td>
													<td className="px-6 py-4 text-sm font-semibold text-text-primary">
														{formatPrice(total)}
													</td>
												</tr>
											);
										})}
									</tbody>
								</table>
							</div>
						)}
					</CardContent>
				</Card>

				{totalPages > 1 && (
					<div className="flex justify-center items-center gap-4 pt-2">
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

export default Orders;
