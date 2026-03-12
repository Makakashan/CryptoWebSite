export const resolveAvatarDataUrl = async (
	avatarUrl: string | null,
): Promise<string | null> => {
	if (!avatarUrl) return null;
	if (avatarUrl.startsWith("data:image/")) return avatarUrl;

	try {
		const response = await fetch(avatarUrl);
		if (!response.ok) return avatarUrl;
		const contentType = response.headers.get("content-type") || "";
		if (!contentType.startsWith("image/")) return avatarUrl;

		const arrayBuffer = await response.arrayBuffer();
		const base64 = Buffer.from(arrayBuffer).toString("base64");
		return `data:${contentType};base64,${base64}`;
	} catch (error) {
		console.error("Failed to fetch remote avatar:", error);
		return avatarUrl;
	}
};
