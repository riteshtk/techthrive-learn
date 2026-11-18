import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { TopBar } from "@/components/shell/TopBar";
import { pageMetadata, SITE_DESCRIPTION, SITE_NAME } from "@/lib/metadata";
import { withBase } from "@/lib/paths";
import { THEME_SCRIPT } from "@/lib/theme";
import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/components.css";
import "./styles/shell.css";
import "./styles/stage.css";
import "./globals.css";

// Downloaded at build time and served from this site: no third-party requests.
// This is the Google build of Inter, the one the design was drawn with.
const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  ...pageMetadata({ description: SITE_DESCRIPTION, path: "/" }),
  title: { default: SITE_NAME, template: `%s · ${SITE_NAME}` },
  icons: {
    icon: [
      {
        url: withBase("/brand/mark-small_on-light.svg"),
        type: "image/svg+xml",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: withBase("/brand/mark-small_on-dark.svg"),
        type: "image/svg+xml",
        media: "(prefers-color-scheme: dark)",
      },
    ],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // data-theme is set before paint by THEME_SCRIPT, so React must not
    // complain that it differs from the server render.
    <html
      lang="en"
      className={`${inter.variable} ${mono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>
        <TopBar />
        {children}
      </body>
    </html>
  );
}
