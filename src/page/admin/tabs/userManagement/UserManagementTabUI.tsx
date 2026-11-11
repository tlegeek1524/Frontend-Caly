import { Card, Table, Tag, Button, Input, Space, Tooltip, Select } from "antd";
import { SearchOutlined, DownloadOutlined, LockOutlined, UnlockOutlined, UserOutlined } from "@ant-design/icons";
import type { AdminUser, RoleDropdownItem, UserRole } from "../../../../types/admin";
import { AdminFilterBar } from "../../components/AdminFilterBar";

type AdminUserManagementTabProps = {
  users: AdminUser[];
  roleOptions: RoleDropdownItem[];
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

const getRoleTagColor = (roleStr: string) => {
  switch (roleStr.toUpperCase()) {
    case "ADMIN":
      return "blue";
    case "DEV":
      return "purple";
    case "STAFF":
      return "cyan";
    case "USER":
      return "default";
    default:
      return "geekblue";
  }
};

export const UserManagementTabUI = ({
  users,
  roleOptions,
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
  const selectOptions = roleOptions.map((item) => ({
    value: item.role.toUpperCase(),
    label: (
      <Tag color={getRoleTagColor(item.role)} style={{ margin: 0, fontWeight: 500 }}>
        {item.role.toUpperCase()}
      </Tag>
    )
  }));

  const columns = [
    {
      title: "ผู้ใช้งาน / LINE UID",
      key: "user_info",
      render: (_: unknown, record: AdminUser) => {
        const displayName = record.display_name || record.full_name || record.username || "ผู้ใช้งาน";
        const uid = record.line_uid || record.accountno || "";
        return (
          <div>
            <div style={{ fontWeight: 500, display: "flex", alignItems: "center", gap: 6 }}>
              <UserOutlined style={{ color: "#9ca3af", fontSize: 13 }} />
              <span>{displayName}</span>
              {record.is_banned && (
                <Tag color="error" style={{ fontSize: 10, lineHeight: "16px", padding: "0 4px" }}>
                  ถูกระงับ
                </Tag>
              )}
            </div>
            <div style={{ fontSize: 11, color: "#8c8c8c", marginTop: 2 }}>
              <Tooltip title={uid}>
                <span className="admin-dashboard-account-code" style={{ maxWidth: 280, display: "inline-block", overflow: "hidden", textOverflow: "ellipsis", verticalAlign: "bottom" }}>
                  {uid}
                </span>
              </Tooltip>
            </div>
          </div>
        );
      }
    },
    {
      title: "สถานะ / สิทธิ์",
      key: "role",
      width: 150,
      align: "center" as const,
      render: (_: unknown, record: AdminUser) => {
        const isMasterAdmin =
          record.accountno === "CALY001" ||
          record.accountno === "ACC-001" ||
          record.line_uid === "mock-admin-1";

        if (isMasterAdmin) {
          return (
            <Tag color="blue" style={{ fontWeight: 600 }}>
              ADMIN
            </Tag>
          );
        }

        const currentRole = (tempRoles[record.accountno] || record.is_status || "USER").toUpperCase();

        return (
          <Select
            size="small"
            variant="borderless"
            suffixIcon={null}
            value={currentRole}
            onChange={(val) => onChangeRole(record.accountno, val)}
            className="admin-role-select-borderless"
            popupMatchSelectWidth={false}
            options={selectOptions}
          />
        );
      }
    },
    {
      title: "จัดการบัญชี",
      key: "actions",
      width: 120,
      align: "center" as const,
      render: (_: unknown, record: AdminUser) => {
        const isMasterAdmin =
          record.accountno === "CALY001" ||
          record.accountno === "ACC-001" ||
          record.line_uid === "mock-admin-1";

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
              placeholder="ค้นหาชื่อ หรือ LINE UID..."
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
          rowKey={(record) => record.accountno || record.line_uid || record.email || ""}
          loading={isLoading}
          pagination={{ pageSize: 8, responsive: true }}
          size="small"
          scroll={{ x: 600 }}
        />
      </Card>
    </div>
  );
};
