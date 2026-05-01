import { NextRequest } from "next/server";
import { handleRouteError, successResponse } from "@/lib/api-response";
import { assertCsrf } from "@/lib/csrf";
import { requirePermission } from "@/lib/permissions";
import { assertRateLimit } from "@/lib/rate-limit";
import { updateContractSchema } from "@/lib/validators/contract.validator";
import { deleteContract, getContractById, updateContract } from "@/services/contract.service";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const authUser = await requirePermission(request, "contract.view");
    const { id } = await context.params;
    const data = await getContractById(id, authUser);
    return successResponse("Contract fetched successfully", data);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    assertRateLimit(request, "contracts:update", { limit: 60, windowMs: 60_000 });
    assertCsrf(request);
    const authUser = await requirePermission(request, "contract.update");
    const { id } = await context.params;
    const body = await request.json();
    const parsed = updateContractSchema.parse(body);
    const data = await updateContract(id, parsed, authUser);
    return successResponse("Contract updated successfully", data);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    assertRateLimit(request, "contracts:delete", { limit: 20, windowMs: 60_000 });
    assertCsrf(request);
    const authUser = await requirePermission(request, "contract.delete");
    const { id } = await context.params;
    await deleteContract(id, authUser);
    return successResponse("Contract deleted successfully");
  } catch (error) {
    return handleRouteError(error);
  }
}
