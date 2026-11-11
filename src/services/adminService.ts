import type {
  AdminUser,
  AuditLogRecord,
  BanUserPayload,
  EventLogRecord,
  UpdateRolePayload,
  RailwayCompareData,
  DashboardCountResponse,
  RequestsTimelineResponse,
  TimelineQueryParams,
  RoleDropdownItem,
  RoleDropdownResponse,
  FoodLocationItem,
  FoodLocationPagination,
  FoodLocationsApiResponse,
  GeoLocationRecord,
  ProvinceStatisticItem,
  ProvinceStatisticResponse
} from "../types/admin";
import adminUsersData from "../data/mock/adminUsers.json";
import auditLogsData from "../data/mock/auditLogs.json";
import eventLogsData from "../data/mock/eventLogs.json";

import { getStoredToken } from "../utils/sessionAuth";

const API_BASE_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

export const MOCK_ADMIN_USERS: AdminUser[] = adminUsersData as AdminUser[];
export const MOCK_AUDIT_LOGS: AuditLogRecord[] = auditLogsData as AuditLogRecord[];
export const MOCK_EVENT_LOGS: EventLogRecord[] = eventLogsData as EventLogRecord[];

export const MOCK_ROLE_DROPDOWN: RoleDropdownItem[] = [
  { id: 1, role: "ADMIN", priority: 1 },
  { id: 2, role: "STAFF", priority: 2 },
  { id: 3, role: "DEV", priority: 3 },
  { id: 4, role: "USER", priority: 4 }
];

export const fetchRoleDropdownService = async (): Promise<RoleDropdownItem[]> => {
  try {
    const token = getStoredToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      accept: "*/*"
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/api/v1/admin/get-all-role-dropdown`, {
      method: "GET",
      headers
    });

    if (!response.ok) {
      return [...MOCK_ROLE_DROPDOWN];
    }

    const resData: RoleDropdownResponse | RoleDropdownItem[] = await response.json();
    if (Array.isArray(resData)) {
      return resData;
    }
    if (Array.isArray(resData?.data)) {
      return resData.data;
    }
    return [...MOCK_ROLE_DROPDOWN];
  } catch (error) {
    console.error("[AdminService] fetchRoleDropdownService error:", error);
    return [...MOCK_ROLE_DROPDOWN];
  }
};

export const fetchAuditLogsService = async (): Promise<AuditLogRecord[]> => {
  return [...MOCK_AUDIT_LOGS];
};

export const fetchEventLogsService = async (): Promise<EventLogRecord[]> => {
  return [...MOCK_EVENT_LOGS];
};

export const fetchAllUsersService = async (): Promise<AdminUser[]> => {
  try {
    const token = getStoredToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/api/v1/admin/users`, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      return [...MOCK_ADMIN_USERS];
    }

    const resData = await response.json();
    const rawList: Record<string, unknown>[] = Array.isArray(resData)
      ? resData
      : Array.isArray(resData?.data)
      ? resData.data
      : Array.isArray(resData?.users)
      ? resData.users
      : [];

    if (rawList.length > 0) {
      return rawList.map((item) => {
        const lineUid = (item.line_uid as string) || "";
        const rawStatus = (item.is_status as string) || "";
        const normalizedStatus = rawStatus.toUpperCase();
        const roles: UserRole[] = normalizedStatus
          ? [normalizedStatus]
          : Array.isArray(item.roles)
          ? (item.roles as UserRole[])
          : ["USER"];

        return {
          accountno: (item.accountno as string) || lineUid || "—",
          line_uid: lineUid,
          full_name: (item.full_name as string) || (item.display_name as string) || undefined,
          username: (item.username as string) || (item.display_name as string) || undefined,
          display_name: (item.display_name as string) || null,
          email: (item.email as string) || undefined,
          roles,
          is_status: rawStatus || "USER",
          gender: (item.gender as string) || undefined,
          age: typeof item.age === "number" ? item.age : undefined,
          weight: typeof item.weight === "number" ? item.weight : undefined,
          height: typeof item.height === "number" ? item.height : undefined,
          activity_level: (item.activity_level as string) || undefined,
          goal: (item.goal as string) || undefined,
          cal: typeof item.cal === "number" ? item.cal : undefined,
          is_banned: Boolean(item.is_banned),
          created_at: (item.created_at as string) || null,
          updated_at: (item.updated_at as string) || null,
        };
      });
    }
    return [...MOCK_ADMIN_USERS];
  } catch (error) {
    return [...MOCK_ADMIN_USERS];
  }
};

export const updateRoleService = async (payload: UpdateRolePayload): Promise<boolean> => {
  try {
    const lineUid = payload.line_uid || payload.accountno;
    if (!lineUid) {
      return false;
    }

    const token = getStoredToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      accept: "*/*"
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const statusValue = (payload.is_status || (payload.roles && payload.roles[0]) || "USER").toUpperCase();

    const response = await fetch(`${API_BASE_URL}/api/v1/admin/users/${encodeURIComponent(lineUid)}/status`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({
        is_status: statusValue
      })
    });

    return response.ok;
  } catch (error) {
    console.error("[AdminService] updateRoleService error:", error);
    return false;
  }
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
    const token = getStoredToken();
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
    const token = getStoredToken();
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
    const token = getStoredToken();
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

