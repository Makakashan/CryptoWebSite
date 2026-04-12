export const parseTimestamp = (value: string): number => {
	const direct = Date.parse(value);
	if (Number.isFinite(direct)) return direct;

	const sqliteMatch =
		/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})(?:\.\d+)?$/.exec(
			value,
		);

	if (sqliteMatch) {
		const [, y, m, d, hh, mm, ss] = sqliteMatch;
		return Date.UTC(
			Number(y),
			Number(m) - 1,
			Number(d),
			Number(hh),
			Number(mm),
			Number(ss),
		);
	}

	return NaN;
};

export const formatRelativeTime = (value: string): string => {
	const ts = parseTimestamp(value);
	if (!Number.isFinite(ts)) return "Unknown time";

	const diffMs = Date.now() - ts;
	if (diffMs < 0) return "Just now";

	const diffMin = Math.floor(diffMs / 60000);
	if (diffMin < 1) return "Just now";
	if (diffMin < 60) return `${diffMin}m ago`;

	const diffH = Math.floor(diffMin / 60);
	if (diffH < 24) return `${diffH}h ago`;

	const diffD = Math.floor(diffH / 24);
	return `${diffD}d ago`;
};
