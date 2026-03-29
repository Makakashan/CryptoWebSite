import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";

const AppLayout = () => {
	const location = useLocation();

	return (
		<div className="flex min-h-screen bg-[#020202]">
			<Sidebar />
			<div className="ml-sidebar min-h-screen w-full flex-1 bg-[#020202] p-6">
				<Header />
				<div key={location.pathname} className="page-transition min-h-[calc(100vh-120px)]">
					<Outlet />
				</div>
			</div>
		</div>
	);
};

export default AppLayout;
