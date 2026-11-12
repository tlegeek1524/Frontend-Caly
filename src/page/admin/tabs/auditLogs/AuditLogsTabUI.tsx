import { Card, Table, Tag, Input, Button } from "antd";
import { SearchOutlined, DownloadOutlined } from "@ant-design/icons";
import type { AuditLogRecord } from "../../../../types/admin";
import { AdminFilterBar } from "../../components/AdminFilterBar";

type AuditLogsTabProps = {
  logs: AuditLogRecord[];
  isLoading: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSelectLog: (log: AuditLogRecord) => void;
  onExportCSV?: () => void;
};

export const AuditLogsTab = ({
  logs,
  isLoading,
  searchQuery,
  onSearchChange,
  onSelectLog,
  onExportCSV
}: AuditLogsTabProps) => {
  const columns = [
    {
      title: "ผู้ดำเนินการ",
      key: "operator",
      width: 180,
      render: (_: unknown, record: AuditLogRecord) => (
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <div style={{ fontWeight: 600, color: "#1e293b", fontSize: 13, lineHeight: 1.3 }}>
            {record.user_detail?.full_name || record.decoded_sessions?.username || "ไม่ระบุชื่อ"}
          </div>
          <div style={{ fontSize: 11, color: "#64748b", fontFamily: "ui-monospace, monospace", lineHeight: 1.2 }}>
            @{record.decoded_sessions?.username || "guest"}
          </div>
        </div>
      )
    },
    {
      title: "IP Address",
      dataIndex: "ip_address",
      key: "ip_address",
      width: 140,
      render: (text: string | undefined) => (
        <span style={{ fontFamily: "ui-monospace, monospace", fontSize: 12, color: "#334155" }}>
          {text || "—"}
        </span>
      )
    },
    {
      title: "วันและเวลา",
      dataIndex: "created_at",
      key: "created_at",
      width: 170,
      render: (text: string | undefined) => (
        <span style={{ fontSize: 12, color: "#64748b" }}>
          {text || "—"}
        </span>
      )
    },
    {
      title: "สถานะ",
      dataIndex: "is_active",
      key: "is_active",
      width: 90,
      align: "center" as const,
      render: (isActive: boolean | undefined) => (
        <Tag color={isActive ? "success" : "default"} style={{ margin: 0 }}>
          {isActive ? "Active" : "Expired"}
        </Tag>
      )
    }
  ];

  return (
    <div className="admin-audit-logs-container">
      {/* Global Unified Filter Bar */}
      <AdminFilterBar
        leftContent={
          <>
            <Input
              prefix={<SearchOutlined style={{ color: "#9ca3af" }} />}
              placeholder="ค้นหาตามชื่อ หรือ IP Address..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="admin-dashboard-search-input"
              allowClear
              style={{ maxWidth: 280 }}
            />
            <span className="admin-dashboard-filter-label" style={{ color: "#64748b", fontWeight: 500 }}>
              รวม <strong style={{ color: "#1677ff", margin: "0 4px" }}>{logs.length}</strong> รายการ
            </span>
          </>
        }
        rightContent={
          onExportCSV && (
            <Button icon={<DownloadOutlined />} onClick={onExportCSV}>
              ส่งออก CSV
            </Button>
          )
        }
      />

      <Card variant="borderless" className="admin-dashboard-card" styles={{ body: { padding: "12px 16px" } }}>
        <Table
          dataSource={logs}
          columns={columns}
          rowKey="record_id"
          loading={isLoading}
          pagination={{ pageSize: 8, responsive: true }}
          size="small"
          scroll={{ x: 550 }}
          onRow={(record) => ({
            onClick: () => onSelectLog(record),
            style: { cursor: "pointer" }
          })}
        />
      </Card>
    </div>
  );
};
