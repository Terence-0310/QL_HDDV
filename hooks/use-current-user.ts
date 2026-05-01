"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api-client";
import type { AuthUser } from "@/types/auth";

type UseCurrentUserResult = {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

let cachedUser: AuthUser | null = null;
let cacheHydrated = false;
let inflightRequest: Promise<AuthUser | null> | null = null;

async function fetchCurrentUser(): Promise<AuthUser | null> {
  if (inflightRequest) return inflightRequest;
  inflightRequest = apiRequest<AuthUser>("/api/auth/me")
    .then((data) => {
      cachedUser = data;
      cacheHydrated = true;
      return data;
    })
    .catch(() => {
      cachedUser = null;
      cacheHydrated = true;
      return null;
    })
    .finally(() => {
      inflightRequest = null;
    });

  return inflightRequest;
}

export function useCurrentUser(): UseCurrentUserResult {
  const [user, setUser] = useState<AuthUser | null>(cachedUser);
  const [loading, setLoading] = useState(!cacheHydrated);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchCurrentUser();
      setUser(data);
      if (!data) {
        setError("Failed to fetch current user");
      }
    } catch (e) {
      setUser(null);
      setError(e instanceof Error ? e.message : "Failed to fetch current user");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (cacheHydrated) {
      setUser(cachedUser);
      setLoading(false);
      return;
    }
    void refresh();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { user, loading, error, refresh };
}
