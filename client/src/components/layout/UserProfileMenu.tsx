import { profileDropdownItemClass, userDisplayName, userInitials, userRoleLine } from "@/components/layout/navigation";
import type { Me } from "@/services/types";
import { useEffect, useRef, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";

export default function UserProfileMenu({
  user,
  favouriteCount,
  onOpen,
  onLogout,
}: {
  user: Me;
  favouriteCount: number;
  onOpen?: () => void;
  onLogout: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    function handleEscapeKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }
    function handlePointerDown(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("keydown", handleEscapeKey);
    document.addEventListener("mousedown", handlePointerDown);
    return () => {
      document.removeEventListener("keydown", handleEscapeKey);
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      onOpen?.();
    }
  }, [isOpen, onOpen]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        className="interactive-icon flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line-strong bg-surface text-xs font-semibold uppercase text-ink"
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-controls="user-profile-menu"
        aria-label={`${userDisplayName(user)}, account menu`}
        onClick={() => setIsOpen((open) => !open)}
      >
        <span aria-hidden="true">{userInitials(userDisplayName(user))}</span>
      </button>
      {isOpen ? (
        <div
          id="user-profile-menu"
          role="menu"
          aria-label="Account"
          className="absolute right-0 z-50 mt-2 w-60 border border-line bg-canvas p-4 shadow-[0_8px_24px_rgba(0,0,0,0.08)]"
        >
          <p className="text-sm font-medium text-ink">{userDisplayName(user)}</p>
          <p className="text-xs text-muted">@{user.username}</p>
          <p className="mt-1 text-xs text-muted">{userRoleLine(user)}</p>
          <div className="mt-4 -mx-1 space-y-0.5 border-t border-line pt-2">
            <NavLink
              to="/account"
              role="menuitem"
              className={profileDropdownItemClass}
              onClick={() => setIsOpen(false)}
            >
              Account settings
            </NavLink>
            <NavLink
              to="/favourites"
              role="menuitem"
              className={profileDropdownItemClass}
              onClick={() => setIsOpen(false)}
            >
              Favourites ({favouriteCount})
            </NavLink>
            <NavLink
              to="/orders"
              role="menuitem"
              className={profileDropdownItemClass}
              onClick={() => setIsOpen(false)}
            >
              Orders
            </NavLink>
            <button
              type="button"
              role="menuitem"
              className={profileDropdownItemClass}
              onClick={() => {
                setIsOpen(false);
                onLogout();
              }}
            >
              Log out
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
