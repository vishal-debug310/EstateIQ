
import { Settings as SettingsIcon } from "lucide-react";

function Settings() {
  return (
    <div className="dashboard-content">
      <section className="welcome-section">
        <div>
          <div className="eyebrow">
            <span className="live-dot" />
            PREFERENCES
          </div>
          <h1>Settings</h1>
          <p>Manage your dashboard preferences.</p>
        </div>
      </section>

      <div className="panel placeholder-panel">
        <div className="placeholder-icon">
          <SettingsIcon size={28} />
        </div>
        <h2>Dashboard Settings</h2>
        <p>
          Application preferences and model configuration will be
          available here.
        </p>
        <span className="coming-soon">Settings coming soon</span>
      </div>
    </div>
  );
}

export default Settings;
