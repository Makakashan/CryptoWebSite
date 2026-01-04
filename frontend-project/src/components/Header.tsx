import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { logout } from "../store/slices/authSlice";

const Header = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const { portfolio } = useAppSelector((state) => state.portfolio);

  const handleLogout = async () => {
    await dispatch(logout());
    navigate("/login");
  };

  return (
    <div className="header">
      <h2>Welcome to MakakaTrade</h2>
      <div className="header-actions">
        {isAuthenticated && user ? (
          <>
            <div className="user-info">
              <span className="username">👤 {user.username}</span>
              <div className="balance">
                Balance: <span>${portfolio?.balance.toFixed(2) || user.balance.toFixed(2)}</span>
              </div>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={handleLogout}>
              Logout
            </button>
          </>
        ) : (
          <button
            className="btn btn-primary btn-sm"
            onClick={() => navigate("/login")}
          >
            Login
          </button>
        )}
      </div>
    </div>
  );
};

export default Header;
