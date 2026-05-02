import { Link, Route, Routes } from "react-router-dom";
import { getDataMode } from "./lib/dataService";
import { HomePage } from "./pages/HomePage";
import { PeoplePage } from "./pages/PeoplePage";
import { HistoryPage } from "./pages/HistoryPage";

export function App() {
  const dataMode = getDataMode();

  return (
    <div className="layout">
      <header className="topbar">
        <h1>Stuff Quiz Tracker ({dataMode} mode)</h1>
        <nav>
          <Link to="/">Dashboard</Link>
          <Link to="/people">People</Link>
          <Link to="/history">History</Link>
        </nav>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/people" element={<PeoplePage />} />
          <Route path="/history" element={<HistoryPage />} />
        </Routes>
      </main>
    </div>
  );
}
