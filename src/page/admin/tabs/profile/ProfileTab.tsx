import { UserOutlined, LogoutOutlined } from "@ant-design/icons";
import { Tag } from "antd";
import "./ProfileTab.css";

type AdminProfileTabProps = {
  currentUser: Record<string, unknown> | null;
  onLogoutClick: () => void;
};

export const AdminProfileTab = ({
  currentUser,
  onLogoutClick
}: AdminProfileTabProps) => {
  const displayName = String(
    currentUser?.displayName ||
      currentUser?.name ||
      currentUser?.full_name ||
      currentUser?.username ||
      "ผู้ดูแลระบบ"
  );
  const email = currentUser?.email ? String(currentUser.email) : "-";
  const isStatus = currentUser?.is_status ? String(currentUser.is_status) : "-";
  const username = currentUser?.username ? String(currentUser.username) : "-";
  const primaryRole = (isStatus !== "-" ? isStatus : "ADMIN").toUpperCase();
  const extraRoles = Array.isArray(currentUser?.roles)
    ? Array.from(
        new Set(
          currentUser.roles
            .map((r: unknown) => String(r).trim().toUpperCase())
            .filter((r) => r && r !== primaryRole)
        )
      )
    : [];

  return (
    <div className="admin-profile-view">
      {/* Profile Hero Card */}
      <div className="admin-profile-hero">
        {currentUser?.picture ? (
          <img
            src={String(currentUser.picture)}
            alt="Profile"
            className="admin-profile-avatar-large"
          />
        ) : (
          <div className="admin-profile-avatar-placeholder">
            <UserOutlined />
          </div>
        )}

        <h2 className="admin-profile-display-name">{displayName}</h2>
        <p className="admin-profile-email">{email}</p>

        <div className="admin-profile-tags">
          <Tag color="success">{primaryRole}</Tag>
          {extraRoles.map((role) => (
            <Tag key={role} color="blue">
              {role}
            </Tag>
          ))}
        </div>
      </div>

      {/* Account Info Details Group */}
      <div className="admin-profile-info-card">
        <div className="admin-profile-info-header">ข้อมูลบัญชีและการเข้าสู่ระบบ</div>

        <div className="admin-profile-row">
          <span className="admin-profile-label">สถานะบัญชี</span>
          <span className="admin-profile-status-active">
            <span className="admin-profile-status-dot" />
            เปิดใช้งาน (Active)
          </span>
        </div>

        <div className="admin-profile-row">
          <span className="admin-profile-label">ระดับสิทธิ์ (Role)</span>
          <span className="admin-profile-value">{isStatus}</span>
        </div>

        <div className="admin-profile-row">
          <span className="admin-profile-label">ชื่อผู้ใช้</span>
          <span className="admin-profile-value">{username}</span>
        </div>
      </div>

      {/* Logout Action Button */}
      <button
        type="button"
        onClick={onLogoutClick}
        className="admin-profile-logout-btn"
      >
        <LogoutOutlined />
        <span>ออกจากระบบ</span>
      </button>
    </div>
  );
};
