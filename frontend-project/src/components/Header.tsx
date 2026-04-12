import { useNavigate, useLocation } from "react-router-dom";
import { useMemo, useEffect, useState, useId } from "react";
import { useTranslation } from "react-i18next";
import { FiArrowUpRight } from "react-icons/fi";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { logout } from "../store/slices/authSlice";
import { formatPrice, getInitials } from "../utils/formatPrice";

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
			const assetData = assets.find((asset) => asset.symbol === portfolioAsset.asset_symbol);
			const livePrice = binanceWebSocketService.getPrice(portfolioAsset.asset_symbol);
			const price = livePrice ?? assetData?.price ?? assetData?.current_price ?? 0;
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
		<div className="header-shell relative mb-6 overflow-hidden px-6 py-4">
			<div
				aria-hidden
				className="header-highlight pointer-events-none absolute inset-0 overflow-hidden"
			>
				<div className="header-highlight__rim" />
				<div className="header-highlight__glow" />
				<div className="header-highlight__orb header-highlight__orb--left" />
				<div className="header-highlight__orb header-highlight__orb--right" />
			</div>

			<div className="relative z-10 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
				<button
					className="header-brand flex items-center gap-4 text-left"
					onClick={() => navigate("/")}
				>
					<div className="header-brand__icon">
						<img src="/favicon.svg" alt="MakakaTrade" className="h-5 w-5" />
					</div>
					<div className="flex flex-col">
						<span className="text-base font-semibold text-text-primary">MakakaTrade</span>
						<span className="header-brand__label text-[11px] uppercase tracking-[0.24em]">
							{pageLabel}
						</span>
					</div>
				</button>

				<div className="flex flex-wrap items-center justify-end gap-3">

					{isAuthenticated && user ? (
						<>
							<div className="header-user-card flex items-center gap-3 px-3 py-2.5">
								<Avatar
									className="avatar-sm cursor-pointer ring-1 ring-white/10 transition-opacity hover:opacity-80"
									onClick={() => navigate("/profile")}
								>
									{user.avatar ? (
										<AvatarImage src={user.avatar} alt={user.username} />
									) : (
										<AvatarFallback className="header-avatar-fallback font-semibold text-white">
											{userInitials}
										</AvatarFallback>
									)}
								</Avatar>
								<div className="min-w-35">
									<div className="flex items-center gap-2">
										<span className="text-sm font-semibold text-text-primary">
											{user.username}
										</span>
										<span className="header-badge rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em]">
											USDT
										</span>
									</div>
									<div className="header-balance text-base font-semibold">
										{formatPrice(totalBalance)}
									</div>
									<div className="text-[10px] leading-none text-text-secondary">
										{t("cash")}: {formatPrice(cashBalance)} · {t("holdings")}:{" "}
										{formatPrice(holdingsValue)}
									</div>
								</div>
							</div>
							<button className="glass-cta-button" onClick={handleLogout}>
								{t("logout")}
								<FiArrowUpRight className="text-sm opacity-70" />
							</button>
						</>
					) : (
						<button className="btn-primary btn-small" onClick={() => navigate("/login")}>
							{t("login")}
						</button>
					)}
				</div>
			</div>
		</div>
	);
};

export default Header;
