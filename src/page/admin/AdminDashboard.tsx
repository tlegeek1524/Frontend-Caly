import { useState, useEffect, lazy, Suspense } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Tabs, message, Modal, Button, Tag, Spin } from "antd";
import {
  DashboardOutlined,
  EnvironmentOutlined,
  UserOutlined,
  FieldTimeOutlined,
  HistoryOutlined,
  LogoutOutlined,
  SafetyCertificateOutlined
} from "@ant-design/icons";

const OverviewTab = lazy(() =>
  import("./tabs/overview").then((m) => ({ default: m.OverviewTab }))
);
const GeoLocationTab = lazy(() =>
  import("./tabs/geoLocation").then((m) => ({ default: m.GeoLocationTab }))
);
const UserManagementTab = lazy(() =>
  import("./tabs/userManagement").then((m) => ({ default: m.UserManagementTab }))
);
const AuditLogsTab = lazy(() =>
  import("./tabs/auditLogs").then((m) => ({ default: m.AuditLogsTab }))
);
const EventLogsTab = lazy(() =>
  import("./tabs/eventLogs").then((m) => ({ default: m.EventLogsTab }))
);
const ProfileTab = lazy(() =>
  import("./tabs/profile").then((m) => ({ default: m.ProfileTab }))
);
import { AdminHeader } from "../../components/AdminHeader";
import { useApp } from "../../context/AppContext";
import { getStoredUser, clearStoredAuth } from "../../utils/sessionAuth";

import "./components/AdminBottomNav.css";
import "./AdminDashboard.css";

const ADMIN_NAV_ITEMS = [
  { key: "overview", label: "ภาพรวม", icon: <DashboardOutlined /> },
  { key: "geo", label: "แผนที่", icon: <EnvironmentOutlined /> },
  { key: "users", label: "สิทธิ์", icon: <SafetyCertificateOutlined /> },
  { key: "profile", label: "โปรไฟล์", icon: <UserOutlined /> }
];

const VALID_TABS = ["overview", "geo", "users", "profile"];

