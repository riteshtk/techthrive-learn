import type { Metadata } from "next";
import { Kit } from "./Kit";
import "./kit.css";

// Every library component on one page, for the axe and keyboard checks.
// A route only in e2e builds: next.config.ts adds the "kit.tsx" page
// extension when KIT=1, so published builds have no /kit/ at all.
export const metadata: Metadata = { title: "Component kit", robots: "noindex" };

export default function KitPage() {
  return <Kit />;
}
