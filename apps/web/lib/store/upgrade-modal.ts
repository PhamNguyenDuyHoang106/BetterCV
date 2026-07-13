import { create } from "zustand";

type UpgradeModalState = {
  open: boolean;
  feature?: string;
  requiredPlan?: string;
  openUpgradeModal: (feature?: string, requiredPlan?: string) => void;
  closeUpgradeModal: () => void;
};

export const useUpgradeModalStore = create<UpgradeModalState>((set) => ({
  open: false,
  feature: undefined,
  requiredPlan: undefined,
  openUpgradeModal: (feature, requiredPlan) =>
    set({ open: true, feature, requiredPlan }),
  closeUpgradeModal: () =>
    set({ open: false, feature: undefined, requiredPlan: undefined }),
}));
