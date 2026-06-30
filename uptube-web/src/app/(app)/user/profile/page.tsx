"use client";

import Link from "next/link";
import { ArrowLeft, Moon, Sun } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useTheme } from "@/contexts/theme-context";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="px-4 py-4">
      <Link
        href="/"
        className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Link>

      <h1 className="mb-4 text-2xl font-bold">Profile</h1>

      {user && (
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
            {user.name?.[0] ?? user.email[0]}
          </div>
          <div>
            <p className="font-semibold">{user.name}</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>
      )}

      <Card className="overflow-hidden">
        <button
          type="button"
          onClick={toggleTheme}
          className="flex w-full items-center justify-between px-4 py-3 hover:bg-muted"
        >
          <span>Toggle Theme</span>
          {theme === "dark" ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
        </button>
        <Separator />
        <Button
          variant="ghost"
          className="w-full justify-start rounded-none px-4"
          onClick={logout}
        >
          Log Out
        </Button>
      </Card>
    </div>
  );
}
