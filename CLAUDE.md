# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server
npm run build    # Production build
npm start        # Start production server
npm run lint     # ESLint
```

No test suite configured.

## Architecture Overview

This is a creative portfolio built with **Next.js App Router**, **Sanity CMS**, **Three.js**, and **GSAP**.

### Pages & Routing (`/app/`)
- `/` — Home page: 3D spiral slider (Three.js) + mouse-drag project browsing
- `/p/[slug]` — Individual project/post detail
- `/lab` — Infinite canvas grid of experiments (GSAP Draggable)
- `/about` — About page with tech stack and achievements
- `/studio/[[...tool]]` — Sanity CMS admin

### Data Flow
Pages fetch content from Sanity in `useEffect` via `client.fetch()` (defined in `/lib/`), store it in local `useState`, then trigger GSAP animation sequences. No global state manager — all state is local React hooks.

### Animation System
- **GSAP timelines** orchestrate page enter/exit transitions — see `/app/animations.ts`
- `data-anim` attributes on DOM elements are used as animation targets
- Page transitions sequence: animate out → navigate → animate in
- **Lenis smooth scroll** is integrated via `SmoothScrollProvider` component, hooked into GSAP ticker
- The homepage uses a `window.exitHomeSketch` callback (declared in `global.d.ts`) to trigger Three.js cleanup before navigating away

### 3D Rendering (Homepage)
- **Three.js** spiral slider lives in `/components/InfiniteSlider.js` (plain JS class, not React)
- Custom GLSL shaders imported as strings via webpack/turbopack raw-loader — see `/app/shaders/`
- Shader files use `.glsl`, `.vert`, `.frag` extensions configured in `next.config.ts`

### CMS (Sanity)
- Schema types in `/sanity/schemaTypes/` (post, about, lab, home)
- GROQ queries in `/lib/`
- Images use Sanity's `urlFor()` builder from `@sanity/image-url`
- Sanity Studio is embedded at `/studio` route

### Styling
- **SCSS Modules** per component/page — imported as `styles` object
- Global CSS variables: `--background` (#F4F4F6), `--foreground` (#202123)
- Default font: Geist Mono (monospace)
- Smooth scroll styles come from Lenis (`globals.scss`)

### Key Environment Variables
```
NEXT_PUBLIC_SANITY_PROJECT_ID
NEXT_PUBLIC_SANITY_DATASET
NEXT_PUBLIC_SANITY_API_VERSION
```
