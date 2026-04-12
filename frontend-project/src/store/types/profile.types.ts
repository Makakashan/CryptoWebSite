export type UiMessage = {
	type: "success" | "error";
	text: string;
} | null;

export interface ProfilePreferences {
	user_id: number;
	language: "en" | "pl";
	theme: "dark" | "light";
	notifications_enabled: boolean;
	email_verified: boolean;
	two_factor_enabled: boolean;
	updated_at: string;
}

export interface ProfileActivityItem {
	id: number;
	user_id: number;
	event_type: string;
	title: string;
	meta: string | null;
	created_at: string;
}
