import { useFormik } from "formik";
import { Headset } from "lucide-react";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import * as Yup from "yup";
import ThreeBackground from "@/components/ThreeBackground";
import { CoinField } from "@/components/three";
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
import { AvatarUpload } from "../components/ui/AvatarUpload";
import { useGoogleAuth } from "../hooks/useGoogleAuth";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { register } from "../store/slices/authSlice";

const Register = () => {
	const { t } = useTranslation();
	const dispatch = useAppDispatch();
	const navigate = useNavigate();
	const { isLoading, error } = useAppSelector((state) => state.auth);
	const [avatar, setAvatar] = useState<string | null>(null);

	const onGoogleSuccess = useCallback(() => navigate("/dashboard"), [navigate]);
	const {
		loading: googleLoading,
		error: googleError,
		triggerPrompt,
	} = useGoogleAuth(onGoogleSuccess);
	const visibleAuthError = googleError ?? error;

	const validationSchema = Yup.object({
		username: Yup.string()
			.min(3, t("usernameMin"))
			.max(20, t("usernameMax"))
			.required(t("usernameRequired")),
		password: Yup.string().min(6, t("passwordMin")).required(t("passwordRequired")),
		confirmPassword: Yup.string()
			.oneOf([Yup.ref("password")], t("passwordsMustMatch"))
			.required(t("pleaseConfirmPassword")),
	});

	const formik = useFormik({
		initialValues: {
			username: "",
			password: "",
			confirmPassword: "",
		},
		validationSchema,
		onSubmit: (values) => {
			dispatch(
				register({
					username: values.username,
					password: values.password,
					avatar: avatar,
				}),
			).then((result) => {
				if (result.meta.requestStatus === "fulfilled") {
					navigate("/login");
				}
			});
		},
	});

	return (
		<div className="login-screen">
			<ThreeBackground />
			<CoinField
				count={6}
				spread={36}
				opacity={0.18}
				parallax={2.5}
				position="fixed"
				zIndex={0}
				draggable
			/>
			<div className="login-screen__glow login-screen__glow--one" />
			<div className="login-screen__glow login-screen__glow--two" />
			<div className="login-screen__orb login-screen__orb--left" />
			<div className="login-screen__orb login-screen__orb--right" />

			<div className="login-form-section">
				<Card className="login-card w-full max-w-sm">
					<CardHeader>
						<div className="login-hero__brand" style={{ justifyContent: "flex-start" }}>
							<img
								src="/favicon.svg"
								alt="MakakaTrade"
								className="login-hero__logo"
								style={{ width: "2.5rem", height: "2.5rem", borderRadius: "0.7rem" }}
							/>
							<div>
								<div className="login-hero__name">MakakaTrade</div>
							</div>
						</div>
						<CardTitle>{t("createAnAccount")}</CardTitle>
						<CardDescription>
							{t("enterYourInformationBelowToCreateYourAccount")}
						</CardDescription>
						<CardAction>
							<Button
								variant="link"
								className="font-semibold"
								onClick={() => navigate("/login")}
							>
								{t("login")}
							</Button>
						</CardAction>
					</CardHeader>
					<CardContent>
						{visibleAuthError && <div className="alert-error mb-4">{visibleAuthError}</div>}

						<form onSubmit={formik.handleSubmit}>
							<div className="flex flex-col gap-6">
								<div className="flex justify-center">
									<AvatarUpload
										currentAvatar={avatar}
										username={formik.values.username || "User"}
										onAvatarChange={setAvatar}
									/>
								</div>

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
									<Label htmlFor="password">{t("password")}</Label>
									<Input
										id="password"
										name="password"
										type="password"
										className="login-input"
										placeholder={t("enterPassword")}
										value={formik.values.password}
										onChange={formik.handleChange}
										onBlur={formik.handleBlur}
									/>
									{formik.touched.password && formik.errors.password && (
										<div className="form-error">{formik.errors.password}</div>
									)}
								</div>

								<div className="grid gap-2">
									<Label htmlFor="confirmPassword">{t("confirmPassword")}</Label>
									<Input
										id="confirmPassword"
										name="confirmPassword"
										type="password"
										className="login-input"
										placeholder={t("confirmPasswordPlaceholder")}
										value={formik.values.confirmPassword}
										onChange={formik.handleChange}
										onBlur={formik.handleBlur}
									/>
									{formik.touched.confirmPassword && formik.errors.confirmPassword && (
										<div className="form-error">{formik.errors.confirmPassword}</div>
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
							{isLoading ? t("loading") : t("register")}
						</Button>
						<Button
							variant="outline"
							className="login-google w-full"
							onClick={triggerPrompt}
							disabled={googleLoading}
						>
							<span className="login-google-icon" aria-hidden="true">
								G
							</span>
							{googleLoading ? t("loading") : t("signUpWithGoogle")}
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

export default Register;
