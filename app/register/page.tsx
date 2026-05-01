"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api-client";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await apiRequest("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          name,
          email,
          password,
          confirmPassword,
        }),
      });
      setSuccessMessage("Đăng ký thành công. Đang chuyển đến trang phù hợp...");
      router.push("/");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Đăng ký thất bại");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-brand">Contract CMS</div>
        <h1 className="auth-title">Đăng ký tài khoản</h1>
        <p className="auth-subtitle">Tạo tài khoản người dùng mới để sử dụng hệ thống.</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            <span>Họ và tên</span>
            <input value={name} onChange={(event) => setName(event.target.value)} required maxLength={100} />
          </label>
          <label>
            <span>Email</span>
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" />
          </label>
          <label>
            <span>Mật khẩu</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
            />
          </label>
          <label>
            <span>Xác nhận mật khẩu</span>
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
            />
          </label>
          <button className="btn-primary" type="submit" disabled={loading} style={{ width: "100%" }}>
            {loading ? "Đang đăng ký..." : "Đăng ký"}
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

        <div style={{ marginTop: "1rem", display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
          <Link href="/login" className="btn btn-primary">Quay lại đăng nhập</Link>
          <Link href="/" className="btn">Về trang chủ</Link>
        </div>
      </section>
    </main>
  );
}
