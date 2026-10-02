# Production Deployment Guide for T1-Scan

This website is fully optimized, clean, and production-ready for deployment to GitHub and Vercel.

---

## 🚀 1. Push to GitHub

From your terminal in this project root (`c:\Users\rorog\OneDrive\Desktop\T1 scan`), run the following commands:

```bash
# 1. Initialize git (if not already initialized)
git init

# 2. Stage all clean, optimized files
git add .

# 3. Create initial production commit
git commit -m "feat: optimize website animations, cleanup code, and prepare for production"

# 4. Set the default branch to main
git branch -M main

# 5. Connect your GitHub remote repository (replace with your repo URL)
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git

# 6. Push to GitHub
git push -u origin main
```

*(If you already have a repository initialized with another remote, simply run `git add .`, `git commit -m "optimize website animations and cleanup code"`, and `git push`)*

---

## ⚡ 2. Deploy to Vercel

### Option A: Via Vercel Web Dashboard (Recommended)
1. Go to [vercel.com](https://vercel.com) and log in.
2. Click **Add New Project** and select your GitHub repository.
3. Set the **Root Directory** to `t1-scan/t1-scan` (Project Settings → Build & Deployment
   → Root Directory → Edit). This must be set in the Vercel dashboard — `rootDirectory`
   is not a valid `vercel.json` property and Vercel rejects it with
   *"should NOT have additional property `rootDirectory`"*.
4. Confirm the framework is detected as **Next.js** and leave the build/install commands on their defaults.
5. Click **Deploy**. Vercel will build and deploy your project automatically with Next.js edge caching and global CDN.

### Option B: Via Vercel CLI
Run the following in your terminal:
```bash
# In the project directory:
npx vercel
```
Follow the interactive prompts to link your Vercel account and deploy. For production:
```bash
npx vercel --prod
```

---

## 🛠️ Optimizations & Fixes Applied

1. **Fluid 60/120fps Canvas Rendering (`DnaBackground.tsx`):**
   - Pauses rendering loop via `IntersectionObserver` when the section scrolls out of view, reducing CPU/GPU cycles.
   - Removed expensive `ctx.shadowBlur = 10` software rasterization that caused stutter and frame drops.
   - Replaced with multi-layer hardware-accelerated arc rendering for crisp glows and smooth physics.
   - Batched canvas path calls for stroke and fill operations.
   - Added delta capping to eliminate erratic jumps when switching browser tabs.

2. **Eliminated Style Re-injection & Frame Drops (`ScanPreview.tsx`):**
   - Extracted large inline style tag into a dedicated Next.js CSS Module (`ScanPreview.module.css`), eliminating continuous DOM re-parse spikes.
   - Removed per-frame React state re-rendering in the metric counter loop; transitioned progress to hardware-accelerated CSS properties.
   - Upgraded image rendering to Next.js `<Image />` with `priority` and static image metadata to ensure 0 layout shift (CLS).

3. **Hardware Acceleration & GPU Containment (`HeroGlow.tsx` & `CtaBanner.tsx`):**
   - Added `transform-gpu`, `will-change-transform`, and CSS `contain: layout style paint` to prevent document-wide repaints during blur keyframe animations.
   - Optimized blur radius and gradient compositing layers.

4. **Code Cleanliness & Production Standards:**
   - Swapped standard `<a>` tags for Next.js `<Link>` components in `Navbar.tsx` and `Hero.tsx` for client-side routing.
   - Cleaned up TypeScript typings in `CursorGlow.tsx` (removed arbitrary `any` casts).
   - Added comprehensive SEO, OpenGraph, Twitter card, viewport, and keyword metadata in `layout.tsx`.
   - Enabled compression (`gzip`/`brotli`) and image optimization configurations in `next.config.mjs`.
   - Created clean `.gitignore` and `vercel.json` deployment configuration.
