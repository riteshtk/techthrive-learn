"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import type { IconName } from "@/components/ui/icons";

const ITEMS: { label: string; href: string; icon: IconName; match: RegExp }[] =
  [
    { label: "Home", href: "/", icon: "home", match: /^\/$/ },
    {
      label: "Learn",
      href: "/topics/",
      icon: "book",
      match: /^\/(topics|roadmaps)\//,
    },
    { label: "Review", href: "/review/", icon: "repeat", match: /^\/review\// },
  ];

/** Home, Learn and Review; the section you're in is aria-current. */
export function PrimaryNav() {
  const pathname = usePathname();
  return (
    <nav className="tt-nav" aria-label="Main">
      {ITEMS.map((item) => {
        const current = item.match.test(pathname);
        return (
          <Link
            key={item.href}
            href={item.href}
            className="tt-navlink"
            aria-current={current ? "page" : undefined}
          >
            <Icon name={item.icon} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
