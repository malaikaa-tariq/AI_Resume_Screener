import type {
  Metadata,
  Viewport,
} from "next";

import SprinkleCursor from "@/components/SprinkleCursor";
import ThemeProvider from "@/components/ThemeProvider";
import "./globals.css";

const themeScript = `
(function () {
  try {
    var saved = localStorage.getItem("career-canvas-theme");
    var legacy = {
      "peach-dark": "rose-light",
      "violet-dark": "violet-light",
      "blue-dark": "blue-light",
      "green-dark": "green-light"
    };
    var themes = [
      "peach-light",
      "beige-light",
      "rose-light",
      "violet-light",
      "blue-light",
      "green-light",
      "night"
    ];
    var resolved = legacy[saved] || saved;

    if (themes.indexOf(resolved) < 0) {
      resolved = "peach-light";
    }

    document.documentElement.dataset.theme =
      resolved;
    localStorage.setItem(
      "career-canvas-theme",
      resolved
    );
  } catch (error) {
    document.documentElement.dataset.theme =
      "peach-light";
  }
})();
`;

export const metadata: Metadata = {
  title: {
    default:
      "CareerCanvas AI Resume Studio",
    template: "%s | CareerCanvas",
  },
  description:
    "Analyze, build, save, and improve truthful job-ready resumes.",
  applicationName: "CareerCanvas",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#fff8f3",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: themeScript,
          }}
        />
      </head>

      <body>
        <ThemeProvider>
          <SprinkleCursor />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
