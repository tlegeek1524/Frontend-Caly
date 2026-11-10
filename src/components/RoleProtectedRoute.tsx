import React from "react";
import { Outlet } from "react-router-dom";
import { ErrorPage } from "../page/error/ErrorPage";

type RoleProtectedRouteProps = {
  allowedRoles?: string[];
};

export const RoleProtectedRoute: React.FC<RoleProtectedRouteProps> = ({ allowedRoles = ["admin", "dev"] }) => {
  const userStr = localStorage.getItem("user");
  let token = localStorage.getItem("access_token");

  if (!token && userStr) {
    try {
      const parsed = JSON.parse(userStr);
      if (parsed?.access_token) {
        token = parsed.access_token;
        localStorage.setItem("access_token", token);
      }
    } catch {
      // ignore JSON parse error
    }
  }

  if (!token || !userStr) {
    return (
      <ErrorPage
        type="403"
        title="403"
        subTitle="กรุณาเข้าสู่ระบบก่อนเข้าใช้งานหน้านี้"
      />
    );
  }

  try {
    const user = JSON.parse(userStr);
    const roles: string[] = Array.isArray(user?.roles)
      ? user.roles.map((r: unknown) => String(r).toLowerCase())
      : user?.roles
      ? [String(user.roles).toLowerCase()]
      : [];
    const status = (user?.is_status || user?.status || user?.role || "").toString().trim().toUpperCase();
    const hasPermission = status === "ADMIN" || roles.some((role) => allowedRoles.includes(role));

    if (!hasPermission) {
      return (
        <ErrorPage
          type="403"
          title="403"
          subTitle="คุณไม่มีสิทธิ์เข้าถึงหน้านี้ เฉพาะผู้ดูแลระบบ (Admin) หรือนักพัฒนา (Developer) เท่านั้น"
        />
      );
    }
  } catch {
    return (
      <ErrorPage
        type="403"
        title="403"
        subTitle="ข้อมูลผู้ใช้งานไม่ถูกต้อง กรุณาเข้าสู่ระบบใหม่อีกครั้ง"
      />
    );
  }

  return <Outlet />;
};
