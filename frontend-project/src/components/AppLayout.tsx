import { Outlet, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
	FiBarChart2,
	FiBriefcase,
	FiHome,
	FiMenu,
	FiShoppingCart,
	FiTrendingUp,
	FiUser,
	FiX,
} from "react-icons/fi";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { cn } from "@/lib/utils";
import type { SidebarNavItem } from "@/store/types";

const MobileNav = () => {
	const { t } = useTranslation();
	const location = useLocation();
	const [isOpen, setIsOpen] = useState(false);

	const navItems: SidebarNavItem[] = [
		{ to: "/dashboard", label: t("dashboard"), icon: FiHome },
		{ to: "/markets", label: t("markets"), icon: FiTrendingUp },
		{ to: "/portfolio", label: t("portfolio"), icon: FiBriefcase },
		{ to: "/orders", label: t("orders"), icon: FiShoppingCart },
		{ to: "/statistics", label: t("statistics"), icon: FiBarChart2 },
		{ to: "/profile", label: t("profile"), icon: FiUser },
	];

	useEffect(() => {
		setIsOpen(false);
	}, [location.pathname]);

	useEffect(() => {
		if (!isOpen) return;

		const previousOverflow = document.body.style.overflow;
		document.body.style.overflow = "hidden";

		return () => {
			document.body.style.overflow = previousOverflow;
		};
	}, [isOpen]);

	return (
		<div className="mobile-nav">
			<button
				type="button"
				className="mobile-nav__trigger"
				aria-expanded={isOpen}
				aria-controls="mobile-nav-list"
				onClick={() => setIsOpen((current) => !current)}
			>
				<span className="mobile-nav__trigger-icon">
					{isOpen ? <FiX /> : <FiMenu />}
				</span>
				<span className="mobile-nav__trigger-text">MakakaTrade</span>
			</button>

			{isOpen ? (
				<>
					<button
						type="button"
						className="mobile-nav__backdrop"
						aria-label="Close navigation"
						onClick={() => setIsOpen(false)}
					/>
					<nav id="mobile-nav-list" className="mobile-nav__panel" aria-label="Mobile navigation">
						<div className="mobile-nav__panel-header">
							<div className="mobile-nav__panel-brand">
								<img src="/favicon.svg" alt="" className="mobile-nav__panel-logo" />
								<span>MakakaTrade</span>
							</div>
							<button
								type="button"
								className="mobile-nav__close"
								aria-label="Close navigation"
								onClick={() => setIsOpen(false)}
							>
								<FiX />
							</button>
						</div>

						<div className="mobile-nav__links">
							{navItems.map((item) => {
								const Icon = item.icon;
								const isActive = location.pathname.startsWith(item.to);

								return (
									<NavLink
										key={item.to}
										to={item.to}
										className={cn("mobile-nav__link", isActive && "mobile-nav__link--active")}
									>
										<span className="mobile-nav__link-icon">
											<Icon />
										</span>
										<span>{item.label}</span>
									</NavLink>
								);
							})}
						</div>
					</nav>
				</>
			) : null}
		</div>
	);
};

const AppLayout = () => {
	const location = useLocation();

	return (
		<div className="app-layout min-h-screen bg-[#020202]">
			<Sidebar />
			<div className="app-main min-h-screen w-full flex-1 bg-[#020202]">
				<MobileNav />
				<Header />
				<div key={location.pathname} className="page-transition min-h-[calc(100vh-120px)]">
					<Outlet />
				</div>
			</div>
		</div>
	);
};

export default AppLayout;
