export const PERMISSIONS = [
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
] as const;

export type Permission = (typeof PERMISSIONS)[number];
