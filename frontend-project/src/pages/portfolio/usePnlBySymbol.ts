import { useMemo } from "react";
import type { AssetPnl } from "@/store/types/portfolio.types";
import type { Order } from "@/store/types/orders.types";

/**
 * Builds a per-symbol PnL summary from the order history.
 * For each symbol we track: amount held, cost basis, realized PnL.
 *
 * Net profit is computed later (in the component) using current market price.
 */
export const usePnlBySymbol = (orders: Order[]) =>
	useMemo<Record<string, AssetPnl>>(() => {
		const sortedOrders = [...orders].sort(
			(a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
		);

		const state: Record<string, { amount: number; cost: number; realized: number }> = {};

		for (const order of sortedOrders) {
			const symbol = order.asset_symbol;
			if (!state[symbol]) state[symbol] = { amount: 0, cost: 0, realized: 0 };
			const s = state[symbol];
			const qty = order.amount;
			const px = order.price_at_transaction;

			if (order.order_type === "BUY") {
				s.amount += qty;
				s.cost += qty * px;
			} else {
				const avgCost = s.amount > 0 ? s.cost / s.amount : 0;
				const soldCost = avgCost * qty;
				const proceeds = qty * px;
				s.realized += proceeds - soldCost;
				s.amount = Math.max(0, s.amount - qty);
				s.cost = Math.max(0, s.cost - soldCost);
			}
		}

		const result: Record<string, AssetPnl> = {};
		for (const [symbol, s] of Object.entries(state)) {
			result[symbol] = {
				invested: s.cost,
				realized: s.realized,
				currentAmount: s.amount,
				netProfit: 0,
				netProfitPercent: 0,
			};
		}
		return result;
	}, [orders]);
