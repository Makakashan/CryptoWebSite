import { useState, useMemo, useEffect } from "react";
import { useSelector } from "react-redux";
import { motion } from "framer-motion";
import { PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area, Tooltip } from "recharts";
import { TrendingUp, DollarSign, Layers } from "lucide-react";
import type { RootState } from "../store/store";
import type { Asset } from "../store/types";
import { fetchPortfolio } from "../store/slices/portfolioSlice";
import { fetchAssets } from "../store/slices/assetsSlice";
import { useAppDispatch } from "../store/hooks";
import { useBinanceWebSocket } from "../hooks/useBinanceWebSocket";
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

const generatePnLHistory = () => {
	const data = [];
	let pnl = 0;
	for (let i = 0; i < 30; i++) {
		pnl += (Math.random() - 0.45) * 100;
		data.push({ day: `Day ${i + 1}`, pnl: Math.round(pnl * 100) / 100 });
	}
	return data;
};

const Portfolio = () => {
	const dispatch = useAppDispatch();
	const { portfolio } = useSelector((state: RootState) => state.portfolio);
	const { assets } = useSelector((state: RootState) => state.assets);
	const [pnlHistory] = useState(generatePnLHistory);

	useEffect(() => {
		dispatch(fetchPortfolio());
		dispatch(fetchAssets({ limit: 100 }));
	}, [dispatch]);

	const portfolioSymbols = useMemo(
		() => portfolio?.assets?.map((a) => a.asset_symbol) || [],
		[portfolio],
	);
	useBinanceWebSocket({ symbols: portfolioSymbols, enabled: portfolioSymbols.length > 0 });

	const portfolioAssets = useMemo(() => {
		if (!portfolio?.assets?.length) return [];
		return portfolio.assets.map((pa) => {
			const asset = assets.find((a: Asset) => a.symbol === pa.asset_symbol);
			return {
				symbol: pa.asset_symbol,
				amount: pa.amount,
				name: asset?.name || pa.asset_symbol,
				image_url: asset?.image_url,
				price: asset?.current_price || asset?.price || 0,
			};
		});
	}, [portfolio, assets]);

	const totalValue = portfolio?.balance || 0;
	const assetsTotalValue = portfolioAssets.reduce((a, b) => a + b.amount * b.price, 0);
	const grandTotal = totalValue + assetsTotalValue;

	const pieData = portfolioAssets
		.filter((pa) => pa.amount > 0)
		.map((pa) => ({
			name: pa.symbol,
			value: pa.amount * pa.price,
		}));

	const stats = [
		{
			label: "Total Balance",
			value: `$${totalValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
			icon: DollarSign,
			color: "from-white/10 to-white/30",
		},
		{
			label: "Assets Value",
			value: `$${assetsTotalValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
			icon: Layers,
			color: "from-white/8 to-white/20",
		},
		{
			label: "Grand Total",
			value: `$${grandTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
			icon: TrendingUp,
			color: "from-white/6 to-white/18",
		},
		{
			label: "Holdings",
			value: `${portfolioAssets.length}`,
			icon: PieChart,
			color: "from-white/12 to-white/24",
		},
	];

	return (
		<div className="space-y-6">
			<h1 className="text-2xl font-bold text-white">Portfolio</h1>

			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
				{stats.map((stat, index) => (
					<motion.div
						key={stat.label}
						initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
						animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
						transition={{ duration: 0.4, delay: index * 0.1, ease: "easeOut" }}
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
					<h2 className="text-lg font-semibold text-white mb-4">Asset Allocation</h2>
					<div className="h-64">
						<ResponsiveContainer width="100%" height="100%">
							<PieChart>
								<Pie
									data={pieData.length > 0 ? pieData : [{ name: "No Data", value: 1 }]}
									cx="50%"
									cy="50%"
									innerRadius={60}
									outerRadius={90}
									paddingAngle={4}
									dataKey="value"
								>
									{(pieData.length > 0 ? pieData : [{ name: "No Data", value: 1 }]).map(
										(_, index) => (
											<Cell
												key={`cell-${index}`}
												fill={
													pieData.length > 0 ? COLORS[index % COLORS.length] : "#555"
												}
											/>
										),
									)}
								</Pie>
								<Tooltip
									contentStyle={{
										background: "rgba(10, 10, 10, 0.9)",
										border: "1px solid rgba(255,255,255,0.1)",
										borderRadius: "12px",
										color: "#fff",
										fontSize: "12px",
									}}
									formatter={(value: number) => [formatPrice(value), "Value"]}
								/>
							</PieChart>
						</ResponsiveContainer>
					</div>
					{pieData.length > 0 && (
						<div className="flex flex-wrap gap-3 mt-4 justify-center">
							{pieData.map((entry, index) => (
								<div key={entry.name} className="flex items-center gap-1.5">
									<div
										className="w-2.5 h-2.5 rounded-full"
										style={{ background: COLORS[index % COLORS.length] }}
									/>
									<span className="text-xs text-white/60">{entry.name}</span>
								</div>
							))}
						</div>
					)}
				</Card>

				<Card className="p-6" style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08)" }}>
					<h2 className="text-lg font-semibold text-white mb-4">PnL History (30d)</h2>
					<div className="h-64">
						<ResponsiveContainer width="100%" height="100%">
							<AreaChart data={pnlHistory}>
								<defs>
									<linearGradient id="pnlGrad" x1="0" y1="0" x2="0" y2="1">
										<stop offset="0%" stopColor="#ffffff" stopOpacity={0.4} />
										<stop offset="100%" stopColor="#ffffff" stopOpacity={0} />
									</linearGradient>
								</defs>
								<Tooltip
									contentStyle={{
										background: "rgba(10, 10, 10, 0.9)",
										border: "1px solid rgba(255,255,255,0.1)",
										borderRadius: "12px",
										color: "#fff",
										fontSize: "12px",
									}}
									formatter={(value: number) => [`$${value.toFixed(2)}`, "PnL"]}
								/>
								<Area
									type="monotone"
									dataKey="pnl"
									stroke="#ffffff"
									strokeWidth={2}
									fill="url(#pnlGrad)"
									dot={false}
								/>
							</AreaChart>
						</ResponsiveContainer>
					</div>
				</Card>
			</div>

			{/* Holdings Table */}
			<Card className="p-6" style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08)" }}>
				<h2 className="text-lg font-semibold text-white mb-4">Holdings</h2>
				<div className="overflow-x-auto">
					<table className="w-full">
						<thead>
							<tr className="border-b border-white/[0.06]">
								<th className="text-left text-xs font-medium text-white/40 pb-3 pr-4">
									Asset
								</th>
								<th className="text-right text-xs font-medium text-white/40 pb-3 pr-4">
									Amount
								</th>
								<th className="text-right text-xs font-medium text-white/40 pb-3 pr-4">
									Price
								</th>
								<th className="text-right text-xs font-medium text-white/40 pb-3">Value</th>
							</tr>
						</thead>
						<tbody>
							{portfolioAssets.map((pa) => (
								<tr
									key={pa.symbol}
									className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors"
								>
									<td className="py-3 pr-4">
										<div className="flex items-center gap-3">
											{pa.image_url ? (
												<img
													src={pa.image_url}
													alt={pa.symbol}
													className="w-8 h-8 rounded-full"
												/>
											) : (
												<div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white text-[10px] font-bold">
													{pa.symbol.slice(0, 2)}
												</div>
											)}
											<span className="text-sm font-medium text-white">{pa.symbol}</span>
										</div>
									</td>
									<td className="text-right text-sm text-white/60 py-3 pr-4">
										{pa.amount.toLocaleString()}
									</td>
									<td className="text-right text-sm text-white/60 py-3 pr-4">
										{formatPrice(pa.price)}
									</td>
									<td className="text-right text-sm font-semibold text-white py-3">
										{formatPrice(pa.amount * pa.price)}
									</td>
								</tr>
							))}
							{portfolioAssets.length === 0 && (
								<tr>
									<td colSpan={4} className="text-center text-white/40 py-8">
										No holdings yet
									</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>
			</Card>
		</div>
	);
};

export default Portfolio;
