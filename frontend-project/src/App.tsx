import { BrowserRouter, Routes, Route } from "react-router-dom";
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

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth routes without sidebar */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Main app routes with sidebar */}
        <Route
          path="/*"
          element={
            <div className="app">
              <Sidebar />
              <div className="main-content">
                <Header />
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/markets" element={<Markets />} />
                  <Route path="/markets/:symbol" element={<AssetDetail />} />
                  <Route path="/portfolio" element={<Portfolio />} />
                  <Route path="/orders" element={<Orders />} />
                  <Route path="/statistics" element={<Statistics />} />
                </Routes>
              </div>
            </div>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
