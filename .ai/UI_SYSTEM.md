# UI_SYSTEM.md - UI & Design System Guidelines

## 1. Design Philosophy
- **Aesthetic:** Modern, clinical-grade, premium dark & light glassmorphic aesthetic with high legibility, clean gradients, and subtle micro-interactions.
- **Typography:** Modern sans-serif stack (Inter / Outfit / system-ui).

## 2. Color Tokens & Themes
- **Primary / Brand:**
  - Sky / Cyan / Medical Blue: `#0284c7`, `#0ea5e9`, `#38bdf8`
  - Emerald / Success: `#10b981`, `#059669`
  - Amber / Warning / Triage Moderate: `#f59e0b`
  - Rose / Emergency / Triage Critical: `#ef4444`
- **Neutrals & Dark Surfaces:**
  - Backgrounds: `#090d16` (Dark), `#f8fafc` (Light)
  - Card Surfaces: Slate / Zinc glass with border opacity (`border-slate-700/50`, `bg-slate-900/60`, `backdrop-blur-md`)

## 3. Key Components
- `Layout.tsx`: Responsive navigation sidebar with role-aware nav items and header status.
- `Card`: Elevated frosted containers with rounded corners (`rounded-2xl`).
- `Badge`: Status tags (Emergency, Completed, Waiting, In-Consultation).
- `Modal` & `Drawer`: Slide-over panels for patient intake, prescriptions, and slot management.
- `StickyChatbot`: Floating AI assistant available across public and operational screens.

## 4. UI Conventions & Responsive Rules
- Mobile-first layouts with responsive grid (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`).
- Use Lucide React icons with consistent sizing (`w-4 h-4`, `w-5 h-5`).
- Ensure accessible contrast ratios on all clinical text and status badges.
