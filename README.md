# T1-Scan — Landing Page

A frontend-only recreation of the T1-Scan landing page, built with Next.js
(App Router), TypeScript, Tailwind CSS, and React. No AI/backend logic is
wired up yet — the analysis card on the page shows fixed sample data so the
UI can be reviewed and iterated on first.

## Stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS (custom tokens in `tailwind.config.ts`)
- `lucide-react` for icons
- Plain SVG + CSS/SMIL for the animated DNA helix background (no extra
  animation library required)

## Getting started

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

## Structure

```
app/
  layout.tsx        Root layout, loads Inter via next/font
  page.tsx           Assembles the sections
  globals.css        Tailwind entry + base tweaks

components/
  layout/
    Navbar.tsx        Logo + "Get Started" button
    Footer.tsx
  sections/
    Hero.tsx           Headline, subcopy, CTA buttons
    AnalysisPreview.tsx "Preview of the analysis" heading + demo card
    Dimensions.tsx     "Four dimensions" cards + helix background
    CtaBanner.tsx      Dark "Ready to see your score?" banner
  analysis/
    AnalysisDemo.tsx   Interactive photo + metrics panel (hover to reveal)
    MetricCard.tsx     Single metric row: score, track, marker
    FacePlaceholder.tsx  Silhouette placeholder (swap in a real photo)
  backgrounds/
    HeroGlow.tsx        Soft ambient gradient blobs behind the hero
    GeneticsBackground.tsx  Animated DNA double-helix (SVG + SMIL)
  ui/
    button.tsx          Shared button (primary / dark / ghost variants)

lib/
  metrics.ts            Sample metric data + scoring logic
  utils.ts               `cn()` class-merge helper
```

## Notes on the photo

No source photo was provided, so `FacePlaceholder` renders a simple
silhouette. To use a real photo, either:

- pass a URL: `<AnalysisDemo photo="/your-photo.jpg" />` in
  `components/sections/AnalysisPreview.tsx`, or
- drop a file into `public/` and reference it the same way.

The overlay measurement lines in `AnalysisDemo.tsx` are positioned in
percentage coordinates against a square photo, tuned to the original
reference image's face position — nudge the coordinates in
`lib/metrics.ts` (`lines`) if a different photo is used.

## Not implemented yet

This is frontend-only, matching the brief:

- Photo upload / file handling
- Any real computer-vision analysis or scoring
- Backend routes / API calls
