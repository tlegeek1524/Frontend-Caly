export type UserRole = "admin" | "dev" | "staff" | "user" | string;

export type RoleDropdownItem = {
  id: number;
  role: string;
  priority: number;
};

export type RoleDropdownResponse = {
  status: string;
  total?: number;
  data: RoleDropdownItem[];
};

export type AdminUser = {
  accountno: string;
  line_uid?: string;
  full_name?: string;
  username?: string;
  display_name?: string | null;
  email?: string;
  roles?: UserRole[] | UserRole;
  is_status?: string;
  gender?: "male" | "female" | string;
  age?: number;
  weight?: number;
  height?: number;
  activity_level?: string;
  goal?: string;
  cal?: number;
  is_banned?: boolean;
  created_at?: string | null;
  updated_at?: string | null;
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

export type FoodLocationMenuItem = {
  id: number;
  menu: string;
  cal: number;
  protein: number;
  carb: number;
  fat: number;
  image_url: string;
  date: string;
};

export type FoodLocationItem = {
  id: number;
  line_uid: string;
  locat_ref_id: string;
  location_name: string | null;
  latitude: string | number;
  longitude: string | number;
  address: string | null;
  subdistrict: string | null;
  district: string | null;
  province: string | null;
  postal_code: string | null;
  country: string | null;
  country_code: string | null;
  map_provider: string | null;
  provider_place_id: string | null;
  map_url: string | null;
  map_zoom: number | null;
  location_type: string | null;
  description: string | null;
  phone: string | null;
  website: string | null;
  accuracy_m: string | number | null;
  source_type: string | null;
  provider_data: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  menu_count: number;
  menus: FoodLocationMenuItem[];
};

export type FoodLocationPagination = {
  total: number;
  total_records?: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
};

export type ProvinceStatisticItem = {
  province: string;
  count: number;
  location_count: number;
};

export type ProvinceStatisticResponse = {
  status: string;
  message?: string;
  data: ProvinceStatisticItem[];
  pagination?: FoodLocationPagination;
};

export type FoodLocationsApiResponse = {
  status: string;
  message?: string;
  data: FoodLocationItem[];
  pagination?: FoodLocationPagination;
};

export type GeoLocationRecord = {
  id: string;
  locationId?: number;
  locatRefId?: string;
  lineUid?: string;
  userName: string;
  accountno: string;
  foodName: string;
  calories: number;
  protein?: number;
  carb?: number;
  fat?: number;
  imageUrl: string;
  latitude: number;
  longitude: number;
  locationName: string;
  address?: string;
  subdistrict?: string;
  district?: string;
  province?: string;
  postalCode?: string;
  timestamp: string;
};

export type BanUserPayload = {
  accountno: string;
  ban_reason?: string;
  ban_end_date?: string;
};

export type UpdateRolePayload = {
  accountno?: string;
  line_uid?: string;
  roles?: UserRole[];
  is_status?: string;
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

export type ApiRequestLogRecord = {
  id: number;
  method: string;
  endpoint: string;
  statusCode: number;
  ip: string;
  durationMs: number;
  createdAt: string;
};

export type ApiRequestLogsFilter = {
  path?: string | null;
  method?: string | null;
  status?: string | null;
  date?: string | null;
};

export type ApiRequestLogsResponse = {
  success: boolean;
  filter?: ApiRequestLogsFilter;
  total: number;
  data: ApiRequestLogRecord[];
};

export type ApiRequestLogsQueryParams = {
  path?: string;
  method?: string;
  date?: string;
  status?: string;
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




