import type { AdminUser, AuditLogRecord, BanUserPayload, EventLogRecord, UpdateRolePayload } from "../types/admin";
import adminUsersData from "../data/mock/adminUsers.json";
import auditLogsData from "../data/mock/auditLogs.json";
import eventLogsData from "../data/mock/eventLogs.json";

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
