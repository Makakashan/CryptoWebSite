export interface ProfilePreferences {
	language: "en" | "pl";
	theme: "dark" | "light";
	notifications_enabled: boolean;
	email_verified: boolean;
	two_factor_enabled: boolean;
}

export interface ProfileActivityItem {
	id: number;
	event_type: string;
	title: string;
	created_at: string;
}

export type UiMessage = {
	type: "success" | "error";
	text: string;
} | null;
