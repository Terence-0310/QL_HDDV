import type { UserRole } from "@prisma/client";
import type { Permission } from "@/types/permission";

const roleToPermissions: Record<string, Permission[]> = {
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

export function hasClientPermission(role: UserRole | undefined, permission: Permission): boolean {
  if (!role) return false;
  return roleToPermissions[role]?.includes(permission) ?? false;
}
