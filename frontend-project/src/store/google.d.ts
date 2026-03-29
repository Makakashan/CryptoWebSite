export {};

declare global {
	interface Window {
		google?: {
			accounts?: {
				id?: {
					initialize: (config: {
						client_id: string;
						callback: (response: { credential: string }) => void;
					}) => void;
					prompt: (
						listener?: (notification: {
							isNotDisplayed: () => boolean;
							isSkippedMoment: () => boolean;
							isDismissedMoment: () => boolean;
							getNotDisplayedReason: () =>
								| "browser_not_supported"
								| "invalid_client"
								| "missing_client_id"
								| "third_party_cookies_blocked"
								| "origin_mismatch"
								| "suppressed_by_user"
								| "unknown";
						}) => void,
					) => void;
					renderButton: (
						element: HTMLElement,
						options: {
							theme?: "outline" | "filled_blue" | "filled_black";
							size?: "large" | "medium" | "small";
							text?: "signin_with" | "signup_with" | "continue_with" | "sign_in_with";
							shape?: "rectangular" | "pill" | "circle" | "square";
							logo_alignment?: "left" | "center";
							width?: number;
						},
					) => void;
				};
			};
		};
	}
}
