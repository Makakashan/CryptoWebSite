import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
	PieChart,
	Pie,
	Cell,
	BarChart,
	Bar,
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

const CHART_COLORS = ["#3861fb", "#0ecb81", "#f6465d", "#ffa500", "#9c27b0"];
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
}

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
		if (!isAuthenticated) {
			navigate("/login");
			return;
		}

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

	const assetDistributionData = useMemo(() => {
		const total = enrichedAssets.reduce((sum, asset) => sum + asset.value, 0);

		return enrichedAssets
			.filter((asset) => asset.value > 0)
			.map((asset) => ({
				name: asset.name,
				value: asset.value,
				share: total > 0 ? (asset.value / total) * 100 : 0,
			}));
	}, [enrichedAssets]);

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
		return buildProfitHistory(orders, priceMap);
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
		const grouped = new Map<
			string,
			{
				trades: number;
				boughtAmount: number;
				soldAmount: number;
				totalSpent: number;
				totalEarned: number;
			}
		>();

		orders.forEach((order) => {
			const current = grouped.get(order.asset_symbol) || {
				trades: 0,
				boughtAmount: 0,
				soldAmount: 0,
				totalSpent: 0,
				totalEarned: 0,
			};
			const value = order.amount * order.price_at_transaction;

			current.trades += 1;
			if (order.order_type === "BUY") {
				current.boughtAmount += order.amount;
				current.totalSpent += value;
			} else {
				current.soldAmount += order.amount;
				current.totalEarned += value;
			}

			grouped.set(order.asset_symbol, current);
		});

		return Array.from(grouped.entries())
			.map(([symbol, stats]) => {
				const holding = Math.max(0, stats.boughtAmount - stats.soldAmount);
				const pnl =
					stats.totalEarned +
					holding * (priceMap[symbol] || 0) -
					stats.totalSpent;

				return {
					asset_symbol: symbol,
					name: symbol.replace("USDT", ""),
					trades: stats.trades,
					holding,
					pnl,
				};
			})
			.sort((a, b) => b.pnl - a.pnl);
	}, [orders, priceMap]);

	const currentHoldingsValue = useMemo(() => {
		return enrichedAssets.reduce((sum, asset) => sum + asset.value, 0);
	}, [enrichedAssets]);

	const totalAccountValue = useMemo(() => {
		return (portfolio?.balance || 0) + currentHoldingsValue;
	}, [portfolio, currentHoldingsValue]);

	if (ordersLoading || portfolioLoading) {
		return (
			<div className="flex flex-col items-center justify-center p-14 text-center">
				<div className="w-10 h-10 border-4 border-bg-hover border-t-blue rounded-full animate-spin mb-4"></div>
				<p className="text-text-secondary">{t("loading")}</p>
			</div>
		);
	}

	const hasNoData = orders.length === 0 && enrichedAssets.length === 0;

	return (
		<div>
			<div className="mb-6">
				<h1 className="text-text-primary text-2xl font-bold m-0">
					{t("tradingStatistics")}
				</h1>
			</div>

			<div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-4 mb-8">
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
					<div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
						{assetDistributionData.length > 0 && (
							<div className="card-padded">
								<h2 className="section-header">
									{t("assetDistribution")}
								</h2>
								<ResponsiveContainer width="100%" height={300}>
									<PieChart>
										<Pie
											data={assetDistributionData}
											cx="50%"
											cy="50%"
											labelLine={false}
											label={false}
											outerRadius={80}
											dataKey="value"
											nameKey="name"
										>
											{assetDistributionData.map((_entry, index) => (
												<Cell
													key={`cell-${index}`}
													fill={
														CHART_COLORS[
															index % CHART_COLORS.length
														]
													}
												/>
											))}
										</Pie>
										<Tooltip
											formatter={(value) =>
												formatPrice(value as number)
											}
											itemStyle={{ color: "#eaecef" }}
											labelStyle={{ color: "#eaecef" }}
											contentStyle={{
												backgroundColor: "#1a1d23",
												border: "1px solid #2b3139",
												borderRadius: "10px",
												color: "#eaecef",
											}}
										/>
										<Legend
											formatter={(value, _entry, index) => {
												const item = assetDistributionData[index];
												if (!item) return value;
												return `${item.name}: ${item.share.toFixed(1)}%`;
											}}
										/>
									</PieChart>
								</ResponsiveContainer>
							</div>
						)}

						{orders.length > 0 && (
							<div className="card-padded">
								<h2 className="section-header">{t("ordersByType")}</h2>
									<ResponsiveContainer width="100%" height={300}>
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
												cursor={{
													fill: "rgba(132, 142, 156, 0.14)",
												}}
												itemStyle={{ color: "#eaecef" }}
												labelStyle={{ color: "#eaecef" }}
												contentStyle={{
													backgroundColor: "#1a1d23",
													border: "1px solid #2b3139",
													borderRadius: "10px",
													color: "#eaecef",
												}}
											/>
											<Bar
												dataKey="value"
												radius={[6, 6, 0, 0]}
												activeBar={false}
											>
												{ordersByTypeData.map((entry, index) => (
													<Cell
													key={`cell-${index}`}
													fill={entry.fill}
												/>
											))}
										</Bar>
									</BarChart>
								</ResponsiveContainer>
							</div>
						)}

						{profitOverTime.length > 0 && (
							<div className="card-padded xl:col-span-2">
								<h2 className="section-header">
									{t("profitLossOverTime")}
								</h2>
								<ResponsiveContainer width="100%" height={300}>
									<LineChart
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
													{
														day: "2-digit",
														month: "2-digit",
													},
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
											labelFormatter={(value) =>
												new Date(Number(value)).toLocaleString([], {
													day: "2-digit",
													month: "2-digit",
													hour: "2-digit",
													minute: "2-digit",
												})
											}
											formatter={(value) =>
												formatPrice(value as number)
											}
											itemStyle={{ color: "#eaecef" }}
											labelStyle={{ color: "#eaecef" }}
											contentStyle={{
												backgroundColor: "#1a1d23",
												border: "1px solid #2b3139",
												borderRadius: "10px",
												color: "#eaecef",
											}}
										/>
										<Legend />
										<Line
											type="monotone"
											dataKey="profit"
											stroke="#3861fb"
											strokeWidth={2.5}
											dot={{ fill: "#3861fb", strokeWidth: 0, r: 4 }}
											activeDot={{
												fill: "#3861fb",
												stroke: "#ffffff",
												strokeWidth: 2,
												r: 5,
											}}
											name={t("netProfit")}
										/>
									</LineChart>
								</ResponsiveContainer>
							</div>
						)}
					</div>

					{topPerformers.length > 0 && (
						<div className="card-padded">
							<h2 className="section-header">{t("topPerformers")}</h2>
							<div className="space-y-3">
								{topPerformers.map((asset) => (
										<div
											key={asset.asset_symbol}
											className="flex flex-wrap gap-2 justify-between items-center p-4 bg-bg-dark rounded-lg"
										>
											<div className="font-semibold text-text-primary">
												{asset.name}
											</div>
											<div className="text-text-secondary text-sm">
												{asset.trades} trades
											</div>
											<div className="text-text-secondary text-sm">
												hold: {asset.holding.toFixed(6)}
											</div>
											<div
												className={`font-bold ${asset.pnl >= 0 ? "text-green" : "text-red"}`}
											>
												{asset.pnl >= 0 ? "+" : ""}
												{formatPrice(asset.pnl)}
											</div>
										</div>
									))}
							</div>
						</div>
					)}
				</>
			)}
		</div>
	);
};

export default Statistics;
