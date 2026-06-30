import { Suspense } from "react";
import ShortsPage from "./shorts-content";

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[calc(100vh-5rem)] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      }
    >
      <ShortsPage />
    </Suspense>
  );
}
