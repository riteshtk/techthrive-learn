import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

// Downloaded at build time and served from this site: no third-party requests.
const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "Tech & Thrive Learn",
  description:
    "Free, open-source roadmaps where each idea explains itself as an animated diagram, one step at a time.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} ${mono.variable}`}>
      <body>
        <header className="site-header">
          <Link href="/" className="brand">
            Tech &amp; Thrive <span>Learn</span>
          </Link>
        </header>
        {children}
      </body>
    </html>
  );
}
