import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, lazy, Suspense } from "react";
import { useAppDispatch, useAppSelector } from "./store/hooks";
import { fetchProfile } from "./store/slices/authSlice";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";

// Lazy load all page components for code splitting
const Markets = lazy(() => import("./pages/Markets"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Portfolio = lazy(() => import("./pages/Portfolio"));
const Orders = lazy(() => import("./pages/Orders"));
const Statistics = lazy(() => import("./pages/Statistics"));
const AssetDetail = lazy(() => import("./pages/AssetDetail"));
const AssetForm = lazy(() => import("./pages/AssetForm"));
const Profile = lazy(() => import("./pages/Profile"));

// Loading component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-100">
    <div className="w-10 h-10 border-4 border-bg-hover border-t-blue rounded-full animate-spin"></div>
  </div>
);

const ProtectedRoutes = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAppSelector((state) => state.auth);

  if (isLoading) {
    return (
      <div className="loading-container h-screen">
        <div className="loading-spinner mb-4"></div>
        <p className="text-text-secondary">Loading...</p>
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
          element={
            isAuthenticated ? (
              <Navigate to="/" replace />
            ) : (
              <Suspense fallback={<PageLoader />}>
                <Login />
              </Suspense>
            )
          }
        />
        <Route
          path="/register"
          element={
            isAuthenticated ? (
              <Navigate to="/" replace />
            ) : (
              <Suspense fallback={<PageLoader />}>
                <Register />
              </Suspense>
            )
          }
        />

        {/* Main app routes with sidebar */}
        <Route
          path="/*"
          element={
            <ProtectedRoutes>
              <div className="flex min-h-screen bg-bg-dark">
                <Sidebar />
                <div className="ml-sidebar flex-1 p-6 min-h-screen w-full">
                  <Header />
                  <Suspense fallback={<PageLoader />}>
                    <div className="page-transition">
                      <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/markets" element={<Markets />} />
                        <Route path="/markets/add" element={<AssetForm />} />
                        <Route
                          path="/markets/edit/:symbol"
                          element={<AssetForm />}
                        />
                        <Route
                          path="/markets/:symbol"
                          element={<AssetDetail />}
                        />
                        <Route path="/portfolio" element={<Portfolio />} />
                        <Route path="/orders" element={<Orders />} />
                        <Route path="/statistics" element={<Statistics />} />
                        <Route path="/profile" element={<Profile />} />
                      </Routes>
                    </div>
                  </Suspense>
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
