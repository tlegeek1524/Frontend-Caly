import React from "react";
import { Card } from "antd";

type AdminFilterBarProps = {
  leftContent?: React.ReactNode;
  rightContent?: React.ReactNode;
  className?: string;
};

export const AdminFilterBar = ({
  leftContent,
  rightContent,
  className = ""
}: AdminFilterBarProps) => {
  return (
    <Card
      variant="borderless"
      className={`admin-dashboard-card admin-dashboard-filter-card ${className}`.trim()}
      styles={{ body: { padding: "10px 14px" } }}
    >
      <div className="admin-dashboard-filter-bar">
        <div className="admin-dashboard-filter-left">{leftContent}</div>
        {rightContent && <div className="admin-dashboard-filter-right">{rightContent}</div>}
      </div>
    </Card>
  );
};
