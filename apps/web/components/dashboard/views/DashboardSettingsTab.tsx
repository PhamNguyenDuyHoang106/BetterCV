"use client";

import { useState, useEffect } from "react";
import { useLanguageStore } from "../../../lib/store/language";
import { useThemeStore } from "../../../lib/store/theme";
import { translations } from "../../../lib/translations";
import { DashPanel, DashToggleRow } from "../dashboard-ui";

export function DashboardSettingsTab() {
  const { language } = useLanguageStore();
  const { theme, setTheme } = useThemeStore();
  const [mounted, setMounted] = useState(false);
  const [emailNotif, setEmailNotif] = useState(true);
  const [autoSave, setAutoSave] = useState(true);

  useEffect(() => {
    setMounted(true);
    const savedEmail = localStorage.getItem("acv-email-notif");
    const savedAutoSave = localStorage.getItem("acv-auto-save");
    if (savedEmail !== null) {
      setEmailNotif(savedEmail === "true");
    }
    if (savedAutoSave !== null) {
      setAutoSave(savedAutoSave === "true");
    }
  }, []);

  const activeLang = mounted ? language : "vi";
  const t = translations[activeLang];

  const handleToggleEmail = (checked: boolean) => {
    setEmailNotif(checked);
    localStorage.setItem("acv-email-notif", String(checked));
  };

  const handleToggleAutoSave = (checked: boolean) => {
    setAutoSave(checked);
    localStorage.setItem("acv-auto-save", String(checked));
  };

  return (
    <div className="max-w-2xl mx-auto w-full py-4">
      <DashPanel title={t.settings.title} icon="settings" iconAccent="teal">
        <div className="space-y-5">

          <DashToggleRow
            title={t.settings.darkMode}
            description={t.settings.darkModeDesc}
            checked={mounted && theme === "dark"}
            onChange={(checked) => setTheme(checked ? "dark" : "light")}
          />
          <DashToggleRow
            title={t.settings.emailNotif}
            description={t.settings.emailNotifDesc}
            checked={mounted && emailNotif}
            onChange={handleToggleEmail}
          />
          <DashToggleRow
            title={t.settings.autoSave}
            description={t.settings.autoSaveDesc}
            checked={mounted && autoSave}
            onChange={handleToggleAutoSave}
          />

        </div>
      </DashPanel>
    </div>
  );
}
