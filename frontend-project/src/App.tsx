import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "./store/hooks";
import { fetchProfile } from "./store/slices/authSlice";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import Markets from "./pages/Markets";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Portfolio from "./pages/Portfolio";
import Orders from "./pages/Orders";
import Statistics from "./pages/Statistics";
import AssetDetail from "./pages/AssetDetail";
import AssetForm from "./pages/AssetForm";

const ProtectedRoutes = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAppSelector((state) => state.auth);

  if (isLoading) {
    return (
      <div className="loading-container" style={{ height: "100vh" }}>
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

function App() {
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  useEffect(() => {
    dispatch(fetchProfile());
  }, [dispatch]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Auth routes without sidebar */}
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/" replace /> : <Login />}
        />
        <Route
          path="/register"
          element={isAuthenticated ? <Navigate to="/" replace /> : <Register />}
        />

        {/* Main app routes with sidebar */}
        <Route
          path="/*"
          element={
            <ProtectedRoutes>
              <div className="app">
                <Sidebar />
                <div className="main-content">
                  <Header />
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/markets" element={<Markets />} />
                    <Route path="/markets/add" element={<AssetForm />} />
                    <Route
                      path="/markets/edit/:symbol"
                      element={<AssetForm />}
                    />
                    <Route path="/markets/:symbol" element={<AssetDetail />} />
                    <Route path="/portfolio" element={<Portfolio />} />
                    <Route path="/orders" element={<Orders />} />
                    <Route path="/statistics" element={<Statistics />} />
                  </Routes>
                </div>
              </div>
            </ProtectedRoutes>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
