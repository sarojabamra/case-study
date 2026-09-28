import MenuIcon from "@/components/layout/MenuIcon";
import { catalogueNavLinkClass, getStaffPortalLink, mobileNavLinkClass, staffPortalButtonClass, userDisplayName, userRoleLine } from "@/components/layout/navigation";
import UserProfileMenu from "@/components/layout/UserProfileMenu";
import WordmarkLink from "@/components/layout/WordmarkLink";
import { api } from "@/services/api";
import type { Product } from "@/services/types";
import { useAuth } from "@/utils/authSession";
import { useCart } from "@/utils/cart";
import { useCurrency } from "@/utils/currency";
import { useLoadData } from "@/utils/useLoadData";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";

export default function StoreShell() {
  const { user, status, logout, studioNote, dismissStudioNote } = useAuth();
  const { count } = useCart();
  const { currency, setCurrency } = useCurrency();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const loadFavourites = useCallback(() => api<Product[]>("/products/favourites"), []);
  const favouritesQuery = useLoadData(loadFavourites, {
    enabled: status === "ready" && Boolean(user),
    showErrorToast: false,
  });
  const favouriteCount = favouritesQuery.data?.length ?? 0;
  const staffPortalLink = user ? getStaffPortalLink(user) : null;
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (!isMobileMenuOpen) {
      return;
    }
    function handleEscapeKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsMobileMenuOpen(false);
      }
    }
    document.addEventListener("keydown", handleEscapeKey);
    return () => document.removeEventListener("keydown", handleEscapeKey);
  }, [isMobileMenuOpen]);

  useLayoutEffect(() => {
    const headerElement = headerRef.current;
    if (!headerElement) {
      return;
    }
    const updateHeaderHeight = () => {
      document.documentElement.style.setProperty("--store-header-height", `${headerElement.offsetHeight}px`);
    };
    updateHeaderHeight();
    const observer = new ResizeObserver(updateHeaderHeight);
    observer.observe(headerElement);
    return () => observer.disconnect();
  }, [staffPortalLink, user?.role, studioNote, isMobileMenuOpen]);

  function scrollToCategoryFilters(event: React.MouseEvent) {
    event.preventDefault();
    setIsMobileMenuOpen(false);
    if (location.pathname !== "/") {
      navigate("/#filters");
      return;
    }
    document.getElementById("filters")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function closeMobileMenu() {
    setIsMobileMenuOpen(false);
  }

  const catalogueActive = location.pathname === "/" || location.pathname.startsWith("/products");

  return (
    <div className="min-h-screen bg-canvas">
      <a
        href="#content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[90] focus:bg-canvas focus:px-3 focus:py-2"
      >
        Skip to content
      </a>
      <header ref={headerRef} className="sticky top-0 z-40 border-b border-line bg-canvas">
        <div className="flex items-center justify-between gap-3 px-5 py-3 md:px-10 lg:px-16">
          <WordmarkLink />

          <nav className="hidden items-center gap-6 lg:flex" aria-label="Catalogue">
            <NavLink to="/" end className={({ isActive }) => catalogueNavLinkClass(isActive || catalogueActive)}>
              All products
            </NavLink>
            <a href="/#filters" className={catalogueNavLinkClass(false)} onClick={scrollToCategoryFilters}>
              Categories
            </a>
            <NavLink to="/brands" className={({ isActive }) => catalogueNavLinkClass(isActive)}>
              Brands
            </NavLink>
          </nav>

          <div className="hidden items-center gap-3 text-sm lg:flex">
            <label className="flex items-center gap-1.5">
              <span className="text-muted">Currency</span>
              <select
                value={currency}
                onChange={(event) => setCurrency(event.target.value as "USD" | "INR")}
                aria-label="Currency"
                className="cursor-pointer border border-line-strong bg-canvas px-2 py-1 text-sm text-ink transition-colors hover:border-ink"
              >
                <option value="USD">USD</option>
                <option value="INR">Rupees</option>
              </select>
            </label>
            {staffPortalLink ? (
              <NavLink to={staffPortalLink.to} className={({ isActive }) => staffPortalButtonClass(isActive)}>
                {staffPortalLink.label}
              </NavLink>
            ) : null}
            <Link to="/cart" className="interactive-muted">Cart ({count})</Link>
            {user ? (
              <UserProfileMenu
                user={user}
                favouriteCount={favouriteCount}
                onOpen={() => void favouritesQuery.reload()}
                onLogout={logout}
              />
            ) : (
              <NavLink to="/login" className="interactive-muted">Log in</NavLink>
            )}
          </div>

          <div className="lg:hidden">
            <button
              type="button"
              className="interactive-icon flex h-11 w-11 items-center justify-center border border-line-strong bg-canvas"
              aria-expanded={isMobileMenuOpen}
              aria-controls="store-mobile-menu"
              aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
              onClick={() => {
                if (!isMobileMenuOpen && user) {
                  void favouritesQuery.reload();
                }
                setIsMobileMenuOpen((open) => !open);
              }}
            >
              <MenuIcon open={isMobileMenuOpen} />
            </button>
          </div>
        </div>

        {isMobileMenuOpen ? (
          <nav
            id="store-mobile-menu"
            className="border-t border-line bg-canvas px-5 py-4 lg:hidden md:px-10"
            aria-label="Main menu"
          >
            <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-muted">Browse</p>
            <ul className="mt-2 divide-y divide-line border-y border-line">
              <li>
                <NavLink
                  to="/"
                  end
                  className={({ isActive }) => mobileNavLinkClass(isActive || catalogueActive)}
                  onClick={closeMobileMenu}
                >
                  All products
                </NavLink>
              </li>
              <li>
                <a href="/#filters" className={mobileNavLinkClass(false)} onClick={scrollToCategoryFilters}>
                  Categories
                </a>
              </li>
              <li>
                <NavLink to="/brands" className={({ isActive }) => mobileNavLinkClass(isActive)} onClick={closeMobileMenu}>
                  Brands
                </NavLink>
              </li>
            </ul>

            <p className="mt-6 text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-muted">Your shop</p>
            <ul className="mt-2 divide-y divide-line border-y border-line">
              <li>
                <Link to="/cart" className={mobileNavLinkClass(location.pathname === "/cart")} onClick={closeMobileMenu}>
                  Cart ({count})
                </Link>
              </li>
              {user ? (
                <>
                  <li>
                    <Link
                      to="/favourites"
                      className={mobileNavLinkClass(location.pathname === "/favourites")}
                      onClick={closeMobileMenu}
                    >
                      Favourites ({favouriteCount})
                    </Link>
                  </li>
                  <li>
                    <NavLink to="/orders" className={({ isActive }) => mobileNavLinkClass(isActive)} onClick={closeMobileMenu}>
                      Orders
                    </NavLink>
                  </li>
                </>
              ) : null}
            </ul>

            {user ? (
              <>
                <p className="mt-6 text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-muted">Account</p>
                <div className="mt-2 border border-line bg-surface px-4 py-3">
                  <p className="text-sm font-medium text-ink">{userDisplayName(user)}</p>
                  <p className="mt-1 text-xs text-muted">@{user.username}</p>
                  <p className="mt-2 text-xs text-muted">{userRoleLine(user)}</p>
                </div>
                <button
                  type="button"
                  className={`${mobileNavLinkClass(false)} mt-3 w-full text-left`}
                  onClick={() => {
                    closeMobileMenu();
                    logout();
                  }}
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <p className="mt-6 text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-muted">Account</p>
                <ul className="mt-2 divide-y divide-line border-y border-line">
                  <li>
                    <NavLink to="/login" className={({ isActive }) => mobileNavLinkClass(isActive)} onClick={closeMobileMenu}>
                      Log in
                    </NavLink>
                  </li>
                  <li>
                    <NavLink to="/signup" className={({ isActive }) => mobileNavLinkClass(isActive)} onClick={closeMobileMenu}>
                      Sign up
                    </NavLink>
                  </li>
                </ul>
              </>
            )}

            {staffPortalLink ? (
              <div className="mt-6">
                <NavLink
                  to={staffPortalLink.to}
                  className={({ isActive }) => `${staffPortalButtonClass(isActive)} block text-center`}
                  onClick={closeMobileMenu}
                >
                  {staffPortalLink.label}
                </NavLink>
              </div>
            ) : null}

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <label className="flex items-center gap-2 text-sm">
                <span className="text-muted">Currency</span>
                <select
                  value={currency}
                  onChange={(event) => setCurrency(event.target.value as "USD" | "INR")}
                  aria-label="Currency"
                  className="cursor-pointer border border-line-strong bg-canvas px-2 py-2 text-sm text-ink"
                >
                  <option value="USD">USD</option>
                  <option value="INR">Rupees</option>
                </select>
              </label>
            </div>
          </nav>
        ) : null}
      </header>

      {studioNote && user?.role === "TENANT" && user.tenant_name ? (
        <div className="flex flex-col gap-3 border-b border-line bg-surface px-5 py-3 text-sm sm:flex-row sm:items-center sm:justify-between md:px-10 lg:px-16">
          <p>
            You manage {user.tenant_name}.{" "}
            <Link
              to={`/${encodeURIComponent(user.tenant_name)}/studio`}
              className="interactive-muted underline underline-offset-4"
            >
              Open studio
            </Link>
          </p>
          <button type="button" className="interactive-muted shrink-0 text-sm text-muted" onClick={dismissStudioNote}>
            Dismiss
          </button>
        </div>
      ) : null}

      <main id="content" className="pb-8">
        <Outlet />
      </main>
    </div>
  );
}
