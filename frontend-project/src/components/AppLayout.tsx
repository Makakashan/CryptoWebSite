import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";

const AppLayout = () => {
	const location = useLocation();

	return (
		<div className="flex min-h-screen bg-bg-dark">
			<Sidebar />
			<div className="ml-sidebar flex-1 p-6 min-h-screen w-full">
				<Header />
				<div
					key={location.pathname}
					className="page-transition min-h-[calc(100vh-120px)]"
				>
					<Outlet />
				</div>
			</div>
		</div>
	);
};

export default AppLayout;
