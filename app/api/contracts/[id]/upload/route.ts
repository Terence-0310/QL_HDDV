import { NextRequest } from "next/server";
import { handleRouteError, successResponse } from "@/lib/api-response";
import { assertCsrf } from "@/lib/csrf";
import { requirePermission } from "@/lib/permissions";
import { AppError } from "@/lib/errors";
import { assertRateLimit } from "@/lib/rate-limit";
import { uploadContractPdf } from "@/services/upload.service";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    assertRateLimit(request, "contracts:upload", { limit: 15, windowMs: 60_000 });
    assertCsrf(request);
    const authUser = await requirePermission(request, "contract.upload");
    const { id } = await context.params;
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      throw new AppError("File is required", 400, "VALIDATION_ERROR");
    }

    const data = await uploadContractPdf(id, file, authUser);
    return successResponse("Contract PDF uploaded successfully", data);
  } catch (error) {
    return handleRouteError(error);
  }
}
