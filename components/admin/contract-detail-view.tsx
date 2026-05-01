"use client";

import useSWR from "swr";
import Link from "next/link";
import { ArrowLeft, FileText, Calendar, Building, DollarSign, Clock, CheckCircle, ShieldAlert } from "lucide-react";
import { apiRequestEnvelope, apiRequest } from "@/lib/api-client";
import { ApprovalStatusBadge, StatusBadge } from "@/components/shared/status-badges";
import { EmptyState, ErrorState, LoadingState } from "@/components/shared/ui-states";
import { PageGuard } from "@/components/shared/page-guard";
import { useCurrentUser } from "@/hooks/use-current-user";

type ContractDetail = {
  id: string;
  code: string;
  title: string;
  partnerName: string;
  partnerEmail?: string;
  description?: string;
  value: number;
  startDate: string;
  endDate: string;
  signedDate?: string;
  status: any;
  approvalStatus: any;
  autoRenew: boolean;
  reminderOffsets: string;
  owner: { name: string; email: string };
  createdAt: string;
  updatedAt: string;
};

export function ContractDetailView({ contractId }: { contractId: string }) {
  const { user, loading: userLoading } = useCurrentUser();

  const { data: contract, error, isLoading } = useSWR<ContractDetail>(
    `/api/contracts/${contractId}`,
    apiRequest
  );

  const displayError = error instanceof Error ? error.message : null;

  return (
    <PageGuard user={user} loading={userLoading} permission="contract.view">
      <div className="page-stack" style={{ maxWidth: "1000px", margin: "0 auto" }}>
        
        <div style={{ marginBottom: "1rem" }}>
          <Link href="/admin/contracts" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", color: "var(--text-muted)", textDecoration: "none", fontWeight: 500, transition: "color 0.2s" }} className="hover-opacity">
            <ArrowLeft size={18} /> Quay lại danh sách
          </Link>
        </div>

        {isLoading && <LoadingState />}
        {displayError && <ErrorState message={displayError} />}
        {!isLoading && !displayError && !contract && <EmptyState message="Không tìm thấy hợp đồng." />}
        
        {!isLoading && !displayError && contract && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            
            {/* Header Card */}
            <div className="card" style={{ padding: "2rem", display: "flex", flexDirection: "column", gap: "1.5rem", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, right: 0, width: "150px", height: "150px", background: "radial-gradient(circle, var(--primary-soft) 0%, transparent 70%)", opacity: 0.5, transform: "translate(30%, -30%)" }} />
              
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
                    <span style={{ background: "var(--primary-soft)", color: "var(--primary)", padding: "0.25rem 0.75rem", borderRadius: "20px", fontWeight: 600, fontSize: "0.85rem" }}>
                      {contract.code}
                    </span>
                    <StatusBadge status={contract.status} />
                    <ApprovalStatusBadge status={contract.approvalStatus} />
                  </div>
                  <h1 style={{ margin: "0 0 0.5rem 0", fontSize: "1.8rem", color: "var(--text)" }}>
                    {contract.title}
                  </h1>
                  <p style={{ margin: 0, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <Building size={16} /> Đối tác: <strong style={{ color: "var(--text)" }}>{contract.partnerName}</strong>
                    {contract.partnerEmail && ` (${contract.partnerEmail})`}
                  </p>
                </div>
                
                <div style={{ textAlign: "right", background: "var(--bg)", padding: "1rem", borderRadius: "12px", border: "1px solid var(--border)" }}>
                  <div style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "0.25rem" }}>Giá trị hợp đồng</div>
                  <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--primary)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <DollarSign size={24} /> {contract.value.toLocaleString('vi-VN')} VND
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem" }}>
              
              {/* Timeline Card */}
              <div className="card" style={{ padding: "1.5rem" }}>
                <h3 style={{ margin: "0 0 1.25rem 0", display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "1.1rem" }}>
                  <Calendar size={18} color="var(--primary)" /> Thời hạn hợp đồng
                </h3>
                
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "0.75rem", borderBottom: "1px solid var(--border)" }}>
                    <span style={{ color: "var(--text-muted)" }}>Ngày bắt đầu</span>
                    <strong style={{ color: "var(--text)" }}>{new Date(contract.startDate).toLocaleDateString('vi-VN')}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "0.75rem", borderBottom: "1px solid var(--border)" }}>
                    <span style={{ color: "var(--text-muted)" }}>Ngày kết thúc</span>
                    <strong style={{ color: "var(--text)" }}>{new Date(contract.endDate).toLocaleDateString('vi-VN')}</strong>
                  </div>
                  {contract.signedDate && (
                    <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "0.75rem", borderBottom: "1px solid var(--border)" }}>
                      <span style={{ color: "var(--text-muted)" }}>Ngày ký</span>
                      <strong style={{ color: "var(--text)" }}>{new Date(contract.signedDate).toLocaleDateString('vi-VN')}</strong>
                    </div>
                  )}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.5rem", background: "var(--bg)", padding: "1rem", borderRadius: "8px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <ShieldAlert size={16} color="var(--primary)" /> 
                      <span style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>Tự động gia hạn</span>
                    </div>
                    {contract.autoRenew ? (
                      <span style={{ display: "flex", alignItems: "center", gap: "0.25rem", color: "var(--success)", fontWeight: 600, fontSize: "0.95rem" }}>
                        <CheckCircle size={16} /> Có
                      </span>
                    ) : (
                      <span style={{ color: "var(--text-muted)", fontWeight: 500, fontSize: "0.95rem" }}>Không</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Info Card */}
              <div className="card" style={{ padding: "1.5rem" }}>
                <h3 style={{ margin: "0 0 1.25rem 0", display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "1.1rem" }}>
                  <FileText size={18} color="var(--primary)" /> Thông tin quản lý
                </h3>
                
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "0.75rem", borderBottom: "1px solid var(--border)" }}>
                    <span style={{ color: "var(--text-muted)" }}>Người phụ trách</span>
                    <div style={{ textAlign: "right" }}>
                      <strong style={{ color: "var(--text)", display: "block" }}>{contract.owner.name}</strong>
                      <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>{contract.owner.email}</span>
                    </div>
                  </div>
                  
                  <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "0.75rem", borderBottom: "1px solid var(--border)" }}>
                    <span style={{ color: "var(--text-muted)" }}>Ngày tạo hệ thống</span>
                    <strong style={{ color: "var(--text)" }}>{new Date(contract.createdAt).toLocaleDateString('vi-VN')}</strong>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "0.75rem", borderBottom: "1px solid var(--border)" }}>
                    <span style={{ color: "var(--text-muted)" }}>Cập nhật lần cuối</span>
                    <strong style={{ color: "var(--text)" }}>{new Date(contract.updatedAt).toLocaleString('vi-VN')}</strong>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}
      </div>
    </PageGuard>
  );
}
