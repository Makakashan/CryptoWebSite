import axiosInstance from "./axiosConfig";
import type { ProfilePreferences, ProfileActivityItem } from "../store/types/profile.types";

export const profileApi = {
	getPreferences: async (): Promise<ProfilePreferences> => {
		const response = await axiosInstance.get<ProfilePreferences>("/users/me/preferences");
		return response.data;
	},

	updatePreferences: async (payload: {
		language?: "en" | "pl";
		theme?: "dark" | "light";
		notifications_enabled?: boolean;
	}): Promise<ProfilePreferences> => {
		const response = await axiosInstance.patch<ProfilePreferences>(
			"/users/me/preferences",
			payload,
		);
		return response.data;
	},

	getActivity: async (limit = 20): Promise<ProfileActivityItem[]> => {
		const response = await axiosInstance.get<{ data: ProfileActivityItem[] }>(
			`/users/me/activity?limit=${limit}`,
		);
		return response.data.data;
	},
};
