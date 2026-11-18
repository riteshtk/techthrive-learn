import Link from "next/link";
import { BrandImage } from "@/components/BrandImage";
import { PrimaryNav } from "./PrimaryNav";
import { SearchDialog } from "./SearchDialog";
import { ThemeToggle } from "./ThemeToggle";

/** The app's top bar (spec 01 §A8): the compact lockup and "Learn", the
    nav, search and the theme switch. No account controls in phase 1. */
export function TopBar() {
  return (
    <header className="tt-topbar">
      <Link
        href="/"
        className="tt-brand"
        aria-label="Tech & Thrive Learn: home"
      >
        <BrandImage kind="compact" height={26} alt="" />
        <span className="tt-prod" aria-hidden="true">
          Learn
        </span>
      </Link>
      <PrimaryNav />
      <div className="tt-topbar-spacer" />
      <SearchDialog />
      <ThemeToggle />
    </header>
  );
}
