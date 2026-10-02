# Aromica Café — Website Concept (Portfolio & Sales Demo)

A unified, editorial single-page website concept for **Aromica Café** (near Boral High School, Kolkata), maintained as an agency portfolio showcase and client sales demo by **Susmit Dey**.

---

## 💼 Demo Configuration (`src/data/demoConfig.ts`)

The project includes a centralized, toggleable demo configuration architecture:
- `demoConfig.enabled`: When `true`, automatically activates subtle demo attributions, editorial photo watermarks, and agency sales contact areas (`tel:` / `mailto:`).
- `demoConfig.owner`: Project creator and demo owner (**Susmit Dey**).
- `demoConfig.secondaryContact`: Agency sales and inquiry contact point (**Tuhimrahamain**).
- When `demoConfig.enabled` is switched to `false` for a live client deployment, all demo watermarks, attributions, and agency contacts cleanly disappear and revert to client configuration.

---

## 🛠️ How to Adapt This Template for a New Café

This project is engineered as a **reusable Café Website System**:

```
REUSABLE CORE + CLIENT CONFIGURATION + CLIENT CONTENT + CLIENT ASSETS = CLIENT WEBSITE
```

### 1. Where Client Configuration Lives
All core business details, contact information, hours, and external links are centralized in [`src/data/cafe.ts`](file:///d:/agency/cafe-aromica/aromica-final/src/data/cafe.ts).

### 2. Where Menu Data Lives
Menu categories, groups, prices, descriptions, and dietary flags (`veg: boolean`) live in the `menuCategories` array in [`src/data/cafe.ts`](file:///d:/agency/cafe-aromica/aromica-final/src/data/cafe.ts). Categories are completely data-driven with no hardcoded assumptions.

### 3. Where Gallery Data Lives
The `galleryItems` array in [`src/data/cafe.ts`](file:///d:/agency/cafe-aromica/aromica-final/src/data/cafe.ts) defines all gallery images, captions, alt text, and aspect ratios. The lightbox modal automatically adapts to any number of items.

### 4. Where Images Are Placed
All client photographs are stored in `public/images/`. Simply drop webp/jpg images there and reference their paths in `cafe.heroImage`, `cafe.atmosphere.image`, and `galleryItems`.

### 5. How to Change Branding
- **Name & Slogan**: Update `cafe.name`, `cafe.brandWord1`, `cafe.brandWord2`, `cafe.tagline`, and `cafe.slogan` in `cafe.ts`.
- **Palette & Tokens**: Adjust CSS variables in [`src/index.css`](file:///d:/agency/cafe-aromica/aromica-final/src/index.css) (`--espresso`, `--coffee`, `--caramel`, `--gold`, `--paper`, `--accent`).

### 6. How to Change Hours & Open/Closed Status
Edit `weeklySchedule` in `cafe.ts`. Set `isClosed: true` for weekly off-days, and configure `openMinutes` / `closeMinutes` along with display strings. The `OpenStatusBadge` dynamically evaluates the schedule without hardcoded times.

### 7. How to Configure External Links
Configure destinations in `cafe.ts`:
- Google Maps directions: `cafe.directions.href` and `cafe.directions.embedSrc`
- WhatsApp link: `cafe.whatsapp.href`
- Phone number: `cafe.phone.display` and `cafe.phone.href`
- Instagram handle and URL: `cafe.instagram`
- Reviews link: `cafe.reviews.href`

### 8. How to Enable / Disable Optional Features
Optional integrations degrade gracefully using flags in `cafe.ts`:
- `cafe.orderOnline.enabled`: When `false`, order buttons in header, hero, menu, and mobile bar are cleanly omitted.
- `cafe.menuFlipbook.enabled`: When `false`, flipbook menu link is hidden.
- `cafe.reviews.enabled`: When `false`, review CTA is hidden.

### 9. How Demo Mode Works
When `demoConfig.enabled = true`, the website serves as an agency portfolio demonstration showcasing Susmit Dey's design capabilities with non-intrusive watermarks and inquiry CTAs.

### 10. How to Switch to Client Mode
Set `enabled: false` in [`src/data/demoConfig.ts`](file:///d:/agency/cafe-aromica/aromica-final/src/data/demoConfig.ts). The entire site automatically converts into a pure client website without modifying components.

---

## 📐 Client Customization Boundary

| Layer | Responsibility | What Changes |
| :--- | :--- | :--- |
| **Client Config** | Business Identity | Name, address, phone, WhatsApp, opening hours, social links, SEO |
| **Client Content** | Offerings & Visuals | Menu categories, items, prices, dietary flags, gallery captions |
| **Client Assets** | Photography & Media | Hero photo, atmosphere photo, storefront photo, gallery items, favicon |
| **Agency Core** | Framework Architecture | Layout, animation system, tactile hover effects, accessible lightbox, responsive behavior |
| **Custom Dev** | Bespoke Capabilities | Custom online ordering backend, table reservations, custom POS sync |

## 🎨 Color System Tokens

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

<<<<<<< HEAD
## Key Refinements
=======
## ✨ Key Refinements
>>>>>>> 28a4245 (Finalize Aromica Café portfolio demo)

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
