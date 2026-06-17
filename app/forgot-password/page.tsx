"use client";

import { useState } from "react";
import Link from "next/link";
import { apiRequest } from "@/lib/api-client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await apiRequest("/api/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      setSuccessMessage("Nếu email này hợp lệ trong hệ thống, bạn sẽ sớm nhận được link đổi mật khẩu.");
    } catch (e) {
      const message = e instanceof Error ? e.message : "Có lỗi xảy ra, vui lòng thử lại sau";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-brand">Contract CMS</div>
        <h1 className="auth-title">Quên mật khẩu</h1>
        <p className="auth-subtitle">Nhập email của bạn để nhận liên kết khôi phục mật khẩu.</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              autoComplete="email"
            />
          </label>

          <button className="btn-primary" type="submit" disabled={loading} style={{ width: "100%", marginTop: "0.2rem" }}>
            {loading ? "Đang gửi yêu cầu..." : "Gửi yêu cầu khôi phục"}
          </button>
        </form>

        {error ? (
          <div style={{ marginTop: "0.75rem", padding: "0.65rem", border: "1px solid #f0c7c7", borderRadius: "var(--radius-sm)", background: "#fff6f6", color: "#9b2c2c" }}>
            {error}
          </div>
        ) : null}

        {successMessage ? (
          <div style={{ marginTop: "0.75rem", padding: "0.65rem", border: "1px solid #cbe8cf", borderRadius: "var(--radius-sm)", background: "#edf7ee", color: "#256d2c" }}>
            {successMessage}
          </div>
        ) : null}

        <p style={{ margin: "1rem 0 0", color: "var(--text-muted)", fontSize: "0.9rem", textAlign: "center" }}>
          Nhớ lại mật khẩu? <Link href="/login" className="link-inline">Đăng nhập ngay</Link>
        </p>
      </section>
    </main>
  );
}
