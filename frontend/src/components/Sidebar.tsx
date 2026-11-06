
import {
  Activity,
  BarChart3,
  Building2,
  Clock3,
  House,
  LayoutDashboard,
  Map,
  Settings,
  MoreHorizontal,
} from "lucide-react";

import { NavLink } from "react-router-dom";

const navigation = [
  { label: "Overview", path: "/", icon: LayoutDashboard },
  { label: "Predictions", path: "/predictions", icon: House },
  { label: "Prediction Map", path: "/map", icon: Map },
  { label: "Prediction History", path: "/history", icon: Clock3 },
  { label: "Model Analytics", path: "/analytics", icon: BarChart3 },
];

function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-icon">
          <Building2 size={22} />
        </div>
        <div>
          <h2>EstateIQ</h2>
          <span>ML Prediction Platform</span>
        </div>
      </div>

      <div className="sidebar-label">WORKSPACE</div>

      <nav className="nav-menu">
        {navigation.map(({ label, path, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            end={path === "/"}
            className={({ isActive }) =>
              `nav-item ${isActive ? "active" : ""}`
            }
          >
            <Icon size={19} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-label settings-label">PREFERENCES</div>

      <nav className="nav-menu">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `nav-item ${isActive ? "active" : ""}`
          }
        >
          <Settings size={19} />
          <span>Settings</span>
        </NavLink>
      </nav>

      <div className="sidebar-bottom">
        <div className="model-status">
          <div className="status-heading">
            <span className="status-dot" />
            Model is active
          </div>

          <p>Random Forest Regressor</p>

          <div className="model-accuracy">
            <span>R² Score</span>
            <strong>80.46%</strong>
          </div>
        </div>

        <div className="sidebar-user">
          <div className="avatar">VK</div>
          <div className="user-info">
            <strong>Project Admin</strong>
            <span>ML Dashboard</span>
          </div>
          <MoreHorizontal size={20} />
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
