import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
	TrendingUp,
	ArrowUpRight,
	ArrowDownRight,
	DollarSign,
	BarChart3,
	Activity,
} from "lucide-react";
import { AreaChart, Area, ResponsiveContainer, YAxis } from "recharts";
import type { RootState } from "../store/store";
import { useBinanceWebSocket } from "../hooks/useBinanceWebSocket";
import { formatPrice } from "../utils/formatPrice";
import { fetchAssets } from "../store/slices/assetsSlice";
import { useAppDispatch } from "../store/hooks";
import { AssetCardSkeleton } from "@/components/skeletons/AssetCardSkeleton";
import Card from "@/components/ui/card";

type BalanceHistoryPoint = {
	time: string;
	value: number;
};

const generateBalanceHistory = (currentBalance: number): BalanceHistoryPoint[] => {
	const data: BalanceHistoryPoint[] = [];
	const points = 7 * 24;
	let balance = currentBalance * (1 + (Math.random() - 0.5) * 0.1);
	for (let i = 0; i < points; i++) {
		balance += (Math.random() - 0.48) * currentBalance * 0.005;
		data.push({
			time: new Date(Date.now() - (points - i) * 3600000).toISOString(),
			value: Math.max(balance, 0),
		});
	}
	return data;
};

const Dashboard = () => {
	const dispatch = useAppDispatch();
	const navigate = useNavigate();
	const { user, isLoading: authLoading } = useSelector((state: RootState) => state.auth);
	const { assets: allAssets } = useSelector((state: RootState) => state.assets);
	const [balanceHistory] = useState(() =>
		user?.balance ? generateBalanceHistory(user.balance) : [],
	);

	const portfolioAssets = useMemo(() => {
		if (!allAssets?.length) return [];
		return allAssets.slice(0, 10);
	}, [allAssets]);

	useBinanceWebSocket({
		symbols: portfolioAssets.map((a) => a.symbol),
		enabled: portfolioAssets.length > 0,
	});

	useEffect(() => {
		dispatch(fetchAssets({ limit: 20 }));
	}, [dispatch]);

	const balance = user?.balance ?? 0;
	const totalValue = balance;

	const topMovers = useMemo(() => {
		if (!portfolioAssets.length) return [];
		return [...portfolioAssets]
			.sort((a, b) => Math.abs(b.price_change_24h || 0) - Math.abs(a.price_change_24h || 0))
			.slice(0, 6);
	}, [portfolioAssets]);

	const stats = [
		{
			label: "Total Balance",
			value: `$${balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
			icon: DollarSign,
			color: "from-[#f23f5d] to-[#b81a3c]",
		},
		{
			label: "Portfolio Value",
			value: `$${totalValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
			icon: BarChart3,
			color: "from-emerald-500 to-emerald-700",
		},
		{
			label: "Total Assets",
			value: `${portfolioAssets.length || 0}`,
			icon: Activity,
			color: "from-violet-500 to-violet-700",
		},
		{
			label: "Top Performer",
			value: topMovers[0]
				? `${topMovers[0].symbol} (${(topMovers[0].price_change_24h || 0) > 0 ? "+" : ""}${(topMovers[0].price_change_24h || 0).toFixed(2)}%)`
				: "N/A",
			icon: TrendingUp,
			color: "from-amber-500 to-amber-700",
		},
	];

	if (authLoading) {
		return (
			<div className="space-y-6">
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
					{Array.from({ length: 4 }).map((_, i) => (
						<div
							key={i}
							className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-5 backdrop-blur-xl"
						>
							<div className="flex items-center gap-3 mb-3">
								<div className="w-9 h-9 rounded-xl bg-white/[0.06]" />
								<div className="h-4 w-24 bg-white/[0.06] rounded" />
							</div>
							<div className="h-8 w-32 bg-white/[0.06] rounded" />
						</div>
					))}
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Hero Balance Card */}
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.6, ease: "easeOut" }}
				className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-2xl p-8"
				style={{
					boxShadow: "0 0 40px rgba(242, 63, 93, 0.08), inset 0 1px 0 rgba(255,255,255,0.1)",
				}}
			>
				<div className="absolute inset-0 bg-gradient-to-br from-[#f23f5d]/5 via-transparent to-[#f23f5d]/10 pointer-events-none" />
				<div className="relative z-10">
					<p className="text-sm font-medium text-white/50 mb-2">Total Balance</p>
					<h1
						className="text-5xl font-bold text-white mb-4"
						style={{ textShadow: "0px 4px 24px rgba(242, 63, 93, 0.3)" }}
					>
						${balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
					</h1>
					{balanceHistory.length > 0 && (
						<div className="h-32 w-full">
							<ResponsiveContainer width="100%" height="100%">
								<AreaChart data={balanceHistory}>
									<defs>
										<linearGradient id="balanceGrad" x1="0" y1="0" x2="0" y2="1">
											<stop offset="0%" stopColor="#f23f5d" stopOpacity={0.4} />
											<stop offset="100%" stopColor="#f23f5d" stopOpacity={0} />
										</linearGradient>
									</defs>
									<YAxis hide domain={["auto", "auto"]} />
									<Area
										type="monotone"
										dataKey="value"
										stroke="#f23f5d"
										strokeWidth={2}
										fill="url(#balanceGrad)"
										dot={false}
									/>
								</AreaChart>
							</ResponsiveContainer>
						</div>
					)}
				</div>
			</motion.div>

			{/* Stats Grid */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
				{stats.map((stat, index) => (
					<motion.div
						key={stat.label}
						initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
						animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
						transition={{ duration: 0.4, delay: index * 0.1, ease: "easeOut" }}
					>
						<Card
							className="p-5 hover:border-[#f23f5d]/20 transition-all duration-300 group"
							style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08)" }}
						>
							<div className="flex items-center gap-3 mb-3">
								<div
									className={`w-9 h-9 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg`}
								>
									<stat.icon className="w-4 h-4 text-white" />
								</div>
								<span className="text-xs font-medium text-white/50">{stat.label}</span>
							</div>
							<p className="text-lg font-semibold text-white truncate">{stat.value}</p>
						</Card>
					</motion.div>
				))}
			</div>

			{/* Top Movers */}
			<div>
				<h2 className="text-xl font-bold text-white mb-4">Top Movers</h2>
				{topMovers.length === 0 ? (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
						{Array.from({ length: 6 }).map((_, i) => (
							<AssetCardSkeleton key={i} />
						))}
					</div>
				) : (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
						{topMovers.map((asset, index) => (
							<motion.div
								key={asset.symbol}
								initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
								animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
								transition={{ duration: 0.4, delay: index * 0.05, ease: "easeOut" }}
							>
								<Card
									className="p-5 cursor-pointer hover:border-[#f23f5d]/20 hover:scale-[1.02] transition-all duration-300"
									style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08)" }}
									onClick={() => navigate(`/markets/${asset.symbol}`)}
								>
									<div className="flex items-start justify-between mb-3">
										<div className="flex items-center gap-3">
											{asset.image_url ? (
												<img
													src={asset.image_url}
													alt={asset.symbol}
													className="w-10 h-10 rounded-full"
												/>
											) : (
												<div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#f23f5d] to-[#b81a3c] flex items-center justify-center text-white text-xs font-bold">
													{asset.symbol.slice(0, 2)}
												</div>
											)}
											<div>
												<h3 className="text-sm font-semibold text-white">
													{asset.symbol}
												</h3>
												<p className="text-xs text-white/40">{asset.name}</p>
											</div>
										</div>
										<div
											className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold ${
												(asset.price_change_24h || 0) >= 0
													? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
													: "bg-red-500/10 text-red-400 border border-red-500/20"
											}`}
										>
											{(asset.price_change_24h || 0) >= 0 ? (
												<ArrowUpRight className="w-3 h-3" />
											) : (
												<ArrowDownRight className="w-3 h-3" />
											)}
											{Math.abs(asset.price_change_24h || 0).toFixed(2)}%
										</div>
									</div>
									<div className="flex items-end justify-between">
										<div>
											<p className="text-xl font-bold text-white">
												{formatPrice(asset.current_price || asset.price || 0)}
											</p>
											<p className="text-xs text-white/40 mt-1">
												{(asset.price_change_24h || 0) >= 0 ? "+" : ""}
												{(asset.price_change_24h || 0).toFixed(2)}%
											</p>
										</div>
									</div>
								</Card>
							</motion.div>
						))}
					</div>
				)}
			</div>
		</div>
	);
};

export default Dashboard;
