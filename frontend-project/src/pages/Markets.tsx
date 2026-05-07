import { useState, useEffect, useMemo } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, Grid3X3, List, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { AreaChart, Area, ResponsiveContainer } from "recharts";
import type { RootState } from "../store/store";
import type { Asset } from "../store/types";
import { binanceWebSocketService } from "../services/binanceWebSocket";
import { useBinanceWebSocket } from "../hooks/useBinanceWebSocket";
import { formatPrice } from "../utils/formatPrice";
import Input from "@/components/ui/input";
import Select from "@/components/ui/select";
import Card from "@/components/ui/card";
import { AssetCardSkeleton } from "@/components/skeletons/AssetCardSkeleton";

const generateSparklineData = (basePrice: number) => {
	const data = [];
	let price = basePrice;
	for (let i = 0; i < 24; i++) {
		price += (Math.random() - 0.48) * price * 0.02;
		data.push(price);
	}
	return data;
};

const AssetCard = ({ asset, onClick }: { asset: Asset; onClick: () => void }) => {
	const initialPrice =
		binanceWebSocketService.getPrice(asset.symbol) ?? asset.current_price ?? asset.price ?? 0;
	const [price, setPrice] = useState<number>(initialPrice);
	const [flash, setFlash] = useState<"up" | "down" | null>(null);

	useEffect(() => {
		const handler = (sym: string, p: number) => {
			if (sym === asset.symbol) {
				setPrice(p);
				setFlash(p >= price ? "up" : "down");
				setTimeout(() => setFlash(null), 500);
			}
		};
		binanceWebSocketService.subscribeToPrice(handler);
		return () => binanceWebSocketService.unsubscribeFromPrice(handler);
	}, [asset.symbol, price]);

	const sparklineData = useMemo(() => generateSparklineData(initialPrice || 100), [initialPrice]);
	const isPositive = (asset.price_change_24h || 0) >= 0;

	return (
		<motion.div
			initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
			animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
			whileHover={{ scale: 1.02 }}
			transition={{ duration: 0.4 }}
		>
			<Card
				className={`p-5 cursor-pointer transition-all duration-300 ${
					flash === "up"
						? "border-emerald-500/40"
						: flash === "down"
							? "border-red-500/40"
							: ""
				}`}
				onClick={onClick}
				style={{
					boxShadow:
						flash === "up"
							? "0 0 20px rgba(74, 222, 128, 0.15)"
							: flash === "down"
								? "0 0 20px rgba(248, 113, 113, 0.15)"
								: "inset 0 1px 0 rgba(255,255,255,0.08)",
				}}
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
							<div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white text-xs font-bold">
								{asset.symbol.slice(0, 2)}
							</div>
						)}
						<div>
							<h3 className="text-sm font-semibold text-white">{asset.symbol}</h3>
							<p className="text-xs text-white/40">{asset.name}</p>
						</div>
					</div>
					<div
						className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold ${
							isPositive
								? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
								: "bg-red-500/10 text-red-400 border border-red-500/20"
						}`}
					>
						{isPositive ? (
							<ArrowUpRight className="w-3 h-3" />
						) : (
							<ArrowDownRight className="w-3 h-3" />
						)}
						{Math.abs(asset.price_change_24h || 0).toFixed(2)}%
					</div>
				</div>
				<div className="flex items-end justify-between">
					<div>
						<p
							className={`text-xl font-bold transition-all duration-500 ${
								flash === "up"
									? "text-emerald-400 drop-shadow-[0_0_8px_rgba(74,222,128,0.5)]"
									: flash === "down"
										? "text-red-400 drop-shadow-[0_0_8px_rgba(248,113,113,0.5)]"
										: "text-white"
							}`}
						>
							{formatPrice(price)}
						</p>
					</div>
					<div className="w-24 h-10">
						<ResponsiveContainer width="100%" height="100%">
							<AreaChart data={sparklineData.map((v) => ({ v }))}>
								<defs>
									<linearGradient id={`spark-${asset.symbol}`} x1="0" y1="0" x2="0" y2="1">
										<stop
											offset="0%"
											stopColor={isPositive ? "#4ade80" : "#f87171"}
											stopOpacity={0.5}
										/>
										<stop
											offset="100%"
											stopColor={isPositive ? "#4ade80" : "#f87171"}
											stopOpacity={0}
										/>
									</linearGradient>
								</defs>
								<Area
									type="monotone"
									dataKey="v"
									stroke={isPositive ? "#4ade80" : "#f87171"}
									strokeWidth={1.5}
									fill={`url(#spark-${asset.symbol})`}
									dot={false}
								/>
							</AreaChart>
						</ResponsiveContainer>
					</div>
				</div>
			</Card>
		</motion.div>
	);
};

