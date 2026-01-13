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
    <div className="sidebar">
      <h2>MakakaTrade</h2>
      <nav>
        <NavLink to="/">
          <FiHome />
          {t("dashboard")}
        </NavLink>
        <NavLink to="/markets">
          <FiTrendingUp />
          {t("markets")}
        </NavLink>
        <NavLink to="/portfolio">
          <FiBriefcase />
          {t("portfolio")}
        </NavLink>
        <NavLink to="/orders">
          <FiShoppingCart />
          {t("orders")}
        </NavLink>
        <NavLink to="/statistics">
          <FiBarChart2 />
          {t("statistics")}
        </NavLink>
      </nav>
    </div>
  );
};

export default Sidebar;
