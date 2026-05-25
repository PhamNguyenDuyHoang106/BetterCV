"use client";

import { DashPageHero, DashPanel, DashToggleRow, dashSelectClass } from "../dashboard-ui";

export function DashboardSettingsTab() {
  return (
    <div className="max-w-2xl mx-auto w-full py-4">
      {/* <DashPageHero
        title="Cài đặt"
        subtitle="Tùy chỉnh ngôn ngữ, thông báo và trải nghiệm làm việc trên workspace."
        accent="teal"
      /> */}

      <DashPanel title="System Settings" icon="settings" iconAccent="teal">
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Language preferences
            </label>
            <select className={dashSelectClass} defaultValue="vi">
              <option value="vi">Tiếng Việt (Vietnamese)</option>
              <option value="en">English (US)</option>
            </select>
          </div>

          <DashToggleRow
            title="Email Notifications"
            description="Receive weekly resume tips and career match scoring reports."
          />
          <DashToggleRow
            title="Auto-save Document State"
            description="Saves work in background database every 30 seconds."
          />

          <button
            type="button"
            onClick={() => alert("Thiết lập hệ thống đã lưu!")}
            className="dash-btn-primary mt-2"
          >
            Save Settings
          </button>
        </div>
      </DashPanel>
    </div>
  );
}
