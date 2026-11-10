import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Tabs, message, Form, Modal, Button, Tag } from "antd";
import {
  DashboardOutlined,
  EnvironmentOutlined,
  UserOutlined,
  FieldTimeOutlined,
  HistoryOutlined,
  LogoutOutlined,
  SafetyCertificateOutlined
} from "@ant-design/icons";

import type {
  AdminUser,
  AuditLogRecord,
  EventLogRecord,
  GeoLocationRecord,
  UserRole,
  BanUserPayload,
  RailwayCompareData,
  DashboardCountResponse
} from "../../types/admin";

import {
  fetchAuditLogsService,
  fetchEventLogsService,
  fetchAllUsersService,
  updateRoleService,
  banUserService,
  fetchRailwayCompareService,
  fetchDashboardCountService
} from "../../services/adminService";

import geoLocationsData from "../../data/mock/geoLocations.json";

import { AdminStatCards } from "./components/AdminStatCards";
import { AdminLogDetailModal, AdminBanUserModal } from "./components/AdminModals";
import {
  OverviewTab,
  GeoLocationTab,
  UserManagementTab,
  AuditLogsTab,
  EventLogsTab,
  ProfileTab
} from "./tabs";
import { AdminHeader } from "../../components/AdminHeader";
import { useApp } from "../../context/AppContext";

import "./components/AdminBottomNav.css";
import "./AdminDashboard.css";

const MOCK_GEO_LOCATIONS: GeoLocationRecord[] = geoLocationsData as GeoLocationRecord[];

const ADMIN_NAV_ITEMS = [
  { key: "overview", label: "ภาพรวม", icon: <DashboardOutlined /> },
  { key: "geo", label: "แผนที่", icon: <EnvironmentOutlined /> },
  { key: "users", label: "สิทธิ์", icon: <SafetyCertificateOutlined /> },
  { key: "audit-logs", label: "Log", icon: <HistoryOutlined /> },
  { key: "profile", label: "โปรไฟล์", icon: <UserOutlined /> }
];

