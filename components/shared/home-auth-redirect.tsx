"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api-client";
import type { AuthUser } from "@/types/auth";

export function HomeAuthRedirect() {
  const router = useRouter();

  useEffect(() => {
    let mounted = true;
    void apiRequest<AuthUser>("/api/auth/me")
      .then((user) => {
        if (!mounted || !user) return;
        router.replace("/admin/dashboard");
      })
      .catch(() => undefined);

    return () => {
      mounted = false;
    };
  }, [router]);

  return null;
}
