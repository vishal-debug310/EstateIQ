
import { Bell, ChevronDown, Search } from "lucide-react";
import { useLocation } from "react-router-dom";

const pageNames: Record<string, string> = {
  "/": "Overview",
  "/predictions": "Predictions",
  "/map": "California Map",
  "/history": "Prediction History",
  "/analytics": "Model Analytics",
  "/settings": "Settings",
};

function Header() {
  const location = useLocation();
  const currentPage = pageNames[location.pathname] || "Dashboard";

  return (
    <header className="topbar">
      <div className="breadcrumb">
        <span>Workspace</span>
        <span className="breadcrumb-divider">/</span>
        <strong>{currentPage}</strong>
      </div>

      <div className="topbar-actions">
        <div className="search-box">
          <Search size={17} />
          <input placeholder="Search anything..." />
          <kbd>⌘ K</kbd>
        </div>

        <button className="icon-button" aria-label="Notifications">
          <Bell size={19} />
          <span className="notification-dot" />
        </button>

        <div className="topbar-profile">
          <div className="avatar">VK</div>
          <ChevronDown size={16} />
        </div>
      </div>
    </header>
  );
}

export default Header;
