"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import { apiRequest } from "@/lib/api-client";
import { Building2, Bell, Shield, Database, Save, Server, Globe, Key, RefreshCw } from "lucide-react";

type TabId = "general" | "reminders" | "security" | "system";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("general");
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  
  const { data: settingsData, mutate, isLoading } = useSWR<any>("/api/admin/settings", apiRequest);
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    if (settingsData) {
      setFormData(settingsData);
    }
  }, [settingsData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as any;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData((prev: any) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaved(false);
    try {
      await apiRequest("/api/admin/settings", {
        method: "POST",
        body: JSON.stringify(formData)
      });
      await mutate(formData, false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      console.error(e);
      alert("Lỗi khi lưu cấu hình!");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || !settingsData) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px", color: "var(--text-muted)" }}>
        <RefreshCw size={24} style={{ animation: "spin 1s linear infinite", marginRight: "0.5rem" }} /> Đang tải cấu hình...
        <style dangerouslySetInnerHTML={{__html: `@keyframes spin { 100% { transform: rotate(360deg); } }`}} />
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: "2rem" }}>
      <header style={{ marginBottom: "2rem" }}>
        <h1 style={{ margin: "0 0 0.5rem 0", fontSize: "1.6rem", color: "var(--text)" }}>Cài đặt hệ thống</h1>
        <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.95rem" }}>
          Quản lý các cấu hình chung, thông báo, và bảo mật của toàn bộ hệ thống
        </p>
      </header>

      <div style={{ display: "flex", gap: "2rem", alignItems: "flex-start", flexWrap: "wrap" }}>
        {/* SIDEBAR TABS */}
        <aside style={{ width: "240px", flexShrink: 0, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", overflow: "hidden" }}>
          <nav style={{ display: "flex", flexDirection: "column" }}>
            <button 
              onClick={() => setActiveTab("general")}
              style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "1rem 1.25rem", border: "none", background: activeTab === "general" ? "var(--primary-soft)" : "transparent", color: activeTab === "general" ? "var(--primary)" : "var(--text)", fontWeight: activeTab === "general" ? 600 : 500, cursor: "pointer", textAlign: "left", transition: "all 0.2s ease", borderLeft: `3px solid ${activeTab === "general" ? "var(--primary)" : "transparent"}` }}
            >
              <Building2 size={18} /> Thông tin chung
            </button>
            <button 
              onClick={() => setActiveTab("reminders")}
              style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "1rem 1.25rem", border: "none", background: activeTab === "reminders" ? "var(--primary-soft)" : "transparent", color: activeTab === "reminders" ? "var(--primary)" : "var(--text)", fontWeight: activeTab === "reminders" ? 600 : 500, cursor: "pointer", textAlign: "left", transition: "all 0.2s ease", borderLeft: `3px solid ${activeTab === "reminders" ? "var(--primary)" : "transparent"}` }}
            >
              <Bell size={18} /> Cảnh báo & Nhắc hạn
            </button>
            <button 
              onClick={() => setActiveTab("security")}
              style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "1rem 1.25rem", border: "none", background: activeTab === "security" ? "var(--primary-soft)" : "transparent", color: activeTab === "security" ? "var(--primary)" : "var(--text)", fontWeight: activeTab === "security" ? 600 : 500, cursor: "pointer", textAlign: "left", transition: "all 0.2s ease", borderLeft: `3px solid ${activeTab === "security" ? "var(--primary)" : "transparent"}` }}
            >
              <Shield size={18} /> Phân quyền & Bảo mật
            </button>
            <button 
              onClick={() => setActiveTab("system")}
              style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "1rem 1.25rem", border: "none", background: activeTab === "system" ? "var(--primary-soft)" : "transparent", color: activeTab === "system" ? "var(--primary)" : "var(--text)", fontWeight: activeTab === "system" ? 600 : 500, cursor: "pointer", textAlign: "left", transition: "all 0.2s ease", borderLeft: `3px solid ${activeTab === "system" ? "var(--primary)" : "transparent"}` }}
            >
              <Database size={18} /> Tích hợp & Sao lưu
            </button>
          </nav>
        </aside>

        {/* CONTENT AREA */}
        <section style={{ flex: 1, minWidth: "300px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: "2rem" }}>
          
          {activeTab === "general" && (
            <div className="tab-pane fade-in">
              <h2 style={{ fontSize: "1.2rem", fontWeight: 600, color: "var(--text)", marginTop: 0, marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Building2 size={20} color="var(--primary)" /> Thông tin Doanh nghiệp
              </h2>
              
              <div style={{ display: "grid", gap: "1.5rem" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "var(--text)", marginBottom: "0.5rem" }}>Tên tổ chức / Công ty</label>
                    <input type="text" name="companyName" value={formData.companyName || ""} onChange={handleChange} style={{ width: "100%", padding: "0.6rem 1rem", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--bg)", fontSize: "0.95rem" }} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "var(--text)", marginBottom: "0.5rem" }}>Mã số thuế</label>
                    <input type="text" name="taxCode" value={formData.taxCode || ""} onChange={handleChange} style={{ width: "100%", padding: "0.6rem 1rem", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--bg)", fontSize: "0.95rem" }} />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "var(--text)", marginBottom: "0.5rem" }}>Email liên hệ mặc định</label>
                    <input type="email" name="email" value={formData.email || ""} onChange={handleChange} style={{ width: "100%", padding: "0.6rem 1rem", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--bg)", fontSize: "0.95rem" }} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "var(--text)", marginBottom: "0.5rem" }}>Số điện thoại</label>
                    <input type="text" name="phone" value={formData.phone || ""} onChange={handleChange} style={{ width: "100%", padding: "0.6rem 1rem", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--bg)", fontSize: "0.95rem" }} />
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "var(--text)", marginBottom: "0.5rem" }}>Địa chỉ trụ sở</label>
                  <input type="text" name="address" value={formData.address || ""} onChange={handleChange} style={{ width: "100%", padding: "0.6rem 1rem", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--bg)", fontSize: "0.95rem" }} />
                </div>
                
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "var(--text)", marginBottom: "0.5rem" }}>Logo hệ thống</label>
                  <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
                    <div style={{ width: "80px", height: "80px", borderRadius: "12px", background: "var(--bg)", border: "2px dashed var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, color: "var(--text-muted)", fontSize: "1.5rem" }}>
                      ABC
                    </div>
                    <button style={{ padding: "0.5rem 1rem", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "8px", cursor: "pointer", fontWeight: 500 }}>
                      Thay đổi logo
                    </button>
                    <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Hỗ trợ JPG, PNG. Tối đa 2MB.</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "reminders" && (
            <div className="tab-pane fade-in">
              <h2 style={{ fontSize: "1.2rem", fontWeight: 600, color: "var(--text)", marginTop: 0, marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Bell size={20} color="var(--primary)" /> Cấu hình Nhắc hạn Hợp đồng
              </h2>
              
              <div style={{ display: "grid", gap: "2rem" }}>
                <div style={{ padding: "1.5rem", background: "var(--bg)", borderRadius: "8px", border: "1px solid var(--border)" }}>
                  <h4 style={{ margin: "0 0 1rem 0", fontSize: "0.95rem", fontWeight: 600 }}>Cột mốc nhắc nhở mặc định</h4>
                  <p style={{ margin: "0 0 1.5rem 0", fontSize: "0.85rem", color: "var(--text-muted)" }}>
                    Hệ thống sẽ tự động gửi email/thông báo cho các bên liên quan theo các cột mốc trước ngày hết hạn hợp đồng.
                  </p>
                  
                  <div style={{ display: "flex", gap: "1rem", alignItems: "center", marginBottom: "1rem" }}>
                    <input type="checkbox" name="r30" checked={!!formData.r30} onChange={handleChange} id="r30" style={{ accentColor: "var(--primary)", width: "16px", height: "16px" }} />
                    <label htmlFor="r30" style={{ fontSize: "0.95rem" }}>Trước 30 ngày (Khởi động quy trình đánh giá)</label>
                  </div>
                  <div style={{ display: "flex", gap: "1rem", alignItems: "center", marginBottom: "1rem" }}>
                    <input type="checkbox" name="r15" checked={!!formData.r15} onChange={handleChange} id="r15" style={{ accentColor: "var(--primary)", width: "16px", height: "16px" }} />
                    <label htmlFor="r15" style={{ fontSize: "0.95rem" }}>Trước 15 ngày (Nhắc nhở chuẩn bị hồ sơ)</label>
                  </div>
                  <div style={{ display: "flex", gap: "1rem", alignItems: "center", marginBottom: "1rem" }}>
                    <input type="checkbox" name="r7" checked={!!formData.r7} onChange={handleChange} id="r7" style={{ accentColor: "var(--primary)", width: "16px", height: "16px" }} />
                    <label htmlFor="r7" style={{ fontSize: "0.95rem" }}>Trước 7 ngày (Cảnh báo khẩn cấp)</label>
                  </div>
                  <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                    <input type="checkbox" name="r0" checked={!!formData.r0} onChange={handleChange} id="r0" style={{ accentColor: "var(--primary)", width: "16px", height: "16px" }} />
                    <label htmlFor="r0" style={{ fontSize: "0.95rem", color: "var(--danger)", fontWeight: 500 }}>Vào ngày hết hạn (Chấm dứt hoặc tự động gia hạn)</label>
                  </div>
                </div>

                <div>
                  <h4 style={{ margin: "0 0 0.5rem 0", fontSize: "0.95rem", fontWeight: 600 }}>Tần suất gửi lại nếu thất bại (Retry Policy)</h4>
                  <select name="retryPolicy" value={formData.retryPolicy || "1"} onChange={handleChange} style={{ width: "100%", maxWidth: "400px", padding: "0.6rem 1rem", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--bg)", fontSize: "0.95rem" }}>
                    <option value="1">Thử lại 3 lần, mỗi lần cách nhau 1 giờ</option>
                    <option value="2">Thử lại 5 lần, mỗi lần cách nhau 30 phút</option>
                    <option value="3">Không thử lại</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {activeTab === "security" && (
            <div className="tab-pane fade-in">
              <h2 style={{ fontSize: "1.2rem", fontWeight: 600, color: "var(--text)", marginTop: 0, marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Shield size={20} color="var(--primary)" /> Bảo mật Hệ thống
              </h2>
              
              <div style={{ display: "grid", gap: "1.5rem" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1.25rem", background: "var(--bg)", borderRadius: "8px", border: "1px solid var(--border)" }}>
                  <div>
                    <h4 style={{ margin: "0 0 0.25rem 0", fontSize: "0.95rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <Key size={16} /> Chính sách mật khẩu mạnh
                    </h4>
                    <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-muted)" }}>Bắt buộc mật khẩu có chữ hoa, chữ thường, số và ký tự đặc biệt (tối thiểu 8 ký tự).</p>
                  </div>
                  <label style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
                    <input type="checkbox" name="strongPassword" checked={!!formData.strongPassword} onChange={handleChange} style={{ display: "none" }} />
                    <div style={{ position: "relative", width: "44px", height: "24px", background: formData.strongPassword ? "var(--success)" : "var(--text-muted)", borderRadius: "12px", transition: "0.3s" }}>
                      <div style={{ position: "absolute", top: "2px", left: formData.strongPassword ? "22px" : "2px", width: "20px", height: "20px", background: "white", borderRadius: "50%", boxShadow: "0 2px 4px rgba(0,0,0,0.2)", transition: "0.3s" }}></div>
                    </div>
                  </label>
                </div>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1.25rem", background: "var(--bg)", borderRadius: "8px", border: "1px solid var(--border)" }}>
                  <div>
                    <h4 style={{ margin: "0 0 0.25rem 0", fontSize: "0.95rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <Shield size={16} /> Xác thực hai yếu tố (2FA)
                    </h4>
                    <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-muted)" }}>Bắt buộc tất cả tài khoản Admin phải bật xác thực 2 bước.</p>
                  </div>
                  <label style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
                    <input type="checkbox" name="require2FA" checked={!!formData.require2FA} onChange={handleChange} style={{ display: "none" }} />
                    <div style={{ position: "relative", width: "44px", height: "24px", background: formData.require2FA ? "var(--success)" : "var(--text-muted)", borderRadius: "12px", transition: "0.3s" }}>
                      <div style={{ position: "absolute", top: "2px", left: formData.require2FA ? "22px" : "2px", width: "20px", height: "20px", background: "white", borderRadius: "50%", boxShadow: "0 2px 4px rgba(0,0,0,0.2)", transition: "0.3s" }}></div>
                    </div>
                  </label>
                </div>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1.25rem", background: "var(--bg)", borderRadius: "8px", border: "1px solid var(--border)" }}>
                  <div>
                    <h4 style={{ margin: "0 0 0.25rem 0", fontSize: "0.95rem" }}>Thời gian Timeout phiên đăng nhập</h4>
                    <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-muted)" }}>Tự động đăng xuất sau một khoảng thời gian không hoạt động.</p>
                  </div>
                  <select name="sessionTimeout" value={formData.sessionTimeout || "3"} onChange={handleChange} style={{ padding: "0.5rem", borderRadius: "6px", border: "1px solid var(--border)", background: "var(--surface)" }}>
                    <option value="1">15 phút</option>
                    <option value="2">30 phút</option>
                    <option value="3">1 giờ</option>
                    <option value="4">4 giờ</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {activeTab === "system" && (
            <div className="tab-pane fade-in">
              <h2 style={{ fontSize: "1.2rem", fontWeight: 600, color: "var(--text)", marginTop: 0, marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Database size={20} color="var(--primary)" /> Dữ liệu & Tích hợp
              </h2>
              
              <div style={{ display: "grid", gap: "1.5rem" }}>
                <div style={{ border: "1px solid var(--border)", borderRadius: "8px", overflow: "hidden" }}>
                  <div style={{ padding: "1rem 1.5rem", background: "var(--bg)", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h4 style={{ margin: 0, fontSize: "0.95rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <Server size={18} /> Cấu hình máy chủ Email (SMTP)
                    </h4>
                    <span style={{ fontSize: "0.75rem", padding: "0.2rem 0.6rem", background: "var(--success)", color: "white", borderRadius: "12px", fontWeight: 600 }}>Đã kết nối</span>
                  </div>
                  <div style={{ padding: "1.5rem", background: "var(--surface)", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}>Máy chủ (Host)</label>
                      <input type="text" name="smtpHost" value={formData.smtpHost || ""} onChange={handleChange} style={{ width: "100%", padding: "0.5rem", borderRadius: "6px", border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text)", fontSize: "0.9rem" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}>Cổng (Port)</label>
                      <input type="text" name="smtpPort" value={formData.smtpPort || ""} onChange={handleChange} style={{ width: "100%", padding: "0.5rem", borderRadius: "6px", border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text)", fontSize: "0.9rem" }} />
                    </div>
                  </div>
                </div>

                <div style={{ border: "1px solid var(--border)", borderRadius: "8px", overflow: "hidden" }}>
                  <div style={{ padding: "1rem 1.5rem", background: "var(--bg)", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h4 style={{ margin: "0", fontSize: "0.95rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <Globe size={18} /> Lưu trữ đám mây (S3 / Cloudinary)
                    </h4>
                    <span style={{ fontSize: "0.75rem", padding: "0.2rem 0.6rem", background: "var(--text-muted)", color: "white", borderRadius: "12px", fontWeight: 600 }}>Chưa cấu hình</span>
                  </div>
                  <div style={{ padding: "1.5rem", background: "var(--surface)" }}>
                    <p style={{ margin: "0 0 1rem 0", fontSize: "0.85rem", color: "var(--text-muted)" }}>
                      Sử dụng lưu trữ đám mây giúp giảm tải cho server chính và đảm bảo an toàn cho các file hợp đồng đính kèm.
                    </p>
                    <button style={{ padding: "0.5rem 1rem", background: "var(--primary-soft)", color: "var(--primary)", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: 600, fontSize: "0.85rem" }}>
                      Thiết lập kết nối S3
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div style={{ marginTop: "2rem", paddingTop: "1.5rem", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "1rem" }}>
            {saved && <span style={{ color: "var(--success)", fontSize: "0.9rem", fontWeight: 500, animation: "fadeIn 0.3s" }}>Cập nhật thành công!</span>}
            <button 
              onClick={handleSave}
              disabled={isSaving}
              style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.75rem 1.5rem", background: "var(--primary)", color: "white", border: "none", borderRadius: "8px", fontWeight: 600, fontSize: "0.95rem", cursor: isSaving ? "not-allowed" : "pointer", opacity: isSaving ? 0.7 : 1, transition: "0.2s" }}
            >
              {isSaving ? (
                <>Đang lưu...</>
              ) : (
                <><Save size={18} /> Lưu thay đổi</>
              )}
            </button>
          </div>
        </section>

      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .fade-in { animation: fadeIn 0.3s ease-in-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
      `}} />
    </div>
  );
}
