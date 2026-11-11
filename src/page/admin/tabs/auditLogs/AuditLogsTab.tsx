import { useState, useEffect } from "react";
import { fetchAuditLogsService } from "../../../../services/adminService";
import type { AuditLogRecord } from "../../../../types/admin";
import { AdminLogDetailModal } from "../../components/AdminModals";
import { AuditLogsTab as AuditLogsTabUI } from "./AuditLogsTabUI";

export const AuditLogsTab = () => {
  const [logs, setLogs] = useState<AuditLogRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLog, setSelectedLog] = useState<AuditLogRecord | null>(null);

  const loadAuditLogs = async () => {
    setIsLoading(true);
    try {
      const data = await fetchAuditLogsService();
      setLogs(data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAuditLogs();
  }, []);

  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
    const filename = `caly_export_logs_${new Date().toISOString().slice(0, 10)}.csv`;

    csvContent += "Record ID,Operator,Username,IP Address,Timestamp,Active Status\n";
    logs.forEach((l) => {
      csvContent += `"${l.record_id}","${l.user_detail?.full_name || ""}","${l.decoded_sessions?.username || ""}","${l.ip_address || ""}","${l.created_at || ""}","${l.is_active ? "Active" : "Expired"}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredLogs = logs.filter((log) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const name = (log.user_detail?.full_name || "").toLowerCase();
    const uname = (log.decoded_sessions?.username || "").toLowerCase();
    const ip = (log.ip_address || "").toLowerCase();
    return name.includes(query) || uname.includes(query) || ip.includes(query);
  });

  return (
    <>
      <AuditLogsTabUI
        logs={filteredLogs}
        isLoading={isLoading}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSelectLog={setSelectedLog}
        onExportCSV={handleExportCSV}
      />
      <AdminLogDetailModal log={selectedLog} onClose={() => setSelectedLog(null)} />
    </>
  );
};
