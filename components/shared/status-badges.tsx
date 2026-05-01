"use client";

import type { CSSProperties } from "react";
import type { ApprovalStatus, ContractStatus, UserRole, UserStatus } from "@prisma/client";

const baseStyle: CSSProperties = {
  display: "inline-block",
  padding: "0.23rem 0.55rem",
  borderRadius: "999px",
  fontSize: "0.75rem",
  fontWeight: 700,
  border: "1px solid transparent",
};

function badgeTone(value: string): { fg: string; bg: string; border: string } {
  if (["ACTIVE", "APPROVED", "SENT"].includes(value)) return { fg: "#256d2c", bg: "#edf7ee", border: "#cbe8cf" };
  if (["PENDING", "PENDING_APPROVAL", "NOT_SUBMITTED", "EXPIRING_SOON"].includes(value)) {
    return { fg: "#9a5a1b", bg: "#fff5eb", border: "#f0dcc4" };
  }
  if (["REJECTED", "FAILED", "BLOCKED", "TERMINATED", "EXPIRED", "INACTIVE"].includes(value)) {
    return { fg: "#9b2c2c", bg: "#fff3f3", border: "#f0c7c7" };
  }
  return { fg: "#5f554e", bg: "#f8f3f0", border: "#e7ded8" };
}

function toVietnameseLabel(value: string): string {
  const labels: Record<string, string> = {
    ADMIN: "Quản trị",
    STAFF: "Nhân viên",
    ACTIVE: "Hoạt động",
    INACTIVE: "Không hoạt động",
    BLOCKED: "Bị khóa",
    DRAFT: "Nháp",
    EXPIRING_SOON: "Sắp hết hạn",
    EXPIRED: "Đã hết hạn",
    TERMINATED: "Đã chấm dứt",
    NOT_SUBMITTED: "Chưa gửi duyệt",
    PENDING: "Chờ duyệt",
    APPROVED: "Đã duyệt",
    REJECTED: "Từ chối",
  };
  return labels[value] ?? value;
}

function Badge({ value }: { value: string }) {
  const tone = badgeTone(value);
  return (
    <span
      style={{
        ...baseStyle,
        color: tone.fg,
        background: tone.bg,
        borderColor: tone.border,
      }}
    >
      {toVietnameseLabel(value)}
    </span>
  );
}

export function StatusBadge({ status }: { status: ContractStatus | UserStatus }) {
  return <Badge value={status} />;
}

export function ApprovalStatusBadge({ status }: { status: ApprovalStatus }) {
  return <Badge value={status} />;
}

export function RoleBadge({ role }: { role: UserRole }) {
  return <Badge value={role} />;
}
