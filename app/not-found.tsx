import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Page not found",
  description: "This page doesn't exist. Head back home or to the topics.",
};

export default function NotFound() {
  return (
    <main className="tt-redirect">
      <h1 className="tt-h1">Page not found</h1>
      <p className="tt-body tt-muted">
        This page doesn&apos;t exist, or the link has a typo.
      </p>
      <p className="tt-redirect-actions">
        <Link href="/" className="tt-btn tt-btn-primary">
          Go home
        </Link>
        <Link href="/topics/" className="tt-btn">
          See all topics
        </Link>
      </p>
    </main>
  );
}
