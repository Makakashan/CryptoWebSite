import { NavLink } from "react-router-dom";
import {
  FiHome,
  FiTrendingUp,
  FiBriefcase,
  FiShoppingCart,
  FiBarChart2,
} from "react-icons/fi";

const Sidebar = () => {
  return (
    <div className="sidebar">
      <h2>MakakaTrade</h2>
      <nav>
        <NavLink to="/">
          <FiHome />
          Dashboard
        </NavLink>
        <NavLink to="/markets">
          <FiTrendingUp />
          Markets
        </NavLink>
        <NavLink to="/portfolio">
          <FiBriefcase />
          Portfolio
        </NavLink>
        <NavLink to="/orders">
          <FiShoppingCart />
          Orders
        </NavLink>
        <NavLink to="/stats">
          <FiBarChart2 />
          Statistics
        </NavLink>
      </nav>
    </div>
  );
};

export default Sidebar;
