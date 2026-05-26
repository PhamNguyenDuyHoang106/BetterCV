import { create } from "zustand";
import { apiFetch } from "../api";
import { CvSectionUpsertDto, CvUpdateDto } from "@acv/shared";

type Cv = {
  id: string;
  title: string;
  locale: string;
  version: number;
  templateId?: string;
  sections: Array<{ id: string; type: string; content: any; order: number }>;
};

type CvState = {
  cv: Cv | null;
  saveStatus: "saved" | "saving" | "error" | "conflict";
  conflictInfo: {
    latestVersion: number;
    lastEditedAt: string;
    lastEditedDevice: string;
  } | null;
  isLoading: boolean;
  loadCv: (cvId: string) => Promise<void>;
  updateCvMetadata: (dto: CvUpdateDto) => Promise<void>;
  upsertSection: (dto: Omit<CvSectionUpsertDto, 'version'>) => Promise<void>;
  resolveConflict: (choice: 'overwrite' | 'reload') => Promise<void>;
};

export const useCvStore = create<CvState>((set, get) => {
  const sessionId = typeof window !== "undefined"
    ? (window as any)._cvSessionId || ((window as any)._cvSessionId = Math.random().toString(36).substring(7))
    : "";

  return {
    cv: null,
    saveStatus: "saved",
    conflictInfo: null,
    isLoading: false,

    loadCv: async (cvId) => {
      set({ isLoading: true, conflictInfo: null });
      try {
        const res = await apiFetch<any>(`/cvs/${cvId}`);
        const cv = res?.data || res;
        set({ cv, saveStatus: "saved", isLoading: false });
      } catch (err) {
        set({ isLoading: false });
      }
    },

    updateCvMetadata: async (dto) => {
      const state = get();
      if (!state.cv) return;

      const currentVersion = state.cv.version;
      set({ saveStatus: "saving" });

      try {
        const res = await apiFetch<any>(`/cvs/${state.cv.id}`, {
          method: "PUT",
          headers: {
            "x-session-id": sessionId,
          },
          body: JSON.stringify({ ...dto, version: currentVersion }),
        });
        const updated = res?.data || res;
        set({ cv: updated, saveStatus: "saved" });
      } catch (err: any) {
        // If NestJS threw ConflictException (409)
        if (err.message && (err.message.includes("chỉnh sửa") || err.message.includes("thiết bị khác") || err.message.includes("Conflict"))) {
          try {
            const resLatest = await apiFetch<any>(`/cvs/${state.cv.id}`);
            const latest = resLatest?.data || resLatest;
            set({
              saveStatus: "conflict",
              conflictInfo: {
                latestVersion: latest.version,
                lastEditedAt: new Date().toISOString(),
                lastEditedDevice: "Tab hoặc thiết bị khác",
              },
            });
          } catch {
            set({ saveStatus: "error" });
          }
        } else {
          set({ saveStatus: "error" });
        }
      }
    },

    upsertSection: async (dto) => {
      const state = get();
      if (!state.cv) return;

      const currentVersion = state.cv.version;
      set({ saveStatus: "saving" });

      try {
        // Perform optimistic local state updates for instant rendering in preview
        const updatedSections = [...state.cv.sections];
        const matchIndex = dto.id
          ? updatedSections.findIndex((s) => s.id === dto.id)
          : updatedSections.findIndex((s) => s.type === dto.type);

        if (matchIndex !== -1) {
          updatedSections[matchIndex] = {
            ...updatedSections[matchIndex],
            content: dto.content,
            order: dto.order,
          };
        } else {
          updatedSections.push({
            id: `temp_${Math.random()}`,
            type: dto.type,
            content: dto.content,
            order: dto.order,
          });
        }
        set({ cv: { ...state.cv, sections: updatedSections } });

        // Save section to backend
        await apiFetch(`/cvs/${state.cv.id}/sections`, {
          method: "POST",
          headers: {
            "x-session-id": sessionId,
          },
          body: JSON.stringify({ ...dto, version: currentVersion }),
        });

        // Pull fully synced CV from server to resolve temp IDs and get new version count
        const res = await apiFetch<any>(`/cvs/${state.cv.id}`);
        const updated = res?.data || res;
        set({ cv: updated, saveStatus: "saved" });
      } catch (err: any) {
        if (err.message && (err.message.includes("chỉnh sửa") || err.message.includes("thiết bị khác") || err.message.includes("Conflict"))) {
          try {
            const resLatest = await apiFetch<any>(`/cvs/${state.cv.id}`);
            const latest = resLatest?.data || resLatest;
            set({
              saveStatus: "conflict",
              conflictInfo: {
                latestVersion: latest.version,
                lastEditedAt: new Date().toISOString(),
                lastEditedDevice: "Tab hoặc thiết bị khác",
              },
            });
          } catch {
            set({ saveStatus: "error" });
          }
        } else {
          set({ saveStatus: "error" });
        }
      }
    },

    resolveConflict: async (choice) => {
      const state = get();
      if (!state.cv) return;

      if (choice === "reload") {
        await get().loadCv(state.cv.id);
      } else {
        try {
          const resLatest = await apiFetch<any>(`/cvs/${state.cv.id}`);
          const latest = resLatest?.data || resLatest;
          // Force update local version number to match server, then save to trigger metadata override
          set({ cv: { ...state.cv, version: latest.version }, conflictInfo: null });
          await get().updateCvMetadata({ title: state.cv.title });
        } catch {
          set({ saveStatus: "error" });
        }
      }
    },
  };
});
