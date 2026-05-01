"use client";

import type { ReactNode } from "react";
import { hasClientPermission } from "@/lib/permissions-client";
import type { AuthUser } from "@/types/auth";
import type { Permission } from "@/types/permission";
import { LoadingState } from "@/components/shared/ui-states";

type Props = {
  user: AuthUser | null;
  loading: boolean;
  permission: Permission;
  children: ReactNode;
};

export function PageGuard({ user, loading, permission, children }: Props) {
  if (loading) {
    return <LoadingState message="Đang tải..." />;
  }

  if (!user) {
    return (
      <div style={{ padding: "1rem", background: "#fff7ed", border: "1px solid #fed7aa", color: "#9a3412" }}>
        Bạn chưa đăng nhập.
      </div>
    );
  }

  if (!hasClientPermission(user.role, permission)) {
    return (
      <div style={{ padding: "1rem", background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b" }}>
        Bạn không có quyền truy cập trang này.
      </div>
    );
  }

  return <>{children}</>;
}
