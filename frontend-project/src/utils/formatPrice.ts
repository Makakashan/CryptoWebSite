export const formatPrice = (price: number): string => {
	if (price === undefined || price === null) return "$0.00";
	if (price >= 1_000_000_000) return `$${(price / 1_000_000_000).toFixed(2)}B`;
	if (price >= 1_000_000) return `$${(price / 1_000_000).toFixed(2)}M`;
	if (price >= 1_000) return `$${(price / 1_000).toFixed(2)}K`;
	if (price >= 1) return `$${price.toFixed(2)}`;
	if (price >= 0.01) return `$${price.toFixed(4)}`;
	return `$${price.toFixed(6)}`;
};

export const getInitials = (name: string): string => {
	return name.slice(0, 2).toUpperCase();
};
