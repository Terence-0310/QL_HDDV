import type { UserRole } from "@prisma/client";
import type { NextRequest } from "next/server";
import { AppError } from "@/lib/errors";
import { requireAuth } from "@/lib/auth";
import type { AuthUser } from "@/types/auth";
import type { Permission } from "@/types/permission";

const roleToPermissions: Record<UserRole, Permission[]> = {
  SUPER_ADMIN: [
    "admin.dashboard.view",
    "user.view",
    "user.manage",
    "user.delete",
    "contract.view",
    "contract.create",
    "contract.update",
    "contract.delete",
    "contract.upload",
    "contract.renew",
    "contract.submitApproval",
    "contract.approve",
    "contract.reject",
    "report.view",
    "report.export",
    "reminder.run",
    "notification.view",
  ],
  ADMIN: [
    "admin.dashboard.view",
    "user.view",
    "user.manage",
    "contract.view",
    "contract.create",
    "contract.update",
    "contract.delete",
    "contract.upload",
    "contract.renew",
    "contract.submitApproval",
    "contract.approve",
    "contract.reject",
    "report.view",
    "report.export",
    "reminder.run",
    "notification.view",
  ],
  STAFF: [
    "contract.view",
    "contract.create",
    "contract.update",
    "contract.upload",
    "contract.renew",
    "contract.submitApproval",
    "notification.view",
  ],
  USER: [
    "contract.view",
    "contract.create",
    "contract.update",
    "contract.upload",
    "contract.renew",
    "contract.submitApproval",
    "notification.view",
  ],
};

export function hasPermission(user: AuthUser, permission: Permission): boolean {
  return roleToPermissions[user.role]?.includes(permission) ?? false;
}

export async function requirePermission(request: NextRequest, permission: Permission): Promise<AuthUser> {
  const user = await requireAuth(request);
  if (!hasPermission(user, permission)) {
    throw new AppError("Missing required permission", 403, "FORBIDDEN");
  }
  return user;
}

export async function requireAnyPermission(request: NextRequest, permissions: Permission[]): Promise<AuthUser> {
  const user = await requireAuth(request);
  if (!permissions.some((permission) => hasPermission(user, permission))) {
    throw new AppError("Missing required permission", 403, "FORBIDDEN");
  }
  return user;
}
