export const toSearchParams = <T extends object>(filters?: T): URLSearchParams => {
	const params = new URLSearchParams();

	if (!filters) {
		return params;
	}

	Object.entries(filters).forEach(([key, value]) => {
		if (value !== undefined && value !== "" && value !== null) {
			params.append(key, String(value));
		}
	});

	return params;
};
