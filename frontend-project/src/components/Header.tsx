import { useNavigate, useLocation } from "react-router-dom";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { logout } from "../store/slices/authSlice";
import { formatPrice, getInitials } from "../utils/formatPrice";
import LanguageSwitcher from "./LanguageSwitcher";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const Header = () => {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const location = useLocation();
	const dispatch = useAppDispatch();
	const { user, isAuthenticated } = useAppSelector((state) => state.auth);
	const { portfolio } = useAppSelector((state) => state.portfolio);
	const { assets } = useAppSelector((state) => state.assets);

	const handleLogout = () => {
		dispatch(logout());
		navigate("/login");
	};

	const cashBalance = portfolio?.balance || user?.balance || 0;
	const holdingsValue = useMemo(() => {
		if (!portfolio) return 0;

		return portfolio.assets.reduce((sum, portfolioAsset) => {
			const assetData = assets.find(
				(asset) => asset.symbol === portfolioAsset.asset_symbol,
			);
			const price = assetData?.price || assetData?.current_price || 0;
			return sum + portfolioAsset.amount * price;
		}, 0);
	}, [portfolio, assets]);
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
		<div className="flex items-center justify-between card px-6 py-4 mb-6">
			<div className="flex items-center gap-4">
				<button
					className="flex items-center gap-3 text-left"
					onClick={() => navigate("/")}
				>
					<div className="w-10 h-10 rounded-xl bg-bg-hover/60 border border-bg-hover flex items-center justify-center">
						<img src="/favicon.svg" alt="MakakaTrade" className="w-5 h-5" />
					</div>
					<div className="hidden sm:flex flex-col">
						<span className="text-sm font-semibold text-text-primary">
							MakakaTrade
						</span>
						<span className="text-xs text-text-secondary uppercase tracking-[0.2em]">
							{pageLabel}
						</span>
					</div>
				</button>
			</div>
			<div className="flex items-center gap-4">
				<LanguageSwitcher />
				{isAuthenticated && user ? (
					<>
						<Avatar
							className="avatar-sm cursor-pointer hover:opacity-80 transition-opacity"
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
						<div className="flex flex-col items-end gap-1">
							<span className="font-semibold text-text-primary text-sm">
								{user.username}
							</span>
							<span className="text-base text-emerald-400 font-bold">
								{formatPrice(totalBalance)}
							</span>
							<span className="text-[11px] text-text-secondary leading-none">
								{t("cash")}: {formatPrice(cashBalance)} ·{" "}
								{t("holdings")}: {formatPrice(holdingsValue)}
							</span>
						</div>
						<button
							className="btn-outline btn-small"
							onClick={handleLogout}
						>
							{t("logout")}
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
	);
};

export default Header;
