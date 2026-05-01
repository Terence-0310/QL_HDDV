import { NextRequest } from "next/server";
import { handleRouteError, successResponse } from "@/lib/api-response";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    // Only admins should see the system audit logs
    await requirePermission(request, "admin.dashboard.view");

    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(parseInt(searchParams.get("page") || "1", 10), 1);
    const pageSize = Math.min(Math.max(parseInt(searchParams.get("pageSize") || "20", 10), 1), 100);
    const search = searchParams.get("search") || undefined;
    const action = searchParams.get("action") || undefined;

    const skip = (page - 1) * pageSize;

    const where: Prisma.AuditLogWhereInput = {
      action: action ? { equals: action } : undefined,
      OR: search
        ? [
            { entityId: { contains: search } },
            { entityType: { contains: search } },
            { user: { name: { contains: search } } },
            { user: { email: { contains: search } } },
          ]
        : undefined,
    };

    const [items, total] = await prisma.$transaction([
      prisma.auditLog.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return successResponse("Audit logs fetched successfully", items, {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize) || 1,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
