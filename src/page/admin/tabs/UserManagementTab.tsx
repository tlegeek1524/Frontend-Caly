import { Card, Table, Tag, Button, Input, Space, Tooltip, Select } from "antd";
import { SearchOutlined, DownloadOutlined, LockOutlined, UnlockOutlined, UserOutlined } from "@ant-design/icons";
import type { AdminUser, UserRole } from "../../../types/admin";
import { AdminFilterBar } from "../components/AdminFilterBar";

type AdminUserManagementTabProps = {
  users: AdminUser[];
  isLoading: boolean;
  isSaving: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  tempRoles: Record<string, UserRole>;
  onChangeRole: (accountno: string, newRole: UserRole) => void;
  onSaveRoles: () => void;
  onOpenBanDialog: (accountno: string) => void;
  onToggleLockUser?: (accountno: string, currentlyBanned: boolean) => void;
  onExportCSV?: () => void;
};

export const AdminUserManagementTab = ({
  users,
  isLoading,
  isSaving,
  searchQuery,
  onSearchChange,
  tempRoles,
  onChangeRole,
  onSaveRoles,
  onOpenBanDialog,
  onToggleLockUser,
  onExportCSV
}: AdminUserManagementTabProps) => {
  const columns = [
    {
      title: "ผู้ใช้งาน",
      dataIndex: "full_name",
      key: "full_name",
      render: (text: string | undefined, record: AdminUser) => (
        <div>
          <div style={{ fontWeight: 500, display: "flex", alignItems: "center", gap: 6 }}>
            {text || record.username}
            {record.is_banned && (
              <Tag color="error" style={{ fontSize: 10, lineHeight: "16px", padding: "0 4px" }}>
                ถูกระงับ
              </Tag>
            )}
          </div>
          <div style={{ fontSize: 11, color: "#8c8c8c" }}>{record.email || "ไม่มีอีเมล"}</div>
        </div>
      )
    },
    {
      title: "เลขบัญชี",
      dataIndex: "accountno",
      key: "accountno",
      width: 110,
      render: (text: string) => <span className="admin-dashboard-account-code">{text || "—"}</span>
    },
    {
      title: "บทบาท",
      key: "role",
      width: 100,
      align: "center" as const,
      render: (_: unknown, record: AdminUser) => {
        const currentRole = tempRoles[record.accountno] || "user";
        const isMasterAdmin =
          record.accountno === "CALY001" ||
          record.accountno === "ACC-001" ||
          (Array.isArray(record.roles) ? record.roles.includes("admin") : record.roles === "admin");

        if (isMasterAdmin) {
          return <Tag color="green">Admin</Tag>;
        }

        return (
          <Select
            size="small"
            variant="borderless"
            value={currentRole}
            onChange={(val) => onChangeRole(record.accountno, val)}
            className="admin-role-select-borderless"
            options={[
              { value: "user", label: "User" },
              { value: "dev", label: "Dev" }
            ]}
          />
        );
      }
    },
    {
      title: "จัดการบัญชี",
      key: "actions",
      width: 110,
      align: "center" as const,
      render: (_: unknown, record: AdminUser) => {
        const isMasterAdmin =
          record.accountno === "CALY001" ||
          record.accountno === "ACC-001" ||
          (Array.isArray(record.roles) ? record.roles.includes("admin") : record.roles === "admin");

        if (isMasterAdmin) {
          return (
            <span style={{ fontSize: 11, color: "#9ca3af" }}>
              ระบบหลัก
            </span>
          );
        }

        const isBanned = Boolean(record.is_banned);

        return (
          <Tooltip title={isBanned ? "คลิกเพื่อปลดล็อคผู้ใช้งาน (Unlock)" : "คลิกเพื่อระงับการใช้งาน (Lock)"}>
            <Button
              type={isBanned ? "primary" : "default"}
              danger={!isBanned}
              size="middle"
              shape="circle"
              icon={isBanned ? <LockOutlined /> : <UnlockOutlined />}
              onClick={() => {
                if (onToggleLockUser) {
                  onToggleLockUser(record.accountno || "", isBanned);
                } else {
                  onOpenBanDialog(record.accountno || "");
                }
              }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            />
          </Tooltip>
        );
      }
    }
  ];

  return (
    <div className="admin-user-management-container">
      {/* Global Unified Filter Bar */}
      <AdminFilterBar
        leftContent={
          <>
            <Input
              prefix={<SearchOutlined style={{ color: "#9ca3af" }} />}
              placeholder="ค้นหาชื่อ, อีเมล หรือเลขบัญชี..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="admin-dashboard-search-input"
              allowClear
              style={{ maxWidth: 280 }}
            />
            <span className="admin-dashboard-filter-label" style={{ color: "#64748b", fontWeight: 500 }}>
              รวม <strong style={{ color: "#1677ff", margin: "0 4px" }}>{users.length}</strong> บัญชี
            </span>
          </>
        }
        rightContent={
          <Space wrap>
            {onExportCSV && (
              <Button icon={<DownloadOutlined />} onClick={onExportCSV}>
                ส่งออก CSV
              </Button>
            )}
            <Button type="primary" onClick={onSaveRoles} loading={isSaving}>
              บันทึกสิทธิ์
            </Button>
          </Space>
        }
      />

      <Card variant="borderless" className="admin-dashboard-card" styles={{ body: { padding: "12px 16px" } }}>
        <Table
          dataSource={users}
          columns={columns}
          rowKey={(record) => record.accountno || record.email || ""}
          loading={isLoading}
          pagination={{ pageSize: 8, responsive: true }}
          size="small"
          scroll={{ x: 600 }}
        />
      </Card>
    </div>
  );
};
