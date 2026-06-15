import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useTranslation } from "react-i18next";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { login, loginWithGoogle } from "../store/slices/authSlice";
import { Headset } from "lucide-react";
import ThreeBackground from "@/components/ThreeBackground";
import Button from "@/components/ui/button";
import Card, {
	CardAction,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import Input from "@/components/ui/input";
import Label from "@/components/ui/label";

const Login = () => {
	const { t } = useTranslation();
	const dispatch = useAppDispatch();
	const navigate = useNavigate();
	const { isLoading, error } = useAppSelector((state) => state.auth);
	const [googleReady, setGoogleReady] = useState(false);
	const [googleLoading, setGoogleLoading] = useState(false);
	const [googleError, setGoogleError] = useState<string | null>(null);
	const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
	const googlePromptStartedRef = useRef(false);
	const googleCredentialReceivedRef = useRef(false);

	useEffect(() => {
		if (!googleClientId) return;

		const existingScript = document.getElementById("google-identity-script");
		if (existingScript) {
			setGoogleReady(true);
			return;
		}

		const script = document.createElement("script");
		script.id = "google-identity-script";
		script.src = "https://accounts.google.com/gsi/client";
		script.async = true;
		script.defer = true;
		script.onload = () => setGoogleReady(true);
		script.onerror = () => setGoogleError("Failed to load Google Sign-In.");
		document.body.appendChild(script);
	}, [googleClientId]);

	useEffect(() => {
		if (!googleReady || !googleClientId || !window.google?.accounts?.id) {
			return;
		}

		window.google.accounts.id.initialize({
			client_id: googleClientId,
			callback: async (response) => {
				if (!response.credential) {
					setGoogleError("Google login failed.");
					return;
				}
				try {
					googleCredentialReceivedRef.current = true;
					setGoogleLoading(true);
					setGoogleError(null);
					await dispatch(loginWithGoogle(response.credential)).unwrap();
					navigate("/dashboard");
				} catch (loginError) {
					const message =
						typeof loginError === "string"
							? loginError
							: loginError instanceof Error
								? loginError.message
								: "Google login failed.";
					setGoogleError(message);
				} finally {
					setGoogleLoading(false);
				}
			},
		});
	}, [dispatch, googleClientId, googleReady, navigate]);

	const validationSchema = Yup.object({
		username: Yup.string().min(3, t("usernameMin")).required(t("usernameRequired")),
		password: Yup.string().min(6, t("passwordMin")).required(t("passwordRequired")),
	});

	const formik = useFormik({
		initialValues: {
			username: "",
			password: "",
		},
		validationSchema,
		onSubmit: (values) => {
			dispatch(login(values)).then((result) => {
				if (result.meta.requestStatus === "fulfilled") {
					navigate("/dashboard");
				}
			});
		},
	});

	const handleGoogleLogin = () => {
		if (!googleClientId) {
			setGoogleError("Google login is not configured.");
			return;
		}
		if (!googleReady || !window.google?.accounts?.id) {
			setGoogleError("Google Sign-In is still loading.");
			return;
		}
		setGoogleError(null);
		googlePromptStartedRef.current = true;
		googleCredentialReceivedRef.current = false;
		window.google.accounts.id.prompt((notification) => {
			if (googleCredentialReceivedRef.current) {
				return;
			}
			if (notification.isNotDisplayed()) {
				const reason = notification.getNotDisplayedReason();
				setGoogleError(
					reason === "browser_not_supported"
						? "Google Sign-In not supported in this browser."
						: reason === "invalid_client"
							? "Invalid Google Client ID."
							: reason === "third_party_cookies_blocked"
								? "Third-party cookies are blocked."
								: reason === "origin_mismatch"
									? "Origin mismatch. Check Google OAuth origins."
									: "Google Sign-In not displayed.",
				);
				googlePromptStartedRef.current = false;
			}
			if (notification.isSkippedMoment()) {
				if (googlePromptStartedRef.current) {
					setGoogleError("Google Sign-In was skipped.");
					googlePromptStartedRef.current = false;
				}
			}
			if (notification.isDismissedMoment()) {
				if (googlePromptStartedRef.current) {
					setGoogleError("Google Sign-In was closed.");
					googlePromptStartedRef.current = false;
				}
			}
		});
	};

	return (
		<div className="login-screen">
			<ThreeBackground />
			<div className="login-screen__glow login-screen__glow--one" />
			<div className="login-screen__glow login-screen__glow--two" />
			<div className="login-screen__orb login-screen__orb--left" />
			<div className="login-screen__orb login-screen__orb--right" />

			<div className="login-form-section">
				<Card className="login-card w-full max-w-sm">
					<CardHeader>
						<div className="login-hero__brand" style={{ justifyContent: "flex-start" }}>
							<img src="/favicon.svg" alt="MakakaTrade" className="login-hero__logo" style={{ width: "2.5rem", height: "2.5rem", borderRadius: "0.7rem" }} />
							<div>
								<div className="login-hero__name">MakakaTrade</div>
							</div>
						</div>
						<CardTitle>{t("loginToYourAccount")}</CardTitle>
						<CardDescription>
							{t("enterYourEmailBelowToLoginToYourAccount")}
						</CardDescription>
						<CardAction>
							<Button
								variant="link"
								className="font-semibold"
								onClick={() => navigate("/register")}
							>
								{t("signUp")}
							</Button>
						</CardAction>
					</CardHeader>
					<CardContent>
						{error && <div className="alert-error mb-4">{error}</div>}
						{googleError && <div className="alert-error mb-4">{googleError}</div>}

						<form onSubmit={formik.handleSubmit}>
							<div className="flex flex-col gap-6">
								<div className="grid gap-2">
									<Label htmlFor="username">{t("username")}</Label>
									<Input
										id="username"
										name="username"
										type="text"
										className="login-input"
										placeholder={t("enterUsername")}
										value={formik.values.username}
										onChange={formik.handleChange}
										onBlur={formik.handleBlur}
									/>
									{formik.touched.username && formik.errors.username && (
										<div className="form-error">{formik.errors.username}</div>
									)}
								</div>
								<div className="grid gap-2">
									<div className="flex items-center">
										<Label htmlFor="password">{t("password")}</Label>
										<a
											href="#"
											className="ml-auto inline-block text-sm text-text-secondary underline-offset-4 hover:underline"
										>
											{t("forgotYourPassword")}
										</a>
									</div>
									<Input
										id="password"
										name="password"
										type="password"
										className="login-input"
										value={formik.values.password}
										onChange={formik.handleChange}
										onBlur={formik.handleBlur}
									/>
									{formik.touched.password && formik.errors.password && (
										<div className="form-error">{formik.errors.password}</div>
									)}
								</div>
							</div>
						</form>
					</CardContent>
					<CardFooter className="flex-col gap-2">
						<Button
							type="submit"
							className="login-button w-full"
							disabled={isLoading || !formik.isValid}
							onClick={() => formik.handleSubmit()}
						>
							{isLoading ? t("loading") : t("login")}
						</Button>
						<Button
							variant="outline"
							className="login-google w-full"
							onClick={handleGoogleLogin}
							disabled={googleLoading || !googleClientId}
						>
							<span className="login-google-icon" aria-hidden="true">
								G
							</span>
							{googleLoading ? t("loading") : t("loginWithGoogle")}
						</Button>
					</CardFooter>
				</Card>
				<p className="login-screen__back">
					<button type="button" onClick={() => navigate("/")}>
						← Back to home
					</button>
				</p>
			</div>

			<button type="button" className="login-support" aria-label="Support" title="Support">
				<Headset size={18} strokeWidth={2.1} />
			</button>
		</div>
	);
};

export default Login;
