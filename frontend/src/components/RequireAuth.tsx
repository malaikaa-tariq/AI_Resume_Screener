"use client";

import Link from "next/link";
import {
  Fragment,
  ReactNode,
  useEffect,
  useState,
} from "react";

import Icon from "@/components/Icon";
import {
  AUTH_EVENT,
  DemoUser,
  getCurrentUser,
} from "@/lib/auth";

export default function RequireAuth({
  children,
  title = "Log in to continue",
  description =
    "This page contains private user data and is available only after login.",
}: {
  children: ReactNode;
  title?: string;
  description?: string;
}) {
  const [user, setUser] =
    useState<DemoUser | null>(null);
  const [ready, setReady] =
    useState(false);

  useEffect(() => {
    function syncSession() {
      setUser(getCurrentUser());
      setReady(true);
    }

    syncSession();

    window.addEventListener(
      "storage",
      syncSession,
    );
    window.addEventListener(
      AUTH_EVENT,
      syncSession,
    );

    return () => {
      window.removeEventListener(
        "storage",
        syncSession,
      );
      window.removeEventListener(
        AUTH_EVENT,
        syncSession,
      );
    };
  }, []);

  if (!ready) {
    return (
      <div className="empty-state">
        <Icon name="login" size={36} />
        <h2>Checking your session</h2>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="empty-state">
        <Icon name="login" size={40} />
        <h2>{title}</h2>
        <p>{description}</p>
        <Link
          href="/login"
          className="primary-button"
        >
          <Icon name="login" size={18} />
          Log in
        </Link>
      </div>
    );
  }

  return (
    <Fragment key={user.email}>
      {children}
    </Fragment>
  );
}
