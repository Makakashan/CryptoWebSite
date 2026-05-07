import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowUpRight, ArrowDownRight, Clock } from "lucide-react";
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import type { RootState } from "../store/store";
import type { PriceFlash } from "../store/types";
import { useBinanceWebSocket } from "../hooks/useBinanceWebSocket";
import { useAppDispatch } from "../store/hooks";
import { placeOrder } from "../store/slices/ordersSlice";
import { binanceWebSocketService } from "../services/binanceWebSocket";
import { formatPrice } from "../utils/formatPrice";
import Card from "@/components/ui/card";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";

const generateChartData = (basePrice: number, points: number = 50) => {
	const data = [];
	let price = basePrice;
	for (let i = 0; i < points; i++) {
		price += (Math.random() - 0.48) * price * 0.02;
		data.push({ time: i, price });
	}
	return data;
};

const AssetDetail = () => {
	const { symbol } = useParams<{ symbol: string }>();
	const navigate = useNavigate();
	const dispatch = useAppDispatch();
	const { assets } = useSelector((state: RootState) => state.assets);
	const { user } = useSelector((state: RootState) => state.auth);
	const [price, setPrice] = useState(0);
	const [flash, setFlash] = useState<PriceFlash>(null);
	const [orderAmount, setOrderAmount] = useState("");
	const [activeTab, setActiveTab] = useState<"buy" | "sell">("buy");
	const [chartData, setChartData] = useState<any[]>([]);

	const asset = assets.find((a) => a.symbol === symbol);

	useEffect(() => {
		if (asset) {
			const initialPrice = asset.current_price || asset.price || 0;
			setPrice(initialPrice);
			setChartData(generateChartData(initialPrice));
		}
	}, [asset]);

	useBinanceWebSocket({ symbols: symbol ? [symbol] : [], enabled: !!symbol });

	useEffect(() => {
		if (!symbol) return;
		const handler = (sym: string, p: number) => {
			if (sym === symbol) {
				setPrice(p);
				setFlash(p >= price ? "up" : "down");
				setTimeout(() => setFlash(null), 500);
			}
		};
		binanceWebSocketService.subscribeToPrice(handler);
		return () => binanceWebSocketService.unsubscribeFromPrice(handler);
	}, [symbol, price]);

	if (!asset) {
		return (
			<div className="flex flex-col items-center justify-center h-96">
				<p className="text-white/50 text-lg mb-4">Asset not found</p>
				<Button onClick={() => navigate("/markets")}>Back to Markets</Button>
			</div>
		);
	}

	const isPositive = (asset.price_change_24h || 0) >= 0;

	const handleOrder = () => {
		if (!orderAmount || parseFloat(orderAmount) <= 0) return;
		dispatch(placeOrder({
			asset_symbol: asset.symbol,
			order_type: activeTab.toUpperCase() as "BUY" | "SELL",
			amount: parseFloat(orderAmount),
		}));
		setOrderAmount("");
	};

	return (
		<motion.div
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			transition={{ duration: 0.4 }}
			className="space-y-6"
		>
			<div className="flex items-center gap-4">
				<button onClick={() => navigate(-1)} className="p-2 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] transition-all text-white/60 hover:text-white">
					<ArrowLeft className="w-5 h-5" />
				</button>
				<div className="flex items-center gap-3">
					{asset.image_url ? (
						<img src={asset.image_url} alt={asset.symbol} className="w-12 h-12 rounded-full" />
					) : (
						<div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#f23f5d] to-[#b81a3c] flex items-center justify-center text-white font-bold text-lg">
							{asset.symbol.slice(0, 2)}
						</div>
					)}
					<div>
						<h1 className="text-2xl font-bold text-white">{asset.symbol}</h1>
						<p className="text-sm text-white/40">{asset.name}</p>
					</div>
				</div>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* Price Chart */}
				<div className="lg:col-span-2">
					<Card className="p-6" style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08)" }}>
						<div className="flex items-center justify-between mb-6">
							<div>
								<p className={`text-3xl font-bold transition-all duration-500 ${
									flash === "up" ? "text-emerald-400" :
									flash === "down" ? "text-red-400" :
									"text-white"
								}`}>
									{formatPrice(price)}
								</p>
								<div className={`flex items-center gap-1 mt-1 ${isPositive ? "text-emerald-400" : "text-red-400"}`}>
									{isPositive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
									<span className="text-sm font-medium">
										{(asset.price_change_24h || 0) >= 0 ? "+" : ""}
										{(asset.price_change_24h || 0).toFixed(2)}%
									</span>
								</div>
							</div>
							<div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08]">
								<Clock className="w-3.5 h-3.5 text-white/40" />
								<span className="text-xs text-white/40">24h</span>
							</div>
						</div>
						<div className="h-72">
							<ResponsiveContainer width="100%" height="100%">
								<AreaChart data={chartData}>
									<defs>
										<linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
											<stop offset="0%" stopColor="#f23f5d" stopOpacity={0.4} />
											<stop offset="100%" stopColor="#f23f5d" stopOpacity={0} />
										</linearGradient>
									</defs>
									<XAxis dataKey="time" hide />
									<YAxis hide domain={["auto", "auto"]} />
									<Tooltip
										contentStyle={{
											background: "rgba(10, 10, 10, 0.9)",
											border: "1px solid rgba(255,255,255,0.1)",
											borderRadius: "12px",
											color: "#fff",
											fontSize: "12px",
										}}
										formatter={(value: number) => [formatPrice(value), "Price"]}
									/>
									<Area type="monotone" dataKey="price" stroke="#f23f5d" strokeWidth={2} fill="url(#chartGrad)" dot={false} />
								</AreaChart>
							</ResponsiveContainer>
						</div>
					</Card>
				</div>

				{/* Order Panel */}
				<div>
					<Card className="p-6" style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08)" }}>
						<h2 className="text-lg font-semibold text-white mb-4">Place Order</h2>
						<div className="flex gap-2 mb-4">
							<button
								onClick={() => setActiveTab("buy")}
								className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
									activeTab === "buy"
										? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
										: "bg-white/[0.04] text-white/50 hover:bg-white/[0.08]"
								}`}
							>
								Buy
							</button>
							<button
								onClick={() => setActiveTab("sell")}
								className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
									activeTab === "sell"
										? "bg-red-500 text-white shadow-lg shadow-red-500/20"
										: "bg-white/[0.04] text-white/50 hover:bg-white/[0.08]"
								}`}
							>
								Sell
							</button>
						</div>
						<div className="space-y-4">
							<div>
								<label className="text-xs text-white/50 mb-1.5 block">Amount</label>
								<Input
									type="number"
									placeholder="0.00"
									value={orderAmount}
									onChange={(e) => setOrderAmount(e.target.value)}
									min="0"
									step="0.01"
								/>
							</div>
							<div className="flex justify-between text-xs">
								<span className="text-white/40">Price</span>
								<span className="text-white">{formatPrice(price)}</span>
							</div>
							<div className="flex justify-between text-xs">
								<span className="text-white/40">Total</span>
								<span className="text-white font-semibold">
									{formatPrice((parseFloat(orderAmount) || 0) * price)}
								</span>
							</div>
							<div className="flex justify-between text-xs">
								<span className="text-white/40">Available</span>
								<span className="text-white">${(user?.balance ?? 0).toLocaleString()}</span>
							</div>
							<Button
								variant={activeTab === "buy" ? "success" : "destructive"}
								className="w-full"
								onClick={handleOrder}
								disabled={!orderAmount || parseFloat(orderAmount) <= 0}
							>
								{activeTab === "buy" ? "Buy" : "Sell"} {asset.symbol}
							</Button>
						</div>
					</Card>
				</div>
			</div>
		</motion.div>
	);
};

export default AssetDetail;
