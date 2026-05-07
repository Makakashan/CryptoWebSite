import { NavLink, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { motion } from "framer-motion";
import {
	LayoutDashboard,
	TrendingUp,
	PieChart,
	ListOrdered,
	UserCircle,
} from "lucide-react";
import type { RootState } from "../store/store";

const navItems = [
	{ to: "/dashboard", icon: LayoutDashboard, label: "Dashboard", exact: true },
	{ to: "/markets", icon: TrendingUp, label: "Markets", exact: false },
	{ to: "/portfolio", icon: PieChart, label: "Portfolio", exact: false },
	{ to: "/orders", icon: ListOrdered, label: "Orders", exact: false },
	{ to: "/profile", icon: UserCircle, label: "Profile", exact: false },
];

const Sidebar = () => {
	const { user } = useSelector((state: RootState) => state.auth);
	const location = useLocation();

	return (
		<aside className="fixed left-0 top-0 h-screen w-60 bg-[#0a0a0a] border-r border-white/[0.06] z-50 flex flex-col">
			<div className="flex items-center gap-3 px-6 py-6 border-b border-white/[0.06]">
				<div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#f23f5d] to-[#b81a3c] flex items-center justify-center shadow-lg shadow-[#f23f5d]/20">
					<TrendingUp className="w-4 h-4 text-white" />
				</div>
				<div>
					<h1 className="text-base font-bold text-white tracking-tight">MakakaTrade</h1>
				</div>
			</div>

			<nav className="flex-1 px-4 py-6 space-y-1.5">
				{navItems.map((item) => {
					const isActive = item.exact
						? location.pathname === item.to
						: location.pathname.startsWith(item.to);
					return (
						<NavLink
							key={item.to}
							to={item.to}
							end={item.exact}
							className={({ isActive: navActive }) =>
								`relative flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
									navActive
										? "text-[#f23f5d]"
										: "text-white/50 hover:text-white/80 hover:bg-white/[0.04]"
								}`
							}
						>
							{isActive && (
								<motion.div
									layoutId="sidebar-active"
									className="absolute inset-0 rounded-xl bg-[#f23f5d]/10 border border-[#f23f5d]/20"
									style={{ boxShadow: "0 0 20px rgba(242, 63, 93, 0.15)" }}
									transition={{ type: "spring", stiffness: 300, damping: 30 }}
								/>
							)}
							<item.icon className="w-5 h-5 relative z-10" />
							<span className="relative z-10">{item.label}</span>
						</NavLink>
					);
				})}
			</nav>

			<div className="px-4 py-4 border-t border-white/[0.06]">
				<div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
					<div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#f23f5d] to-[#b81a3c] flex items-center justify-center text-white text-xs font-bold">
						{user?.username?.slice(0, 2).toUpperCase() || "U"}
					</div>
					<div className="overflow-hidden">
						<p className="text-sm font-medium text-white truncate">
							{user?.username || "User"}
						</p>
						<p className="text-xs text-white/40 truncate">
							Balance: ${(user?.balance ?? 0).toLocaleString()}
						</p>
					</div>
				</div>
			</div>
		</aside>
	);
};

export default Sidebar;
