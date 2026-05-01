import { NextRequest } from "next/server";
import { contractListQuerySchema, createContractSchema } from "@/lib/validators/contract.validator";
import { handleRouteError, successResponse } from "@/lib/api-response";
import { assertCsrf } from "@/lib/csrf";
import { requirePermission } from "@/lib/permissions";
import { assertRateLimit } from "@/lib/rate-limit";
import { createContract, listContracts } from "@/services/contract.service";

export async function GET(request: NextRequest) {
  try {
    const authUser = await requirePermission(request, "contract.view");
    const parsed = contractListQuerySchema.parse({
      search: request.nextUrl.searchParams.get("search") ?? undefined,
      status: request.nextUrl.searchParams.get("status") ?? undefined,
      ownerId: request.nextUrl.searchParams.get("ownerId") ?? undefined,
      autoRenew: request.nextUrl.searchParams.get("autoRenew") ?? undefined,
      startDateFrom: request.nextUrl.searchParams.get("startDateFrom") ?? undefined,
      startDateTo: request.nextUrl.searchParams.get("startDateTo") ?? undefined,
      endDateFrom: request.nextUrl.searchParams.get("endDateFrom") ?? undefined,
      endDateTo: request.nextUrl.searchParams.get("endDateTo") ?? undefined,
      sortBy: request.nextUrl.searchParams.get("sortBy") ?? undefined,
      sortOrder: request.nextUrl.searchParams.get("sortOrder") ?? undefined,
      page: request.nextUrl.searchParams.get("page") ?? undefined,
      pageSize: request.nextUrl.searchParams.get("pageSize") ?? undefined,
    });

    const data = await listContracts(parsed, authUser);
    return successResponse("Contracts fetched successfully", data, {
      page: data.page,
      pageSize: data.pageSize,
      totalItems: data.total,
      totalPages: data.totalPages,
      sortBy: parsed.sortBy,
      sortOrder: parsed.sortOrder,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    assertRateLimit(request, "contracts:create", { limit: 30, windowMs: 60_000 });
    assertCsrf(request);
    const authUser = await requirePermission(request, "contract.create");
    const body = await request.json();
    const parsed = createContractSchema.parse(body);

    const data = await createContract(
      {
        ...parsed,
        ownerId: authUser.id,
      },
      authUser,
    );

    return successResponse("Contract created successfully", data, undefined, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
