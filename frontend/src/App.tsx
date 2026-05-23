import { Link, Navigate, Route, Routes } from "react-router-dom";
import { AppDataProvider } from "./lib/AppDataContext";
import { getDataMode } from "./lib/dataService";
import { AnalyticsPage } from "./pages/AnalyticsPage";
import { HomePage } from "./pages/HomePage";

export function App() {
  const dataMode = getDataMode();

  return (
    <div className="layout">
      <header className="topbar">
        <h1>Stuff Quiz Tracker ({dataMode} mode)</h1>
        <nav>
          <Link to="/">Dashboard</Link>
          <Link to="/analytics">Analytics</Link>
        </nav>
      </header>
      <main>
        <AppDataProvider>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/people" element={<Navigate to="/analytics" replace />} />
            <Route path="/history" element={<Navigate to="/analytics" replace />} />
          </Routes>
        </AppDataProvider>
      </main>
    </div>
  );
}