export const AdminDashboard = () => {
  const { t } = useApp();
  const navigate = useNavigate();
  const { tab } = useParams<{ tab?: string }>();
  const [currentUser, setCurrentUser] = useState<Record<string, unknown> | null>(null);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth <= 768;
    }
    return false;
  });

  const activeTab = tab && VALID_TABS.includes(tab) ? tab : "overview";

  const handleTabChange = (newTab: string) => {
    const targetPath = newTab === "overview" ? "/admin-dashboard/overview" : `/admin-dashboard/${newTab}`;
    navigate(targetPath, { viewTransition: true });
  };

  useEffect(() => {
    try {
      const user = getStoredUser();
      if (user) {
        setCurrentUser(user);
      }
    } catch {
      // ignore parse error
    }

    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (!mobile && activeTab === "profile") {
        navigate("/admin-dashboard/overview", { replace: true });
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [activeTab, navigate]);

  const handleLogout = () => {
    clearStoredAuth();
    sessionStorage.clear();
    message.success("ออกจากระบบเรียบร้อยแล้ว");
    navigate("/linelogin", { replace: true });
  };

  return (
    <div className="admin-dashboard">
      {/* Shared Admin Header */}
      <AdminHeader
        title="Dashboard"
        currentUser={currentUser}
        onProfileClick={() => {
          if (isMobile) {
            handleTabChange("profile");
            window.scrollTo({ top: 0, behavior: "smooth" });
          } else {
            setIsProfileModalOpen(true);
          }
        }}
        onLogoutClick={() => setIsLogoutModalOpen(true)}
      />

      {/* Tabs Menu */}
      <Tabs
        activeKey={activeTab}
        onChange={handleTabChange}
        type="line"
        className="admin-dashboard-tabs"
        animated={{ inkBar: true, tabPane: true }}
        destroyInactiveTabPane={true}
        items={[
          {
            key: "overview",
            label: <span><DashboardOutlined /> {t("admin.overviewTitle")}</span>,
            children: (
              <Suspense fallback={<div style={{ padding: "40px 0", textAlign: "center" }}><Spin size="large" /></div>}>
                {activeTab === "overview" && <OverviewTab isMobile={isMobile} />}
              </Suspense>
            )
          },
          {
            key: "geo",
            label: <span><EnvironmentOutlined /> {t("admin.geoTitle")}</span>,
            children: (
              <Suspense fallback={<div style={{ padding: "40px 0", textAlign: "center" }}><Spin size="large" /></div>}>
                {activeTab === "geo" && <GeoLocationTab />}
              </Suspense>
            )
          },
          {
            key: "users",
            label: <span><SafetyCertificateOutlined /> {t("admin.userMgmtTitle")}</span>,
            children: (
              <Suspense fallback={<div style={{ padding: "40px 0", textAlign: "center" }}><Spin size="large" /></div>}>
                {activeTab === "users" && <UserManagementTab />}
              </Suspense>
            )
          },
          {
            key: "audit-logs",
            label: <span><FieldTimeOutlined /> {t("admin.auditLogsTitle")}</span>,
            children: (
              <Suspense fallback={<div style={{ padding: "40px 0", textAlign: "center" }}><Spin size="large" /></div>}>
                {activeTab === "audit-logs" && <AuditLogsTab />}
              </Suspense>
            )
          },
          {
            key: "event-logs",
            label: <span><HistoryOutlined /> {t("admin.eventLogsTitle")}</span>,
            children: (
              <Suspense fallback={<div style={{ padding: "40px 0", textAlign: "center" }}><Spin size="large" /></div>}>
                {activeTab === "event-logs" && <EventLogsTab />}
              </Suspense>
            )
          },
          ...(isMobile
            ? [
                {
                  key: "profile",
                  label: <span><UserOutlined /> {t("admin.profile")}</span>,
                  children: (
                    <Suspense fallback={<div style={{ padding: "40px 0", textAlign: "center" }}><Spin size="large" /></div>}>
                      {activeTab === "profile" && (
                        <ProfileTab
                          currentUser={currentUser}
                          onLogoutClick={() => setIsLogoutModalOpen(true)}
                        />
                      )}
                    </Suspense>
                  )
                }
              ]
            : [])
        ]}
      />

      {/* Desktop Profile Modal */}
      {!isMobile && (
        <Modal
          title={
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <UserOutlined style={{ color: "#059669" }} />
              <span>ข้อมูลโปรไฟล์ผู้ดูแลระบบ</span>
            </div>
          }
          open={isProfileModalOpen}
          onCancel={() => setIsProfileModalOpen(false)}
          footer={[
            <Button
              key="logout"
              danger
              icon={<LogoutOutlined />}
              onClick={() => {
                setIsProfileModalOpen(false);
                setIsLogoutModalOpen(true);
              }}
            >
              ออกจากระบบ
            </Button>,
            <Button key="close" onClick={() => setIsProfileModalOpen(false)}>
              ปิด
            </Button>
          ]}
        >
          <div style={{ padding: "16px 0", display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              {currentUser?.picture ? (
                <img
                  src={String(currentUser.picture)}
                  alt="Profile"
                  style={{ width: 60, height: 60, borderRadius: "50%", objectFit: "cover", border: "2px solid #e2e8f0" }}
                />
              ) : (
                <div
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: "50%",
                    backgroundColor: "#ecfdf5",
                    color: "#059669",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 22,
                    border: "2px solid #a7f3d0"
                  }}
                >
                  <UserOutlined />
                </div>
              )}
              <div>
                <div style={{ fontSize: 17, fontWeight: 700, color: "#1e293b" }}>
                  {String(currentUser?.displayName || currentUser?.name || currentUser?.full_name || currentUser?.username || "Admin")}
                </div>
                <div style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>
                  {String(currentUser?.email || "admin@caly.com")}
                </div>
                <div style={{ marginTop: 6, display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <Tag color="success">ADMIN</Tag>
                  {Array.isArray(currentUser?.roles) && currentUser.roles.map((r: unknown) => (
                    <Tag key={String(r)} color="blue">{String(r).toUpperCase()}</Tag>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ backgroundColor: "#f8fafc", padding: 14, borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 13 }}>
              <div style={{ display: "grid", gridTemplateColumns: "110px 1fr", rowGap: 8 }}>
                <span style={{ color: "#64748b" }}>สถานะบัญชี:</span>
                <span style={{ fontWeight: 600, color: "#059669" }}>เปิดใช้งาน (Active)</span>

                <span style={{ color: "#64748b" }}>สิทธิ์ระบบ:</span>
                <span style={{ fontWeight: 500, color: "#334155" }}>
                  {String(currentUser?.is_status || "ADMIN")}
                </span>

                {Boolean(currentUser?.id) && (
                  <>
                    <span style={{ color: "#64748b" }}>User ID / LINE:</span>
                    <span style={{ fontWeight: 400, color: "#475569", wordBreak: "break-all" }}>
                      {String(currentUser?.id)}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Logout Confirmation Modal */}
      <Modal
        title="ยืนยันการออกจากระบบ"
        open={isLogoutModalOpen}
        onOk={handleLogout}
        onCancel={() => setIsLogoutModalOpen(false)}
        okText="ออกจากระบบ"
        cancelText="ยกเลิก"
        okButtonProps={{ danger: true }}
      >
        <p style={{ margin: "16px 0", color: "#475569", fontSize: 14 }}>
          คุณต้องการออกจากระบบผู้ดูแลระบบ (Admin) หรือไม่?
        </p>
      </Modal>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="admin-mobile-bottom-nav" aria-label="Mobile Navigation">
        {ADMIN_NAV_ITEMS.map((item) => {
          const isActive =
            item.key === "audit-logs"
              ? activeTab === "audit-logs" || activeTab === "event-logs"
              : activeTab === item.key;

          return (
            <button
              key={item.key}
              type="button"
              onClick={() => {
                handleTabChange(item.key);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className={`admin-bottom-nav-item ${isActive ? "admin-bottom-nav-item-active" : ""}`}
            >
              {item.key === "profile" && currentUser?.picture ? (
                <img
                  src={String(currentUser.picture)}
                  alt="Profile"
                  className="admin-bottom-nav-avatar"
                />
              ) : (
                <span className="admin-bottom-nav-icon">{item.icon}</span>
              )}
              <span className="admin-bottom-nav-label">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default AdminDashboard;
