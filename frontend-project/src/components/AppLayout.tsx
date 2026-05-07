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
		<div className="flex min-h-screen bg-[#030303]">
			<Sidebar />
			<div className="flex-1 flex flex-col ml-60">
				<Header />
				<main className="flex-1 p-6 overflow-y-auto">
					<div className="flex justify-end mb-4">
						<LanguageSwitcher />
					</div>
					<Outlet />
				</main>
			</div>
		</div>
	);
};

export default AppLayout;
