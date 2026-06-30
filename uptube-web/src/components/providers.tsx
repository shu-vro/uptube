"use client";

import { FeaturesProvider } from "@/contexts/features-context";
import { AuthProvider } from "@/contexts/auth-context";
import { ThemeProvider } from "@/contexts/theme-context";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <FeaturesProvider>
        <AuthProvider>{children}</AuthProvider>
      </FeaturesProvider>
    </ThemeProvider>
  );
}
