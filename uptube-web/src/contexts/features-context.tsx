"use client";

import { createContext, useContext, useState } from "react";
import useSWR from "swr";
import { get } from "@/lib/api";
import { Button } from "@/components/ui/button";

type FeaturesContextType = {
  data: Record<string, unknown> | undefined;
  mutate: () => void;
};

const FeaturesContext = createContext<FeaturesContextType>({
  data: undefined,
  mutate: () => {},
});

function ServerMaintenance({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-2xl font-bold">Service Unavailable</h1>
      <p className="text-muted-foreground">
        Unable to connect to the server. Please try again.
      </p>
      <Button onClick={onRetry}>Retry</Button>
    </div>
  );
}

export function FeaturesProvider({ children }: { children: React.ReactNode }) {
  const [failed, setFailed] = useState(false);
  const { data, mutate } = useSWR(
    "/public/features",
    (url) => get({ endpoint: url }),
    {
      refreshInterval: 0,
      onSuccess: (d) => setFailed(!d),
      onError: () => setFailed(true),
    },
  );

  if (failed) return <ServerMaintenance onRetry={() => mutate()} />;
  return (
    <FeaturesContext.Provider value={{ data, mutate }}>
      {children}
    </FeaturesContext.Provider>
  );
}

export function useFeatures() {
  return useContext(FeaturesContext);
}
