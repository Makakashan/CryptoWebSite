import { BrowserRouter, Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Markets from "./pages/Markets";

function App() {
  return (
    <BrowserRouter>
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
            <Route path="/" element={<Markets />} />
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
    </BrowserRouter>
  );
}

export default App;
