import React from "react";
import { useNavigate } from "react-router-dom";
import { UserOutlined, LogoutOutlined } from "@ant-design/icons";
import { ExternalLink } from "lucide-react";
import { useApp } from "../../context/AppContext";
import "./AdminHeader.css";

type AdminHeaderProps = {
  title?: string;
  currentUser?: Record<string, unknown> | null;
  onProfileClick: () => void;
  onLogoutClick: () => void;
};

export const AdminHeader = ({
  title = "Dashboard",
  currentUser,
  onProfileClick,
  onLogoutClick
}: AdminHeaderProps) => {
  const navigate = useNavigate();
  const { t } = useApp();

  const displayName = String(
    currentUser?.displayName ||
      currentUser?.name ||
      currentUser?.full_name ||
      currentUser?.username ||
      "Admin Caly"
  );

  return (
    <header className="admin-page-header">
      <h1 className="admin-page-title">{title}</h1>

      <div className="admin-page-header-actions">
        {/* User View Redirect Button */}
        <button
          type="button"
          onClick={() => navigate("/dashboard")}
          className="admin-header-user-view-btn"
          title="ไปหน้า User Dashboard"
        >
          <ExternalLink size={14} />
          <span>หน้า User</span>
        </button>

        {/* Profile Button */}
        <button
          type="button"
          onClick={onProfileClick}
          className="admin-header-profile-btn"
          title="Profile"
        >
          {currentUser?.picture ? (
            <img
              src={String(currentUser.picture)}
              alt="Profile"
              className="admin-header-avatar"
            />
          ) : (
            <div className="admin-header-avatar-empty">
              <UserOutlined />
            </div>
          )}
          <span className="admin-header-name">{displayName}</span>
        </button>

        {/* Logout Button */}
        <button
          type="button"
          onClick={onLogoutClick}
          className="admin-header-logout-btn"
          title={t("admin.logout")}
        >
          <LogoutOutlined />
          <span>{t("admin.logout")}</span>
        </button>
      </div>
    </header>
  );
};
