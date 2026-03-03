import { useEffect, useState, useMemo, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useTranslation } from "react-i18next";
import {
	ResponsiveContainer,
	AreaChart,
	Area,
	XAxis,
	YAxis,
	Tooltip,
	CartesianGrid,
} from "recharts";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { placeOrder } from "../store/slices/ordersSlice";
import { fetchPortfolio } from "../store/slices/portfolioSlice";
import { deleteAsset, fetchChartData } from "../store/slices/assetsSlice";
import { useBinanceWebSocket } from "../hooks/useBinanceWebSocket";
import { formatPrice } from "../utils/formatPrice";

const AMOUNT_DECIMALS = 6;
const AMOUNT_EPSILON = 1 / 10 ** AMOUNT_DECIMALS;

const floorToDecimals = (value: number, decimals = AMOUNT_DECIMALS): number => {
	const factor = 10 ** decimals;
	return Math.floor((value + Number.EPSILON) * factor) / factor;
};

const AssetDetail = () => {
	const { t } = useTranslation();
	const { symbol } = useParams<{ symbol: string }>();
	const navigate = useNavigate();
	const dispatch = useAppDispatch();
	const [successMessage, setSuccessMessage] = useState("");
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
	const [isAllAmountPinned, setIsAllAmountPinned] = useState(false);
	const [priceFlash, setPriceFlash] = useState<"up" | "down" | null>(null);
	const previousPriceRef = useRef(0);

	const { isAuthenticated, user } = useAppSelector((state) => state.auth);
	const { assets, chartData } = useAppSelector((state) => state.assets);
	const { portfolio } = useAppSelector((state) => state.portfolio);
	const { isLoading: orderLoading, error: orderError } = useAppSelector(
		(state) => state.orders,
	);

	useBinanceWebSocket({
		symbols: symbol ? [symbol] : [],
		enabled: Boolean(symbol),
	});

	const asset = assets.find((a) => a.symbol === symbol);
	const portfolioAsset = portfolio?.assets.find(
		(a) => a.asset_symbol === symbol,
	);

	// Calculate values for validation
	const currentPrice = asset?.price || asset?.current_price || 0;
	const ownedAmount = portfolioAsset?.amount || 0;
	const balance = portfolio?.balance || user?.balance || 0;
	const rawMaxBuyAmount = currentPrice > 0 ? balance / currentPrice : 0;
	const maxBuyAmount =
		rawMaxBuyAmount > 0
			? Math.max(0, floorToDecimals(rawMaxBuyAmount - AMOUNT_EPSILON))
			: 0;
	const maxSellAmount = ownedAmount;
	const symbolChartData = useMemo(
		() => (symbol ? chartData[symbol] || [] : []),
		[symbol, chartData],
	);
	const chartPoints = useMemo(
		() =>
			symbolChartData.map((price, index) => ({
				index,
				price,
			})),
		[symbolChartData],
	);

	useEffect(() => {
		if (!isAuthenticated) {
			navigate("/login");
			return;
		}

		dispatch(fetchPortfolio());
	}, [isAuthenticated, dispatch, navigate]);

	useEffect(() => {
		if (!symbol) return;

		if (symbolChartData.length === 0) {
			dispatch(fetchChartData([symbol]));
		}

		const intervalId = setInterval(() => {
			if (!document.hidden) {
				dispatch(fetchChartData([symbol]));
			}
		}, 30000);

		return () => clearInterval(intervalId);
	}, [dispatch, symbol, symbolChartData.length]);

	useEffect(() => {
		const previousPrice = previousPriceRef.current;
		if (
			previousPrice > 0 &&
			currentPrice > 0 &&
			previousPrice !== currentPrice
		) {
			setPriceFlash(currentPrice > previousPrice ? "up" : "down");
			const timeoutId = window.setTimeout(() => setPriceFlash(null), 600);
			previousPriceRef.current = currentPrice;
			return () => window.clearTimeout(timeoutId);
		}
		previousPriceRef.current = currentPrice;
	}, [currentPrice]);

	const orderValidationSchema = useMemo(
		() =>
			Yup.object({
				orderType: Yup.string()
					.oneOf(["BUY", "SELL"], "Invalid order type")
					.required("Order type is required"),
				amount: Yup.number()
					.positive("Amount must be positive")
					.required("Amount is required")
					.test("max-amount", "Insufficient balance", function (value) {
						const { orderType } = this.parent;
						if (!value) return false;
						if (orderType === "BUY") {
							return value <= maxBuyAmount + AMOUNT_EPSILON;
						}
						return value <= maxSellAmount;
					}),
			}),
		[maxBuyAmount, maxSellAmount],
	);

	const formik = useFormik({
		initialValues: {
			orderType: "BUY" as "BUY" | "SELL",
			amount: "" as string | number,
		},
		validationSchema: orderValidationSchema,
		onSubmit: async (values, { resetForm }) => {
			if (!asset || !symbol) return;

			const result = await dispatch(
				placeOrder({
					asset_symbol: symbol,
					order_type: values.orderType,
					amount: Number(values.amount),
					use_max: values.orderType === "BUY" && isAllAmountPinned,
				}),
			);

			if (result.meta.requestStatus === "fulfilled") {
				setSuccessMessage(`${values.orderType} order placed successfully!`);
				resetForm();
				setIsAllAmountPinned(false);
				await dispatch(fetchPortfolio());
				setTimeout(() => setSuccessMessage(""), 3000);
			}
		},
	});
	const selectedOrderType = formik.values.orderType;
	const setFieldValue = formik.setFieldValue;

	useEffect(() => {
		if (!isAllAmountPinned) return;

		const maxAmount =
			selectedOrderType === "BUY" ? maxBuyAmount : maxSellAmount;
		setFieldValue("amount", maxAmount > 0 ? maxAmount.toFixed(6) : "0");
	}, [
		isAllAmountPinned,
		selectedOrderType,
		maxBuyAmount,
		maxSellAmount,
		setFieldValue,
	]);

	const handleEdit = () => {
		navigate(`/markets/edit/${symbol}`);
	};

	const handleDeleteClick = () => {
		setShowDeleteConfirm(true);
	};

	const handleDeleteConfirm = async () => {
		if (!symbol) return;

		const result = await dispatch(deleteAsset(symbol));
		if (result.meta.requestStatus === "fulfilled") {
			setSuccessMessage(t("assetDeletedSuccessfully"));
			setTimeout(() => {
				navigate("/markets");
			}, 1500);
		}
		setShowDeleteConfirm(false);
	};

	const handleDeleteCancel = () => {
		setShowDeleteConfirm(false);
	};

	if (!asset) {
		return (
			<div>
				<div className="flex flex-col items-center justify-center p-14 text-center gap-4">
					<p className="text-red text-base">Asset not found</p>
					<button
						className="btn-primary"
						onClick={() => navigate("/markets")}
					>
						Back to Markets
					</button>
				</div>
			</div>
		);
	}

	const shortName = asset.symbol.replace("USDT", "");
	const defaultIcon = `https://ui-avatars.com/api/?name=${shortName}&background=random&size=80`;
	const ownedValue = ownedAmount * currentPrice;
	const canSell = ownedAmount > 0;
	const firstChartPrice = symbolChartData[0] || currentPrice;
	const lastChartPrice =
		symbolChartData[symbolChartData.length - 1] || currentPrice;
	const chartChange =
		firstChartPrice > 0
			? ((lastChartPrice - firstChartPrice) / firstChartPrice) * 100
			: 0;

	return (
		<div>
			<div className="flex justify-between items-center mb-6">
				<button
					className="btn-secondary btn-small"
					onClick={() => navigate("/markets")}
				>
					← {t("back")}
				</button>
				<div className="flex gap-3">
					<button className="btn-outline btn-small" onClick={handleEdit}>
						{t("edit")}
					</button>
					<button
						className="btn-danger btn-small"
						onClick={handleDeleteClick}
					>
						{t("delete")}
					</button>
				</div>
			</div>

			{showDeleteConfirm && (
				<div
					className="fixed inset-0 bg-black/70 flex items-center justify-center z-1000"
					onClick={handleDeleteCancel}
				>
					<div
						className="card p-8 max-w-md w-full mx-4"
						onClick={(e) => e.stopPropagation()}
					>
						<h3 className="text-xl font-semibold text-text-primary mb-4">
							{t("confirmDeleteAsset")}
						</h3>
						<p className="text-text-secondary mb-6">
							{t("asset")}:{" "}
							<strong className="text-text-primary">
								{asset?.name || asset?.symbol}
							</strong>
						</p>
						<div className="flex gap-3 justify-end">
							<button
								className="btn-outline btn-small"
								onClick={handleDeleteCancel}
							>
								{t("cancel")}
							</button>
							<button
								className="btn-danger btn-small"
								onClick={handleDeleteConfirm}
							>
								{t("delete")}
							</button>
						</div>
					</div>
				</div>
			)}

			<div className="flex justify-between items-start mb-6 card-padded">
				<div className="flex items-start gap-4">
					<img
						src={asset.image_url || defaultIcon}
						alt={shortName}
						className="w-20 h-20 rounded-full"
						onError={(e) => {
							e.currentTarget.src = defaultIcon;
						}}
					/>
					<div>
						<h1 className="text-3xl font-bold text-text-primary mb-1">
							{shortName}
						</h1>
						<p className="text-text-secondary text-sm mb-2">
							{asset.name || asset.symbol}
						</p>
						{asset.category && (
							<span className="badge-primary">{asset.category}</span>
						)}
					</div>
				</div>

				<div className="text-right">
					<div
						className={`text-3xl font-bold transition-colors duration-300 ${
							priceFlash === "up"
								? "text-green"
								: priceFlash === "down"
									? "text-red"
									: "text-text-primary"
						}`}
					>
						{formatPrice(currentPrice)}
					</div>
					<div className="mt-2 flex items-center justify-end gap-2 text-xs">
						<span className="px-2 py-0.5 rounded-full border border-green/50 text-green">
							LIVE
						</span>
						<span
							className={
								chartChange >= 0
									? "text-green font-semibold"
									: "text-red font-semibold"
							}
						>
							{chartChange >= 0 ? "+" : ""}
							{chartChange.toFixed(2)}%
						</span>
					</div>
				</div>
			</div>

			{asset.description && (
				<div className="card-padded mb-6">
					<h2 className="section-header mb-3">About {shortName}</h2>
					<p className="text-text-secondary leading-relaxed">
						{asset.description}
					</p>
				</div>
			)}

			<div className="card-padded mb-6">
				<div className="flex items-center justify-between mb-4">
					<h2 className="section-header m-0">Price Chart (24h)</h2>
					<span className="text-xs text-text-secondary">15m candles</span>
				</div>
				<div className="h-64">
					{chartPoints.length > 1 ? (
						<ResponsiveContainer width="100%" height="100%">
							<AreaChart data={chartPoints}>
								<defs>
									<linearGradient
										id="detailPriceFill"
										x1="0"
										y1="0"
										x2="0"
										y2="1"
									>
										<stop
											offset="5%"
											stopColor="#0ecb81"
											stopOpacity={0.4}
										/>
										<stop
											offset="95%"
											stopColor="#0ecb81"
											stopOpacity={0.02}
										/>
									</linearGradient>
								</defs>
								<CartesianGrid strokeDasharray="3 3" stroke="#2b3139" />
								<XAxis dataKey="index" hide />
								<YAxis
									tick={{ fill: "#9ca3af", fontSize: 12 }}
									tickFormatter={(value: number) =>
										`$${value.toLocaleString()}`
									}
									width={80}
									domain={["dataMin", "dataMax"]}
								/>
								<Tooltip
									formatter={(value) =>
										formatPrice(Number(value || 0))
									}
									contentStyle={{
										background: "#151922",
										border: "1px solid #2b3139",
										borderRadius: 10,
										color: "#ffffff",
									}}
									labelFormatter={() => "Price"}
								/>
								<Area
									type="monotone"
									dataKey="price"
									stroke="#0ecb81"
									strokeWidth={2}
									fill="url(#detailPriceFill)"
								/>
							</AreaChart>
						</ResponsiveContainer>
					) : (
						<div className="h-full flex items-center justify-center text-text-secondary">
							Loading chart...
						</div>
					)}
				</div>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				<div className="card-padded">
					<h2 className="section-header">Your Holdings</h2>
					<div className="grid grid-cols-2 gap-4">
						<div className="data-item">
							<span className="data-item-label">Amount Owned</span>
							<span className="data-item-value">
								{ownedAmount.toFixed(6)}
							</span>
						</div>
						<div className="data-item">
							<span className="data-item-label">Total Value</span>
							<span className="data-item-value">
								{formatPrice(ownedValue)}
							</span>
						</div>
						<div className="data-item">
							<span className="data-item-label">Available Balance</span>
							<span className="data-item-value">
								{formatPrice(balance)}
							</span>
						</div>
						<div className="data-item">
							<span className="data-item-label">Max Buy Amount</span>
							<span className="data-item-value">
								{maxBuyAmount > 0
									? maxBuyAmount.toFixed(6)
									: "0.000000"}
							</span>
						</div>
					</div>
				</div>

				<div className="card-padded">
					<h2 className="section-header">Trade {shortName}</h2>

					{successMessage && (
						<div className="alert-success">{successMessage}</div>
					)}

					{orderError && <div className="alert-error">{orderError}</div>}

					<form onSubmit={formik.handleSubmit}>
						<div className="grid grid-cols-2 gap-3 mb-6">
							<button
								type="button"
								className={`py-3 rounded-lg text-sm font-semibold cursor-pointer transition-all duration-200 border-2 ${
									formik.values.orderType === "BUY"
										? "bg-green/20 border-green text-green"
										: "bg-transparent border-bg-hover text-text-secondary hover:border-green/50"
								}`}
								onClick={() => {
									setIsAllAmountPinned(false);
									formik.setFieldValue("orderType", "BUY");
									formik.setFieldValue("amount", "");
								}}
							>
								Buy
							</button>
							<button
								type="button"
								className={`py-3 rounded-lg text-sm font-semibold cursor-pointer transition-all duration-200 border-2 ${
									formik.values.orderType === "SELL"
										? "bg-red/20 border-red text-red"
										: "bg-transparent border-bg-hover text-text-secondary hover:border-red/50"
								} disabled:opacity-50 disabled:cursor-not-allowed`}
								onClick={() => {
									setIsAllAmountPinned(false);
									formik.setFieldValue("orderType", "SELL");
									formik.setFieldValue("amount", "");
								}}
								disabled={!canSell}
							>
								Sell
							</button>
						</div>

						<div className="mb-6">
							<label
								htmlFor="amount"
								className="block mb-2 text-text-primary font-semibold text-sm"
							>
								Amount
							</label>
							<div className="relative">
								<input
									id="amount"
									name="amount"
									type="number"
									step="0.000001"
									min="0"
									placeholder="Enter amount"
									value={formik.values.amount}
									onChange={(e) => {
										setIsAllAmountPinned(false);
										formik.handleChange(e);
									}}
									onBlur={formik.handleBlur}
									className="input pr-24"
								/>
								<button
									type="button"
									className={`${formik.values.orderType === "BUY" ? "btn-success" : "btn-primary"} absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 text-xs`}
									onClick={() => {
										const maxAmount =
											formik.values.orderType === "BUY"
												? maxBuyAmount
												: maxSellAmount;
										setIsAllAmountPinned(true);
										formik.setFieldValue(
											"amount",
											maxAmount > 0 ? maxAmount.toFixed(6) : "0",
										);
									}}
								>
									{formik.values.orderType === "BUY"
										? "Buy All"
										: "Sell All"}
								</button>
							</div>
							{formik.touched.amount && formik.errors.amount && (
								<div className="text-red text-xs mt-1">
									{formik.errors.amount}
								</div>
							)}
							<div className="text-text-secondary text-xs mt-1">
								{formik.values.orderType === "BUY" ? (
									<span>Max: {maxBuyAmount.toFixed(6)}</span>
								) : (
									<span>Available: {ownedAmount.toFixed(6)}</span>
								)}
							</div>
						</div>

						{formik.values.amount && Number(formik.values.amount) > 0 && (
							<div className="bg-bg-dark rounded-lg p-4 mb-6 space-y-2">
								<div className="flex justify-between text-sm">
									<span className="text-text-secondary">Amount:</span>
									<span className="text-text-primary font-medium">
										{Number(formik.values.amount).toFixed(6)}{" "}
										{shortName}
									</span>
								</div>
								<div className="flex justify-between text-sm">
									<span className="text-text-secondary">Price:</span>
									<span className="text-text-primary font-medium">
										{formatPrice(currentPrice)}
									</span>
								</div>
								<div className="flex justify-between text-base font-semibold pt-2 border-t border-bg-hover">
									<span className="text-text-primary">Total:</span>
									<span className="text-text-primary">
										{formatPrice(
											Number(formik.values.amount) * currentPrice,
										)}
									</span>
								</div>
							</div>
						)}

						<button
							type="submit"
							className={`w-full px-6 py-3 border-0 rounded-lg text-sm font-semibold cursor-pointer transition-all duration-200 text-white disabled:opacity-50 disabled:cursor-not-allowed ${
								formik.values.orderType === "BUY"
									? "bg-green hover:enabled:bg-green/90"
									: "bg-red hover:enabled:bg-red/90"
							}`}
							disabled={
								orderLoading || !formik.isValid || !formik.values.amount
							}
						>
							{orderLoading
								? "Processing..."
								: `${formik.values.orderType} ${shortName}`}
						</button>
					</form>
				</div>
			</div>
		</div>
	);
};

export default AssetDetail;
