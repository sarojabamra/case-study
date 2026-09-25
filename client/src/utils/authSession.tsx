import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { api, clearSession, restoreSession, setSession, setSessionExpiredHandler } from "@/services/api";
import type { Me, Tokens } from "@/services/types";
import { toastStore } from "@/utils/toast";

const STUDIO_NOTE = "shop.studioNote";

type LoginInput = {
  username: string;
  password: string;
  tenantName?: string;
};

type AuthContextValue = {
  user: Me | null;
  status: "loading" | "anonymous" | "ready";
  studioNote: boolean;
  dismissStudioNote: () => void;
  login: (input: LoginInput) => Promise<Me>;
  logout: () => void;
  refreshUser: () => Promise<Me | null>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const locationRef = useRef(location);
  const sessionReadyRef = useRef(false);
  const [user, setUser] = useState<Me | null>(null);
  const [status, setStatus] = useState<AuthContextValue["status"]>("loading");
  const [studioNote, setStudioNote] = useState(false);

  locationRef.current = location;

  useEffect(() => {
    setSessionExpiredHandler(() => {
      setUser(null);
      setStatus("anonymous");
      setStudioNote(false);
      sessionStorage.removeItem(STUDIO_NOTE);
      if (!sessionReadyRef.current) {
        return;
      }
      toastStore.failure("Your session expired. Sign in again.");
      const path = locationRef.current.pathname;
      const studioMatch = path.match(/^\/([^/]+)\/studio\/?$/);
      if (studioMatch) {
        navigate(`/${studioMatch[1]}/login`, { replace: true });
        return;
      }
      if (path === "/login" || path.endsWith("/login")) {
        return;
      }
      const returnPath = encodeURIComponent(`${path}${locationRef.current.search}`);
      navigate(`/login?next=${returnPath}`, { replace: true });
    });
  }, [navigate]);

  useEffect(() => {
    let isMounted = true;

    async function loadUserOnStartup() {
      const sessionRestored = await restoreSession();
      if (!isMounted) {
        return;
      }
      if (!sessionRestored) {
        setStatus("anonymous");
        sessionReadyRef.current = true;
        return;
      }
      try {
        const currentUser = await api<Me>("/auth/me");
        if (!isMounted) {
          return;
        }
        setUser(currentUser);
        let showStudioNote = false;
        try {
          showStudioNote = sessionStorage.getItem(STUDIO_NOTE) === "1";
        } catch {
          showStudioNote = false;
        }
        setStudioNote(currentUser.role === "TENANT" && showStudioNote);
        setStatus("ready");
      } catch {
        clearSession();
        if (!isMounted) {
          return;
        }
        setStatus("anonymous");
      } finally {
        sessionReadyRef.current = true;
      }
    }

    void loadUserOnStartup();
    return () => {
      isMounted = false;
    };
  }, []);

  function dismissStudioNote() {
    sessionStorage.removeItem(STUDIO_NOTE);
    setStudioNote(false);
  }

  async function login(input: LoginInput) {
    const loginPath = input.tenantName
      ? `/auth/${encodeURIComponent(input.tenantName)}/login`
      : "/auth/login";
    const tokens = await api<Tokens>(loginPath, {
      method: "POST",
      auth: false,
      body: JSON.stringify({
        username: input.username,
        password: input.password,
      }),
    });
    setSession(tokens);
    const currentUser = await api<Me>("/auth/me");

    currentUser.isBrandStaffLoggedIn = !!input.tenantName;

    setUser(currentUser);
    setStatus("ready");
    const shouldShowStudioNote =
      !input.tenantName && currentUser.role === "TENANT";
    try {
      if (shouldShowStudioNote) {
        sessionStorage.setItem(STUDIO_NOTE, "1");
      } else {
        sessionStorage.removeItem(STUDIO_NOTE);
      }
    } catch {}
    setStudioNote(shouldShowStudioNote);
    return currentUser;
  }

  function logout() {
    clearSession();
    sessionStorage.removeItem(STUDIO_NOTE);
    setUser(null);
    setStudioNote(false);
    setStatus("anonymous");
    navigate("/");
  }

  async function refreshUser() {
    if (status !== "ready") {
      return null;
    }
    try {
      const currentUser = await api<Me>("/auth/me");
      setUser(currentUser);
      return currentUser;
    } catch {
      return null;
    }
  }

  const authContextValue: AuthContextValue = {
    user,
    status,
    studioNote,
    dismissStudioNote,
    login,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={authContextValue}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return value;
}
