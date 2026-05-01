"use client";

import { SWRConfig } from "swr";
import type { ReactNode } from "react";

export function SWRProvider({ children }: { children: ReactNode }) {
  return (
    <SWRConfig
      value={{
        revalidateOnFocus: false, // Prevent redundant re-fetching when switching browser tabs
        revalidateIfStale: false, // Prevent re-fetching when mounting an already-cached key
        dedupingInterval: 10000, // Deduplicate requests with the same key in a 10-second span
        errorRetryCount: 3, // Only retry 3 times on error instead of indefinitely
      }}
    >
      {children}
    </SWRConfig>
  );
}
