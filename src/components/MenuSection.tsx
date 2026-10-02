import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BookOpen, Search, ShoppingBag, X } from "lucide-react";
import { cafe, menuCategories, type MenuCategory, type MenuGroup, type MenuItem } from "@/data/cafe";
import { demoConfig } from "@/data/demoConfig";
import { openOrderDemoModal } from "@/lib/demoModal";
import { cn } from "@/lib/utils";
import { useScrollReveal } from "@/lib/useScrollReveal";

const DEFAULT_CATEGORY = menuCategories[0]?.id || "";

function matchesQuery(item: MenuItem, q: string): boolean {
  const query = q.toLowerCase();
  return (
    item.name.toLowerCase().includes(query) ||
    Boolean(item.description?.toLowerCase().includes(query)) ||
    Boolean(item.note?.toLowerCase().includes(query))
  );
}

export function MenuSection() {
  const { ref: headerRevealRef, isRevealed: isHeaderRevealed } = useScrollReveal();
  const [activeCategory, setActiveCategory] = useState<string>(DEFAULT_CATEGORY);
  const [searchQuery, setSearchQuery] = useState("");
  const [vegOnly, setVegOnly] = useState(false);

  const handleOrderClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (demoConfig.enabled && demoConfig.externalActions.demoMode) {
      e.preventDefault();
      openOrderDemoModal();
    }
  };

  const filterBarAnchorRef = useRef<HTMLDivElement>(null);
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const pendingScrollRef = useRef<string | null>(null);

  const tabs = useMemo(
    () => menuCategories.map((c) => ({ id: c.id, label: c.label })),
    []
  );

  const filteredCategories = useMemo<MenuCategory[]>(() => {
    const q = searchQuery.trim();
    const source = q
      ? menuCategories
      : menuCategories.filter((c) => c.id === activeCategory);

    return source
      .map((cat) => ({
        ...cat,
        groups: cat.groups
          .map((group) => ({
            ...group,
            items: group.items.filter((item) => {
              if (vegOnly && !item.veg) return false;
              if (q && !matchesQuery(item, q)) return false;
              return true;
            }),
          }))
          .filter((group) => group.items.length > 0),
      }))
      .filter((cat) => cat.groups.length > 0);
  }, [activeCategory, searchQuery, vegOnly]);

  const totalFilteredItems = filteredCategories.reduce(
    (total, cat) => total + cat.groups.reduce((subTotal, g) => subTotal + g.items.length, 0),
    0
  );

  // Automatically center the selected category button within the horizontal category bar
  const scrollActiveTabIntoView = useCallback((tabId: string) => {
    const container = tabsContainerRef.current;
    const button = tabRefs.current[tabId];
    if (!container || !button) return;

    const containerWidth = container.clientWidth;
    const buttonLeft = button.offsetLeft;
    const buttonWidth = button.clientWidth;

    const targetScrollLeft = buttonLeft - containerWidth / 2 + buttonWidth / 2;
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    container.scrollTo({
      left: Math.max(0, targetScrollLeft),
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
  }, []);

  // Smoothly reposition page so the menu category navigation sits flush below the sticky header
  const repositionToCategoryBar = useCallback(() => {
    if (!filterBarAnchorRef.current) return;

    const header = document.querySelector("header");
    const headerHeight = header ? header.getBoundingClientRect().height : 72;

    const anchorRect = filterBarAnchorRef.current.getBoundingClientRect();
    const currentScrollY = window.scrollY;
    const targetScrollY = currentScrollY + anchorRect.top - headerHeight;

    const maxScrollY = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    const clampedTargetY = Math.max(0, Math.min(targetScrollY, maxScrollY));

    // Avoid unnecessary micro-jumps if the user is already looking at the top of the category
    if (Math.abs(currentScrollY - clampedTargetY) <= 16) {
      return;
    }

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    window.scrollTo({
      top: clampedTargetY,
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
  }, []);

  const handleCategorySelect = (categoryId: string) => {
    setSearchQuery("");
    if (categoryId === activeCategory && !searchQuery) {
      // If already active, still reposition if the user was scrolled down in the items
      repositionToCategoryBar();
      scrollActiveTabIntoView(categoryId);
      return;
    }
    pendingScrollRef.current = categoryId;
    setActiveCategory(categoryId);
  };

  useEffect(() => {
    if (pendingScrollRef.current) {
      const categoryId = pendingScrollRef.current;
      pendingScrollRef.current = null;

      // Allow React to paint the filtered category DOM, then smoothly scroll to the category bar
      requestAnimationFrame(() => {
        repositionToCategoryBar();
        scrollActiveTabIntoView(categoryId);
      });
    }
  }, [activeCategory, repositionToCategoryBar, scrollActiveTabIntoView]);

  return (
    <section id="menu" aria-labelledby="menu-title" className="scroll-mt-18 border-t border-primary/20 bg-card/40 py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        {/* Header Strip with Scroll Reveal */}
        <div
          ref={headerRevealRef}
          className={`reveal-fade-up flex flex-col gap-6 md:flex-row md:items-end md:justify-between ${
            isHeaderRevealed ? "is-revealed" : ""
          }`}
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-accent">
              {cafe.menu.eyebrow}
            </p>
            <h2 id="menu-title" className="mt-3 font-display text-4xl text-primary sm:text-5xl lg:text-6xl">
              {cafe.menu.title}
            </h2>
            <p className="mt-3 max-w-xl text-base text-muted-foreground">
              {cafe.menu.subtitle}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {cafe.menuFlipbook.enabled && (
              <a
                href={cafe.menuFlipbook.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[40px] items-center gap-2 rounded-full border border-coffee/25 bg-background px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-coffee shadow-2xs transition-all duration-200 hover:bg-cream-2/70 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]"
              >
                <BookOpen className="size-4 text-caramel" />
                <span>{cafe.menuFlipbook.label}</span>
              </a>
            )}
            {(cafe.orderOnline.enabled || demoConfig.enabled) && (
              <a
                href={cafe.orderOnline.href}
                onClick={handleOrderClick}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex min-h-[40px] items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-paper shadow-sm transition-all duration-200 hover:bg-accent/90 hover:-translate-y-0.5 hover:shadow-paper active:translate-y-0 active:scale-[0.98]"
              >
                <ShoppingBag className="size-4 transition-transform duration-200 group-hover:scale-105" />
                <span>{demoConfig.enabled ? "Order Online Demo" : cafe.orderOnline.label}</span>
              </a>
            )}
          </div>
        </div>

        {/* Natural layout anchor positioned at the exact top edge of the filter bar */}
        <div className="h-10" />
        <div ref={filterBarAnchorRef} className="h-0 w-full" aria-hidden="true" />

        {/* Filter & Search Bar */}
        <div className="sticky top-18 z-30 -mx-5 border-y border-coffee/15 bg-background/95 px-5 py-4 backdrop-blur-md lg:-mx-8 lg:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search
                className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search momos, pizza, chai, coffee, shakes…"
                aria-label="Search menu items"
                className="h-11 w-full rounded-full border border-coffee/20 bg-card pl-10 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:border-caramel focus:outline-none focus:ring-2 focus:ring-caramel/20"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  aria-label="Clear search"
                  className="absolute right-2.5 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:bg-cream-2 hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>

            {/* Veg Only Toggle */}
            <button
              type="button"
              role="switch"
              aria-checked={vegOnly}
              onClick={() => setVegOnly(!vegOnly)}
              className={cn(
                "inline-flex min-h-[44px] items-center gap-2 self-start rounded-full border px-4 text-xs font-semibold tracking-wide transition-all sm:self-auto",
                vegOnly
                  ? "border-green bg-green text-white shadow-sm"
                  : "border-coffee/20 bg-card text-foreground hover:border-green"
              )}
            >
              <DietIndicator veg className={vegOnly ? "border-white [&>span]:bg-white" : ""} />
              <span>Veg Only</span>
            </button>
          </div>

          {/* Category Tabs: Natural horizontal scroll with automatic centering */}
          <div
            ref={tabsContainerRef}
            role="tablist"
            aria-label="Menu categories"
            className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]"
          >
            {tabs.map((tab) => {
              const isSelected = !searchQuery && activeCategory === tab.id;
              return (
                <button
                  key={tab.id}
                  ref={(el) => {
                    tabRefs.current[tab.id] = el;
                  }}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => handleCategorySelect(tab.id)}
                  className={cn(
                    "min-h-[40px] shrink-0 rounded-full px-4 py-2 text-xs font-semibold tracking-wide whitespace-nowrap transition-all duration-200 active:scale-95",
                    isSelected
                      ? "bg-coffee text-paper shadow-sm"
                      : "border border-coffee/15 bg-card/60 text-muted-foreground hover:bg-cream-2/60 hover:text-coffee"
                  )}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Dietary Legend */}
        <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5">
              <DietIndicator veg />
              <span>Vegetarian</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <DietIndicator veg={false} />
              <span>Non-Vegetarian</span>
            </span>
          </div>
          {(searchQuery || vegOnly) && (
            <span>
              Showing {totalFilteredItems} {totalFilteredItems === 1 ? "item" : "items"}
            </span>
          )}
        </div>

        {/* Menu Listings with graceful category change animation */}
        {filteredCategories.length === 0 ? (
          <div className="py-24 text-center">
            <p className="font-display text-2xl text-primary">
              No menu items match your search
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Try searching for &ldquo;chai&rdquo;, &ldquo;pizza&rdquo;, &ldquo;burger&rdquo;, or reset filters.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setVegOnly(false);
                setActiveCategory(DEFAULT_CATEGORY);
              }}
              className="mt-5 rounded-full border border-primary/30 px-5 py-2 text-xs font-semibold uppercase tracking-wider text-primary transition-all duration-200 hover:bg-secondary/40 active:scale-95"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div
            key={activeCategory + (searchQuery ? `_q_${searchQuery}` : "") + (vegOnly ? "_veg" : "")}
            className="animate-menu-content mt-12 space-y-16"
          >
            {filteredCategories.map((category) => (
              <div key={category.id} className="scroll-mt-32">
                {(searchQuery || filteredCategories.length > 1) && (
                  <div className="mb-6 flex items-baseline gap-3 border-b border-primary/20 pb-2">
                    <h3 className="font-display text-2xl text-primary sm:text-3xl">
                      {category.label}
                    </h3>
                  </div>
                )}

                <div className="grid gap-8 lg:grid-cols-2">
                  {category.groups.map((group) => (
                    <MenuGroupCard key={group.title} group={group} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer note & ordering link */}
        <div className="mt-16 border-t border-primary/20 pt-8 text-center sm:flex sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            {cafe.menu.footerNote}
          </p>
          {(cafe.orderOnline.enabled || demoConfig.enabled) && (
            <a
              href={cafe.orderOnline.href}
              onClick={handleOrderClick}
              target="_blank"
              rel="noopener noreferrer"
              className="group mt-4 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary transition-colors hover:text-accent sm:mt-0"
            >
              <span className="link-editorial">{demoConfig.enabled ? "Explore Ordering Demo" : "Proceed to Digital Ordering"}</span>
              <ShoppingBag className="size-3.5 transition-transform duration-200 group-hover:scale-110" />
            </a>
          )}
        </div>
      </div>
    </section>
  );
}

function MenuGroupCard({ group }: { group: MenuGroup }) {
  return (
    <article className="rounded-2xl border border-primary/15 bg-card p-4 sm:p-6 shadow-paper transition-all duration-250 md:hover:-translate-y-1 md:hover:shadow-paper-lg">
      <header className="mb-4 flex items-baseline justify-between gap-4 border-b border-dashed border-primary/20 pb-3">
        <h4 className="font-display text-xl text-primary">{group.title}</h4>
        {group.note && <span className="text-xs italic text-caramel">{group.note}</span>}
      </header>
      <ul className="flex flex-col gap-1.5">
        {group.items.map((item) => (
          <li
            key={item.name}
            className="menu-item-hover flex items-start gap-3 rounded-xl px-3 py-2.5 transition-colors"
          >
            <DietIndicator veg={item.veg} className="mt-1 shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-sm font-medium text-foreground">{item.name}</span>
                <span
                  aria-hidden="true"
                  className="mx-2 hidden flex-1 translate-y-[-4px] border-b border-dotted border-primary/20 sm:block"
                />
                <span className="font-display text-sm font-semibold tabular-nums text-primary whitespace-nowrap">
                  ₹{item.price}
                </span>
              </div>
              {item.description && (
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {item.description}
                </p>
              )}
              {item.note && (
                <p className="mt-0.5 text-[11px] italic text-caramel">
                  {item.note}
                </p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </article>
  );
}

export function DietIndicator({ veg, className }: { veg: boolean; className?: string }) {
  return (
    <span
      role="img"
      aria-label={veg ? "Vegetarian" : "Non-vegetarian"}
      title={veg ? "Vegetarian" : "Non-vegetarian"}
      className={cn(
        "inline-flex size-3.5 items-center justify-center rounded-[3px] border-[1.5px]",
        veg ? "border-veg" : "border-nonveg",
        className
      )}
    >
      <span className={cn("size-1.5 rounded-full", veg ? "bg-veg" : "bg-nonveg")} />
    </span>
  );
}
