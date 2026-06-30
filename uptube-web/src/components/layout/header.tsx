"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { useTheme } from "@/contexts/theme-context";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";

export function Header() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
      <Link href="/" className="flex items-center gap-2">
        <svg
          width="32"
          height="32"
          viewBox="0 0 512 512"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M256 64C150 64 64 150 64 256s86 192 192 192 192-86 192-192S362 64 256 64zm-32 288V160l160 96-160 96z"
            fill="currentColor"
          />
        </svg>
        <span className="text-xl font-bold">Uptube</span>
      </Link>

      <div className="flex items-center gap-2">
        {user?.name ? (
          <Link href="/user/profile">
            <Avatar>
              <AvatarFallback className="bg-primary font-bold text-primary-foreground">
                {user.name[0]}
              </AvatarFallback>
            </Avatar>
          </Link>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="rounded-full"
          >
            {theme === "dark" ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>
        )}
      </div>
    </header>
  );
}
