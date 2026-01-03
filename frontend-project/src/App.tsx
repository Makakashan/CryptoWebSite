import { BrowserRouter, Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Markets from "./pages/Markets";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Register from "./pages/Register";

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
                <div className="header">
                  <h2>Welcome to MakakaTrade</h2>
                  <div className="balance">
                    Balance: <span>$10,000.00</span>
                  </div>
                </div>

                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/markets" element={<Markets />} />
                  <Route
                    path="/portfolio"
                    element={
                      <div>
                        <h1>Portfolio (coming soon)</h1>
                      </div>
                    }
                  />
                  <Route
                    path="/orders"
                    element={
                      <div>
                        <h1>Orders (coming soon)</h1>
                      </div>
                    }
                  />
                  <Route
                    path="/stats"
                    element={
                      <div>
                        <h1>Statistics (coming soon)</h1>
                      </div>
                    }
                  />
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
