import { hasPermission } from "@/lib/permissions";
import { hasClientPermission } from "@/lib/permissions-client";
import type { AuthUser } from "@/types/auth";

function makeUser(role: "ADMIN" | "STAFF"): AuthUser {
  return {
    id: "u1",
    name: "Test User",
    email: "test@example.com",
    role,
    status: "ACTIVE",
  };
}

describe("permissions mapping", () => {
  it("allows admin-only permissions for ADMIN", () => {
    const admin = makeUser("ADMIN");
    expect(hasPermission(admin, "user.manage")).toBe(true);
    expect(hasPermission(admin, "report.export")).toBe(true);
  });

  it("blocks admin-only permissions for STAFF", () => {
    const staff = makeUser("STAFF");
    expect(hasPermission(staff, "user.manage")).toBe(false);
    expect(hasPermission(staff, "contract.approve")).toBe(false);
    expect(hasPermission(staff, "report.export")).toBe(false);
  });

  it("keeps client permission helper consistent with server mapping intent", () => {
    expect(hasClientPermission("ADMIN", "admin.dashboard.view")).toBe(true);
    expect(hasClientPermission("STAFF", "notification.view")).toBe(true);
    expect(hasClientPermission("STAFF", "admin.dashboard.view")).toBe(false);
  });
});
