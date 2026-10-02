import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { cafe, galleryItems } from "@/data/cafe";
import { InstagramIcon } from "@/components/brand-icons";
import { PhotoWatermark } from "@/components/PhotoWatermark";
import { cn } from "@/lib/utils";
import { useScrollReveal } from "@/lib/useScrollReveal";

export function GallerySection() {
  const { ref: headerRevealRef, isRevealed: isHeaderRevealed } = useScrollReveal();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const touchStartX = useRef<number | null>(null);

  const activePhoto = selectedIndex !== null ? galleryItems[selectedIndex] : null;

  const navigatePhoto = useCallback((delta: number) => {
    setSelectedIndex((current) => {
      if (current === null) return null;
      const count = galleryItems.length;
      return (current + delta + count) % count;
    });
  }, []);

  // Lock background page scroll when lightbox is open
  useEffect(() => {
    if (selectedIndex !== null) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [selectedIndex]);

  // Keyboard navigation: Escape closes, Left/Right arrows navigate
  useEffect(() => {
    if (selectedIndex === null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedIndex(null);
      if (e.key === "ArrowLeft") navigatePhoto(-1);
      if (e.key === "ArrowRight") navigatePhoto(1);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedIndex, navigatePhoto]);

  // Touch handlers for mobile swipe navigation
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;

    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        navigatePhoto(1); // Swiped left -> next
      } else {
        navigatePhoto(-1); // Swiped right -> prev
      }
    }
    touchStartX.current = null;
  };

  return (
    <section id="gallery" aria-labelledby="gallery-title" className="scroll-mt-18 border-t border-primary/20 py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        {/* Section Header with Scroll Reveal */}
        <div
          ref={headerRevealRef}
          className={`reveal-fade-up flex flex-col gap-6 md:flex-row md:items-end md:justify-between ${
            isHeaderRevealed ? "is-revealed" : ""
          }`}
        >
          <div>
            <div className="flex items-center gap-2.5">
              <p className="text-xs font-semibold uppercase tracking-wider text-caramel">
                Visual Moments
              </p>
            </div>
            <h2 id="gallery-title" className="mt-3 font-display text-4xl text-primary sm:text-5xl lg:text-6xl">
              Inside Aromica
            </h2>
            <p className="mt-3 max-w-xl text-base text-muted-foreground">
              A glimpse of our cozy café corner, artisan beverages, and evening comfort food. Click any image to view details.
            </p>
          </div>

          <a
            href={cafe.instagram.href}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary transition-colors hover:text-accent"
          >
            <InstagramIcon className="size-4 transition-transform duration-200 group-hover:scale-110" />
            <span className="link-editorial">Follow {cafe.instagram.handle}</span>
          </a>
        </div>

        {/* Masonry / Column Gallery */}
        <div className="mt-12 columns-1 gap-4 sm:columns-2 lg:columns-4">
          {galleryItems.map((photo, index) => (
            <div key={photo.id} className="mb-4 break-inside-avoid">
              <button
                type="button"
                onClick={() => setSelectedIndex(index)}
                aria-label={`Open photo view for ${photo.caption}`}
                className="group relative block w-full overflow-hidden rounded-2xl border border-primary/15 bg-card shadow-paper transition-all duration-300 hover:border-gold/50 hover:shadow-paper-lg hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-caramel"
              >
                <img
                  src={photo.src}
                  alt={photo.alt}
                  className={cn(
                    "w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.025]",
                    photo.aspectClass || (photo.tall ? "aspect-[3/4]" : "aspect-square")
                  )}
                  loading="lazy"
                />

                {/* Subtle caption bar on hover */}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-espresso/95 via-espresso/70 to-transparent p-4 pt-10 text-left text-cream opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100">
                  <p className="font-display text-sm text-cream">{photo.caption}</p>
                  {photo.category && (
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-gold-soft">
                      {photo.category}
                    </p>
                  )}
                </div>

                <PhotoWatermark className="bottom-2.5 right-2.5 group-hover:opacity-0" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Accessible Lightbox Modal Dialog with Smooth Animation */}
      {activePhoto && selectedIndex !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Image Lightbox Preview"
          className="animate-fade-in fixed inset-0 z-50 flex items-center justify-center bg-darkest/90 p-3 backdrop-blur-md sm:p-6"
          onClick={() => setSelectedIndex(null)}
        >
          <div
            className="animate-dialog-in relative flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-gold/25 bg-espresso text-cream shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {/* Close button with >= 44px touch target */}
            <button
              type="button"
              onClick={() => setSelectedIndex(null)}
              aria-label="Close photo preview"
              className="absolute right-3.5 top-3.5 z-10 flex size-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-coffee/80 text-cream transition-all duration-150 hover:bg-caramel hover:text-paper active:scale-95 focus-visible:outline-2 focus-visible:outline-gold"
            >
              <X className="size-5" />
            </button>

            {/* Photo & Prev/Next Arrows with subtle directional nudge */}
            <div className="relative flex min-h-[240px] max-h-[64vh] sm:max-h-[72vh] items-center justify-center bg-darkest/60">
              <img
                src={activePhoto.src}
                alt={activePhoto.alt}
                className="max-h-[64vh] sm:max-h-[72vh] w-auto max-w-full select-none object-contain"
              />

              <PhotoWatermark className="bottom-3 right-3 sm:bottom-4 sm:right-4 z-20" />

              <button
                type="button"
                onClick={() => navigatePhoto(-1)}
                aria-label="Previous photo"
                className="group absolute left-2.5 top-1/2 flex size-11 min-h-[44px] min-w-[44px] -translate-y-1/2 items-center justify-center rounded-full bg-coffee/80 text-cream transition-all duration-200 hover:-translate-x-0.5 hover:bg-caramel hover:text-paper active:scale-95 focus-visible:outline-2 focus-visible:outline-gold sm:left-4 sm:size-12"
              >
                <ChevronLeft className="size-6 transition-transform duration-200 group-hover:-translate-x-0.5" />
              </button>

              <button
                type="button"
                onClick={() => navigatePhoto(1)}
                aria-label="Next photo"
                className="group absolute right-2.5 top-1/2 flex size-11 min-h-[44px] min-w-[44px] -translate-y-1/2 items-center justify-center rounded-full bg-coffee/80 text-cream transition-all duration-200 hover:translate-x-0.5 hover:bg-caramel hover:text-paper active:scale-95 focus-visible:outline-2 focus-visible:outline-gold sm:right-4 sm:size-12"
              >
                <ChevronRight className="size-6 transition-transform duration-200 group-hover:translate-x-0.5" />
              </button>
            </div>

            {/* Photo metadata strip styled in Aromica design system */}
            <div className="flex items-center justify-between gap-3 border-t border-mocha/40 bg-coffee/90 p-4 sm:px-6">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate font-display text-base text-paper sm:text-lg">{activePhoto.caption}</p>
                </div>
                <p className="truncate text-xs text-cream/70">{activePhoto.alt}</p>
              </div>
              <span className="shrink-0 font-display text-xs font-semibold tabular-nums text-gold">
                {selectedIndex + 1} / {galleryItems.length}
              </span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
