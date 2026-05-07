import { NavLink, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { motion } from "framer-motion";
import { LayoutDashboard, TrendingUp, PieChart, ListOrdered, UserCircle } from "lucide-react";
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
		<aside className="fixed left-4 top-4 z-50 flex h-[calc(100vh-2rem)] w-60 flex-col rounded-[2rem] liquid-glass-strong">
			<div className="flex items-center gap-3 border-b border-white/[0.06] px-6 py-6">
				<div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-black/50 to-black/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_12px_30px_rgba(0,0,0,0.35)]">
					<TrendingUp className="w-4 h-4 text-white" />
				</div>
				<div>
					<h1 className="text-base font-bold tracking-tight text-white">MakakaTrade</h1>
				</div>
			</div>

			<nav className="flex-1 space-y-1.5 px-4 py-6">
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
								`relative flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-300 ${
									navActive
										? "text-white"
										: "text-white/50 hover:text-white/80 hover:bg-black/20"
								}`
							}
						>
							{isActive && (
								<motion.div
									layoutId="sidebar-active"
									className="absolute inset-0 rounded-2xl bg-black/35 border border-white/14"
									style={{ boxShadow: "0 0 20px rgba(255, 255, 255, 0.1)" }}
									transition={{ type: "spring", stiffness: 300, damping: 30 }}
								/>
							)}
							<item.icon className="w-5 h-5 relative z-10" />
							<span className="relative z-10">{item.label}</span>
						</NavLink>
					);
				})}
			</nav>

			<div className="border-t border-white/[0.06] px-4 py-4">
				<div className="flex items-center gap-3 rounded-2xl liquid-glass px-4 py-3">
					<div className="flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-xs font-bold text-white border border-white/[0.08]">
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
