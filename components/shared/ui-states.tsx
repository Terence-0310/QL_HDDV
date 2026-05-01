"use client";

export function LoadingState({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="card" style={{ padding: "1rem", color: "var(--text-muted)" }}>
      {message}
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div style={{ padding: "0.9rem", border: "1px solid #f0c7c7", background: "#fff6f6", color: "#9b2c2c", borderRadius: "var(--radius-sm)" }}>
      {message}
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div style={{ padding: "1rem", border: "1px dashed #d9c8bc", borderRadius: "var(--radius-sm)", background: "#fff", color: "var(--text-muted)" }}>
      {message}
    </div>
  );
}
