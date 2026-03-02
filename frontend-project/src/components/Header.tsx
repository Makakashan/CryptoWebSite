import { useNavigate } from "react-router-dom";
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
      const assetData = assets.find((asset) => asset.symbol === portfolioAsset.asset_symbol);
      const price = assetData?.price || assetData?.current_price || 0;
      return sum + portfolioAsset.amount * price;
    }, 0);
  }, [portfolio, assets]);
  const totalBalance = cashBalance + holdingsValue;
  const userInitials = user?.username ? getInitials(user.username) : "U";

  return (
    <div className="flex justify-end items-center card px-6 py-4 mb-6">
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
                {t("cash")}: {formatPrice(cashBalance)} · {t("holdings")}:{" "}
                {formatPrice(holdingsValue)}
              </span>
            </div>
            <button className="btn-outline btn-small" onClick={handleLogout}>
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
