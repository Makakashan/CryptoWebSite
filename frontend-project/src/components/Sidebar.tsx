import { NavLink } from "react-router-dom";
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
				{navItems.map((item) => (
					<NavLink
						key={item.to}
						to={item.to}
						end={item.exact}
						className={({ isActive }) =>
							`relative isolate flex items-center gap-3 overflow-hidden rounded-2xl px-4 py-3 text-sm font-medium transition-colors duration-150 ease-out ${
								isActive
									? "text-white"
									: "text-white/50 hover:bg-black/20 hover:text-white/80"
							}`
						}
					>
						{({ isActive }) => (
							<>
								{isActive && (
									<motion.span
										layoutId="sidebar-active"
										aria-hidden
										className="absolute inset-0 overflow-hidden rounded-2xl border border-white/30 bg-gradient-to-br from-white/12 via-white/5 to-black/50 ring-1 ring-white/10"
										style={{
											boxShadow:
												"0 0 28px rgba(255, 255, 255, 0.16), inset 0 1px 0 rgba(255, 255, 255, 0.12), inset 0 -1px 0 rgba(255, 255, 255, 0.04)",
										}}
										transition={{ type: "spring", stiffness: 260, damping: 28 }}
									>
										<span
											aria-hidden
											className="absolute inset-0 bg-[radial-gradient(circle_at_24%_18%,rgba(255,255,255,0.18),transparent_34%),radial-gradient(circle_at_78%_82%,rgba(255,255,255,0.08),transparent_30%)]"
										/>
									</motion.span>
								)}
								<item.icon className="relative z-10 h-5 w-5" />
								<span className="relative z-10">{item.label}</span>
							</>
						)}
					</NavLink>
				))}
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
