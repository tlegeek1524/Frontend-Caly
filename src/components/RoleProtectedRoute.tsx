import React, { useEffect, useState, useCallback, useRef } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { ErrorPage } from "../page/error/ErrorPage";
import {
  getStoredUser,
  getStoredToken,
  verifyAdminStatusFromApi,
  isAdminAuthorized,
  ALLOWED_ADMIN_ROLES
} from "../utils/sessionAuth";

type RoleProtectedRouteProps = {
  allowedRoles?: string[];
  redirectPath?: string;
};

export const RoleProtectedRoute: React.FC<RoleProtectedRouteProps> = ({
  allowedRoles = ALLOWED_ADMIN_ROLES,
  redirectPath
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const hasCheckedInitialRef = useRef(false);

  const checkAuthorization = useCallback((): {
    isAllowed: boolean;
    isLoggedIn: boolean;
    user: Record<string, unknown> | null;
    errorReason?: string;
  } => {
    const user = getStoredUser();
    const token = getStoredToken();

    if (!token || !user) {
      return {
        isAllowed: false,
        isLoggedIn: false,
        user: null,
        errorReason: "กรุณาเข้าสู่ระบบก่อนเข้าใช้งานหน้านี้"
      };
    }

    const hasPermission = isAdminAuthorized(user, allowedRoles);
    if (!hasPermission) {
      return {
        isAllowed: false,
        isLoggedIn: true,
        user,
        errorReason: "คุณไม่มีสิทธิ์เข้าถึงหน้านี้ เฉพาะผู้ดูแลระบบ (Admin/Dev/Staff) เท่านั้น"
      };
    }

    return { isAllowed: true, isLoggedIn: true, user };
  }, [allowedRoles]);

  const [authStatus, setAuthStatus] = useState(checkAuthorization);

  const evictUnauthorizedUser = useCallback(
    (statusResult: ReturnType<typeof checkAuthorization>) => {
      if (statusResult.isAllowed) return;

      const targetRedirect =
        redirectPath || (statusResult.isLoggedIn ? "/dashboard" : "/linelogin");

      navigate(targetRedirect, { replace: true, state: { from: location.pathname } });
    },
    [navigate, redirectPath, location.pathname]
  );

  // ตรวจสอบสิทธิ์เมื่อแรกเข้า path หรือ route เปลี่ยน
  useEffect(() => {
    const localResult = checkAuthorization();
    setAuthStatus(localResult);

    if (!localResult.isAllowed) {
      // กรณี 1: ยังไม่ได้ login หรือ session ใน sessionStorage ไม่มีสิทธิ์ admin
      // ให้ลองยิง /verifyadmin เพื่อ verify กับ server ดูว่ามีสิทธิ์หรือไม่
      if (localResult.isLoggedIn && !hasCheckedInitialRef.current) {
        hasCheckedInitialRef.current = true;
        verifyAdminStatusFromApi().then((updatedUser) => {
          if (updatedUser) {
            const recheck = checkAuthorization();
            setAuthStatus(recheck);
            if (!recheck.isAllowed) {
              evictUnauthorizedUser(recheck);
            }
          } else {
            evictUnauthorizedUser(localResult);
          }
        });
      } else {
        evictUnauthorizedUser(localResult);
      }
    } else {
      // กรณี 2: ใน sessionStorage มี is_status หรือ role ที่เป็น admin แล้ว เข้าใช้งานได้เลย ไม่ต้องยิง API ซ้ำ
      hasCheckedInitialRef.current = true;
    }
  }, [location.pathname, checkAuthorization, evictUnauthorizedUser]);

  // ดักฟังการเปลี่ยนแปลงของ sessionStorage (เช่น กรณี logout จากแท็บอื่น)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "user" || e.key === "access_token" || e.key === null) {
        const result = checkAuthorization();
        setAuthStatus(result);
        if (!result.isAllowed) {
          evictUnauthorizedUser(result);
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [checkAuthorization, evictUnauthorizedUser]);

  if (!authStatus.isAllowed) {
    return (
      <ErrorPage
        type="403"
        title="403"
        subTitle={authStatus.errorReason || "คุณไม่มีสิทธิ์เข้าถึงหน้านี้"}
      />
    );
  }

  return <Outlet />;
};
