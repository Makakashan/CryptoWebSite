// Simple price formatting utilities

export function formatPrice(price: number | undefined | null): string {
  if (!price || price === 0) {
    return "$0.00";
  }

  if (price >= 1) {
    return `$${price.toFixed(2)}`;
  }

  if (price >= 0.01) {
    return `$${price.toFixed(4)}`;
  }

  return `$${price.toFixed(6)}`;
}

export function formatNumber(value: number | undefined | null): string {
  if (!value) {
    return "0";
  }

  if (value >= 1000000000) {
    return `${(value / 1000000000).toFixed(2)}B`;
  }

  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(2)}M`;
  }

  if (value >= 1000) {
    return `${(value / 1000).toFixed(2)}K`;
  }

  return value.toFixed(2);
}
