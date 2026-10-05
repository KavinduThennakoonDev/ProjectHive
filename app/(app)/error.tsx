"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/shared/states";

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="rounded-xl border bg-card">
      <ErrorState
        title="This page could not be loaded"
        message="There was a problem loading the data. Check the database connection and try again."
        onRetry={reset}
      />
    </div>
  );
}
