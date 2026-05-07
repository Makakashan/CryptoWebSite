import { Outlet, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../store/store";
import Sidebar from "./Sidebar";
import Header from "./Header";
import LanguageSwitcher from "./ui/LanguageSwitcher";

const AppLayout = () => {
	const { isAuthenticated } = useSelector((state: RootState) => state.auth);
	const navigate = useNavigate();

	useEffect(() => {
		if (!isAuthenticated) {
			navigate("/login", { replace: true });
		}
	}, [isAuthenticated, navigate]);

	if (!isAuthenticated) return null;

	return (
		<div className="relative min-h-screen overflow-hidden bg-[#030303]">
			<div
				aria-hidden
				className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(255,255,255,0.025),transparent_24%),radial-gradient(circle_at_80%_0%,rgba(255,255,255,0.015),transparent_20%),radial-gradient(circle_at_50%_100%,rgba(255,255,255,0.01),transparent_26%)]"
			/>
			<div
				aria-hidden
				className="pointer-events-none absolute -left-32 top-24 h-72 w-72 rounded-full bg-black/30 blur-3xl"
			/>
			<div
				aria-hidden
				className="pointer-events-none absolute -right-24 top-80 h-80 w-80 rounded-full bg-black/25 blur-3xl"
			/>
			<Sidebar />
			<div className="relative z-10 flex min-h-screen flex-col pl-[17rem]">
				<Header />
				<main className="flex-1 overflow-y-auto p-6">
					<div className="mb-4 flex justify-end">
						<LanguageSwitcher />
					</div>
					<Outlet />
				</main>
			</div>
		</div>
	);
};

export default AppLayout;
