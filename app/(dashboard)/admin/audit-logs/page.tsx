import { AuditLogsView } from "@/components/admin/audit-logs-view";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Nhật ký hệ thống",
  description: "Truy vết hoạt động",
};

export default function AuditLogsPage() {
  return <AuditLogsView />;
}
