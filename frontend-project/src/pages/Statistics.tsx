import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
	Cell,
	BarChart,
	Bar,
	AreaChart,
	Area,
	LineChart,
	Line,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	Legend,
	ResponsiveContainer,
} from "recharts";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import type { RootState } from "../store";
import { fetchOrders } from "../store/slices/ordersSlice";
import { fetchPortfolio } from "../store/slices/portfolioSlice";
import { fetchAssets } from "../store/slices/assetsSlice";
import { formatPrice } from "../utils/formatPrice";
import type { Order } from "../store/types/orders.types";
import { useIconLoader } from "../hooks/useIconLoader";
import { TrendingDown, TrendingUp } from "lucide-react";
import {
	ChartContainer,
	ChartLegend,
	ChartTooltip,
} from "@/components/ui/chart";
import StatCardSkeleton from "../components/skeletons/StatCardSkeleton";
import StatsChartSkeleton from "../components/skeletons/StatsChartSkeleton";

const STARTING_BALANCE = 10000;

interface EnrichedAsset {
	asset_symbol: string;
	amount: number;
	currentPrice: number;
	value: number;
	name: string;
}

interface ProfitPoint {
	ts: number;
	profit: number;
}

interface Performer {
	asset_symbol: string;
	name: string;
	trades: number;
	holding: number;
	pnl: number;
	image_url: string | null;
}

interface PerformerSparkPoint {
	ts: number;
	pnl: number;
}

const collapseProfitPointsByDay = (points: ProfitPoint[]): ProfitPoint[] => {
	const byDay = new Map<string, ProfitPoint>();
	points.forEach((point) => {
		const dayKey = new Date(point.ts).toISOString().slice(0, 10);
		const existing = byDay.get(dayKey);
		if (!existing || point.ts > existing.ts) {
			byDay.set(dayKey, point);
		}
	});

	return Array.from(byDay.values()).sort((a, b) => a.ts - b.ts);
};

const buildOrdersBySymbol = (orders: Order[]) => {
	const bySymbol = new Map<string, Order[]>();
	orders.forEach((order) => {
		const list = bySymbol.get(order.asset_symbol) || [];
		list.push(order);
		bySymbol.set(order.asset_symbol, list);
	});

	bySymbol.forEach((list, symbol) => {
		bySymbol.set(
			symbol,
			[...list].sort(
				(a, b) =>
					new Date(a.timestamp).getTime() -
					new Date(b.timestamp).getTime(),
			),
		);
	});

	return bySymbol;
};

const calculateHoldingsValue = (
	holdings: Map<string, number>,
	valuationPrices: Record<string, number>,
): number => {
	let totalValue = 0;
	holdings.forEach((amount, symbol) => {
		if (amount <= 0) return;
		totalValue += amount * (valuationPrices[symbol] || 0);
	});
	return totalValue;
};

