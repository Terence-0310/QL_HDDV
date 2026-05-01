"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api-client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@example.com");
  const [password, setPassword] = useState("Admin@12345");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await apiRequest("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      setSuccessMessage("Đăng nhập thành công, đang chuyển trang...");
      window.location.href = "/";
    } catch (e) {
      const message = e instanceof Error ? e.message : "Đăng nhập thất bại";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-brand">Contract CMS</div>
        <h1 className="auth-title">Đăng nhập hệ thống</h1>
        <p className="auth-subtitle">Đăng nhập để truy cập khu vực quản trị nội bộ.</p>

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

        <label>
          <span>Mật khẩu</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            autoComplete="current-password"
          />
        </label>

        <button className="btn-primary" type="submit" disabled={loading} style={{ width: "100%", marginTop: "0.2rem" }}>
          {loading ? "Đang đăng nhập..." : "Đăng nhập"}
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

        <div className="hint-box">
          Tài khoản demo: <strong>admin@example.com</strong> / <strong>Admin@12345</strong>
        </div>
        <p style={{ margin: "0.8rem 0 0", color: "var(--text-muted)", fontSize: "0.9rem" }}>
          Chưa có tài khoản? <Link href="/register" className="link-inline">Đăng ký</Link>
        </p>
      </section>
    </main>
  );
}
