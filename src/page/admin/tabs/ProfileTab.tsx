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
  const email = String(currentUser?.email || "admin@caly.com");
  const isStatus = String(currentUser?.is_status || "ADMIN");
  const username = String(currentUser?.username || "admin");
  const lineUid = currentUser?.id ? String(currentUser.id) : "-";

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
          <Tag color="success">ADMIN</Tag>
          {Array.isArray(currentUser?.roles) &&
            currentUser.roles.map((r: unknown) => (
              <Tag key={String(r)} color="blue">
                {String(r).toUpperCase()}
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

        <div className="admin-profile-row">
          <span className="admin-profile-label">User ID / LINE UID</span>
          <span className="admin-profile-value">{lineUid}</span>
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
