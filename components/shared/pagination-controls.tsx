"use client";

type Props = {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
};

export function PaginationControls({ page, totalPages, onChange }: Props) {
  const maxPages = Math.max(totalPages, 1);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.8rem", justifyContent: "flex-end" }}>
      <button disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label="Trang trước">
        Trước
      </button>
      <span style={{ color: "var(--text-muted)", fontSize: "0.92rem", minWidth: "100px", textAlign: "center" }}>
        Trang {page} / {maxPages}
      </span>
      <button disabled={page >= maxPages} onClick={() => onChange(page + 1)} aria-label="Trang sau">
        Sau
      </button>
    </div>
  );
}
