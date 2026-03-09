import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useTranslation } from "react-i18next";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { login } from "../store/slices/authSlice";
import api from "@/api/axiosConfig";
import { Headset } from "lucide-react";
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
	const [fearGreed, setFearGreed] = useState<string>("--");

	useEffect(() => {
		const fetchFearGreed = async () => {
			try {
				const response = await api.get("/stats/fear-greed");
				const value = response?.data?.data?.value;
				const classification = response?.data?.data?.classification;
				if (value !== undefined && classification) {
					setFearGreed(`${value} / ${classification}`);
				}
			} catch (fetchError) {
				console.error("Failed to fetch fear & greed index:", fetchError);
			}
		};

		fetchFearGreed();
	}, []);

	const validationSchema = Yup.object({
		username: Yup.string()
			.min(3, t("usernameMin"))
			.required(t("usernameRequired")),
		password: Yup.string()
			.min(6, t("passwordMin"))
			.required(t("passwordRequired")),
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
					navigate("/");
				}
			});
		},
	});

	const chartCurve =
		"M40 190 C120 160, 150 170, 220 145 C280 120, 320 130, 385 110 C450 92, 520 112, 590 90 C670 64, 720 78, 860 40";

	return (
		<div className="login-screen min-h-screen flex items-center justify-center p-5">
			<div className="login-screen__glow login-screen__glow--one" />
			<div className="login-screen__glow login-screen__glow--two" />
			<div className="login-layout w-full max-w-7xl">
				<section className="login-hero">
					<div className="login-hero__brand">
						<img src="/favicon.svg" alt="MakakaTrade" className="login-hero__logo" />
						<div>
							<div className="login-hero__name">MakakaTrade</div>
							<div className="login-hero__tag">Crypto Trading Platform</div>
						</div>
					</div>
					<h1 className="login-hero__title">Trade faster. Track smarter.</h1>
					<p className="login-hero__text">
						Live prices, clean analytics and portfolio control in one place. Built
						for quick decisions in volatile markets.
					</p>
				</section>

				<div className="login-main">
					<div className="login-visual">
						<div className="login-stats">
							<div className="login-stat">
								<span>24h Volume</span>
								<strong>$12.4B</strong>
							</div>
							<div className="login-stat">
								<span>BTC Dominance</span>
								<strong>54.7%</strong>
							</div>
							<div className="login-stat">
								<span>Fear & Greed</span>
								<strong>{fearGreed}</strong>
							</div>
						</div>

						<div className="login-screen__chart">
							<div className="login-screen__chips">
								<span>BTC/USDT</span>
								<span>+2.84%</span>
							</div>
							<svg
								className="login-screen__chart-svg"
								viewBox="0 0 900 260"
								preserveAspectRatio="none"
								aria-hidden="true"
							>
								<path
									className="login-screen__chart-area"
									d={`${chartCurve} L860 240 L40 240 Z`}
								/>
								<path
									className="login-screen__chart-line"
									d={chartCurve}
								/>
								<line className="login-screen__grid-line" x1="40" y1="210" x2="860" y2="210" />
								<line className="login-screen__grid-line" x1="40" y1="155" x2="860" y2="155" />
								<line className="login-screen__grid-line" x1="40" y1="100" x2="860" y2="100" />
								<line className="login-screen__grid-line" x1="40" y1="45" x2="860" y2="45" />
							</svg>
						</div>
					</div>

					<Card className="login-card w-full max-w-sm">
						<CardHeader>
							<div className="login-brand">MakakaTrade</div>
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
											<div className="form-error">
												{formik.errors.username}
											</div>
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
											<div className="form-error">
												{formik.errors.password}
											</div>
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
							<Button variant="outline" className="login-google w-full">
								{t("loginWithGoogle")}
							</Button>
						</CardFooter>
					</Card>
				</div>
			</div>
			<button
				type="button"
				className="login-support"
				aria-label="Support"
				title="Support"
			>
				<Headset size={18} strokeWidth={2.1} />
			</button>
		</div>
	);
};

export default Login;
