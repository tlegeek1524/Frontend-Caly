import React from "react";
import { UserOutlined, LogoutOutlined } from "@ant-design/icons";
import { Sun, Moon, Globe } from "lucide-react";
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
  const { theme, toggleTheme, language, toggleLanguage, t } = useApp();

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
        {/* Language Switcher Button (TH / EN) */}
        <button
          type="button"
          onClick={toggleLanguage}
          className="admin-header-tool-btn"
          title={language === "th" ? "Switch to English" : "เปลี่ยนเป็นภาษาไทย"}
        >
          <Globe size={15} />
          <span className="admin-header-tool-text">{language === "th" ? "TH" : "EN"}</span>
        </button>

        {/* Theme Switcher Button (Light / Dark) */}
        <button
          type="button"
          onClick={toggleTheme}
          className="admin-header-tool-btn"
          title={theme === "light" ? t("common.darkMode") : t("common.lightMode")}
        >
          {theme === "light" ? <Moon size={15} /> : <Sun size={15} />}
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