export const mapFoodLocationItemsToGeoRecords = (
  items: FoodLocationItem[]
): GeoLocationRecord[] => {
  const records: GeoLocationRecord[] = [];

  items.forEach((loc) => {
    const lat = Number(loc.latitude);
    const lng = Number(loc.longitude);
    if (Number.isNaN(lat) || Number.isNaN(lng)) return;

    const locationLabel =
      loc.address ||
      loc.location_name ||
      [loc.subdistrict, loc.district, loc.province].filter(Boolean).join(" ") ||
      "ไม่ระบุสถานที่";

    const menus = Array.isArray(loc.menus) && loc.menus.length > 0 ? loc.menus : [];

    if (menus.length > 0) {
      menus.forEach((m) => {
        records.push({
          id: `${loc.id}-${m.id}`,
          locationId: loc.id,
          locatRefId: loc.locat_ref_id,
          userName: "",
          accountno: loc.locat_ref_id || String(loc.id),
          foodName: m.menu || loc.location_name || "เมนูอาหาร",
          calories: Number(m.cal ?? 0),
          protein: typeof m.protein === "number" ? m.protein : undefined,
          carb: typeof m.carb === "number" ? m.carb : undefined,
          fat: typeof m.fat === "number" ? m.fat : undefined,
          imageUrl: m.image_url || "",
          latitude: lat,
          longitude: lng,
          locationName: locationLabel,
          address: loc.address || undefined,
          subdistrict: loc.subdistrict || undefined,
          district: loc.district || undefined,
          province: loc.province || undefined,
          postalCode: loc.postal_code || undefined,
          timestamp: m.date || loc.created_at || new Date().toISOString()
        });
      });
    } else {
      records.push({
        id: `${loc.id}`,
        locationId: loc.id,
        locatRefId: loc.locat_ref_id,
        userName: "",
        accountno: loc.locat_ref_id || String(loc.id),
        foodName: loc.location_name || "พิกัดสถานที่",
        calories: 0,
        imageUrl: "",
        latitude: lat,
        longitude: lng,
        locationName: locationLabel,
        address: loc.address || undefined,
        subdistrict: loc.subdistrict || undefined,
        district: loc.district || undefined,
        province: loc.province || undefined,
        postalCode: loc.postal_code || undefined,
        timestamp: loc.created_at || new Date().toISOString()
      });
    }
  });

  return records;
};

export const fetchFoodLocationsService = async (
  page = 1,
  limit = 10
): Promise<{
  success: boolean;
  data: GeoLocationRecord[];
  rawItems: FoodLocationItem[];
  pagination: FoodLocationPagination;
  message?: string;
}> => {
  const defaultPagination: FoodLocationPagination = {
    total: 0,
    page,
    limit,
    totalPages: 1,
    hasNext: false,
    hasPrevious: false
  };

  try {
    const token = getStoredToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      accept: "application/json"
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const query = new URLSearchParams({
      page: String(page),
      limit: String(limit)
    });

    const response = await fetch(`${API_BASE_URL}/api/food-locations?${query.toString()}`, {
      method: "GET",
      headers
    });

    if (!response.ok) {
      return {
        success: false,
        data: [],
        rawItems: [],
        pagination: defaultPagination,
        message: response.statusText
      };
    }

    const resData: FoodLocationsApiResponse = await response.json();
    const rawItems = Array.isArray(resData?.data) ? resData.data : [];
    const mappedRecords = mapFoodLocationItemsToGeoRecords(rawItems);
    const pagination: FoodLocationPagination = resData?.pagination || {
      total: rawItems.length,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(rawItems.length / limit)),
      hasNext: false,
      hasPrevious: page > 1
    };

    return {
      success: resData?.status === "success" || response.ok,
      data: mappedRecords,
      rawItems,
      pagination,
      message: resData?.message
    };
  } catch (error) {
    console.error("[AdminService] fetchFoodLocationsService error:", error);
    return {
      success: false,
      data: [],
      rawItems: [],
      pagination: defaultPagination
    };
  }
};

export const fetchProvinceStatisticsService = async (params?: {
  province?: string;
}): Promise<{
  success: boolean;
  data: ProvinceStatisticItem[];
  pagination?: FoodLocationPagination;
  message?: string;
}> => {
  try {
    const token = getStoredToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      accept: "application/json"
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const query = new URLSearchParams();
    if (params?.province && params.province !== "all") {
      query.set("province", params.province);
    }

    const queryString = query.toString();
    const url = `${API_BASE_URL}/api/food-locations/provinces${queryString ? `?${queryString}` : ""}`;

    const response = await fetch(url, {
      method: "GET",
      headers
    });

    if (!response.ok) {
      return {
        success: false,
        data: [],
        message: response.statusText
      };
    }

    const resData: ProvinceStatisticResponse = await response.json();
    return {
      success: resData?.status === "success" || response.ok,
      data: Array.isArray(resData?.data) ? resData.data : [],
      pagination: resData?.pagination,
      message: resData?.message
    };
  } catch (error) {
    console.error("[AdminService] fetchProvinceStatisticsService error:", error);
    return {
      success: false,
      data: []
    };
  }
};






