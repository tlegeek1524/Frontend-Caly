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

export type RailwayCompareData = {
  cpuUsage?: {
    max: string;
    used: string;
    maxValue: number;
    usedValue: number;
    unit: string;
    usagePercent: number;
  };
  memoryRam?: {
    max: string;
    used: string;
    maxGb: number;
    usedGb: number;
    unit: string;
    usagePercent: number;
  };
  storageDisk?: {
    max: string;
    used: string;
    maxGb: number;
    usedGb: number;
    unit: string;
    usagePercent: number;
  };
  databaseStorage?: {
    max: string;
    used: string;
    maxGb: number;
    usedGb: number;
    usedBytes: number;
    connections?: {
      max: number;
      used: number;
    };
    usagePercent: number;
  };
};

export type DashboardCountResponse = {
  Image_food?: {
    count: number;
  };
  User?: {
    count: number;
  };
};

export type TimeIntervalType =
  | "second" | "1s" | "5s" | "10s" | "30s"
  | "minute" | "1m" | "5m" | "15m" | "30m"
  | "hour"   | "1h"
  | "day"    | "1d"
  | "week"   | "month";

export type TimelineQueryParams = {
  interval?: TimeIntervalType;
  date?: string;          // YYYY-MM-DD
  from?: string;          // ISO or YYYY-MM-DD HH:mm:ss
  to?: string;            // ISO or YYYY-MM-DD HH:mm:ss
  days?: number;
  hours?: number;
  minutes?: number;
  seconds?: number;
  path?: string;
  method?: string;        // e.g. "GET" or "GET,POST"
  status?: "all" | "success" | "fail";
  statusCode?: number;
  minDurationMs?: number;
  maxDurationMs?: number;
  sort?: "asc" | "desc";
  fillEmpty?: boolean;
  includeEndpoints?: boolean;
  timezone?: string;
};

export type RequestsTimelineEndpointItem = {
  rank?: number;
  method: string;
  endpoint: string;
  totalRequests: number;
  successCount: number;
  failCount: number;
  clientError4xx?: number;
  serverError5xx?: number;
  errorCount?: number;
  successRate: number;
  failRate: number;
  percentageOfAll?: number;
  avgDurationMs: number;
  minDurationMs?: number;
  maxDurationMs?: number;
  lastAccessedAt?: string;
};

export type RequestsTimelineBucket = {
  timeBucket: string;
  timestamp?: number;
  label?: string;
  localTime?: string;
  totalRequests: number;
  successCount: number;
  failCount: number;
  clientError4xx?: number;
  serverError5xx?: number;
  successRate: number;
  failRate: number;
  avgDurationMs: number;
  minDurationMs?: number;
  maxDurationMs?: number;
  endpoints?: RequestsTimelineEndpointItem[];
};

export type RequestsTimelineResponse = {
  success: boolean;
  source?: "database" | "memory" | string;
  filter?: {
    interval: string;
    sort?: "asc" | "desc";
    fillEmpty?: boolean;
    timeRange: string;
    from?: string | null;
    to?: string | null;
    path: string;
    method?: string;
    status?: string;
    statusCode?: number | string;
    minDurationMs?: number | null;
    maxDurationMs?: number | null;
    timezone?: string;
  };
  summary?: {
    totalRequests: number;
    successCount: number;
    failCount: number;
    clientError4xx?: number;
    serverError5xx?: number;
    successRate: number;
    failRate: number;
    avgDurationMs?: number;
    minDurationMs?: number;
    maxDurationMs?: number;
    peakTimeSlot?: {
      timeBucket: string;
      label: string;
      localTime: string;
      totalRequests: number;
      successCount: number;
      failCount: number;
    } | null;
  };
  chartData?: {
    labels: string[];
    localTimes: string[];
    timestamps: string[];
    series: {
      totalRequests: number[];
      successCount: number[];
      failCount: number[];
      avgDurationMs: number[];
    };
  };
  timeSlotsCount?: number;
  timeSeries: RequestsTimelineBucket[];
  endpointsSummary: RequestsTimelineEndpointItem[];
};




