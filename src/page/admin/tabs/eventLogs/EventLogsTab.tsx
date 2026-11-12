import { useState, useEffect } from "react";
import { fetchEventLogsService } from "../../../../services/adminService";
import type { EventLogRecord } from "../../../../types/admin";
import { EventLogsTab as EventLogsTabUI } from "./EventLogsTabUI";

export const EventLogsTab = () => {
  const [eventLogs, setEventLogs] = useState<EventLogRecord[]>([]);
  const [loading, setLoading] = useState(false);

  const loadEventLogs = async () => {
    setLoading(true);
    try {
      const data = await fetchEventLogsService();
      setEventLogs(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEventLogs();
  }, []);

  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
    const filename = `caly_export_event_logs_${new Date().toISOString().slice(0, 10)}.csv`;

    csvContent += "Event ID,Timestamp,Category,Action,Detail,Level,Operator,IP Address\n";
    eventLogs.forEach((e) => {
      csvContent += `"${e.event_id}","${e.timestamp}","${e.category}","${e.action}","${e.detail}","${e.level}","${e.operator}","${e.ip_address}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <EventLogsTabUI
      eventLogs={eventLogs}
      loading={loading}
      onExportCSV={handleExportCSV}
    />
  );
};