const formatAxisValue = (value: number): string => {
	const abs = Math.abs(value);
	if (abs >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
	if (abs >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
	if (abs >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
	return `$${value.toFixed(0)}`;
};

const buildProfitHistory = (
	orders: Order[],
	currentPrices: Record<string, number>,
): ProfitPoint[] => {
	if (orders.length === 0) return [];

	const sortedOrdersAsc = [...orders].sort(
		(a, b) =>
			new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
	);
	let cash = STARTING_BALANCE;
	const holdings = new Map<string, number>();
	const valuationPrices: Record<string, number> = { ...currentPrices };

	const points = sortedOrdersAsc.map((order) => {
		const value = order.amount * order.price_at_transaction;
		const currentAmount = holdings.get(order.asset_symbol) || 0;

		if (order.order_type === "BUY") {
			holdings.set(order.asset_symbol, currentAmount + order.amount);
			cash -= value;
		} else {
			holdings.set(order.asset_symbol, Math.max(0, currentAmount - order.amount));
			cash += value;
		}

		valuationPrices[order.asset_symbol] = order.price_at_transaction;

		const totalAccountValue =
			cash + calculateHoldingsValue(holdings, valuationPrices);

		return {
			ts: new Date(order.timestamp).getTime(),
			profit: totalAccountValue - STARTING_BALANCE,
		};
	});

	return points.slice(-40);
};

const Statistics = () => {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const dispatch = useAppDispatch();

	const { isAuthenticated } = useAppSelector((state: RootState) => state.auth);
	const { orders, isLoading: ordersLoading } = useAppSelector(
		(state: RootState) => state.orders,
	);
	const { portfolio, isLoading: portfolioLoading } = useAppSelector(
		(state: RootState) => state.portfolio,
	);
	const { assets } = useAppSelector((state: RootState) => state.assets);

	useEffect(() => {
		if (!isAuthenticated) return;

		dispatch(
			fetchOrders({
				page: 1,
				limit: 2000,
				sortBy: "timestamp",
				sortOrder: "asc",
			}),
		);
		dispatch(fetchPortfolio());

		if (assets.length === 0) {
			dispatch(fetchAssets({ limit: 100 }));
		}
	}, [dispatch, isAuthenticated, navigate, assets.length]);

	const enrichedAssets = useMemo<EnrichedAsset[]>(() => {
		if (!portfolio) return [];

		return portfolio.assets.map((portfolioAsset) => {
			const assetData = assets.find(
				(a) => a.symbol === portfolioAsset.asset_symbol,
			);
			const currentPrice = assetData?.price || assetData?.current_price || 0;

			return {
				...portfolioAsset,
				currentPrice,
				value: portfolioAsset.amount * currentPrice,
				name: portfolioAsset.asset_symbol.replace("USDT", ""),
			};
		});
	}, [portfolio, assets]);

	const priceMap = useMemo(() => {
		return assets.reduce<Record<string, number>>((acc, asset) => {
			acc[asset.symbol] = asset.price || asset.current_price || 0;
			return acc;
		}, {});
	}, [assets]);

	const ordersByTypeData = useMemo(() => {
		const buyCount = orders.filter(
			(order) => order.order_type === "BUY",
		).length;
		const sellCount = orders.filter(
			(order) => order.order_type === "SELL",
		).length;

		return [
			{ name: t("buy"), value: buyCount, fill: "#0ecb81" },
			{ name: t("sell"), value: sellCount, fill: "#f6465d" },
		];
	}, [orders, t]);

	const profitOverTime = useMemo(() => {
		const raw = buildProfitHistory(orders, priceMap);
		return collapseProfitPointsByDay(raw);
	}, [orders, priceMap]);

	const profitYAxisDomain = useMemo<[number, number]>(() => {
		if (profitOverTime.length === 0) return [-100, 100];

		const values = profitOverTime.map((point) => point.profit);
		const min = Math.min(...values);
		const max = Math.max(...values);

		if (min === max) {
			const padding = Math.max(10, Math.abs(min) * 0.1);
			return [min - padding, max + padding];
		}

		const padding = (max - min) * 0.12;
		return [min - padding, max + padding];
	}, [profitOverTime]);

	const topPerformers = useMemo<Performer[]>(() => {
		const ordersBySymbol = buildOrdersBySymbol(orders);

		return Array.from(ordersBySymbol.entries())
			.map(([symbol, list]) => {
				let trades = 0;
				let boughtAmount = 0;
				let soldAmount = 0;
				let totalAmount = 0;
				let totalCost = 0;
				let realizedPnl = 0;

				list.forEach((order) => {
					trades += 1;
					const value = order.amount * order.price_at_transaction;

					if (order.order_type === "BUY") {
						boughtAmount += order.amount;
						totalAmount += order.amount;
						totalCost += value;
						return;
					}

					soldAmount += order.amount;
					if (totalAmount <= 0) return;

					const sellAmount = Math.min(order.amount, totalAmount);
					const avgCost = totalCost / totalAmount;
					realizedPnl += (order.price_at_transaction - avgCost) * sellAmount;
					totalAmount -= sellAmount;
					totalCost -= avgCost * sellAmount;
				});

				const holding = Math.max(0, boughtAmount - soldAmount);
				const pnl = realizedPnl;

				const image_url =
					assets.find((asset) => asset.symbol === symbol)?.image_url ||
					null;

				return {
					asset_symbol: symbol,
					name: symbol.replace("USDT", ""),
					trades,
					holding,
					pnl,
					image_url,
				};
			})
			.sort((a, b) => b.pnl - a.pnl);
	}, [orders, assets]);

	const topPerformerSparks = useMemo(() => {
		const ordersBySymbol = buildOrdersBySymbol(orders);
		const series = new Map<string, PerformerSparkPoint[]>();

		ordersBySymbol.forEach((list, symbol) => {
			let totalAmount = 0;
			let totalCost = 0;
			let realizedPnl = 0;
			const points = list.map((order) => {
				const value = order.amount * order.price_at_transaction;

				if (order.order_type === "BUY") {
					totalAmount += order.amount;
					totalCost += value;
				} else if (totalAmount > 0) {
					const sellAmount = Math.min(order.amount, totalAmount);
					const avgCost = totalCost / totalAmount;
					realizedPnl += (order.price_at_transaction - avgCost) * sellAmount;
					totalAmount -= sellAmount;
					totalCost -= avgCost * sellAmount;
				}

				return {
					ts: new Date(order.timestamp).getTime(),
					pnl: realizedPnl,
				};
			});

			series.set(symbol, points.slice(-30));
		});

		return series;
	}, [orders]);

	const currentHoldingsValue = useMemo(() => {
		return enrichedAssets.reduce((sum, asset) => sum + asset.value, 0);
	}, [enrichedAssets]);

	const totalAccountValue = useMemo(() => {
		return (portfolio?.balance || 0) + currentHoldingsValue;
	}, [portfolio, currentHoldingsValue]);

	const showSkeletons = ordersLoading || portfolioLoading;

	const hasNoData = orders.length === 0 && enrichedAssets.length === 0;

	return (
		<div className="statistics-page">
			<div className="mb-6">
				<h1 className="text-text-primary text-2xl font-bold m-0">
					{t("tradingStatistics")}
				</h1>
			</div>

			<div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-4 mb-8">
				{showSkeletons ? (
					<>
						<StatCardSkeleton />
						<StatCardSkeleton />
						<StatCardSkeleton />
					</>
				) : (
					<>
						<div className="stat-card">
							<h3 className="stat-title">{t("totalOrders")}</h3>
							<div className="stat-value">{orders.length}</div>
							<p className="stat-subtitle">{t("allTime")}</p>
						</div>

						<div className="stat-card">
							<h3 className="stat-title">{t("holdingsValue")}</h3>
							<div className="stat-value">
								{formatPrice(currentHoldingsValue)}
							</div>
							<p className="stat-subtitle">
								{enrichedAssets.length} {t("assets")}
							</p>
						</div>

						<div className="stat-card">
							<h3 className="stat-title">{t("totalValue")}</h3>
							<div className="stat-value">
								{formatPrice(totalAccountValue)}
							</div>
							<p className="stat-subtitle">{t("cashAndHoldings")}</p>
						</div>
					</>
				)}
			</div>

			{hasNoData ? (
				<div className="flex flex-col items-center justify-center p-14 text-center">
					<p className="text-text-secondary mb-4">{t("noOrdersYet")}</p>
					<button
						className="btn-primary"
						onClick={() => navigate("/markets")}
					>
						{t("startTrading")}
						</button>
					</div>
				) : (
				<>
					<div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-6 mb-8">
						{showSkeletons ? (
							<>
								<StatsChartSkeleton />
								<StatsChartSkeleton />
							</>
						) : (
							<>
								{orders.length > 0 && (
									<div className="card-padded stats-chart-card">
								<div className="stats-chart-header">
									<h2 className="section-header">{t("ordersByType")}</h2>
									<div className="stats-chart-meta">
										<span className="stats-chart-pill">
											{ordersByTypeData.reduce((sum, item) => sum + item.value, 0)}{" "}
											{t("orders")}
										</span>
									</div>
								</div>
								<ChartContainer className="h-75 w-full aspect-auto">
									<ResponsiveContainer width="100%" height="100%">
										<BarChart
											data={ordersByTypeData}
											margin={{ top: 8, right: 8, left: 8, bottom: 0 }}
										>
											<CartesianGrid
												strokeDasharray="3 3"
												stroke="#2b3139"
											/>
											<XAxis
												dataKey="name"
												stroke="#848e9c"
												tickLine={false}
												axisLine={false}
											/>
											<YAxis
												stroke="#848e9c"
												allowDecimals={false}
												tickLine={false}
												axisLine={false}
											/>
											<Tooltip
												cursor={{ fill: "rgba(132, 142, 156, 0.14)" }}
												content={
													<ChartTooltip
														formatter={(value) => value}
													/>
												}
											/>
										<Bar
											dataKey="value"
											radius={[6, 6, 0, 0]}
											activeBar={false}
											isAnimationActive={true}
											animationDuration={900}
											animationBegin={120}
											animationEasing="ease-out"
										>
												{ordersByTypeData.map((entry, index) => (
													<Cell key={`cell-${index}`} fill={entry.fill} />
												))}
											</Bar>
										</BarChart>
									</ResponsiveContainer>
								</ChartContainer>
							</div>
								)}

								{profitOverTime.length > 0 && (
									<div className="card-padded stats-chart-card">
								<div className="stats-chart-header">
									<h2 className="section-header">
										{t("profitLossOverTime")}
									</h2>
									<div className="stats-chart-meta">
										<span className="stats-chart-pill">
											{formatPrice(
												profitOverTime[profitOverTime.length - 1]?.profit ||
													0,
											)}
										</span>
									</div>
								</div>
								<p className="stats-chart-subtitle">
									Daily closing profit from last trade of each day
								</p>
								<ChartContainer className="h-75 w-full aspect-auto">
									<ResponsiveContainer width="100%" height="100%">
										<AreaChart
											data={profitOverTime}
											margin={{ top: 8, right: 8, left: 8, bottom: 0 }}
										>
											<CartesianGrid
												strokeDasharray="3 3"
												stroke="#2b3139"
											/>
											<XAxis
												dataKey="ts"
												type="number"
												domain={["dataMin", "dataMax"]}
												stroke="#848e9c"
												tickLine={false}
												axisLine={false}
												tickFormatter={(value) =>
													new Date(Number(value)).toLocaleDateString(
														[],
														{ day: "2-digit", month: "2-digit" },
													)
												}
											/>
											<YAxis
												domain={profitYAxisDomain}
												stroke="#848e9c"
												tickLine={false}
												axisLine={false}
												tickFormatter={(value) =>
													formatAxisValue(Number(value))
												}
											/>
											<Tooltip
												content={
													<ChartTooltip
														labelFormatter={(label) =>
															new Date(Number(label)).toLocaleString(
																[],
																{
																	day: "2-digit",
																	month: "2-digit",
																	hour: "2-digit",
																	minute: "2-digit",
																},
															)
														}
														formatter={(value) =>
															formatPrice(value as number)
														}
													/>
												}
											/>
											<Legend content={<ChartLegend />} />
											<Area
												type="monotone"
												dataKey="profit"
												stroke="#3861fb"
												strokeWidth={2.5}
												fill="none"
												fillOpacity={0}
												dot={false}
												strokeLinecap="round"
												strokeLinejoin="round"
												isAnimationActive={true}
												animationDuration={1000}
												animationBegin={120}
												animationEasing="ease-out"
												name={t("netProfit")}
											/>
										</AreaChart>
									</ResponsiveContainer>
								</ChartContainer>
							</div>
								)}
							</>
						)}
					</div>

					{topPerformers.length > 0 && (
						<div className="card-padded top-performers-card">
							<h2 className="section-header top-performers-header">
								{t("topPerformers")}
							</h2>
							<div className="top-performers-grid">
								{topPerformers.map((asset, index) => {
									const sparkData =
										topPerformerSparks.get(asset.asset_symbol) || [];
									const isPositive = asset.pnl >= 0;
											return (
												<div
													key={asset.asset_symbol}
													className={`top-performer-card ${
														isPositive ? "is-positive" : "is-negative"
													}`}
												>
											<div className="top-performer-info">
												<div className="top-performer-rank">
													#{index + 1}
												</div>
												<TopPerformerIcon
													symbol={asset.asset_symbol}
													shortName={asset.name}
													initialImageUrl={asset.image_url}
												/>
												<div className="top-performer-meta">
													<div className="top-performer-name">
														{asset.name}
													</div>
													<div className="top-performer-symbol">
														{asset.asset_symbol}
													</div>
													<div className="top-performer-badges">
														<span className="top-performer-pill">
															{asset.trades} trades
														</span>
														<span className="top-performer-pill">
															hold {asset.holding.toFixed(4)} {asset.name}
														</span>
													</div>
												</div>
											</div>
											<div className="top-performer-spark">
												{sparkData.length > 1 ? (
													<ResponsiveContainer width="100%" height="100%">
														<LineChart data={sparkData}>
															<Line
																type="monotone"
																dataKey="pnl"
																stroke={isPositive ? "#0ecb81" : "#f6465d"}
																strokeWidth={2}
																dot={false}
															/>
														</LineChart>
													</ResponsiveContainer>
												) : (
													<div className="top-performer-spark-empty">
														No chart yet
													</div>
												)}
											</div>
											<div
												className={`top-performer-pnl ${
													isPositive ? "is-positive" : "is-negative"
												}`}
											>
												<div className="top-performer-pnl-icon">
													{isPositive ? (
														<TrendingUp className="w-4 h-4" />
													) : (
														<TrendingDown className="w-4 h-4" />
													)}
												</div>
												<div className="top-performer-pnl-value">
													{isPositive ? "+" : ""}
													{formatPrice(asset.pnl)}
												</div>
												<div className="top-performer-pnl-label">
													Realized PnL
												</div>
											</div>
										</div>
									);
								})}
							</div>
						</div>
					)}
				</>
			)}
		</div>
	);
};

const TopPerformerIcon = ({
	symbol,
	shortName,
	initialImageUrl,
}: {
	symbol: string;
	shortName: string;
	initialImageUrl: string | null;
}) => {
	const defaultIcon = `https://ui-avatars.com/api/?name=${shortName}&background=random&size=64`;
	const { imageUrl } = useIconLoader({
		symbol,
		initialImageUrl,
		enabled: !initialImageUrl,
	});
	const [useFallback, setUseFallback] = useState(false);
	const currentSrc = useFallback
		? defaultIcon
		: imageUrl || initialImageUrl || defaultIcon;

	return (
		<div className="top-performer-icon">
			<img
				src={currentSrc}
				alt={shortName}
				loading="lazy"
				onError={() => setUseFallback(true)}
			/>
		</div>
	);
};

export default Statistics;
