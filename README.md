# Aromica Café — Official Digital Home (V3.1 Polish Pass)

A unified, editorial single-page website for **Aromica Café** (near Boral High School, Kolkata).

Built by synthesizing the **Lovable visual design language** (warm editorial typography, generous whitespace, organic shapes, restrained palette) with the **v0 functional UX** (live Kolkata opening status, interactive category & search menu with veg-only filter, responsive gallery with accessible lightbox, Google Maps integration, and mobile quick action bar).

---

## 🎨 V3.1 Color System Tokens

```css
--espresso: #241611;    /* Primary dark tone */
--coffee: #3B2417;      /* Primary brand / text dark */
--mocha: #5A3A24;       /* Secondary brand dark */
--caramel: #B0793F;     /* Warm accent */
--gold: #D9A45B;        /* Restrained detail & badges */
--gold-soft: #E8C58C;   /* Warm soft highlight */
--cream: #F6EAD9;       /* Card surfaces */
--cream-2: #EFE0C9;     /* Secondary warm surfaces & tabs */
--paper: #FBF4E8;       /* Light foundation background */
--ink: #2A1C12;         /* Primary readable text */
--muted: #8D755F;       /* Subdued secondary text */
--accent: #C2542B;      /* Semantic CTA / Order / Primary Action */
--green: #3F7D4E;       /* Semantic Open Status / Veg indicator */
--wa: #25D366;          /* WhatsApp brand tone ONLY */
--darkest: #170D08;     /* Lightbox backdrop & deep shadows */
```

### Visual Hierarchy
- **Light Foundation**: Paper (`#FBF4E8`), Cream (`#F6EAD9`), Cream-2 (`#EFE0C9`)
- **Warm Accents**: Gold-soft (`#E8C58C`), Gold (`#D9A45B`), Caramel (`#B0793F`)
- **Dark Brand**: Mocha (`#5A3A24`), Coffee (`#3B2417`), Espresso (`#241611`), Darkest (`#170D08`)
- **Semantic Accents**: Terracotta Accent (`#C2542B`) for Order / CTAs; Green (`#3F7D4E`) for Veg / Open; WhatsApp Green (`#25D366`) for WhatsApp only.

---

## ✨ V3.1 Key Refinements

1. **Gallery Lightbox**:
   - Clicking any gallery item opens an accessible full-resolution viewer.
   - Deep espresso/darkened softened backdrop (`#170D08` with blur).
   - Prevents background page scrolling while open (`document.body.style.overflow = "hidden"`).
   - Keyboard accessible (`Esc` to close, `←` / `→` arrow keys to navigate).
   - Click outside the photo closes the modal.
   - Mobile touch swipe navigation (swipe left/right to browse).
   - Styled strictly in the Aromica design system with photo counter (`3 / 8`) and editorial captions.

2. **Menu Tactile Hover Effect**:
   - Subtle desktop-only tactile elevation (`translateY(-1.5px)`) and soft shadow on menu item rows.
   - No large scale, no dramatic lift, no bright glowing effects.
   - Scoped strictly to `@media (hover: hover) and (pointer: fine)` so touch devices remain smooth and unaffected.

3. **Custom Desktop Coffee Cup Cursor**:
   - Small, unobtrusive minimalist coffee cup cursor with warm terracotta steam.
   - Interactive alternate state on buttons, links, and inputs.
   - Scoped to desktop pointer devices only (`@media (hover: hover) and (pointer: fine)`).
   - Graceful native fallback to system cursor.
   - Zero JavaScript overhead; no distracting cursor trails or large glow rings.

4. **Subtle Ambient Background Motion**:
   - Extremely subtle, slow warm ambient light drift across the paper background (30s ease-in-out cycle).
   - Almost imperceptible; makes the page feel gently alive without distracting from content.
   - Full support for `prefers-reduced-motion: reduce` (automatically disabled when reduced motion is preferred).

---

## 📂 Project Architecture

```
aromica-final/
├── public/
│   ├── images/              # Authentic Aromica Café photography (.webp)
│   │   ├── aromica-exterior-drinks-01.webp
│   │   ├── aromica-exterior-day-01.webp
│   │   ├── aromica-exterior-night-01.webp
│   │   ├── aromica-interior-01.webp
│   │   ├── aromica-coffee-01.webp
│   │   ├── aromica-tea-01.webp
│   │   ├── aromica-cold-coffee-01.webp
│   │   ├── aromica-crispy-snack-01.webp
│   │   ├── aromica-momos-snacks-01.webp
│   │   ├── aromica-burger-platter-01.webp
│   │   ├── aromica-flowers-table-01.webp
│   │   ├── aromica-burger-01.webp
│   │   └── aromica-burger-momos-overhead-01.webp
│   ├── icon.svg             # Favicon & brand icon
│   └── favicon.ico
├── src/
│   ├── components/
│   │   ├── Header.tsx            # Sticky editorial header with mobile drawer & editorial link effects
│   │   ├── Hero.tsx              # Editorial hero with DM Serif Display signature mask reveal
│   │   ├── QuickInfoStrip.tsx    # Live hours & Kolkata timezone status strip
│   │   ├── MenuSection.tsx       # Interactive menu (tactile hover, search, tabs, auto-repositioning)
│   │   ├── AtmosphereHook.tsx    # Visual editorial pause between Menu and Gallery
│   │   ├── GallerySection.tsx    # Responsive grid with accessible swipeable Lightbox modal
│   │   ├── VisitSection.tsx      # Embedded Google Map, address, landmarks, exterior photo & hours
│   │   ├── OrderSection.tsx      # Digital takeaway & delivery CTA
│   │   ├── SocialSection.tsx     # Instagram & community feedback section
│   │   ├── Footer.tsx            # Lovable warm footer with brand info & links
│   │   ├── MobileActionBar.tsx   # Fixed bottom action bar for mobile devices
│   │   ├── OpenStatusBadge.tsx   # Kolkata timezone dynamic open/closed calculator
│   │   └── brand-icons.tsx       # SVG icons for Instagram and WhatsApp
│   ├── data/
│   │   └── cafe.ts               # Centralized café config, verified menu data & real photo assets
│   ├── lib/
│   │   ├── useScrollReveal.ts    # Lightweight IntersectionObserver scroll reveal hook
│   │   └── utils.ts              # Utility helpers (cn)
│   ├── App.tsx                   # Single-page layout assembly with ambient warmth layer
│   ├── index.css                 # Color tokens, DM Serif Display, motion keyframes & cursor
│   └── main.tsx                  # React 19 entry point
├── index.html                    # SEO meta, preconnect fonts, and JSON-LD schema
├── package.json
└── vite.config.ts
```

---

## 🚀 Running Locally

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build production bundle
npm run build

# Preview production build
npm run preview
```
