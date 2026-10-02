import { Header } from "./components/Header";
import { Hero } from "./components/Hero";
import { QuickInfoStrip } from "./components/QuickInfoStrip";
import { MenuSection } from "./components/MenuSection";
import { AtmosphereHook } from "./components/AtmosphereHook";
import { GallerySection } from "./components/GallerySection";
import { VisitSection } from "./components/VisitSection";
import { OrderSection } from "./components/OrderSection";
import { SocialSection } from "./components/SocialSection";
import { DemoContactSection } from "./components/DemoContactSection";
import { Footer } from "./components/Footer";
import { MobileActionBar } from "./components/MobileActionBar";
import { DemoOrderModal } from "./components/DemoOrderModal";

export function App() {
  return (
    <div className="relative flex min-h-screen flex-col bg-background text-foreground antialiased selection:bg-accent/25">
      {/* Subtle Background Ambient Illumination Layer */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
        <div className="ambient-illumination absolute -inset-[10%] h-[120%] w-[120%]" />
      </div>

      {/* 1. Header */}
      <Header />

      <main className="flex-1">
        {/* 2. Hero */}
        <Hero />

        {/* 3. Quick Action / Business Info Strip */}
        <QuickInfoStrip />

        {/* 4. Menu */}
        <MenuSection />

        {/* 5. Atmosphere Visual Hook (Editorial Breathing Point) */}
        <AtmosphereHook />

        {/* 6. Gallery */}
        <GallerySection />

        {/* 7. Visit Aromica (Map, Hours, Address) */}
        <VisitSection />

        {/* 8. Order Online CTA Strip */}
        <OrderSection />

        {/* 9. Social & Instagram */}
        <SocialSection />

        {/* 10. Agency Sales Demo & Portfolio Inquiries (Active when demo mode is enabled) */}
        <DemoContactSection />
      </main>

      {/* 11. Footer */}
      <Footer />

      {/* 11. Mobile Action Bar (Sticky at bottom on small viewports) */}
      <MobileActionBar />

      {/* 12. Demo Order Interception Modal (Accessible concept notice) */}
      <DemoOrderModal />
    </div>
  );
}

export default App;
