import { TranslationSchema } from "../types";
import { common } from "./common";
import { landing } from "./landing";
import { auth } from "./auth";
import { onboarding } from "./onboarding";
import { dashboard } from "./dashboard";
import { editor } from "./editor";
import { validation } from "./validation";
import { toast } from "./toast";

export const vi: TranslationSchema = {
  common,
  nav: landing.nav,
  hero: landing.hero,
  painPoints: landing.painPoints,
  steps: landing.steps,
  atsDemo: landing.atsDemo,
  pricing: landing.pricing,
  testimonials: landing.testimonials,
  faq: landing.faq,
  finalCta: landing.finalCta,
  footer: landing.footer,
  auth,
  onboarding,
  dashboard: dashboard.main,
  settings: dashboard.settings,
  profile: dashboard.profile,
  upgrade: dashboard.upgrade,
  cvHealth: dashboard.cvHealth,
  overview: dashboard.overview,
  resumes: dashboard.resumes,
  createCvModal: dashboard.createCvModal,
  initializeCvModal: dashboard.initializeCvModal,
  career: dashboard.career,
  templateGallery: dashboard.templateGallery,
  deleteCvModal: dashboard.deleteCvModal,
  editor,
  validation,
  toast,
};
