import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { motion } from "framer-motion";
import { ArrowUpDown, ShoppingCart, Filter } from "lucide-react";
import type { RootState } from "../store/store";
import type { Order, OrdersFilters } from "../store/types";
import { fetchOrders } from "../store/slices/ordersSlice";
import { useAppDispatch } from "../store/hooks";
import Input from "@/components/ui/input";
import Select from "@/components/ui/select";
import Card from "@/components/ui/card";
import { TableSkeleton } from "@/components/skeletons/TableSkeleton";

const Orders = () => {
	const dispatch = useAppDispatch();
	const { orders, isLoading } = useSelector((state: RootState) => state.orders);
	const [filters, setFilters] = useState<OrdersFilters>({
		page: 1,
		limit: 20,
		sortBy: "timestamp",
		sortOrder: "desc",
	});
	const [assetFilter, setAssetFilter] = useState("");
	type OrderTypeFilter = "" | "BUY" | "SELL";
	const [typeFilter, setTypeFilter] = useState<OrderTypeFilter>("");

	useEffect(() => {
		dispatch(fetchOrders(filters));
	}, [dispatch, filters]);

	const handleSort = (field: string) => {
		setFilters((prev) => ({
			...prev,
			sortBy: field,
			sortOrder: prev.sortBy === field && prev.sortOrder === "asc" ? "desc" : "asc",
		}));
	};

	const filteredOrders = (orders || []).filter((order: Order) => {
		const matchesAsset =
			!assetFilter || order.asset_symbol.toLowerCase().includes(assetFilter.toLowerCase());
		const matchesType = !typeFilter || order.order_type === typeFilter;
		return matchesAsset && matchesType;
	});

	const formatDate = (dateStr: string) => {
		return new Date(dateStr).toLocaleDateString("en-US", {
			year: "numeric",
			month: "short",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	return (
		<motion.div
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			transition={{ duration: 0.4 }}
			className="space-y-6"
		>
			<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
				<h1 className="text-2xl font-bold text-white">Order History</h1>
			</div>

			<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
				<div className="relative">
					<Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
					<Input
						placeholder="Filter by asset..."
						value={assetFilter}
						onChange={(e) => setAssetFilter(e.target.value)}
						className="pl-10"
					/>
				</div>
				<Select
					value={typeFilter}
					onChange={(e) => setTypeFilter(e.target.value as OrderTypeFilter)}
				>
					<option value="">All Types</option>
					<option value="BUY">Buy</option>
					<option value="SELL">Sell</option>
				</Select>
				<Select
					value={filters.sortBy}
					onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
				>
					<option value="timestamp">Date</option>
					<option value="asset_symbol">Asset</option>
					<option value="amount">Amount</option>
				</Select>
			</div>

			<Card className="p-6" style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08)" }}>
				{isLoading ? (
					<TableSkeleton />
				) : (
					<div className="overflow-x-auto">
						<table className="w-full">
							<thead>
								<tr className="border-b border-white/[0.06]">
									<th
										className="text-left text-xs font-medium text-white/40 pb-3 pr-4 cursor-pointer hover:text-white/60 transition-colors"
										onClick={() => handleSort("asset_symbol")}
									>
										<div className="flex items-center gap-1">
											Asset <ArrowUpDown className="w-3 h-3" />
										</div>
									</th>
									<th className="text-left text-xs font-medium text-white/40 pb-3 pr-4">
										Type
									</th>
									<th className="text-right text-xs font-medium text-white/40 pb-3 pr-4">
										Amount
									</th>
									<th className="text-right text-xs font-medium text-white/40 pb-3 pr-4">
										Price
									</th>
									<th className="text-right text-xs font-medium text-white/40 pb-3">
										Date
									</th>
								</tr>
							</thead>
							<tbody>
								{filteredOrders.map((order: Order, index: number) => (
									<motion.tr
										key={order.id}
										initial={{ opacity: 0, y: 5 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ duration: 0.3, delay: index * 0.03 }}
										className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors"
									>
										<td className="py-3 pr-4">
											<span className="text-sm font-medium text-white">
												{order.asset_symbol}
											</span>
										</td>
										<td className="py-3 pr-4">
											<span
												className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold ${
													order.order_type === "BUY"
														? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
														: "bg-red-500/10 text-red-400 border border-red-500/20"
												}`}
											>
												{order.order_type === "BUY" ? (
													<ShoppingCart className="w-3 h-3" />
												) : (
													<ShoppingCart className="w-3 h-3" />
												)}
												{order.order_type}
											</span>
										</td>
										<td className="text-right text-sm text-white/60 py-3 pr-4">
											{order.amount.toLocaleString()}
										</td>
										<td className="text-right text-sm text-white/60 py-3 pr-4">
											${order.price_at_transaction.toFixed(2)}
										</td>
										<td className="text-right text-xs text-white/40 py-3">
											{formatDate(order.timestamp)}
										</td>
									</motion.tr>
								))}
								{filteredOrders.length === 0 && (
									<tr>
										<td colSpan={5} className="text-center text-white/40 py-8">
											No orders found
										</td>
									</tr>
								)}
							</tbody>
						</table>
					</div>
				)}
			</Card>
		</motion.div>
	);
};

export default Orders;
