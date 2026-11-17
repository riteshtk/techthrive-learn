import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tech & Thrive Learn",
  description:
    "Free, open-source roadmaps where each idea explains itself as an animated diagram, one step at a time.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
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
