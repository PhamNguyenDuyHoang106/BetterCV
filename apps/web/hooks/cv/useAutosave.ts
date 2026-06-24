import { useEffect, useRef, useCallback } from "react";
import { useCvStore } from "../../lib/store/cv";

export function useAutosave() {
  const { syncDirtyChanges } = useCvStore();
  const saveTimersRef = useRef<Record<string, NodeJS.Timeout>>({});

  useEffect(() => {
    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      Object.values(saveTimersRef.current).forEach(clearTimeout);
    };
  }, []);

  const triggerAutosave = useCallback(() => {
    if (typeof window !== "undefined") {
      const enabled = localStorage.getItem("acv-auto-save") !== "false";
      if (!enabled) return;
    }
    const key = "autosave";
    if (saveTimersRef.current[key]) {
      clearTimeout(saveTimersRef.current[key]);
    }
    saveTimersRef.current[key] = setTimeout(() => {
      syncDirtyChanges();
      delete saveTimersRef.current[key];
    }, 60000);
  }, [syncDirtyChanges]);

  return {
    triggerAutosave,
  };
}
