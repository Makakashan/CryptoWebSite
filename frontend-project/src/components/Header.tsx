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
    <div className="header">
      <h2>MakakaTrade</h2>
      <div className="header-actions">
        <LanguageSwitcher />
        {isAuthenticated && user ? (
          <>
            <div className="user-info">
              <span className="username">{user.username}</span>
              <span className="balance">{formatPrice(balance)}</span>
            </div>
            <button className="btn btn-secondary" onClick={handleLogout}>
              {t("logout")}
            </button>
          </>
        ) : (
          <button
            className="btn btn-primary"
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
