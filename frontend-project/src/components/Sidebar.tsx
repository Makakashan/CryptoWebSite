import { NavLink, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
	FiHome,
	FiTrendingUp,
	FiBriefcase,
	FiShoppingCart,
	FiBarChart2,
	FiUser,
} from "react-icons/fi";
import { cn } from "@/lib/utils";
import type { SidebarNavItem } from "@/store/types";

const Sidebar = () => {
	const { t } = useTranslation();
	const location = useLocation();

	const navItems: SidebarNavItem[] = [
		{ to: "/", label: t("dashboard"), icon: FiHome },
		{ to: "/markets", label: t("markets"), icon: FiTrendingUp },
		{ to: "/portfolio", label: t("portfolio"), icon: FiBriefcase },
		{ to: "/orders", label: t("orders"), icon: FiShoppingCart },
		{ to: "/statistics", label: t("statistics"), icon: FiBarChart2 },
		{ to: "/profile", label: t("profile"), icon: FiUser },
	];

	return (
		<aside className="sidebar-shell fixed left-0 top-0 z-100 h-screen w-sidebar p-4">
			<div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
				<div className="absolute -top-32 -left-24 h-72 w-72 rounded-full bg-white/3 blur-xl" />
				<div className="absolute top-1/3 -right-20 h-64 w-64 rounded-full bg-white/2 blur-xl" />
				<div className="absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-white/2 blur-xl" />
			</div>

			<div className="relative z-10 flex h-full flex-col">
				<header className="mb-6 px-2 pt-2">
					<div className="sidebar-brand-pill">
						<div className="sidebar-brand-dot" />
						<h2 className="sidebar-brand-text">MakakaTrade</h2>
					</div>
				</header>

				<nav className="flex flex-1 flex-col gap-1.5">
					{navItems.map((item) => {
						const Icon = item.icon;
						const isActive =
							item.to === "/"
								? location.pathname === "/"
								: location.pathname.startsWith(item.to);

						return (
							<NavLink
								key={item.to}
								to={item.to}
								className={({ isActive: navActive }) =>
									cn(
										"sidebar-nav-link group relative isolate flex items-center gap-3 overflow-hidden rounded-xl px-3.5 py-3 text-sm font-medium transition-all duration-300",
										navActive || isActive
											? "sidebar-active-link text-white"
											: "text-slate-300/90",
									)
								}
							>
								<span
									aria-hidden
									className={cn(
										"absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full bg-linear-to-b from-white/90 to-white/25",
										isActive ? "opacity-100" : "opacity-0 group-hover:opacity-70",
									)}
								/>

								<span
									className={cn(
										"sidebar-nav-icon grid h-8 w-8 place-items-center rounded-lg border transition-all duration-300",
										isActive
											? "sidebar-active-icon"
											: "text-slate-300 group-hover:text-white",
									)}
								>
									<Icon className="text-base" />
								</span>

								<span className="tracking-[0.01em]">{item.label}</span>
							</NavLink>
						);
					})}
				</nav>

				<footer className="mt-4 border-t border-white/14 px-2 pt-4">
					<div className="sidebar-footer-card p-3 text-xs text-slate-300/80">
						<div className="sidebar-footer-label mb-1 text-[11px] uppercase tracking-[0.14em]">
							{t("sidebar.brand", { defaultValue: "MakakaTrade" })}
						</div>
						<div className="text-sm font-medium text-slate-100">
							{t("sidebar.tagline", {
								defaultValue: "Trade smarter with clarity",
							})}
						</div>
					</div>
				</footer>
			</div>
		</aside>
	);
};

export default Sidebar;
