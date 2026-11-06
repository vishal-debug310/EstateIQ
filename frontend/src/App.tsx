
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Sidebar from "./components/Sidebar";
import Header from "./components/Header";

import Overview from "./pages/Overview";
import Predictions from "./pages/Predictions";
import CaliforniaMap from "./pages/CaliforniaMap";
import PredictionHistory from "./pages/PredictionHistory";
import ModelAnalytics from "./pages/ModelAnalytics";
import Settings from "./pages/Settings";

import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <Sidebar />

        <main className="main-content">
          <Header />

          <Routes>
            <Route path="/" element={<Overview />} />
            <Route path="/predictions" element={<Predictions />} />
            <Route path="/map" element={<CaliforniaMap />} />
            <Route path="/history" element={<PredictionHistory />} />
            <Route path="/analytics" element={<ModelAnalytics />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