const Markets = () => {
	const navigate = useNavigate();
	const { assets: allAssets, isLoading } = useSelector((state: RootState) => state.assets);
	const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
	const [searchTerm, setSearchTerm] = useState("");
	const [selectedCategory, setSelectedCategory] = useState<string>("");
	const [sortBy, setSortBy] = useState<string>("price");
	const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

	const filteredAssets = (allAssets || [])
		.filter((asset: Asset) => {
			const matchesSearch =
				!searchTerm ||
				asset.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
				asset.name.toLowerCase().includes(searchTerm.toLowerCase());
			const matchesCategory = !selectedCategory || asset.category === selectedCategory;
			return matchesSearch && matchesCategory;
		})
		.sort((a: Asset, b: Asset) => {
			let aVal: number, bVal: number;
			switch (sortBy) {
				case "symbol":
					aVal = a.symbol.localeCompare(b.symbol);
					bVal = 0;
					return sortOrder === "asc" ? aVal : -aVal;
				case "price":
					aVal = a.current_price || a.price || 0;
					bVal = b.current_price || b.price || 0;
					break;
				case "change":
					aVal = a.price_change_24h || 0;
					bVal = b.price_change_24h || 0;
					break;
				default:
					aVal = a.current_price || a.price || 0;
					bVal = b.current_price || b.price || 0;
			}
			return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
		});

	const symbols = filteredAssets.map((a: Asset) => a.symbol);
	useBinanceWebSocket({ symbols, enabled: symbols.length > 0 });

	return (
		<div className="space-y-6">
			<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
				<h1 className="text-2xl font-bold text-white">Markets</h1>
				<div className="flex items-center gap-2">
					<button
						onClick={() => setViewMode("grid")}
						className={`p-2 rounded-lg transition-colors ${viewMode === "grid" ? "bg-white/[0.08] text-white" : "text-white/40 hover:text-white"}`}
					>
						<Grid3X3 className="w-5 h-5" />
					</button>
					<button
						onClick={() => setViewMode("list")}
						className={`p-2 rounded-lg transition-colors ${viewMode === "list" ? "bg-white/[0.08] text-white" : "text-white/40 hover:text-white"}`}
					>
						<List className="w-5 h-5" />
					</button>
				</div>
			</div>

			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
				<div className="relative">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
					<Input
						placeholder="Search assets..."
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						className="pl-10"
					/>
				</div>
				<Select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
					<option value="">All Categories</option>
					<option value="crypto">Crypto</option>
					<option value="stock">Stock</option>
					<option value="forex">Forex</option>
					<option value="commodity">Commodity</option>
				</Select>
				<Select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
					<option value="price">Price</option>
					<option value="symbol">Symbol</option>
					<option value="change">Change %</option>
				</Select>
				<Select
					value={sortOrder}
					onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}
				>
					<option value="desc">High to Low</option>
					<option value="asc">Low to High</option>
				</Select>
			</div>

			{isLoading ? (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{Array.from({ length: 9 }).map((_, i) => (
						<AssetCardSkeleton key={i} />
					))}
				</div>
			) : (
				<div
					className={
						viewMode === "grid"
							? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
							: "flex flex-col gap-3"
					}
				>
					{filteredAssets.map((asset: Asset) => (
						<AssetCard
							key={asset.symbol}
							asset={asset}
							onClick={() => navigate(`/markets/${asset.symbol}`)}
						/>
					))}
				</div>
			)}
		</div>
	);
};

export default Markets;
