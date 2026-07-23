"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import Icon from "@/components/Icon";
import {
  ThemeId,
  themeOptions,
  useTheme,
} from "@/components/ThemeProvider";

export default function ThemeMenu() {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const containerRef =
    useRef<HTMLDivElement>(null);

  const active =
    themeOptions.find(
      (option) => option.id === theme,
    ) ?? themeOptions[0];

  useEffect(() => {
    function closeWhenOutside(
      event: MouseEvent,
    ) {
      if (
        containerRef.current &&
        !containerRef.current.contains(
          event.target as Node,
        )
      ) {
        setOpen(false);
      }
    }

    function closeWithEscape(
      event: KeyboardEvent,
    ) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener(
      "mousedown",
      closeWhenOutside,
    );
    document.addEventListener(
      "keydown",
      closeWithEscape,
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        closeWhenOutside,
      );
      document.removeEventListener(
        "keydown",
        closeWithEscape,
      );
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="theme-menu"
    >
      <button
        type="button"
        className="theme-trigger"
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() =>
          setOpen((value) => !value)
        }
      >
        <span
          className="theme-swatch theme-swatch-large"
          style={{
            backgroundColor: active.swatch,
          }}
        />
        <span>{active.label}</span>
        <Icon
          name="chevronDown"
          size={17}
          className={
            open
              ? "theme-chevron-open"
              : "theme-chevron"
          }
        />
      </button>

      {open && (
        <div
          className="theme-popover"
          role="listbox"
          aria-label="Color themes"
        >
          <p>Choose a color theme</p>

          {themeOptions.map((option) => (
            <button
              key={option.id}
              type="button"
              role="option"
              aria-selected={
                option.id === theme
              }
              className={`theme-option ${
                option.id === theme
                  ? "theme-option-active"
                  : ""
              }`}
              onClick={() => {
                setTheme(
                  option.id as ThemeId,
                );
                setOpen(false);
              }}
            >
              <span
                className="theme-swatch"
                style={{
                  backgroundColor:
                    option.swatch,
                }}
              />
              <span>{option.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
