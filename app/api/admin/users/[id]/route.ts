import { NextRequest } from "next/server";
import { handleRouteError, successResponse } from "@/lib/api-response";
import { assertCsrf } from "@/lib/csrf";
import { requirePermission } from "@/lib/permissions";
import { assertRateLimit } from "@/lib/rate-limit";
import { adminUpdateUserSchema } from "@/lib/validators/admin.validator";
import { getUserById, updateUser, deleteUser } from "@/services/admin.service";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    await requirePermission(request, "user.view");
    const { id } = await context.params;
    const data = await getUserById(id);
    return successResponse("User fetched successfully", data);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    assertRateLimit(request, "admin:users:update", { limit: 30, windowMs: 60_000 });
    assertCsrf(request);
    const authUser = await requirePermission(request, "user.manage");
    const { id } = await context.params;
    const body = await request.json();
    const parsed = adminUpdateUserSchema.parse(body);
    const data = await updateUser(id, parsed, authUser);
    return successResponse("User updated successfully", data);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    assertRateLimit(request, "admin:users:delete", { limit: 10, windowMs: 60_000 });
    assertCsrf(request);
    const authUser = await requirePermission(request, "user.delete");
    const { id } = await context.params;
    await deleteUser(id, authUser);
    return successResponse("User deleted successfully", null);
  } catch (error) {
    return handleRouteError(error);
  }
}
