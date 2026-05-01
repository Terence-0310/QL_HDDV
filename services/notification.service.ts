import { NotificationEntityType, NotificationType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import { createAuditLog } from "@/services/audit.service";
import type { AuthUser } from "@/types/auth";
import type { NotificationListQuery } from "@/types/notification";

export async function createNotification(input: {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedEntityType?: NotificationEntityType;
  relatedEntityId?: string;
}) {
  const notification = await prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      message: input.message,
      relatedEntityType: input.relatedEntityType,
      relatedEntityId: input.relatedEntityId,
    },
  });

  await createAuditLog({
    userId: input.userId,
    action: "CREATE_NOTIFICATION",
    entityType: "NOTIFICATION",
    entityId: notification.id,
    metadata: {
      type: notification.type,
      relatedEntityType: notification.relatedEntityType,
      relatedEntityId: notification.relatedEntityId,
    },
  });

  return notification;
}

export async function listNotifications(query: NotificationListQuery, authUser: AuthUser) {
  const page = Math.max(query.page ?? 1, 1);
  const pageSize = Math.min(Math.max(query.pageSize ?? 20, 1), 100);
  const skip = (page - 1) * pageSize;

  const where = {
    userId: authUser.id,
    isRead: query.isRead,
  };

  const [items, total] = await prisma.$transaction([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.notification.count({ where }),
  ]);

  return {
    items,
    page,
    pageSize,
    total,
    totalPages: Math.max(Math.ceil(total / pageSize), 1),
  };
}

export async function getUnreadCount(authUser: AuthUser) {
  const unreadCount = await prisma.notification.count({
    where: {
      userId: authUser.id,
      isRead: false,
    },
  });
  return { unreadCount };
}

export async function markAsRead(notificationId: string, authUser: AuthUser) {
  const existing = await prisma.notification.findUnique({
    where: { id: notificationId },
  });

  if (!existing) {
    throw new AppError("Notification not found", 404, "NOT_FOUND");
  }

  if (existing.userId !== authUser.id) {
    throw new AppError("You do not have access to this notification", 403, "FORBIDDEN");
  }

  if (existing.isRead) {
    return existing;
  }

  return prisma.notification.update({
    where: { id: notificationId },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });
}

export async function markAllAsRead(authUser: AuthUser) {
  const result = await prisma.notification.updateMany({
    where: {
      userId: authUser.id,
      isRead: false,
    },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });

  await createAuditLog({
    userId: authUser.id,
    action: "MARK_ALL_NOTIFICATIONS_AS_READ",
    entityType: "NOTIFICATION",
    entityId: authUser.id,
    metadata: {
      updatedCount: result.count,
    },
  });

  return { updatedCount: result.count };
}
