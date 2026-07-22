"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CSSProperties,
  useEffect,
  useRef,
  useState,
} from "react";

import Icon from "@/components/Icon";
import Logo from "@/components/Logo";
import ThemeMenu from "@/components/ThemeMenu";
import {
  AUTH_EVENT,
  DemoUser,
  getCurrentUser,
  signOut,
} from "@/lib/auth";
import {
  getProfile,
  PROFILE_EVENT,
} from "@/lib/db";

const links = [
  {
    href: "/features",
    label: "Features",
    icon: "sparkles" as const,
  },
  {
    href: "/analyze",
    label: "Analyze",
    icon: "upload" as const,
  },
  {
    href: "/templates",
    label: "Templates",
    icon: "template" as const,
  },
  {
    href: "/resume-builder",
    label: "Builder",
    icon: "edit" as const,
  },
  {
    href: "/history",
    label: "History",
    icon: "history" as const,
  },
  {
    href: "/profile",
    label: "Profile",
    icon: "user" as const,
  },
];

type IndicatorState = {
  left: number;
  width: number;
  visible: boolean;
};

function routeIsActive(
  pathname: string,
  href: string,
): boolean {
  return (
    pathname === href ||
    pathname.startsWith(`${href}/`)
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [user, setUser] =
    useState<DemoUser | null>(null);
  const [profileName, setProfileName] =
    useState("");
  const [avatarUrl, setAvatarUrl] =
    useState("");
  const [indicator, setIndicator] =
    useState<IndicatorState>({
      left: 0,
      width: 0,
      visible: false,
    });

  const avatarObjectUrl = useRef("");
  const desktopNavRef =
    useRef<HTMLDivElement>(null);
  const linkRefs = useRef<
    Record<string, HTMLAnchorElement | null>
  >({});

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    function updateIndicator() {
      const nav = desktopNavRef.current;
      const activeLink = links.find((item) =>
        routeIsActive(
          pathname,
          item.href,
        ),
      );

      const link = activeLink
        ? linkRefs.current[activeLink.href]
        : null;

      if (!nav || !link) {
        setIndicator((current) => ({
          ...current,
          visible: false,
        }));
        return;
      }

      const navRect =
        nav.getBoundingClientRect();
      const linkRect =
        link.getBoundingClientRect();

      setIndicator({
        left: linkRect.left - navRect.left,
        width: linkRect.width,
        visible: true,
      });
    }

    const frame =
      window.requestAnimationFrame(
        updateIndicator,
      );

    const resizeObserver =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(
            updateIndicator,
          )
        : null;

    if (desktopNavRef.current) {
      resizeObserver?.observe(
        desktopNavRef.current,
      );
    }

    window.addEventListener(
      "resize",
      updateIndicator,
    );

    return () => {
      window.cancelAnimationFrame(frame);
      resizeObserver?.disconnect();
      window.removeEventListener(
        "resize",
        updateIndicator,
      );
    };
  }, [pathname, user, profileName]);

  useEffect(() => {
    let cancelled = false;

    function clearAvatarUrl() {
      if (avatarObjectUrl.current) {
        URL.revokeObjectURL(
          avatarObjectUrl.current,
        );
        avatarObjectUrl.current = "";
      }

      setAvatarUrl("");
    }

    async function syncUserAndProfile() {
      const nextUser = getCurrentUser();

      if (cancelled) return;

      setUser(nextUser);

      if (!nextUser) {
        clearAvatarUrl();
        setProfileName("");
        return;
      }

      try {
        const profile = await getProfile();

        if (cancelled) return;

        clearAvatarUrl();
        setProfileName(
          profile?.fullName.trim() ||
            nextUser.name,
        );

        if (profile?.avatar) {
          const nextAvatarUrl =
            URL.createObjectURL(
              profile.avatar,
            );

          avatarObjectUrl.current =
            nextAvatarUrl;
          setAvatarUrl(nextAvatarUrl);
        }
      } catch {
        if (cancelled) return;

        clearAvatarUrl();
        setProfileName(nextUser.name);
      }
    }

    const handleSync = () => {
      void syncUserAndProfile();
    };

    handleSync();
    window.addEventListener(
      "storage",
      handleSync,
    );
    window.addEventListener(
      AUTH_EVENT,
      handleSync,
    );
    window.addEventListener(
      PROFILE_EVENT,
      handleSync,
    );

    return () => {
      cancelled = true;
      window.removeEventListener(
        "storage",
        handleSync,
      );
      window.removeEventListener(
        AUTH_EVENT,
        handleSync,
      );
      window.removeEventListener(
        PROFILE_EVENT,
        handleSync,
      );

      if (avatarObjectUrl.current) {
        URL.revokeObjectURL(
          avatarObjectUrl.current,
        );
        avatarObjectUrl.current = "";
      }
    };
  }, []);

  const displayedName =
    profileName || user?.name || "User";

  const profileIdentity = user ? (
    <Link
      href="/profile"
      className="user-pill"
    >
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={`${displayedName} profile`}
          className="user-pill-avatar"
        />
      ) : (
        <span className="user-pill-fallback">
          {displayedName
            .slice(0, 1)
            .toUpperCase()}
        </span>
      )}

      <strong>{displayedName}</strong>
    </Link>
  ) : null;

  function handleSignOut() {
    signOut();
    setUser(null);
    setProfileName("");

    if (avatarObjectUrl.current) {
      URL.revokeObjectURL(
        avatarObjectUrl.current,
      );
      avatarObjectUrl.current = "";
    }

    setAvatarUrl("");
  }

  const indicatorStyle = {
    "--indicator-x":
      `${indicator.left}px`,
    "--indicator-width":
      `${indicator.width}px`,
    opacity: indicator.visible ? 1 : 0,
  } as CSSProperties;

  return (
    <header className="site-navbar">
      <nav className="nav-shell">
        <Logo />

        <div
          ref={desktopNavRef}
          className="desktop-nav"
        >
          <span
            className="nav-active-indicator"
            style={indicatorStyle}
            aria-hidden="true"
          />

          {links.map((item) => {
            const active = routeIsActive(
              pathname,
              item.href,
            );

            return (
              <Link
                key={item.href}
                ref={(element) => {
                  linkRefs.current[
                    item.href
                  ] = element;
                }}
                href={item.href}
                aria-current={
                  active
                    ? "page"
                    : undefined
                }
                className={`nav-link ${
                  active
                    ? "nav-link-active"
                    : ""
                }`}
              >
                <Icon
                  name={item.icon}
                  size={17}
                />
                {item.label}
              </Link>
            );
          })}
        </div>

        <div className="desktop-actions">
          <ThemeMenu />

          {user ? (
            <>
              {profileIdentity}
              <button
                type="button"
                className="icon-text-button"
                onClick={handleSignOut}
              >
                <Icon
                  name="logout"
                  size={17}
                />
                Log out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="icon-text-button"
              >
                <Icon
                  name="login"
                  size={17}
                />
                Log in
              </Link>
              <Link
                href="/signup"
                className="primary-button small-button"
              >
                Sign up
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          className="mobile-menu-button"
          aria-expanded={open}
          aria-label={
            open
              ? "Close menu"
              : "Open menu"
          }
          onClick={() =>
            setOpen((value) => !value)
          }
        >
          <Icon
            name={open ? "close" : "menu"}
            size={22}
          />
        </button>
      </nav>

      {open && (
        <div className="mobile-menu">
          <div className="mobile-menu-links">
            {links.map((item) => {
              const active = routeIsActive(
                pathname,
                item.href,
              );

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={
                    active
                      ? "page"
                      : undefined
                  }
                  className={`mobile-nav-link ${
                    active
                      ? "mobile-nav-link-active"
                      : ""
                  }`}
                  onClick={() =>
                    setOpen(false)
                  }
                >
                  <Icon
                    name={item.icon}
                    size={18}
                  />
                  {item.label}
                </Link>
              );
            })}
          </div>

          <ThemeMenu />

          <div className="mobile-auth">
            {user ? (
              <>
                {profileIdentity}
                <button
                  type="button"
                  className="icon-text-button"
                  onClick={() => {
                    handleSignOut();
                    setOpen(false);
                  }}
                >
                  <Icon
                    name="logout"
                    size={17}
                  />
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="icon-text-button"
                >
                  <Icon
                    name="login"
                    size={17}
                  />
                  Log in
                </Link>
                <Link
                  href="/signup"
                  className="primary-button small-button"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
