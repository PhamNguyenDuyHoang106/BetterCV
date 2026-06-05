"use client";

import { useState, useEffect } from "react";
import { useLanguageStore } from "../../../lib/store/language";
import { translations } from "../../../lib/translations";
import { DashPanel, DashToggleRow } from "../dashboard-ui";

export function DashboardSettingsTab() {
  const { language } = useLanguageStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const activeLang = mounted ? language : "vi";
  const t = translations[activeLang];

  const handleSave = () => {
    alert(t.settings.savedAlert);
  };

  return (
    <div className="max-w-2xl mx-auto w-full py-4">
      <DashPanel title={t.settings.title} icon="settings" iconAccent="teal">
        <div className="space-y-5">

          <DashToggleRow
            title={t.settings.emailNotif}
            description={t.settings.emailNotifDesc}
          />
          <DashToggleRow
            title={t.settings.autoSave}
            description={t.settings.autoSaveDesc}
          />

          <button
            type="button"
            onClick={handleSave}
            className="dash-btn-primary mt-2"
          >
            {t.settings.saveBtn}
          </button>
        </div>
      </DashPanel>
    </div>
  );
}
