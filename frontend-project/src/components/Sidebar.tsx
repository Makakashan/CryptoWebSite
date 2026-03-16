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
	// Localization + current route for active link highlighting
	const { t } = useTranslation();
	const location = useLocation();

	// Sidebar navigation config (route, label, icon)
	const navItems: SidebarNavItem[] = [
		{ to: "/", label: t("dashboard"), icon: FiHome },
		{ to: "/markets", label: t("markets"), icon: FiTrendingUp },
		{ to: "/portfolio", label: t("portfolio"), icon: FiBriefcase },
		{ to: "/orders", label: t("orders"), icon: FiShoppingCart },
		{ to: "/statistics", label: t("statistics"), icon: FiBarChart2 },
		{ to: "/profile", label: t("profile"), icon: FiUser },
	];

	return (
		// Main sidebar shell
		<aside className="fixed left-0 top-0 z-100 h-screen w-sidebar border-r border-white/10 bg-[#141116]/95 p-4 backdrop-blur-xl">
			{/* Ambient background glow layers */}
			<div
				aria-hidden
				className="pointer-events-none absolute inset-0 overflow-hidden"
			>
				<div className="absolute -top-32 -left-24 h-72 w-72 rounded-full bg-yellow-400/10 blur-3xl" />
				<div className="absolute top-1/3 -right-20 h-64 w-64 rounded-full bg-red-500/10 blur-3xl" />
				<div className="absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-orange-400/10 blur-3xl" />
			</div>

			<div className="relative z-10 flex h-full flex-col">
				{/* Brand header */}
				<header className="mb-6 px-2 pt-1">
					<div className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/3 px-3 py-2 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
						<div className="h-2.5 w-2.5 rounded-full bg-linear-to-r from-yellow-300 to-red-500 shadow-[0_0_20px_rgba(248,113,113,0.45)]" />
						<h2 className="bg-linear-to-r from-yellow-200 via-amber-100 to-red-200 bg-clip-text text-lg font-semibold text-transparent">
							MakakaTrade
						</h2>
					</div>
				</header>

				{/* Navigation list */}
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
										"group relative isolate flex items-center gap-3 overflow-hidden rounded-xl px-3.5 py-3 text-sm font-medium transition-all duration-300",
										"border border-transparent",
										"hover:-translate-y-px hover:border-white/10 hover:bg-white/4 hover:text-white",
										navActive || isActive
											? "text-white shadow-[0_0_0_1px_rgba(255,255,255,0.06)]"
											: "text-slate-300/90",
									)
								}
							>
								{/* Active item animated gradient background */}
								<span
									aria-hidden
									className={cn(
										"absolute inset-0 -z-10 opacity-0 transition-opacity duration-300",
										"bg-[linear-gradient(110deg,rgba(250,204,21,0.18),rgba(251,146,60,0.14),rgba(244,63,94,0.14))]",
										"bg-size-[220%_220%]",
										"animate-[sidebarGradient_6s_ease_infinite]",
										isActive && "opacity-100",
									)}
								/>

								{/* Left active indicator rail */}
								<span
									aria-hidden
									className={cn(
										"absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full bg-linear-to-b from-yellow-300 to-red-500 shadow-[0_0_16px_rgba(251,146,60,0.65)] transition-all duration-300",
										isActive
											? "opacity-100"
											: "opacity-0 group-hover:opacity-70",
									)}
								/>

								{/* Icon container */}
								<span
									className={cn(
										"grid h-8 w-8 place-items-center rounded-lg border transition-all duration-300",
										isActive
											? "border-yellow-300/35 bg-orange-300/12 text-yellow-100 shadow-[0_0_18px_rgba(251,146,60,0.32)]"
											: "border-white/10 bg-white/4 text-slate-300 group-hover:border-orange-200/25 group-hover:text-yellow-100",
									)}
								>
									<Icon className="text-base" />
								</span>

								<span className="tracking-[0.01em]">{item.label}</span>
							</NavLink>
						);
					})}
				</nav>

				{/* Footer info card */}
				<footer className="mt-4 border-t border-white/10 px-2 pt-4">
					<div className="rounded-xl border border-yellow-200/15 bg-linear-to-r from-yellow-300/8 to-red-400/8 p-3 text-xs text-slate-300/80">
						<div className="mb-1 text-[11px] uppercase tracking-[0.14em] text-yellow-200/75">
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

			{/* Local animation keyframes for active gradient */}
			<style>{`
				@keyframes sidebarGradient {
					0% { background-position: 0% 50%; }
					50% { background-position: 100% 50%; }
					100% { background-position: 0% 50%; }
				}
			`}</style>
		</aside>
	);
};

export default Sidebar;
