import { NavLink } from "react-router-dom";
import {
  FiHome,
  FiTrendingUp,
  FiBriefcase,
  FiShoppingCart,
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
      </nav>
    </div>
  );
};

export default Sidebar;
