import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  FiHome,
  FiTrendingUp,
  FiBriefcase,
  FiShoppingCart,
  FiBarChart2,
} from "react-icons/fi";

const Sidebar = () => {
  const { t } = useTranslation();

  return (
    <div className="w-220px h-screen bg-bg-card border-r border-bg-hover fixed left-0 top-0 p-6 z-100">
      <h2 className="text-blue mb-6 text-xl font-semibold">MakakaTrade</h2>
      <nav className="flex flex-col gap-2">
        <NavLink
          to="/"
          className={({ isActive }) =>
            `px-4 py-3 rounded-lg flex items-center gap-2.5 transition-all duration-200 font-medium no-underline ${
              isActive
                ? "bg-blue/10 text-blue"
                : "text-text-secondary hover:bg-bg-hover hover:text-text-primary"
            }`
          }
        >
          <FiHome className="text-lg" />
          {t("dashboard")}
        </NavLink>
        <NavLink
          to="/markets"
          className={({ isActive }) =>
            `px-4 py-3 rounded-lg flex items-center gap-2.5 transition-all duration-200 font-medium no-underline ${
              isActive
                ? "bg-blue/10 text-blue"
                : "text-text-secondary hover:bg-bg-hover hover:text-text-primary"
            }`
          }
        >
          <FiTrendingUp className="text-lg" />
          {t("markets")}
        </NavLink>
        <NavLink
          to="/portfolio"
          className={({ isActive }) =>
            `px-4 py-3 rounded-lg flex items-center gap-2.5 transition-all duration-200 font-medium no-underline ${
              isActive
                ? "bg-blue/10 text-blue"
                : "text-text-secondary hover:bg-bg-hover hover:text-text-primary"
            }`
          }
        >
          <FiBriefcase className="text-lg" />
          {t("portfolio")}
        </NavLink>
        <NavLink
          to="/orders"
          className={({ isActive }) =>
            `px-4 py-3 rounded-lg flex items-center gap-2.5 transition-all duration-200 font-medium no-underline ${
              isActive
                ? "bg-blue/10 text-blue"
                : "text-text-secondary hover:bg-bg-hover hover:text-text-primary"
            }`
          }
        >
          <FiShoppingCart className="text-lg" />
          {t("orders")}
        </NavLink>
        <NavLink
          to="/statistics"
          className={({ isActive }) =>
            `px-4 py-3 rounded-lg flex items-center gap-2.5 transition-all duration-200 font-medium no-underline ${
              isActive
                ? "bg-blue/10 text-blue"
                : "text-text-secondary hover:bg-bg-hover hover:text-text-primary"
            }`
          }
        >
          <FiBarChart2 className="text-lg" />
          {t("statistics")}
        </NavLink>
      </nav>
    </div>
  );
};

export default Sidebar;