const VALID_TABS = ["overview", "geo", "users", "audit-logs", "event-logs", "profile"];

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

  // ซิงก์ activeTab กับ URL param (:tab)
  const activeTab = tab && VALID_TABS.includes(tab) ? tab : "overview";

  const handleTabChange = (newTab: string) => {
    const targetPath = newTab === "overview" ? "/admin-dashboard/overview" : `/admin-dashboard/${newTab}`;
    navigate(targetPath, { viewTransition: true });
  };

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      // หากออกจากขนาด device mobile แล้วแท็บปัจจุบันเป็น profile ให้รีเซ็ตกลับเป็น overview
      if (!mobile && activeTab === "profile") {
        navigate("/admin-dashboard/overview", { replace: true });
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [activeTab, navigate]);
  const [logs, setLogs] = useState<AuditLogRecord[]>([]);
  const [eventLogs, setEventLogs] = useState<EventLogRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEventLogsLoading, setIsEventLogsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUsersLoading, setIsUsersLoading] = useState(false);

  const [selectedLog, setSelectedLog] = useState<AuditLogRecord | null>(null);
  const [allUsers, setAllUsers] = useState<AdminUser[]>([]);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [tempRoles, setTempRoles] = useState<Record<string, UserRole>>({});

  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [banForm] = Form.useForm<BanUserPayload>();

  const [searchLogQuery, setSearchLogQuery] = useState("");
  const [selectedPhotoLocation, setSelectedPhotoLocation] = useState<GeoLocationRecord | null>(null);
  const [railwayCompare, setRailwayCompare] = useState<RailwayCompareData | null>(null);
  const [dashboardCounts, setDashboardCounts] = useState<DashboardCountResponse | null>(null);

  const loadRailwayCompare = async (): Promise<number | undefined> => {
    const res = await fetchRailwayCompareService();
    if (res.success && res.data) {
      setRailwayCompare(res.data);
    }
    return res.serverTimeMs;
  };

  const loadDashboardCounts = async () => {
    const res = await fetchDashboardCountService();
    if (res.success && res.data) {
      setDashboardCounts(res.data);
    }
  };

  const loadAuditLogs = async (notify = false) => {
    setIsLoading(true);
    const data = await fetchAuditLogsService();
    setLogs(data);
    setIsLoading(false);
    if (notify) message.success("อัปเดตบันทึกกิจกรรมเรียบร้อยแล้ว");
  };

  const loadEventLogs = async () => {
    setIsEventLogsLoading(true);
    const data = await fetchEventLogsService();
    setEventLogs(data);
    setIsEventLogsLoading(false);
  };

  const loadUsersList = async () => {
    setIsUsersLoading(true);
    const users = await fetchAllUsersService();
    setAllUsers(users);

    const initialTempRoles: Record<string, UserRole> = {};
    users.forEach((usr) => {
      const hasDev = Array.isArray(usr.roles)
        ? usr.roles.includes("dev")
        : usr.roles === "dev";
      initialTempRoles[usr.accountno] = hasDev ? "dev" : "user";
    });
    setTempRoles(initialTempRoles);
    setIsUsersLoading(false);
  };

  const handleChangeRole = (accountno: string, newRole: UserRole) => {
    setTempRoles((prev) => ({
      ...prev,
      [accountno]: newRole
    }));
  };

  const handleSaveRoles = async () => {
    setIsProcessing(true);
    const changedUsers: { accountno: string; roles: UserRole[] }[] = [];
    allUsers.forEach((usr) => {
      const originalIsDev = Array.isArray(usr.roles)
        ? usr.roles.includes("dev")
        : usr.roles === "dev";
      const currentIsDev = tempRoles[usr.accountno] === "dev";
      if (originalIsDev !== currentIsDev) {
        changedUsers.push({
          accountno: usr.accountno,
          roles: currentIsDev ? ["user", "dev"] : ["user"]
        });
      }
    });

    if (changedUsers.length === 0) {
      message.info("ไม่มีการเปลี่ยนแปลงสิทธิ์");
      setIsProcessing(false);
      return;
    }

    let successCount = 0;
    for (const item of changedUsers) {
      const ok = await updateRoleService(item);
      if (ok) successCount++;
    }

    if (successCount > 0) {
      message.success(`บันทึกสิทธิ์ผู้ใช้สำเร็จ ${successCount} รายการ`);
      loadUsersList();
      loadAuditLogs();
    } else {
      message.error("บันทึกสิทธิ์ผู้ใช้งานล้มเหลว");
    }
    setIsProcessing(false);
  };

  const handleBanUserSubmit = async (values: BanUserPayload) => {
    setIsProcessing(true);
    const result = await banUserService(values);
    if (result.success) {
      message.success(result.message);
      setBanDialogOpen(false);
      banForm.resetFields();
      setAllUsers((prev) =>
        prev.map((u) => (u.accountno === values.accountno ? { ...u, is_banned: true } : u))
      );
      loadAuditLogs();
    } else {
      message.error(result.message);
    }
    setIsProcessing(false);
  };

  const handleToggleLockUser = (accountno: string, currentlyBanned: boolean) => {
    if (currentlyBanned) {
      setAllUsers((prev) =>
        prev.map((u) => (u.accountno === accountno ? { ...u, is_banned: false } : u))
      );
      message.success("ปลดล็อคผู้ใช้งานเรียบร้อยแล้ว");
    } else {
      banForm.setFieldsValue({ accountno });
      setBanDialogOpen(true);
    }
  };

  const handleExportCSV = (dataType: string) => {
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
    const filename = `caly_export_${dataType}_${new Date().toISOString().slice(0, 10)}.csv`;

    if (dataType === "users") {
      csvContent += "Account No,Full Name,Username,Email,Roles\n";
      allUsers.forEach((u) => {
        csvContent += `"${u.accountno || ""}","${u.full_name || ""}","${u.username || ""}","${u.email || ""}","${Array.isArray(u.roles) ? u.roles.join(";") : u.roles || ""}"\n`;
      });
    } else if (dataType === "geo") {
      csvContent += "ID,User Name,Food Name,Calories,Latitude,Longitude,Location,Timestamp\n";
      MOCK_GEO_LOCATIONS.forEach((g) => {
        csvContent += `"${g.id}","${g.userName}","${g.foodName}",${g.calories},${g.latitude},${g.longitude},"${g.locationName}","${g.timestamp}"\n`;
      });
    } else if (dataType === "event-logs") {
      csvContent += "Event ID,Timestamp,Category,Action,Detail,Level,Operator,IP Address\n";
      eventLogs.forEach((e) => {
        csvContent += `"${e.event_id}","${e.timestamp}","${e.category}","${e.action}","${e.detail}","${e.level}","${e.operator}","${e.ip_address}"\n`;
      });
    } else {
      csvContent += "Record ID,Operator,Username,IP Address,Timestamp,Active Status\n";
      logs.forEach((l) => {
        csvContent += `"${l.record_id}","${l.user_detail?.full_name || ""}","${l.decoded_sessions?.username || ""}","${l.ip_address || ""}","${l.created_at || ""}","${l.is_active ? "Active" : "Expired"}"\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    message.success(`ส่งออกไฟล์ ${filename} เรียบร้อยแล้ว`);
  };

  useEffect(() => {
    let isMounted = true;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    const FIVE_MINUTES_MS = 5 * 60 * 1000;

    try {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        setCurrentUser(JSON.parse(userStr));
      }
    } catch {
      // ignore JSON parse error
    }
    loadAuditLogs();
    loadEventLogs();
    loadUsersList();

    const syncByServerTime = async () => {
      const [serverTimeMs] = await Promise.all([
        loadRailwayCompare(),
        loadDashboardCounts()
      ]);

      if (!isMounted) return;

      // คำนวณเวลาที่เหลือจนถึงรอบ 5 นาทีถัดไปของเวลา Server (เช่น :00, :05, :10, :15 ...)
      const delayMs = serverTimeMs
        ? FIVE_MINUTES_MS - (serverTimeMs % FIVE_MINUTES_MS)
        : FIVE_MINUTES_MS;

      timeoutId = setTimeout(syncByServerTime, Math.max(1000, delayMs));
    };

    syncByServerTime();

    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("access_token");
    sessionStorage.clear();
    message.success("ออกจากระบบเรียบร้อยแล้ว");
    navigate("/linelogin", { replace: true });
  };

  const filteredLogs = logs.filter((log) => {
    if (!searchLogQuery) return true;
    const query = searchLogQuery.toLowerCase();
    const name = (log.user_detail?.full_name || "").toLowerCase();
    const uname = (log.decoded_sessions?.username || "").toLowerCase();
    const ip = (log.ip_address || "").toLowerCase();
    return name.includes(query) || uname.includes(query) || ip.includes(query);
  });

  const filteredUsers = allUsers.filter((usr) => {
    const query = userSearchQuery.toLowerCase();
    const fullName = (usr.full_name || "").toLowerCase();
    const username = (usr.username || "").toLowerCase();
    const email = (usr.email || "").toLowerCase();
    const accountno = (usr.accountno || "").toLowerCase();
    return (
      fullName.includes(query) ||
      username.includes(query) ||
      email.includes(query) ||
      accountno.includes(query)
    );
  });

  return (
    <div className="admin-dashboard">
      {/* Quiet, Natural Page Header (Shared Component) */}
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

      {/* Top 4 Stat Cards ย้ายขึ้นบนสุด (ซ่อนเมื่ออยู่ในหน้าโปรไฟล์) */}
      {activeTab !== "profile" && (
        <AdminStatCards
          totalUsers={dashboardCounts?.User?.count ?? 0}
          totalPhotos={dashboardCounts?.Image_food?.count ?? 0}
          storageUsage={railwayCompare?.databaseStorage?.used ?? "-"}
          storageMax={railwayCompare?.databaseStorage?.max ?? "-"}
          serverLoad={
            railwayCompare?.cpuUsage?.usagePercent !== undefined
              ? `${railwayCompare.cpuUsage.usagePercent}%`
              : "-"
          }
          serverLoadMax={railwayCompare?.cpuUsage ? "100%" : "-"}
        />
      )}

      {/* Tabs Menu */}
      <Tabs
        activeKey={activeTab}
        onChange={handleTabChange}
        type="line"
        className="admin-dashboard-tabs"
        animated={{ inkBar: true, tabPane: true }}
        destroyOnHidden={false}
        items={[
          {
            key: "overview",
            label: <span><DashboardOutlined /> {t("admin.overviewTitle")}</span>,
            children: <OverviewTab railwayCompare={railwayCompare} />
          },
          {
            key: "geo",
            label: <span><EnvironmentOutlined /> {t("admin.geoTitle")}</span>,
            children: (
              <GeoLocationTab
                locations={MOCK_GEO_LOCATIONS}
                selectedLocation={selectedPhotoLocation}
                onSelectLocation={setSelectedPhotoLocation}
              />
            )
          },
          {
            key: "users",
            label: <span><SafetyCertificateOutlined /> {t("admin.userMgmtTitle")}</span>,
            children: (
              <UserManagementTab
                users={filteredUsers}
                isLoading={isUsersLoading}
                isSaving={isProcessing}
                searchQuery={userSearchQuery}
                onSearchChange={setUserSearchQuery}
                tempRoles={tempRoles}
                onChangeRole={handleChangeRole}
                onSaveRoles={handleSaveRoles}
                onOpenBanDialog={(accountno) => {
                  banForm.setFieldsValue({ accountno });
                  setBanDialogOpen(true);
                }}
                onToggleLockUser={handleToggleLockUser}
                onExportCSV={() => handleExportCSV("users")}
              />
            )
          },
          {
            key: "audit-logs",
            label: <span><FieldTimeOutlined /> {t("admin.auditLogsTitle")}</span>,
            children: (
              <AuditLogsTab
                logs={filteredLogs}
                isLoading={isLoading}
                searchQuery={searchLogQuery}
                onSearchChange={setSearchLogQuery}
                onSelectLog={setSelectedLog}
                onExportCSV={() => handleExportCSV("logs")}
              />
            )
          },
          {
            key: "event-logs",
            label: <span><HistoryOutlined /> {t("admin.eventLogsTitle")}</span>,
            children: (
              <EventLogsTab
                eventLogs={eventLogs}
                loading={isEventLogsLoading}
                onExportCSV={() => handleExportCSV("event-logs")}
              />
            )
          },
          // ซ่อนแท็บโปรไฟล์ออกจากแถบแท็บเมื่อขนาดหน้าจอออกจาก device mobile
          ...(isMobile
            ? [
                {
                  key: "profile",
                  label: <span><UserOutlined /> {t("admin.profile")}</span>,
                  children: (
                    <ProfileTab
                      currentUser={currentUser}
                      onLogoutClick={() => setIsLogoutModalOpen(true)}
                    />
                  )
                }
              ]
            : [])
        ]}
      />

      {/* Detail & Ban Modals */}
      <AdminLogDetailModal log={selectedLog} onClose={() => setSelectedLog(null)} />
      <AdminBanUserModal
        open={banDialogOpen}
        form={banForm}
        isProcessing={isProcessing}
        onCancel={() => {
          setBanDialogOpen(false);
          banForm.resetFields();
        }}
        onSubmit={handleBanUserSubmit}
      />

      {/* Desktop Profile Modal (แสดงเฉพาะเมื่อคลิกโปรไฟล์บนหน้าจอคอมพิวเตอร์/นอกเหนือจาก mobile) */}
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
