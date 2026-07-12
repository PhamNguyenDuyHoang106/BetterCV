"use client";

import { useUpgradeModalStore } from "../lib/store/upgrade-modal";
import UpgradePromptModal from "./cv/UpgradePromptModal";

export function UpgradeModalProvider() {
  const { open, feature, requiredPlan, closeUpgradeModal } = useUpgradeModalStore();
  
  return (
    <UpgradePromptModal
      open={open}
      onClose={closeUpgradeModal}
      feature={feature}
      requiredPlan={requiredPlan}
    />
  );
}
export default UpgradeModalProvider;
