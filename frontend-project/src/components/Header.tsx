import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { logout } from "../store/slices/authSlice";
import { formatPrice } from "../utils/formatPrice";
import LanguageSwitcher from "./LanguageSwitcher";

const Header = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const { portfolio } = useAppSelector((state) => state.portfolio);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  const balance = portfolio?.balance || user?.balance || 0;

  return (
    <div className="flex justify-end items-center card px-6 py-4 mb-6">
      <div className="flex items-center gap-4">
        <LanguageSwitcher />
        {isAuthenticated && user ? (
          <>
            <div className="flex flex-col items-end gap-1">
              <span className="font-semibold text-text-primary text-sm">
                {user.username}
              </span>
              <span className="text-base text-green font-bold">
                {formatPrice(balance)}
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
