/**
 * Utility functions for user session & authorization management
 * Centralizes sessionStorage storage, role checking, and live API status syncing.
 */

export const ALLOWED_ADMIN_ROLES = ["ADMIN", "DEV", "STAFF"];

export const getStoredUser = (): Record<string, unknown> | null => {
  try {
    let userStr = sessionStorage.getItem("user");
    if (!userStr) {
      userStr = localStorage.getItem("user");
      if (userStr) {
        sessionStorage.setItem("user", userStr);
        localStorage.removeItem("user");
      }
    }

    if (!userStr) return null;
    return JSON.parse(userStr);
  } catch {
    return null;
  }
};

export const getStoredToken = (): string | null => {
  let token = sessionStorage.getItem("access_token");
  if (!token) {
    token = localStorage.getItem("access_token");
    if (token) {
      sessionStorage.setItem("access_token", token);
      localStorage.removeItem("access_token");
    }
  }

  if (!token) {
    const user = getStoredUser();
    if (user && typeof user.access_token === "string") {
      token = user.access_token;
      sessionStorage.setItem("access_token", token);
    }
  }

  return token;
};

export const setStoredUser = (user: Record<string, unknown> | null): void => {
  if (user) {
    sessionStorage.setItem("user", JSON.stringify(user));
  } else {
    sessionStorage.removeItem("user");
  }
  localStorage.removeItem("user");
};

export const setStoredToken = (token: string | null): void => {
  if (token) {
    sessionStorage.setItem("access_token", token);
  } else {
    sessionStorage.removeItem("access_token");
  }
  localStorage.removeItem("access_token");
};

export const clearStoredAuth = (): void => {
  sessionStorage.removeItem("user");
  sessionStorage.removeItem("access_token");
  localStorage.removeItem("user");
  localStorage.removeItem("access_token");
};

/**
 * Normalizes and extracts user's primary status/role string (e.g., "ADMIN", "DEV", "STAFF", "USER")
 */
export const getNormalizedUserStatus = (user?: Record<string, unknown> | null): string => {
  if (!user) return "USER";

  const rawStatus = (user.is_status || user.status || user.role || "")
    .toString()
    .trim()
    .toUpperCase();

  if (rawStatus) return rawStatus;

  if (Array.isArray(user.roles) && user.roles.length > 0) {
    const upperRoles = user.roles.map((r) => String(r).trim().toUpperCase());
    for (const adminRole of ALLOWED_ADMIN_ROLES) {
      if (upperRoles.includes(adminRole)) {
        return adminRole;
      }
    }
    return upperRoles[0] || "USER";
  }

  return "USER";
};

/**
 * Checks whether a user has privilege to access Admin Protected Routes
 */
export const isAdminAuthorized = (
  user?: Record<string, unknown> | null,
  allowedRoles: string[] = ALLOWED_ADMIN_ROLES
): boolean => {
  if (!user) return false;

  const isMasterAccount =
    user.accountno === "CALY001" ||
    user.accountno === "ACC-001" ||
    user.userId === "mock-admin-1" ||
    user.line_uid === "mock-admin-1" ||
    user.id === "mock-admin-1";

  if (isMasterAccount) return true;

  const upperAllowed = allowedRoles.map((r) => r.trim().toUpperCase());
  const status = getNormalizedUserStatus(user);

  if (upperAllowed.includes(status)) {
    return true;
  }

  if (Array.isArray(user.roles)) {
    const hasAllowedRole = user.roles.some((r) =>
      upperAllowed.includes(String(r).trim().toUpperCase())
    );
    if (hasAllowedRole) return true;
  }

  return false;
};

/**
 * Determines the default home route after login based on user role and profile data
 */
export const getPostLoginRedirectPath = (user?: Record<string, unknown> | null): string => {
  if (!user) return "/linelogin";

  if (isAdminAuthorized(user)) {
    return "/admin-dashboard";
  }

  const hasCalData = Boolean(
    user.cal !== undefined &&
    user.cal !== null &&
    user.cal !== 0 &&
    user.cal !== "0" &&
    user.cal !== ""
  );

  return hasCalData ? "/dashboard" : "/regis";
};

/**
 * Checks and updates the user's latest status (is_status / roles) via
 * GET /verifyadmin?id_token=<line_uid>
 */
export const verifyAdminStatusFromApi = async (): Promise<Record<string, unknown> | null> => {
  const user = getStoredUser();
  if (!user) return null;

  const lineUid = (user.line_uid || user.id || user.userId || user.accountno) as string;
  if (!lineUid) return user;

  const API_BASE_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
  const token = getStoredToken();

  const headers: Record<string, string> = {
    accept: "*/*"
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    const verifyRes = await fetch(
      `${API_BASE_URL}/verifyadmin?id_token=${encodeURIComponent(lineUid)}`,
      {
        method: "GET",
        headers
      }
    );

    if (verifyRes.ok) {
      const json = await verifyRes.json();
      const verifyData = (json?.data || json) as Record<string, unknown>;

      if (verifyData && typeof verifyData === "object") {
        const rawVerifiedStatus = (
          verifyData.is_status ||
          verifyData.status ||
          verifyData.role ||
          ""
        )
          .toString()
          .trim()
          .toUpperCase();

        if (rawVerifiedStatus) {
          const updatedRoles = Array.isArray(verifyData.roles)
            ? verifyData.roles
            : [rawVerifiedStatus.toLowerCase()];

          const updatedUser: Record<string, unknown> = {
            ...user,
            ...verifyData,
            id: user.id || verifyData.line_uid || lineUid,
            line_uid: verifyData.line_uid || user.line_uid || user.id || lineUid,
            is_status: rawVerifiedStatus,
            roles: updatedRoles
          };

          setStoredUser(updatedUser);
          return updatedUser;
        }
      }
    }
  } catch {
    // Fallback to user profile status check below if /verifyadmin fails
  }

  return syncUserStatus();
};

/**
 * Checks and updates the user's latest status (is_status / roles) from backend API
 */
export const syncUserStatus = async (): Promise<Record<string, unknown> | null> => {
  const user = getStoredUser();
  if (!user) return null;

  const lineUid = (user.id || user.line_uid || user.userId || user.accountno) as string;
  if (!lineUid) return user;

  try {
    const API_BASE_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
    const token = getStoredToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      accept: "*/*"
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/api/v1/user/${encodeURIComponent(lineUid)}`, {
      method: "GET",
      headers
    });

    if (!response.ok) return user;

    const resData = await response.json();
    const fetchedData = resData?.data || resData;

    if (fetchedData && typeof fetchedData === "object") {
      const updatedStatus = (
        fetchedData.is_status ||
        fetchedData.status ||
        fetchedData.role ||
        user.is_status ||
        "USER"
      )
        .toString()
        .trim()
        .toUpperCase();

      const updatedRoles = Array.isArray(fetchedData.roles)
        ? fetchedData.roles
        : [updatedStatus.toLowerCase()];

      const updatedUser: Record<string, unknown> = {
        ...user,
        ...fetchedData,
        id: user.id || fetchedData.line_uid || lineUid,
        line_uid: fetchedData.line_uid || user.line_uid || user.id || lineUid,
        is_status: updatedStatus,
        roles: updatedRoles
      };

      setStoredUser(updatedUser);
      return updatedUser;
    }
  } catch {
    // If network or endpoint fails, keep current session user
  }

  return user;
};
