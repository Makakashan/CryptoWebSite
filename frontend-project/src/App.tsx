import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
import { useAppDispatch } from "./store/hooks";
import { fetchAssets } from "./store/slices/assetsSlice";
import { fetchPortfolio } from "./store/slices/portfolioSlice";
import { fetchOrders } from "./store/slices/ordersSlice";
import { fetchProfile } from "./store/slices/authSlice";
import AppLayout from "./components/AppLayout";
import Dashboard from "./pages/Dashboard";
import Markets from "./pages/Markets";
import AssetDetail from "./pages/AssetDetail";
import AssetForm from "./pages/AssetForm";
import Portfolio from "./pages/Portfolio";
import Orders from "./pages/Orders";
import Statistics from "./pages/Statistics";
import Profile from "./pages/Profile";
import Login from "./pages/Login";
import Register from "./pages/Register";

const AssetDetailRoute = () => {
	const { symbol } = useParams<{ symbol: string }>();
	return <AssetDetail key={symbol} />;
};

const AppInitializer = ({ children }: { children: React.ReactNode }) => {
	const dispatch = useAppDispatch();
	const [ready, setReady] = useState(false);

	useEffect(() => {
		const init = async () => {
			await dispatch(fetchProfile());
			dispatch(fetchAssets({ limit: 50 }));
			dispatch(fetchPortfolio());
			dispatch(fetchOrders({ limit: 50 }));
			setReady(true);
		};
		init();
	}, [dispatch]);

	if (!ready) {
		return (
			<div className="min-h-screen bg-[#030303] flex items-center justify-center">
				<div className="flex flex-col items-center gap-4">
					<div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#f23f5d] to-[#b81a3c] flex items-center justify-center animate-pulse shadow-lg shadow-[#f23f5d]/20">
						<div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
					</div>
					<p className="text-white/40 text-sm">Loading MakakaTrade...</p>
				</div>
			</div>
		);
	}

	return <>{children}</>;
};

const App = () => {
	return (
		<BrowserRouter>
			<AppInitializer>
				<Routes>
					<Route path="/login" element={<Login />} />
					<Route path="/register" element={<Register />} />
					<Route element={<AppLayout />}>
						<Route path="/dashboard" element={<Dashboard />} />
						<Route path="/markets" element={<Markets />} />
						<Route path="/markets/:symbol" element={<AssetDetailRoute />} />
						<Route path="/assets/new" element={<AssetForm />} />
						<Route path="/assets/:symbol/edit" element={<AssetForm />} />
						<Route path="/portfolio" element={<Portfolio />} />
						<Route path="/orders" element={<Orders />} />
						<Route path="/statistics" element={<Statistics />} />
						<Route path="/profile" element={<Profile />} />
						<Route path="/" element={<Navigate to="/dashboard" replace />} />
					</Route>
				</Routes>
			</AppInitializer>
		</BrowserRouter>
	);
};

export default App;
