"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { apiRequest } from "@/lib/api-client";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const id = searchParams.get("id");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!token || !id) {
    return (
      <div style={{ textAlign: "center", color: "#9b2c2c", padding: "1rem" }}>
        Đường dẫn không hợp lệ. Vui lòng kiểm tra lại email của bạn.
      </div>
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (newPassword !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }
    if (newPassword.length < 8) {
      setError("Mật khẩu phải chứa ít nhất 8 ký tự.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await apiRequest("/api/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ id, token, newPassword }),
      });
      setSuccess(true);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Có lỗi xảy ra, vui lòng thử lại sau";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div style={{ textAlign: "center", padding: "1rem" }}>
        <h3 style={{ color: "#256d2c", marginBottom: "1rem" }}>Đổi mật khẩu thành công!</h3>
        <p style={{ color: "var(--text-muted)", marginBottom: "1.5rem" }}>
          Mật khẩu của bạn đã được cập nhật thành công. Bạn có thể sử dụng mật khẩu mới để đăng nhập.
        </p>
        <Link href="/login" className="btn-primary" style={{ display: "inline-block", textDecoration: "none" }}>
          Đăng nhập ngay
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="auth-form">
      <label>
        <span>Mật khẩu mới</span>
        <input
          type="password"
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
          required
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
          autoComplete="new-password"
        />
      </label>

      <button className="btn-primary" type="submit" disabled={loading} style={{ width: "100%", marginTop: "0.2rem" }}>
        {loading ? "Đang xử lý..." : "Cập nhật mật khẩu"}
      </button>

      {error ? (
        <div style={{ marginTop: "0.75rem", padding: "0.65rem", border: "1px solid #f0c7c7", borderRadius: "var(--radius-sm)", background: "#fff6f6", color: "#9b2c2c" }}>
          {error}
        </div>
      ) : null}
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-brand">Contract CMS</div>
        <h1 className="auth-title">Đặt lại mật khẩu</h1>
        <p className="auth-subtitle">Vui lòng nhập mật khẩu mới cho tài khoản của bạn.</p>
        <Suspense fallback={<div style={{ textAlign: "center", padding: "2rem" }}>Đang tải...</div>}>
          <ResetPasswordForm />
        </Suspense>
      </section>
    </main>
  );
}
