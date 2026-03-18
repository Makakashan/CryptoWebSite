import { useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
	Area,
	AreaChart,
	CartesianGrid,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import {
	ArrowRight,
	TrendingUp,
	Wallet,
	PieChart,
	Landmark,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { fetchAssets, fetchChartData } from "../store/slices/assetsSlice";
import { fetchPortfolio } from "../store/slices/portfolioSlice";
import { fetchOrders } from "../store/slices/ordersSlice";
import { formatPrice } from "../utils/formatPrice";
import Card, {
	CardAction,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import Button from "@/components/ui/button";
import type { Order } from "../store/types/orders.types";

type BalancePoint = {
	ts: number;
	label: string;
	value: number;
};

const BALANCE_HISTORY_INTERVAL = "1h";
const BALANCE_HISTORY_LIMIT = 7 * 24;
const BALANCE_HISTORY_STEP_MS = 60 * 60 * 1000;

const formatPointLabel = (timestamp: number): string => {
	const date = new Date(timestamp);
	return `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1)
		.toString()
		.padStart(2, "0")} ${date.getHours().toString().padStart(2, "0")}:${date
		.getMinutes()
		.toString()
		.padStart(2, "0")}`;
};

const formatAxisPrice = (value: number): string => {
	const abs = Math.abs(value);
	if (abs >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
	if (abs >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
	if (abs >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
	return `$${value.toFixed(0)}`;
};

const calculateHoldingsValue = (
	holdings: Map<string, number>,
	valuationPrices: Record<string, number>,
): number => {
	let total = 0;
	holdings.forEach((amount, symbol) => {
		if (amount <= 0) return;
		total += amount * (valuationPrices[symbol] || 0);
	});
	return total;
};

const applyOrderToState = (
	holdings: Map<string, number>,
	cash: number,
	order: Order,
	direction: "forward" | "rewind",
): number => {
	const totalAmount = order.amount * order.price_at_transaction;
	const currentAmount = holdings.get(order.asset_symbol) || 0;

	if (direction === "forward") {
		if (order.order_type === "BUY") {
			holdings.set(order.asset_symbol, currentAmount + order.amount);
			return cash - totalAmount;
		}

		const nextAmount = Math.max(0, currentAmount - order.amount);
		if (nextAmount > 0) {
			holdings.set(order.asset_symbol, nextAmount);
		} else {
			holdings.delete(order.asset_symbol);
		}
		return cash + totalAmount;
	}

	if (order.order_type === "BUY") {
		const nextAmount = Math.max(0, currentAmount - order.amount);
		if (nextAmount > 0) {
			holdings.set(order.asset_symbol, nextAmount);
		} else {
			holdings.delete(order.asset_symbol);
		}
		return cash + totalAmount;
	}

	holdings.set(order.asset_symbol, currentAmount + order.amount);
	return cash - totalAmount;
};

const getHistoricalPrice = (
	symbol: string,
	pointIndex: number,
	totalPoints: number,
	historicalPrices: Record<string, number[]>,
	currentPrices: Record<string, number>,
): number => {
	const series = historicalPrices[symbol];
	const currentPrice = currentPrices[symbol] || 0;

	if (!series || series.length === 0) {
		return currentPrice;
	}

	if (pointIndex === totalPoints - 1 && currentPrice > 0) {
		return currentPrice;
	}

	const mappedIndex =
		totalPoints <= 1
			? 0
			: Math.round((pointIndex * (series.length - 1)) / (totalPoints - 1));

	return series[mappedIndex] || currentPrice;
};

const buildBalanceHistory = (
	orders: Order[],
	currentPrices: Record<string, number>,
	currentCashBalance: number,
	currentHoldings: Map<string, number>,
	historicalPrices: Record<string, number[]>,
): BalancePoint[] => {
	if (orders.length === 0 && currentHoldings.size === 0) {
		return [];
	}

	const sortedOrdersAsc = [...orders].sort(
		(a, b) =>
			new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
	);
	const endTime = Date.now();
	const startTime =
		endTime - (BALANCE_HISTORY_LIMIT - 1) * BALANCE_HISTORY_STEP_MS;
	const ordersInRange = sortedOrdersAsc.filter(
		(order) => new Date(order.timestamp).getTime() >= startTime,
	);

	let cash = currentCashBalance;
	const holdings = new Map<string, number>(currentHoldings);

	for (let index = ordersInRange.length - 1; index >= 0; index--) {
		cash = applyOrderToState(holdings, cash, ordersInRange[index], "rewind");
	}

	const trackedSymbols = new Set<string>([
		...currentHoldings.keys(),
		...ordersInRange.map((order) => order.asset_symbol),
	]);
	const points: BalancePoint[] = [];
	let orderIndex = 0;

	for (let pointIndex = 0; pointIndex < BALANCE_HISTORY_LIMIT; pointIndex++) {
		const ts = startTime + pointIndex * BALANCE_HISTORY_STEP_MS;

		while (orderIndex < ordersInRange.length) {
			const order = ordersInRange[orderIndex];
			const orderTimestamp = new Date(order.timestamp).getTime();
			if (orderTimestamp > ts) {
				break;
			}

			cash = applyOrderToState(holdings, cash, order, "forward");
			orderIndex += 1;
		}

		const valuationPrices: Record<string, number> = {};
		trackedSymbols.forEach((symbol) => {
			valuationPrices[symbol] = getHistoricalPrice(
				symbol,
				pointIndex,
				BALANCE_HISTORY_LIMIT,
				historicalPrices,
				currentPrices,
			);
		});

		points.push({
			ts,
			label: formatPointLabel(ts),
			value: cash + calculateHoldingsValue(holdings, valuationPrices),
		});
	}

	return points;
};

const Dashboard = () => {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const dispatch = useAppDispatch();

	const { isAuthenticated } = useAppSelector((state) => state.auth);
	const {
		assets,
		isLoading: assetsLoading,
		chartData,
	} = useAppSelector((state) => state.assets);
	const { portfolio, isLoading: portfolioLoading } = useAppSelector(
		(state) => state.portfolio,
	);
	const { orders, isLoading: ordersLoading } = useAppSelector(
		(state) => state.orders,
	);

	const initialFetchDone = useRef(false);

	useEffect(() => {
		if (initialFetchDone.current) return;
		initialFetchDone.current = true;

		if (assets.length === 0) {
			dispatch(
				fetchAssets({ limit: 12, sortBy: "price", sortOrder: "desc" }),
			);
		}

		if (isAuthenticated) {
			if (!portfolio) {
				dispatch(fetchPortfolio());
			}

			if (orders.length === 0) {
				dispatch(
					fetchOrders({
						page: 1,
						limit: 200,
						sortBy: "timestamp",
						sortOrder: "asc",
					}),
				);
			}
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [dispatch, isAuthenticated]);

	const isLoading = assetsLoading || portfolioLoading || ordersLoading;

	const priceMap = useMemo(() => {
		return assets.reduce<Record<string, number>>((acc, asset) => {
			acc[asset.symbol] = asset.price || asset.current_price || 0;
			return acc;
		}, {});
	}, [assets]);

	const cashBalance = portfolio?.balance || 0;
	const currentHoldings = useMemo(() => {
		const map = new Map<string, number>();
		if (!portfolio) return map;

		portfolio.assets.forEach((asset) => {
			map.set(asset.asset_symbol, asset.amount);
		});

		return map;
	}, [portfolio]);

	const holdingsValue = useMemo(() => {
		if (!portfolio) return 0;

		return portfolio.assets.reduce((sum, portfolioAsset) => {
			return (
				sum +
				portfolioAsset.amount * (priceMap[portfolioAsset.asset_symbol] || 0)
			);
		}, 0);
	}, [portfolio, priceMap]);

	const totalBalance = cashBalance + holdingsValue;

	const recentOrders = useMemo(() => {
		const sevenDaysAgo =
			Date.now() - BALANCE_HISTORY_LIMIT * BALANCE_HISTORY_STEP_MS;
		return orders.filter(
			(order) => new Date(order.timestamp).getTime() >= sevenDaysAgo,
		);
	}, [orders]);

	const balanceHistorySymbols = useMemo(() => {
		if (!isAuthenticated) return [];

		return Array.from(
			new Set([
				...(portfolio?.assets.map((asset) => asset.asset_symbol) ?? []),
				...recentOrders.map((order) => order.asset_symbol),
			]),
		).slice(0, 50);
	}, [isAuthenticated, portfolio, recentOrders]);

	useEffect(() => {
		if (balanceHistorySymbols.length === 0) {
			return;
		}

		const symbolsToFetch = balanceHistorySymbols.filter(
			(symbol) => !(symbol in chartData),
		);

		if (symbolsToFetch.length === 0) {
			return;
		}

		dispatch(
			fetchChartData({
				symbols: symbolsToFetch,
				interval: BALANCE_HISTORY_INTERVAL,
				limit: BALANCE_HISTORY_LIMIT,
			}),
		);
	}, [balanceHistorySymbols, chartData, dispatch]);

	const isBalanceHistoryLoading =
		balanceHistorySymbols.length > 0 &&
		balanceHistorySymbols.some((symbol) => !(symbol in chartData));

	const balanceHistory = useMemo(() => {
		return buildBalanceHistory(
			recentOrders,
			priceMap,
			cashBalance,
			currentHoldings,
			chartData,
		);
	}, [recentOrders, priceMap, cashBalance, currentHoldings, chartData]);

	const balanceChange = useMemo(() => {
		if (balanceHistory.length < 2) return 0;

		const first = balanceHistory[0].value;
		const last = balanceHistory[balanceHistory.length - 1].value;
		if (first === 0) return 0;

		return ((last - first) / first) * 100;
	}, [balanceHistory]);

	const yAxisDomain = useMemo<[number, number]>(() => {
		if (balanceHistory.length === 0) return [0, 100];

		const values = balanceHistory.map((point) => point.value);
		const min = Math.min(...values);
		const max = Math.max(...values);

		if (min === max) {
			const padding = Math.max(1, Math.abs(min) * 0.02);
			return [min - padding, max + padding];
		}

		const padding = (max - min) * 0.12;
		return [min - padding, max + padding];
	}, [balanceHistory]);

	const topMovers = useMemo(() => {
		return [...assets]
			.filter((asset) => typeof asset.price_change_24h === "number")
			.sort(
				(a, b) =>
					Math.abs(b.price_change_24h || 0) -
					Math.abs(a.price_change_24h || 0),
			)
			.slice(0, 5);
	}, [assets]);

	if (!isAuthenticated) {
		return (
			<Card>
				<CardHeader>
					<CardTitle className="text-3xl">
						{t("welcomeToMakakaTrade")}
					</CardTitle>
					<CardDescription>{t("loginToViewPortfolio")}</CardDescription>
				</CardHeader>
				<CardContent className="flex flex-wrap gap-3">
					<Button onClick={() => navigate("/login")}>{t("login")}</Button>
					<Button variant="outline" onClick={() => navigate("/markets")}>
						{t("viewMarkets")}
					</Button>
				</CardContent>
			</Card>
		);
	}

	return (
		<div className="space-y-6">
			<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
				<Card>
					<CardHeader className="pb-2">
						<CardDescription>{t("totalBalance")}</CardDescription>
						<CardTitle className="text-2xl">
							{formatPrice(totalBalance)}
						</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-xs text-text-secondary flex items-center gap-2">
							<Wallet className="w-3.5 h-3.5" />
							{t("cashAndHoldings")}
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-2">
						<CardDescription>{t("cashBalance")}</CardDescription>
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

				<Card>
					<CardHeader className="pb-2">
						<CardDescription>{t("portfolioValue")}</CardDescription>
						<CardTitle className="text-2xl">
							{formatPrice(holdingsValue)}
						</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-xs text-text-secondary flex items-center gap-2">
							<PieChart className="w-3.5 h-3.5" />
							{portfolio?.assets.length || 0} {t("assets")}
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-2">
						<CardDescription>{t("balanceTrend")}</CardDescription>
						<CardTitle
							className={`text-2xl ${balanceChange >= 0 ? "text-emerald-400" : "text-rose-400"}`}
						>
							{balanceChange >= 0 ? "+" : ""}
							{balanceChange.toFixed(2)}%
						</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-xs text-text-secondary flex items-center gap-2">
							<TrendingUp className="w-3.5 h-3.5" />
							{t("last7DaysHourly")}
						</p>
					</CardContent>
				</Card>
			</div>

			<div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
				<Card className="xl:col-span-2">
					<CardHeader>
						<CardTitle className="text-xl">
							{t("balanceOverTime")}
						</CardTitle>
						<CardDescription>
							{t("balanceOverTimeDescription")}
						</CardDescription>
						<CardAction>
							<Button
								variant="outline"
								size="sm"
								onClick={() => navigate("/statistics")}
							>
								{t("details")}
							</Button>
						</CardAction>
					</CardHeader>
					<CardContent>
						{isLoading || isBalanceHistoryLoading ? (
							<div className="h-75 rounded-lg bg-bg-hover/40 animate-pulse" />
						) : balanceHistory.length > 1 ? (
							<div className="h-75">
								<ResponsiveContainer width="100%" height="100%">
									<AreaChart
										data={balanceHistory}
										margin={{ top: 8, right: 8, left: 8, bottom: 0 }}
									>
										<defs>
											<linearGradient
												id="balanceGradient"
												x1="0"
												y1="0"
												x2="0"
												y2="1"
											>
												<stop
													offset="5%"
													stopColor="#3861fb"
													stopOpacity={0.45}
												/>
												<stop
													offset="95%"
													stopColor="#3861fb"
													stopOpacity={0.05}
												/>
											</linearGradient>
										</defs>
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
											domain={yAxisDomain}
											width={90}
											stroke="#848e9c"
											tickLine={false}
											axisLine={false}
											tickFormatter={(value) =>
												formatAxisPrice(Number(value))
											}
										/>
										<Tooltip
											labelFormatter={(label) =>
												new Date(Number(label)).toLocaleString([], {
													day: "2-digit",
													month: "2-digit",
													hour: "2-digit",
													minute: "2-digit",
												})
											}
											formatter={(value, _name, item) => [
												formatPrice(Number(value)),
												item?.payload?.label || t("balance"),
											]}
											contentStyle={{
												backgroundColor: "#1a1d23",
												border: "1px solid #2b3139",
												borderRadius: "10px",
											}}
										/>
										<Area
											type="monotone"
											dataKey="value"
											stroke="#3861fb"
											strokeWidth={2.5}
											fill="url(#balanceGradient)"
										/>
									</AreaChart>
								</ResponsiveContainer>
							</div>
						) : (
							<div className="h-75 flex items-center justify-center text-text-secondary text-sm">
								{t("addMoreTradesToBuildChart")}
							</div>
						)}
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="text-xl">{t("topMovers")}</CardTitle>
						<CardDescription>{t("strongest24hMove")}</CardDescription>
					</CardHeader>
					<CardContent className="space-y-3">
						{topMovers.length === 0 ? (
							<p className="text-sm text-text-secondary">
								{t("noMarketDataYet")}
							</p>
						) : (
							topMovers.map((asset) => {
								const shortName = asset.symbol.replace("USDT", "");
								const defaultIcon = `https://ui-avatars.com/api/?name=${shortName}&background=random&size=32`;
								const price = asset.price || asset.current_price || 0;
								const change = asset.price_change_24h || 0;

								return (
									<button
										type="button"
										key={asset.symbol}
										className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-bg-hover transition-colors"
										onClick={() =>
											navigate(`/markets/${asset.symbol}`)
										}
									>
										<div className="flex items-center gap-3 text-left">
											<img
												src={asset.image_url || defaultIcon}
												alt={shortName}
												className="w-8 h-8 rounded-full"
												onError={(e) => {
													e.currentTarget.src = defaultIcon;
												}}
											/>
											<div>
												<p className="text-sm font-semibold text-text-primary">
													{shortName}
												</p>
												<p className="text-xs text-text-secondary">
													{formatPrice(price)}
												</p>
											</div>
										</div>
										<span
											className={`text-xs font-semibold px-2 py-1 rounded ${
												change >= 0
													? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
													: "bg-rose-500/10 text-rose-400 border border-rose-500/30"
											}`}
										>
											{change >= 0 ? "+" : ""}
											{change.toFixed(2)}%
										</span>
									</button>
								);
							})
						)}

						<Button
							variant="outline"
							className="w-full mt-2"
							onClick={() => navigate("/markets")}
						>
							{t("viewMarkets")}
							<ArrowRight className="w-4 h-4" />
						</Button>
					</CardContent>
				</Card>
			</div>

			<Card>
				<CardHeader>
					<CardTitle className="text-xl">{t("quickActions")}</CardTitle>
					<CardDescription>{t("shortcutsForNextMove")}</CardDescription>
				</CardHeader>
				<CardContent className="flex flex-wrap gap-3">
					<Button onClick={() => navigate("/markets")}>
						{t("viewMarkets")}
					</Button>
					<Button
						variant="secondary"
						onClick={() => navigate("/portfolio")}
					>
						{t("myPortfolio")}
					</Button>
					<Button variant="secondary" onClick={() => navigate("/orders")}>
						{t("orderHistory")}
					</Button>
				</CardContent>
			</Card>
		</div>
	);
};

export default Dashboard;
