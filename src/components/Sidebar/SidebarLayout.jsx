import React from "react";
import { Outlet } from "react-router-dom";
import { useApp } from "../../context/AppContext";
import { getStoredUser } from "../../utils/sessionAuth";

const SidebarLayout = () => {
  const { theme } = useApp();
  const user = getStoredUser();
  const isDark = theme === "dark";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        backgroundColor: isDark ? "#0f172a" : "#f8fafc",
        color: isDark ? "#f8fafc" : "#0f172a",
      }}
    >
      <main
        style={{
          flexGrow: 1,
          minWidth: 0,
          padding: 0,
          minHeight: "100vh",
        }}
      >
        <Outlet context={{ user }} />
      </main>
    </div>
  );
};

export default SidebarLayout;
