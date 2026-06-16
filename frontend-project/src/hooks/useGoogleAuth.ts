import { useCallback, useState } from "react";
import { useAppDispatch } from "../store/hooks";
import { loginWithGoogle } from "../store/slices/authSlice";
import { signInWithGoogle, isFirebaseConfigured } from "../lib/firebase";

export function useGoogleAuth(onSuccess: () => void) {
	const dispatch = useAppDispatch();
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const triggerPrompt = useCallback(async () => {
		if (!isFirebaseConfigured()) {
			setError("Google login is not configured.");
			return;
		}

		setError(null);
		setLoading(true);

		try {
			const idToken = await signInWithGoogle();
			await dispatch(loginWithGoogle(idToken)).unwrap();
			onSuccess();
		} catch (err: unknown) {
			if (err instanceof Error) {
				const code = (err as { code?: string }).code;
				if (code === "auth/popup-closed-by-user") {
					setError("Google Sign-In was closed.");
				} else if (code === "auth/cancelled-popup-request") {
					setError("Google Sign-In was cancelled.");
				} else if (code === "auth/popup-blocked") {
					setError("Pop-up was blocked by your browser.");
				} else {
					setError(err.message || "Google login failed.");
				}
			} else if (typeof err === "string") {
				setError(err);
			} else {
				setError("Google login failed.");
			}
		} finally {
			setLoading(false);
		}
	}, [dispatch, onSuccess]);

	return {
		loading,
		error,
		setError,
		triggerPrompt,
	};
}
