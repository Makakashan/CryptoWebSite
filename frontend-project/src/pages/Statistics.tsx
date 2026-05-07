import { useMemo } from "react";
import { useSelector } from "react-redux";
import { motion } from "framer-motion";
import {
	BarChart,
	Bar,
	XAxis,
	YAxis,
	ResponsiveContainer,
	Tooltip,
	PieChart,
	Pie,
	Cell,
} from "recharts";
import { TrendingUp, TrendingDown, DollarSign, BarChart3, Target } from "lucide-react";
import type { RootState } from "../store/store";
import type { Order } from "../store/types";
import { formatPrice } from "../utils/formatPrice";
import Card from "@/components/ui/card";

const COLORS = [
	"#ffffff",
	"#d4d4d8",
	"#a1a1aa",
	"#71717a",
	"#52525b",
	"#e5e7eb",
	"#f4f4f5",
	"#9ca3af",
];

const Statistics = () => {
	const { orders } = useSelector((state: RootState) => state.orders);

	const stats = useMemo(() => {
		if (!orders?.length) return null;
		const totalBuy = orders
			.filter((o: Order) => o.order_type === "BUY")
			.reduce((s: number, o: Order) => s + o.amount * o.price_at_transaction, 0);
		const totalSell = orders
			.filter((o: Order) => o.order_type === "SELL")
			.reduce((s: number, o: Order) => s + o.amount * o.price_at_transaction, 0);
		const totalVolume = totalBuy + totalSell;
		const tradeCount = orders.length;
		const avgTradeSize = tradeCount > 0 ? totalVolume / tradeCount : 0;
		return {
			totalBuy,
			totalSell,
			totalVolume,
			tradeCount,
			avgTradeSize,
			netFlow: totalBuy - totalSell,
		};
	}, [orders]);

	const dailyVolume = useMemo(() => {
		if (!orders?.length) return [];
		const grouped: Record<string, number> = {};
		orders.forEach((o: Order) => {
			const day = new Date(o.timestamp).toLocaleDateString("en-US", {
				month: "short",
				day: "numeric",
			});
			grouped[day] = (grouped[day] || 0) + o.amount * o.price_at_transaction;
		});
		return Object.entries(grouped)
			.slice(-14)
			.map(([name, value]) => ({ name, value }));
	}, [orders]);

	const assetDistribution = useMemo(() => {
		if (!orders?.length) return [];
		const grouped: Record<string, number> = {};
		orders.forEach((o: Order) => {
			grouped[o.asset_symbol] =
				(grouped[o.asset_symbol] || 0) + o.amount * o.price_at_transaction;
		});
		return Object.entries(grouped)
			.sort((a, b) => b[1] - a[1])
			.slice(0, 8)
			.map(([name, value]) => ({ name, value }));
	}, [orders]);

	if (!stats) {
		return (
			<div className="flex flex-col items-center justify-center h-96">
				<BarChart3 className="w-12 h-12 text-white/20 mb-4" />
				<p className="text-white/40 text-lg">No trading data available</p>
			</div>
		);
	}

	const statCards = [
		{
			label: "Total Volume",
			value: `$${stats.totalVolume.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
			icon: DollarSign,
			color: "from-white/10 to-white/30",
		},
		{
			label: "Total Trades",
			value: `${stats.tradeCount}`,
			icon: BarChart3,
			color: "from-white/8 to-white/20",
		},
		{
			label: "Avg Trade Size",
			value: `$${stats.avgTradeSize.toFixed(2)}`,
			icon: Target,
			color: "from-white/6 to-white/18",
		},
		{
			label: "Net Flow",
			value: `$${stats.netFlow.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
			icon: stats.netFlow >= 0 ? TrendingUp : TrendingDown,
			color: stats.netFlow >= 0 ? "from-white/12 to-white/24" : "from-white/12 to-white/24",
		},
	];

	return (
		<div className="space-y-6">
			<h1 className="text-2xl font-bold text-white">Trading Statistics</h1>

			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
				{statCards.map((stat, index) => (
					<motion.div
						key={stat.label}
						initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
						animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
						transition={{ duration: 0.4, delay: index * 0.1 }}
					>
						<Card
							className="p-5"
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

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				<Card className="p-6" style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08)" }}>
					<h2 className="text-lg font-semibold text-white mb-4">Daily Volume (14d)</h2>
					<div className="h-64">
						<ResponsiveContainer width="100%" height="100%">
							<BarChart data={dailyVolume}>
								<XAxis
									dataKey="name"
									tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }}
									axisLine={false}
									tickLine={false}
								/>
								<YAxis
									tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }}
									axisLine={false}
									tickLine={false}
									tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`}
								/>
								<Tooltip
									contentStyle={{
										background: "rgba(10, 10, 10, 0.9)",
										border: "1px solid rgba(255,255,255,0.1)",
										borderRadius: "12px",
										color: "#fff",
										fontSize: "12px",
									}}
									formatter={(value: number) => [formatPrice(value), "Volume"]}
								/>
								<Bar dataKey="value" fill="#ffffff" radius={[4, 4, 0, 0]} />
							</BarChart>
						</ResponsiveContainer>
					</div>
				</Card>

				<Card className="p-6" style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08)" }}>
					<h2 className="text-lg font-semibold text-white mb-4">Asset Distribution</h2>
					<div className="h-64">
						<ResponsiveContainer width="100%" height="100%">
							<PieChart>
								<Pie
									data={
										assetDistribution.length > 0
											? assetDistribution
											: [{ name: "No Data", value: 1 }]
									}
									cx="50%"
									cy="50%"
									outerRadius={90}
									dataKey="value"
									label={({ name }) => name}
									labelLine={false}
								>
									{(assetDistribution.length > 0
										? assetDistribution
										: [{ name: "No Data", value: 1 }]
									).map((_, index) => (
										<Cell
											key={index}
											fill={
												assetDistribution.length > 0
													? COLORS[index % COLORS.length]
													: "#555"
											}
										/>
									))}
								</Pie>
								<Tooltip
									contentStyle={{
										background: "rgba(10, 10, 10, 0.9)",
										border: "1px solid rgba(255,255,255,0.1)",
										borderRadius: "12px",
										color: "#fff",
										fontSize: "12px",
									}}
									formatter={(value: number) => [formatPrice(value), "Volume"]}
								/>
							</PieChart>
						</ResponsiveContainer>
					</div>
				</Card>
			</div>
		</div>
	);
};

export default Statistics;
