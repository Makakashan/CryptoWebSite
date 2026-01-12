// Simple price formatting utilities

export function formatPrice(price: number | undefined | null): string {
  if (price === undefined || price === null) {
    return "$0.00";
  }

  if (price === 0) {
    return "$0.00";
  }

  const isNegative = price < 0;
  const absPrice = Math.abs(price);

  let formatted = "";

  if (absPrice >= 1) {
    formatted = `$${absPrice.toFixed(2)}`;
  } else if (absPrice >= 0.01) {
    formatted = `$${absPrice.toFixed(4)}`;
  } else {
    formatted = `$${absPrice.toFixed(6)}`;
  }

  return isNegative ? `-${formatted}` : formatted;
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
