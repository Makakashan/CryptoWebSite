import type { Order } from "@/store/types/orders.types";

export type BalancePoint = {
	ts: number;
	label: string;
	value: number;
};

export const BALANCE_HISTORY_INTERVAL = "1h";
export const BALANCE_HISTORY_LIMIT = 7 * 24;
export const BALANCE_HISTORY_STEP_MS = 60 * 60 * 1000;

export const formatPointLabel = (timestamp: number): string => {
	const date = new Date(timestamp);
	return `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1)
		.toString()
		.padStart(2, "0")} ${date.getHours().toString().padStart(2, "0")}:${date
		.getMinutes()
		.toString()
		.padStart(2, "0")}`;
};

export const formatAxisPrice = (value: number): string => {
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
		totalPoints <= 1 ? 0 : Math.round((pointIndex * (series.length - 1)) / (totalPoints - 1));

	return series[mappedIndex] || currentPrice;
};

export const buildBalanceHistory = (
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
		(a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
	);
	const endTime = Date.now();
	const startTime = endTime - (BALANCE_HISTORY_LIMIT - 1) * BALANCE_HISTORY_STEP_MS;
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
