export type UserRole = "admin" | "dev" | "user";

export type AdminUser = {
  accountno: string;
  full_name?: string;
  username?: string;
  email?: string;
  roles?: UserRole[] | UserRole;
  is_banned?: boolean;
};

export type AuditLogRecord = {
  record_id: string;
  ip_address?: string;
  created_at?: string;
  is_active?: boolean;
  user_agent?: string;
  session_id?: string;
  user_detail?: {
    full_name?: string;
  };
  decoded_sessions?: {
    username?: string;
    accountno?: string;
  };
};

export type EventLogRecord = {
  event_id: string;
  timestamp: string;
  category: "auth" | "system" | "user" | "security";
  action: string;
  detail: string;
  level: "info" | "warning" | "error" | "success";
  operator: string;
  ip_address: string;
};

export type GeoLocationRecord = {
  id: string;
  userName: string;
  accountno: string;
  foodName: string;
  calories: number;
  imageUrl: string;
  latitude: number;
  longitude: number;
  locationName: string;
  timestamp: string;
};

export type BanUserPayload = {
  accountno: string;
  ban_reason?: string;
  ban_end_date?: string;
};

export type UpdateRolePayload = {
  accountno: string;
  roles: UserRole[];
};
