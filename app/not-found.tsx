import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Page not found",
  description: "This page doesn't exist. Head back to the topics.",
};

export default function NotFound() {
  return (
    <main className="page">
      <h1>Page not found</h1>
      <p className="lede">
        This page doesn&apos;t exist, or the link has a typo.
      </p>
      <p>
        <Link href="/" className="button button-primary">
          Go home
        </Link>{" "}
        <Link href="/topics/" className="button">
          See all topics
        </Link>
      </p>
    </main>
  );
}
