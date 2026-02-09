import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  FiHome,
  FiTrendingUp,
  FiBriefcase,
  FiShoppingCart,
  FiBarChart2,
  FiUser,
} from "react-icons/fi";

const Sidebar = () => {
  const { t } = useTranslation();

  return (
    <div className="w-sidebar h-screen bg-bg-card border-r border-bg-hover fixed left-0 top-0 p-6 z-100">
      <h2 className="text-blue mb-6 text-xl font-semibold">MakakaTrade</h2>
      <nav className="flex flex-col gap-2">
        <NavLink
          to="/"
          className={({ isActive }) =>
            isActive ? "nav-link-active" : "nav-link-inactive"
          }
        >
          <FiHome className="text-lg" />
          {t("dashboard")}
        </NavLink>
        <NavLink
          to="/markets"
          className={({ isActive }) =>
            isActive ? "nav-link-active" : "nav-link-inactive"
          }
        >
          <FiTrendingUp className="text-lg" />
          {t("markets")}
        </NavLink>
        <NavLink
          to="/portfolio"
          className={({ isActive }) =>
            isActive ? "nav-link-active" : "nav-link-inactive"
          }
        >
          <FiBriefcase className="text-lg" />
          {t("portfolio")}
        </NavLink>
        <NavLink
          to="/orders"
          className={({ isActive }) =>
            isActive ? "nav-link-active" : "nav-link-inactive"
          }
        >
          <FiShoppingCart className="text-lg" />
          {t("orders")}
        </NavLink>
        <NavLink
          to="/statistics"
          className={({ isActive }) =>
            isActive ? "nav-link-active" : "nav-link-inactive"
          }
        >
          <FiBarChart2 className="text-lg" />
          {t("statistics")}
        </NavLink>
        <NavLink
          to="/profile"
          className={({ isActive }) =>
            isActive ? "nav-link-active" : "nav-link-inactive"
          }
        >
          <FiUser className="text-lg" />
          {t("profile")}
        </NavLink>
      </nav>
    </div>
  );
};

export default Sidebar;
