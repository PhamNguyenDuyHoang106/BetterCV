---
name: BetterCV Glassmorphism
colors:
  surface: '#f5faff'
  surface-dim: '#caddea'
  surface-bright: '#f5faff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#e9f5ff'
  surface-container: '#def0fe'
  surface-container-high: '#d8ebf8'
  surface-container-highest: '#d3e5f2'
  on-surface: '#0c1d27'
  on-surface-variant: '#40484f'
  inverse-surface: '#22323d'
  inverse-on-surface: '#e3f3ff'
  outline: '#707880'
  outline-variant: '#bfc7d0'
  surface-tint: '#006491'
  primary: '#006491'
  on-primary: '#ffffff'
  primary-container: '#5dade2'
  on-primary-container: '#003f5d'
  inverse-primary: '#8aceff'
  secondary: '#446272'
  on-secondary: '#ffffff'
  secondary-container: '#c7e7fa'
  on-secondary-container: '#4a6878'
  tertiary: '#5a5f62'
  on-tertiary: '#ffffff'
  tertiary-container: '#a1a6a9'
  on-tertiary-container: '#363c3e'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#c9e6ff'
  primary-fixed-dim: '#8aceff'
  on-primary-fixed: '#001e2f'
  on-primary-fixed-variant: '#004b6f'
  secondary-fixed: '#c7e7fa'
  secondary-fixed-dim: '#abcbdd'
  on-secondary-fixed: '#001f2b'
  on-secondary-fixed-variant: '#2c4b59'
  tertiary-fixed: '#dee3e6'
  tertiary-fixed-dim: '#c2c7ca'
  on-tertiary-fixed: '#171c1f'
  on-tertiary-fixed-variant: '#42484a'
  background: '#f5faff'
  on-background: '#0c1d27'
  surface-variant: '#d3e5f2'
  text-primary: '#1C2D37'
  text-secondary: '#5A7383'
  glass-border: rgba(255, 255, 255, 0.4)
  glass-bg: rgba(255, 255, 255, 0.4)
  accent-glow: rgba(93, 173, 226, 0.3)
typography:
  hero-title:
    fontFamily: Inter
    fontSize: 60px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  section-title:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '600'
    lineHeight: '1.3'
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1.4'
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1.2'
  hero-title-mobile:
    fontFamily: Inter
    fontSize: 40px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  container-margin: 24px
  section-gap: 64px
  grid-gutter: 24px
  card-padding: 32px
  stack-sm: 8px
  stack-md: 16px
---

## Brand & Style

The design system for BetterCV is built upon a **Soft Glassmorphism** aesthetic, designed to evoke a sense of clarity, modern professionalism, and airy productivity. The target audience consists of career-focused professionals who value high-end SaaS aesthetics that don't compromise on data readability.

The visual narrative is defined by:
- **Pristine Transparency:** Use of translucent layers and backdrop blurs to create depth without clutter.
- **Atmospheric Depth:** Soft radial gradients in the background interact with frosted surfaces to create a futuristic, "cloud-like" workspace.
- **Functional Elegance:** While the style is expressive, the underlying structure remains rigid and grid-based to ensure the CV creation process feels reliable and organized.

## Colors

The palette is anchored by **Ice-cool White**, providing a sterile and professional canvas. **Vibrant Blue** serves as the functional driver, reserved for actions, progress, and focus states. 

**Color Implementation Notes:**
- **Primary (Vibrant Blue):** High-impact interactive elements and streaming text highlights.
- **Secondary (Soft Sky Blue):** Primarily used as a subtle tint for glass panels and decorative glow.
- **Tertiary (Ice-cool White):** The base layer for the entire application.
- **Glass Effects:** Always pair `glass-bg` with a `backdrop-filter: blur(12px)` and the `glass-border` to maintain the frosted edge.

## Typography

This design system exclusively employs **Inter** to maintain a systematic and utilitarian feel that balances the softer visual effects of glassmorphism.

- **Scale & Impact:** Use `hero-title` for marketing landing pages and primary dashboard welcomes.
- **Readability:** Maintain `body-md` for all user-generated content within the CV editor to ensure maximum legibility during export previews.
- **Hierarchy:** Use `label-sm` in uppercase for category headers or metadata tags to provide clear visual anchors within dense information layouts.

## Layout & Spacing

The layout philosophy relies on a **Fixed Grid** for content-heavy editor views and a **Fluid Grid** for dashboard overviews. 

- **Whitespace:** Prioritize "Airy" layouts. Sections should be separated by a minimum of `section-gap` to prevent the glass panels from feeling cluttered.
- **Desktop:** A 12-column system is standard, with sidebars occupying 3 columns and the primary editor occupying 9.
- **Mobile:** Transition to a single-column layout with `container-margin` of 16px. Glass cards should span the full width of the container on mobile to maximize horizontal real estate.
- **Consistency:** Elements within a grid (like feature cards) must use a "stretch" alignment to ensure equal height, maintaining the structural integrity of the frosted panels.

## Elevation & Depth

Depth is achieved through **Backdrop Blurring** and **Tonal Layering** rather than traditional heavy shadows.

- **Surface Level (Base):** `Ice-cool White` with subtle radial gradients of `Soft Sky Blue`.
- **Level 1 (Cards):** Translucent white backgrounds (40% opacity) with a `12px` backdrop blur. This level uses a `shadow-sm` (a light blue-gray tint) to separate it from the base.
- **Level 2 (Overlays/Modals):** Increased backdrop blur (`24px`) and a more pronounced `shadow-md`.
- **Interactions:** Use a "gentle lift" effect on hover, where the shadow expands slightly and the card moves 2px upwards on the Y-axis.

## Shapes

The shape language is consistently **Rounded**, leaning towards a soft, organic feel that offsets the technical nature of CV building.

- **Standard Containers:** Use `rounded-2xl` (1rem / 16px) for all main card components.
- **Interactive Elements:** Inputs and smaller buttons use `rounded-xl` (0.75rem / 12px).
- **Pill Elements:** Status badges and secondary glass buttons should use `rounded-full` to create a distinct visual contrast against rectangular card layouts.

## Components

### Buttons
- **Primary:** Solid `Vibrant Blue` with white text. Use `rounded-xl` for a modern look. On hover, apply a `primary-glow` (soft blue external shadow).
- **Glass / Secondary:** `rgba(185, 217, 235, 0.2)` background with a `1px` white/40 border. Text remains `Vibrant Blue`. Shape is `rounded-full`.

### Cards & Containers
- **Glass Panel:** The core component. `bg-white/40`, `backdrop-blur-md`, and a `1px` border of `white/30`. Ensure generous internal padding (`card-padding`).

### Inputs & Forms
- **Frosted Input:** Lightly translucent background with a subtle border. 
- **Focus State:** Border transitions to `Vibrant Blue` with a 4px `accent-glow` shadow. Labels should always be `text-secondary` and placed above the field.

### Chips & Badges
- **Status Badges:** Small, `rounded-full` elements with medium weight `label-md` typography. Use `Vibrant Blue` for active states and `Muted Slate` for inactive.

### Lists
- CV list items should be styled as "mini-glass-cards" with a hover-induced background opacity increase (from 40% to 60%) to signify interactivity.