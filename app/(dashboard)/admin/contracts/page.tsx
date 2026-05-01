import { AdminContractsView } from "@/components/admin/contracts-view";
import { Suspense } from "react";

export default function AdminContractsPage() {
  return (
    <Suspense fallback={<div style={{ padding: "2rem", textAlign: "center" }}>Đang tải dữ liệu...</div>}>
      <AdminContractsView />
    </Suspense>
  );
}
