import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import Link from "next/link";
import { BrandImage } from "@/components/BrandImage";
import { pageMetadata, SITE_DESCRIPTION, SITE_NAME } from "@/lib/metadata";
import { withBase } from "@/lib/paths";
import "./globals.css";

// Downloaded at build time and served from this site: no third-party requests.
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
    <html lang="en" className={`${inter.variable} ${mono.variable}`}>
      <body>
        <header className="site-header">
          <Link href="/" className="brand">
            <BrandImage kind="lockup" height={28} alt="Tech & Thrive" />
            <span>Learn</span>
          </Link>
        </header>
        {children}
      </body>
    </html>
  );
}
