import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Landmark, PieChart, TrendingUp, Wallet } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchAssets, fetchChartData } from "@/store/slices/assetsSlice";
import { fetchPortfolio } from "@/store/slices/portfolioSlice";
import { fetchOrders } from "@/store/slices/ordersSlice";
import { useBinanceWebSocket } from "@/hooks/useBinanceWebSocket";
import { binanceWebSocketService } from "@/services/binanceWebSocket";
import { formatPrice } from "@/utils/formatPrice";
import Card, { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Button from "@/components/ui/button";
import { DashboardHero } from "./dashboard/DashboardHero";
import { DashboardMetricCard } from "./dashboard/DashboardMetricCard";
import { BalanceChart } from "./dashboard/BalanceChart";
import { TopMovers } from "./dashboard/TopMovers";
import { QuickActions } from "./dashboard/QuickActions";
import {
	BALANCE_HISTORY_INTERVAL,
	BALANCE_HISTORY_LIMIT,
	BALANCE_HISTORY_STEP_MS,
	buildBalanceHistory,
} from "./dashboard/balanceHistory";

const Dashboard = () => {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const dispatch = useAppDispatch();

	const { isAuthenticated } = useAppSelector((state) => state.auth);
	const { assets, isLoading: assetsLoading, chartData } = useAppSelector((state) => state.assets);
	const { portfolio, isLoading: portfolioLoading } = useAppSelector((state) => state.portfolio);
	const { orders, isLoading: ordersLoading } = useAppSelector((state) => state.orders);
	const [priceTick, setPriceTick] = useState(0);
	const [isCompactChart, setIsCompactChart] = useState(false);

	const initialFetchDone = useRef(false);

	useEffect(() => {
		const mediaQuery = window.matchMedia("(max-width: 640px)");
		const updateCompactChart = () => setIsCompactChart(mediaQuery.matches);

		updateCompactChart();
		mediaQuery.addEventListener("change", updateCompactChart);

		return () => {
			mediaQuery.removeEventListener("change", updateCompactChart);
		};
	}, []);

	useEffect(() => {
		if (initialFetchDone.current) return;
		initialFetchDone.current = true;

		if (assets.length === 0) {
			dispatch(fetchAssets({ limit: 12, sortBy: "price", sortOrder: "desc" }));
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
	const wsSymbols = useMemo(() => assets.map((asset) => asset.symbol), [assets]);
	useBinanceWebSocket({ symbols: wsSymbols, enabled: wsSymbols.length > 0 });

	useEffect(() => {
		const handlePriceUpdate = () => setPriceTick((tick) => tick + 1);
		binanceWebSocketService.subscribe(handlePriceUpdate);
		return () => binanceWebSocketService.unsubscribe(handlePriceUpdate);
	}, []);

	const priceMap = useMemo(() => {
		void priceTick;
		return assets.reduce<Record<string, number>>((acc, asset) => {
			acc[asset.symbol] =
				binanceWebSocketService.getPrice(asset.symbol) ??
				asset.price ??
				asset.current_price ??
				0;
			return acc;
		}, {});
	}, [assets, priceTick]);

	const cashBalance = portfolio?.balance || 0;
	const currentHoldings = useMemo(() => {
		const map = new Map<string, number>();
		if (!portfolio) return map;
		portfolio.assets.forEach((asset) => map.set(asset.asset_symbol, asset.amount));
		return map;
	}, [portfolio]);

	const holdingsValue = useMemo(() => {
		if (!portfolio) return 0;
		return portfolio.assets.reduce(
			(sum, asset) => sum + asset.amount * (priceMap[asset.asset_symbol] || 0),
			0,
		);
	}, [portfolio, priceMap]);

	const totalBalance = cashBalance + holdingsValue;

	const recentOrders = useMemo(() => {
		const sevenDaysAgo = Date.now() - BALANCE_HISTORY_LIMIT * BALANCE_HISTORY_STEP_MS;
		return orders.filter((order) => new Date(order.timestamp).getTime() >= sevenDaysAgo);
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
		if (balanceHistorySymbols.length === 0) return;
		const symbolsToFetch = balanceHistorySymbols.filter((symbol) => !(symbol in chartData));
		if (symbolsToFetch.length === 0) return;
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

	const balanceHistory = useMemo(
		() => buildBalanceHistory(recentOrders, priceMap, cashBalance, currentHoldings, chartData),
		[recentOrders, priceMap, cashBalance, currentHoldings, chartData],
	);

	const balanceChange = useMemo(() => {
		if (balanceHistory.length < 2) return 0;
		const first = balanceHistory[0].value;
		const last = balanceHistory[balanceHistory.length - 1].value;
		if (first === 0) return 0;
		return ((last - first) / first) * 100;
	}, [balanceHistory]);

	if (!isAuthenticated) {
		return (
			<Card>
				<CardHeader>
					<CardTitle className="text-3xl">{t("welcomeToMakakaTrade")}</CardTitle>
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
		<div className="glass-page-shell">
			<div className="glass-page-body">
				<DashboardHero live />

				<div className="glass-metric-grid glass-metric-grid--four">
					<DashboardMetricCard
						title={t("totalBalance")}
						value={formatPrice(totalBalance)}
						numericValue={totalBalance}
						format={formatPrice}
						description={t("cashAndHoldings")}
						icon={Wallet}
					/>
					<DashboardMetricCard
						title={t("cashBalance")}
						value={formatPrice(cashBalance)}
						numericValue={cashBalance}
						format={formatPrice}
						description={t("available")}
						icon={Landmark}
					/>
					<DashboardMetricCard
						title={t("portfolioValue")}
						value={formatPrice(holdingsValue)}
						numericValue={holdingsValue}
						format={formatPrice}
						description={`${portfolio?.assets.length || 0} ${t("assets")}`}
						icon={PieChart}
					/>
					<DashboardMetricCard
						title={t("balanceTrend")}
						value={`${balanceChange >= 0 ? "+" : ""}${balanceChange.toFixed(2)}%`}
						description={t("last7DaysHourly")}
						icon={TrendingUp}
						valueClassName={`text-2xl ${balanceChange >= 0 ? "portfolio-status-text-positive" : "portfolio-status-text-negative"}`}
					/>
				</div>

				<div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
					<BalanceChart
						data={balanceHistory}
						isLoading={isLoading || isBalanceHistoryLoading}
						isCompact={isCompactChart}
					/>
					<TopMovers assets={assets} />
				</div>

				<QuickActions />
			</div>
		</div>
	);
};

export default Dashboard;
