"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bookmark, Compass, Search, Smartphone } from "lucide-react";
import { cn } from "@/lib/cn";

const NAV_ITEMS = [
  { href: "/", label: "Explore", icon: Compass },
  { href: "/search", label: "Search", icon: Search },
  { href: "/shorts", label: "Shorts", icon: Smartphone },
  { href: "/library", label: "Library", icon: Bookmark },
] as const;

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex md:w-60 md:flex-col md:border-r md:border-border md:px-3 md:py-4">
      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-4 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted",
              )}
            >
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-4 left-4 right-4 z-40 flex rounded-xl border border-white/20 bg-background/80 backdrop-blur-xl md:hidden">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active =
          href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 py-2 text-xs",
              active ? "text-primary" : "text-muted-foreground",
            )}
          >
            <span
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full",
                active && "bg-primary text-primary-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
            </span>
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
