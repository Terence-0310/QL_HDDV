import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleRouteError, successResponse } from "@/lib/api-response";
import { requirePermission } from "@/lib/permissions";

export async function GET(request: NextRequest) {
  try {
    await requirePermission(request, "admin.dashboard.view");
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "20", 10);
    const skip = (page - 1) * pageSize;

    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";

    const where: any = {};
    if (status) {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { sentTo: { contains: search } },
        { contract: { code: { contains: search } } },
        { contract: { title: { contains: search } } }
      ];
    }

    const [items, total] = await prisma.$transaction([
      prisma.reminderLog.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: "desc" },
        include: { contract: { select: { code: true, title: true } } }
      }),
      prisma.reminderLog.count({ where }),
    ]);

    return successResponse(
      "Fetched reminder logs", 
      items, 
      { page, pageSize, total, totalPages: Math.max(Math.ceil(total / pageSize), 1) }
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
