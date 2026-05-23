# Design System: BetterCV
**Project ID:** 3556704583957884041

## 1. Visual Theme & Atmosphere
The BetterCV interface uses a **Soft Glassmorphism** design system with a highly modern, premium, and airy SaaS aesthetic. 
* **Atmosphere:** Airy, pristine, futuristic, and productivity-focused. 
* **Visual Styling:** Translucent card containers with subtle white borders, soft drop shadows, and high-quality backdrop blurring over beautiful soft-blue radial gradients. The interface must prioritize extreme content clarity and data readability so that the glass effect feels premium without hindering high-efficiency productivity.

## 2. Color Palette & Roles
* **Primary Color - Soft Sky Blue (`#B9D9EB`):** Used as the primary tint for translucent card backgrounds, glass panels, secondary buttons, and decorative glow gradients.
* **Accent Color - Vibrant Blue (`#5DADE2`):** Used for highlighting interactive elements, active sidebar items, primary call-to-actions, status badges, and loading/streaming text highlights.
* **App Background - Ice-cool White (`#F5FAFD`):** The clean, light background color for all screens. Subtle sky blue radial background gradients are placed beneath active areas to enhance the depth of the glassmorphism elements.
* **Text Primary - Deep Charcoal (`#1C2D37`):** High contrast charcoal color for excellent readability across all headings, titles, and body content.
* **Text Secondary - Muted Slate (`#5A7383`):** Medium contrast gray for secondary subheadings, metadata, small labels, and placeholder states.
* **Card Border - Translucent Frost (`rgba(255, 255, 255, 0.4)`):** A thin, semi-transparent white outline to give glass panels their distinct frosted-edge look.

## 3. Typography Rules
BetterCV utilizes the **Inter** font family exclusively.
* **Hero Titles:** `60px` / Font Weight: Bold (`700`) / Line Height: `1.2` / Letter Spacing: `-0.02em` (for high-impact marketing headings).
* **Section Titles:** `36px` / Font Weight: Semi-bold (`600`) / Letter Spacing: `-0.01em`.
* **Body / Paragraphs:** `16px` / Font Weight: Regular (`400`) / Line Height: `1.6`.
* **Small Labels / Badges:** `14px` / Font Weight: Medium (`500`) / Letter Spacing: `0.02em`.

## 4. Component Stylings
* **Primary Buttons:** Solid Vibrant Blue (`#5DADE2`) background with crisp white text. Shape is pill-shaped (`rounded-full`) or highly rounded (`rounded-xl`). Subtle hover state increases contrast or adds a gentle external glow.
* **Secondary Buttons / Glass Buttons:** Translucent Soft Sky Blue (`rgba(185, 217, 235, 0.2)`) background with a thin frost border (`border border-white/40`) and accent colored text (`#5DADE2`). Pill-shaped (`rounded-full`).
* **Cards / Containers:** Frosted glass panels (`backdrop-blur-md bg-white/40 border border-white/30`) with generous corner roundness (`rounded-2xl`) and whisper-soft diffused shadows (`shadow-sm` to `shadow-md` using a light blue-gray shadow color). All cards in a grid must maintain strictly equal heights and spacing.
* **Inputs & Forms:** Frosted background with a thin boundary line. On focus, the border shifts to active Vibrant Blue (`#5DADE2`) with a soft blue shadow glow. All inputs use `rounded-xl`.

## 5. Layout Principles
* **Whitespace Strategy:** Generous padding and margins (`px-6 py-8` or `gap-6` to `gap-8`) to prevent layout density issues and maintain the "airy" feel.
* **Responsive Spacing:** Clean grids (e.g., 3-column layouts for the Editor, 4-card grids for feature sections) aligned meticulously with consistent margins on desktop.
* **Interactive Clues:** Micro-transitions on hover (gentle lift, subtle shadow growth, soft background shift) for all clickable cards and buttons to make the UI feel responsive and alive.
