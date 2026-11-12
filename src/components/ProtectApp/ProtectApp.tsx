import { useState, useEffect } from "react";
import { Navigate, Outlet } from "react-router-dom";
import LoadingOverlay from "../Loading/LoadingOverlay";
import { getStoredUser } from "../../utils/sessionAuth";
import { getUserService } from "../../services/user.service";

type AuthStatus = "checking" | "authenticated" | "unauthenticated" | "unregistered";

export const ProtectApp = () => {
  const initialUser = getStoredUser();
  const initialUid = String(
    initialUser?.id || initialUser?.line_uid || initialUser?.userId || ""
  );
  const [status, setStatus] = useState<AuthStatus>(
    initialUid ? "authenticated" : "unauthenticated"
  );

  useEffect(() => {
    let isMounted = true;

    const verifyUser = async () => {
      const storedUser = getStoredUser();
      const lineUid = String(
        storedUser?.id || storedUser?.line_uid || storedUser?.userId || ""
      );

      if (!lineUid) {
        if (isMounted) setStatus("unauthenticated");
        return;
      }

      try {
        const res = await getUserService(lineUid);
        if (!isMounted) return;

        if (res?.success && res?.data) {
          setStatus("authenticated");
        } else {
          setStatus("unregistered");
        }
      } catch {
        if (isMounted) setStatus("unregistered");
      }
    };

    verifyUser();

    return () => {
      isMounted = false;
    };
  }, []);

  if (status === "checking") {
    return <LoadingOverlay show={true} />;
  }

  if (status === "unauthenticated") {
    return <Navigate to="/linelogin" replace />;
  }

  if (status === "unregistered") {
    return <Navigate to="/regis" replace />;
  }

  return <Outlet />;
};
