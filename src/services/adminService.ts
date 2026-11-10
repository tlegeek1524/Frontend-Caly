import type {
  AdminUser,
  AuditLogRecord,
  BanUserPayload,
  EventLogRecord,
  UpdateRolePayload,
  RailwayCompareData,
  DashboardCountResponse,
  RequestsTimelineResponse,
  TimelineQueryParams
} from "../types/admin";
import adminUsersData from "../data/mock/adminUsers.json";
import auditLogsData from "../data/mock/auditLogs.json";
import eventLogsData from "../data/mock/eventLogs.json";

const API_BASE_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

export const MOCK_ADMIN_USERS: AdminUser[] = adminUsersData as AdminUser[];
export const MOCK_AUDIT_LOGS: AuditLogRecord[] = auditLogsData as AuditLogRecord[];
export const MOCK_EVENT_LOGS: EventLogRecord[] = eventLogsData as EventLogRecord[];

export const fetchAuditLogsService = async (): Promise<AuditLogRecord[]> => {
  return [...MOCK_AUDIT_LOGS];
};

export const fetchEventLogsService = async (): Promise<EventLogRecord[]> => {
  return [...MOCK_EVENT_LOGS];
};

export const fetchAllUsersService = async (): Promise<AdminUser[]> => {
  return [...MOCK_ADMIN_USERS];
};

export const updateRoleService = async (_payload: UpdateRolePayload): Promise<boolean> => {
  return true;
};

export const banUserService = async (_payload: BanUserPayload): Promise<{ success: boolean; message?: string }> => {
  return { success: true, message: "ระงับการใช้งานสำเร็จ" };
};

export const fetchRailwayCompareService = async (): Promise<{
  success: boolean;
  data?: RailwayCompareData;
  serverTimeMs?: number;
  error?: unknown;
}> => {
  try {
    const token = localStorage.getItem("access_token");
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/api/railway/compare`, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      return { success: false, error: response.statusText };
    }

    const dateHeader = response.headers.get("date");
    const resData = await response.json();
    const rawServerTime = resData?.timestamp || resData?.serverTime || resData?.data?.timestamp || dateHeader;
    const parsedTime = rawServerTime ? Date.parse(String(rawServerTime)) : NaN;

    return {
      success: resData.success ?? true,
      data: resData.data || resData,
      serverTimeMs: !Number.isNaN(parsedTime) ? parsedTime : undefined,
    };
  } catch (error) {
    console.error("[AdminService] fetchRailwayCompareService error:", error);
    return { success: false, error };
  }
};

export const fetchDashboardCountService = async (): Promise<{
  success: boolean;
  data?: DashboardCountResponse;
  error?: unknown;
}> => {
  try {
    const token = localStorage.getItem("access_token");
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/dashboard/count`, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      return { success: false, error: response.statusText };
    }

    const resData = await response.json();
    return {
      success: true,
      data: resData?.data || resData,
    };
  } catch (error) {
    console.error("[AdminService] fetchDashboardCountService error:", error);
    return { success: false, error };
  }
};

export const fetchRequestsTimelineService = async (params?: TimelineQueryParams): Promise<{
  success: boolean;
  data?: RequestsTimelineResponse;
  error?: unknown;
}> => {
  try {
    const token = localStorage.getItem("access_token");
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== "") {
          query.set(key, String(val));
        }
      });
    }

    const queryString = query.toString();
    const url = `${API_BASE_URL}/api/railway/requests-timeline${queryString ? `?${queryString}` : ""}`;

    const response = await fetch(url, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      return { success: false, error: response.statusText };
    }

    const resData = await response.json();
    return {
      success: resData?.success ?? true,
      data: resData,
    };
  } catch (error) {
    console.error("[AdminService] fetchRequestsTimelineService error:", error);
    return { success: false, error };
  }
};




