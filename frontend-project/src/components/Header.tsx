import { useNavigate, useLocation } from "react-router-dom";
import { useMemo, useEffect, useState, useId } from "react";
import { useTranslation } from "react-i18next";
import { FiArrowUpRight } from "react-icons/fi";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { logout } from "../store/slices/authSlice";
import { formatPrice, getInitials } from "../utils/formatPrice";
import LanguageSwitcher from "./LanguageSwitcher";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { binanceWebSocketService } from "../services/binanceWebSocket";

const Header = () => {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const location = useLocation();
	const dispatch = useAppDispatch();
	const { user, isAuthenticated } = useAppSelector((state) => state.auth);
	const { portfolio } = useAppSelector((state) => state.portfolio);
	const { assets } = useAppSelector((state) => state.assets);
	const [priceTick, setPriceTick] = useState(0);
	const wsSourceId = `header-ws-${useId()}`;

	const handleLogout = () => {
		dispatch(logout());
		navigate("/login");
	};

	const cashBalance = portfolio?.balance || user?.balance || 0;
	const portfolioSymbols = useMemo(() => {
		if (!portfolio) return [];
		return portfolio.assets.map((asset) => asset.asset_symbol);
	}, [portfolio]);

	useEffect(() => {
		if (portfolioSymbols.length === 0) {
			binanceWebSocketService.clearSymbols(wsSourceId);
			return;
		}
		binanceWebSocketService.updateSymbols(portfolioSymbols, wsSourceId);
		return () => {
			binanceWebSocketService.clearSymbols(wsSourceId);
		};
	}, [portfolioSymbols, wsSourceId]);

	useEffect(() => {
		const handlePriceUpdate = () => {
			setPriceTick((tick) => tick + 1);
		};

		binanceWebSocketService.subscribe(handlePriceUpdate);
		return () => {
			binanceWebSocketService.unsubscribe(handlePriceUpdate);
		};
	}, []);

	const holdingsValue = useMemo(() => {
		if (!portfolio) return 0;
		void priceTick;

		return portfolio.assets.reduce((sum, portfolioAsset) => {
			const assetData = assets.find(
				(asset) => asset.symbol === portfolioAsset.asset_symbol,
			);
			const livePrice = binanceWebSocketService.getPrice(
				portfolioAsset.asset_symbol,
			);
			const price =
				livePrice ?? assetData?.price ?? assetData?.current_price ?? 0;
			return sum + portfolioAsset.amount * price;
		}, 0);
	}, [portfolio, assets, priceTick]);
	const totalBalance = cashBalance + holdingsValue;
	const userInitials = user?.username ? getInitials(user.username) : "U";
	const pageLabel = useMemo(() => {
		const path = location.pathname;
		if (path === "/") return t("dashboard");
		if (path.startsWith("/markets")) return t("markets");
		if (path.startsWith("/portfolio")) return t("portfolio");
		if (path.startsWith("/orders")) return t("orders");
		if (path.startsWith("/statistics")) return t("statistics");
		if (path.startsWith("/profile")) return t("profile");
		return "MakakaTrade";
	}, [location.pathname, t]);

	return (
		<div className="relative mb-6 overflow-hidden rounded-3xl border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.045),rgba(255,255,255,0.018))] px-6 py-4 shadow-[0_24px_64px_rgba(0,0,0,0.32)] backdrop-blur-xl">
			<div
				aria-hidden
				className="pointer-events-none absolute inset-0 overflow-hidden"
			>
				<div className="absolute -left-16 top-0 h-32 w-32 rounded-full bg-yellow-300/10 blur-3xl" />
				<div className="absolute right-0 top-0 h-36 w-36 rounded-full bg-red-500/10 blur-3xl" />
			</div>

			<div className="relative z-10 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
				<button
					className="flex items-center gap-4 text-left"
					onClick={() => navigate("/")}
				>
					<div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-yellow-300/20 bg-[linear-gradient(135deg,rgba(250,204,21,0.12),rgba(239,68,68,0.12))] shadow-[0_0_24px_rgba(251,146,60,0.18)]">
						<img src="/favicon.svg" alt="MakakaTrade" className="h-5 w-5" />
					</div>
					<div className="flex flex-col">
						<span className="text-base font-semibold text-text-primary">
							MakakaTrade
						</span>
						<span className="text-[11px] uppercase tracking-[0.24em] text-yellow-100/70">
							{pageLabel}
						</span>
					</div>
				</button>

				<div className="flex flex-wrap items-center justify-end gap-3">
					<LanguageSwitcher />
					{isAuthenticated && user ? (
						<>
							<div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-3 py-2.5">
								<Avatar
									className="avatar-sm cursor-pointer ring-1 ring-white/10 transition-opacity hover:opacity-80"
									onClick={() => navigate("/profile")}
								>
									{user.avatar ? (
										<AvatarImage src={user.avatar} alt={user.username} />
									) : (
										<AvatarFallback className="bg-blue text-white font-semibold">
											{userInitials}
										</AvatarFallback>
									)}
								</Avatar>
								<div className="min-w-[140px]">
									<div className="flex items-center gap-2">
										<span className="text-sm font-semibold text-text-primary">
											{user.username}
										</span>
										<span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-300">
											USDT
										</span>
									</div>
									<div className="text-base font-semibold text-emerald-400">
										{formatPrice(totalBalance)}
									</div>
									<div className="text-[10px] leading-none text-text-secondary">
										{t("cash")}: {formatPrice(cashBalance)} ·{" "}
										{t("holdings")}: {formatPrice(holdingsValue)}
									</div>
								</div>
							</div>
							<button
								className="inline-flex h-11 items-center gap-2 rounded-2xl border border-white/10 bg-white/4 px-4 text-sm font-semibold text-text-primary transition-all hover:border-red/35 hover:bg-red/10"
								onClick={handleLogout}
							>
								{t("logout")}
								<FiArrowUpRight className="text-sm opacity-70" />
							</button>
						</>
					) : (
						<button
							className="btn-primary btn-small"
							onClick={() => navigate("/login")}
						>
							{t("login")}
						</button>
					)}
				</div>
			</div>
		</div>
	);
};

export default Header;
