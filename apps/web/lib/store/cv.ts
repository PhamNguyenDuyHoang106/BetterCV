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
  isDirty: boolean;
  dirtyChanges: {
    metadata?: boolean;
    sections?: Record<string, boolean>;
  };
  loadCv: (cvId: string) => Promise<void>;
  updateCvMetadata: (dto: CvUpdateDto) => Promise<void>;
  upsertSection: (dto: Omit<CvSectionUpsertDto, 'version'>) => Promise<void>;
  resolveConflict: (choice: 'overwrite' | 'reload') => Promise<void>;
  
  // High performance draft state actions for instant local rendering (60fps)
  setDraftMetadata: (updates: Partial<Omit<Cv, 'sections'>>) => void;
  setDraftSection: (type: string, content: any, order?: number) => void;
  syncDirtyChanges: () => Promise<void>;
};

let saveGeneration = 0;

export const useCvStore = create<CvState>((set, get) => {
  const sessionId = typeof window !== "undefined"
    ? (window as any)._cvSessionId || ((window as any)._cvSessionId = Math.random().toString(36).substring(7))
    : "";

  return {
    cv: null,
    saveStatus: "saved",
    conflictInfo: null,
    isLoading: false,
    isDirty: false,
    dirtyChanges: {},

    loadCv: async (cvId) => {
      set({ isLoading: true, conflictInfo: null, isDirty: false, dirtyChanges: {} });
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
        const sections = state.cv.sections || [];
        set({ cv: { ...state.cv, ...updated, sections }, saveStatus: "saved" });
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
        const saveDto = { ...dto };
        if (saveDto.id && saveDto.id.startsWith("temp_")) {
          delete saveDto.id;
        }

        await apiFetch(`/cvs/${state.cv.id}/sections`, {
          method: "POST",
          headers: {
            "x-session-id": sessionId,
          },
          body: JSON.stringify({ ...saveDto, version: currentVersion }),
        });

        const isNewSection = !dto.id || dto.id.startsWith("temp_");
        if (isNewSection) {
          const res = await apiFetch<any>(`/cvs/${state.cv.id}`);
          const updated = res?.data || res;
          set({ cv: updated, saveStatus: "saved" });
        } else {
          set({
            cv: { ...get().cv!, version: get().cv!.version + 1 },
            saveStatus: "saved",
          });
        }

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
          set({ cv: { ...state.cv, version: latest.version }, conflictInfo: null });
          await get().updateCvMetadata({ title: state.cv.title });
        } catch {
          set({ saveStatus: "error" });
        }
      }
    },

    setDraftMetadata: (updates) => {
      const state = get();
      if (!state.cv) return;

      set({
        cv: { ...state.cv, ...updates },
        isDirty: true,
        dirtyChanges: {
          ...state.dirtyChanges,
          metadata: true,
        },
      });
    },

    setDraftSection: (type, content, order = 1) => {
      const state = get();
      if (!state.cv) return;

      const updatedSections = [...state.cv.sections];
      const matchIndex = updatedSections.findIndex((s) => s.type === type);

      if (matchIndex !== -1) {
        updatedSections[matchIndex] = {
          ...updatedSections[matchIndex],
          content,
          order: order !== undefined ? order : updatedSections[matchIndex].order,
        };
      } else {
        updatedSections.push({
          id: `temp_${Math.random()}`,
          type,
          content,
          order,
        });
      }

      set({
        cv: { ...state.cv, sections: updatedSections },
        isDirty: true,
        dirtyChanges: {
          ...state.dirtyChanges,
          sections: {
            ...(state.dirtyChanges.sections || {}),
            [type]: true,
          },
        },
      });
    },

    syncDirtyChanges: async () => {
      const state = get();
      if (!state.cv || !state.isDirty) return;

      const currentGeneration = ++saveGeneration;
      set({ saveStatus: "saving" });

      try {
        const { metadata, sections } = state.dirtyChanges;
        const currentCv = get().cv!;
        const currentVersion = currentCv.version;

        // 1. Sync metadata if changed
        if (metadata) {
          await apiFetch<any>(`/cvs/${currentCv.id}`, {
            method: "PUT",
            headers: {
              "x-session-id": sessionId,
            },
            body: JSON.stringify({
              title: currentCv.title,
              locale: currentCv.locale,
              templateId: currentCv.templateId,
              version: currentVersion,
            }),
          });
        }

        // 2. Sync sections if changed
        if (sections) {
          const dirtyTypes = Object.keys(sections).filter((t) => sections[t]);
          for (const type of dirtyTypes) {
            const sec = currentCv.sections.find((s) => s.type === type);
            if (sec) {
              const saveDto: any = {
                type: sec.type,
                content: sec.content,
                order: sec.order,
              };
              if (sec.id && !sec.id.startsWith("temp_")) {
                saveDto.id = sec.id;
              }
              
              await apiFetch(`/cvs/${currentCv.id}/sections`, {
                method: "POST",
                headers: {
                  "x-session-id": sessionId,
                },
                body: JSON.stringify({ ...saveDto, version: currentVersion }),
              });
            }
          }
        }

        // After all requests complete, check if a newer save request has been initiated
        if (currentGeneration !== saveGeneration) {
          console.log("Stale save response detected, skipping state override.");
          return;
        }

        // Fetch fully synced CV to resolve temp_ IDs and update version
        const res = await apiFetch<any>(`/cvs/${currentCv.id}`);
        const updated = res?.data || res;
        
        set({
          cv: updated,
          saveStatus: "saved",
          isDirty: false,
          dirtyChanges: {},
        });

      } catch (err: any) {
        if (currentGeneration !== saveGeneration) return;

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
  };
});
