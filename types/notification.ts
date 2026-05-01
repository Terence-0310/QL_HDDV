import type { NotificationEntityType, NotificationType } from "@prisma/client";

export type NotificationListQuery = {
  page?: number;
  pageSize?: number;
  isRead?: boolean;
};

export type NotificationListItem = {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  readAt: Date | null;
  relatedEntityType: NotificationEntityType | null;
  relatedEntityId: string | null;
  createdAt: Date;
};
