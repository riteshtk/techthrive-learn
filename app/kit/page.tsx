import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Kit } from "./Kit";
import "./kit.css";

// Every library component on one page, for the axe and keyboard checks.
// It is built only for end-to-end runs (KIT=1); the published site 404s.
const BUILT = process.env.KIT === "1";

export function generateMetadata(): Metadata {
  return BUILT ? { title: "Component kit", robots: "noindex" } : {};
}

export default function KitPage() {
  if (!BUILT) notFound();
  return <Kit />;
}
