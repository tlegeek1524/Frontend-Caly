import { useState, useMemo } from "react";
import { Table, Tag, Input, Select, Typography, Card, Button, Pagination } from "antd";
import {
  SearchOutlined,
  DownloadOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
  AlertOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  GlobalOutlined,
  UserOutlined
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import type { EventLogRecord } from "../../../types/admin";
import { AdminFilterBar } from "../components/AdminFilterBar";

const { Text } = Typography;

type AdminEventLogsTabProps = {
  eventLogs: EventLogRecord[];
  loading?: boolean;
  onExportCSV?: () => void;
};

const CATEGORY_MAP: Record<EventLogRecord["category"], { text: string; color: string }> = {
  auth: { text: "การยืนยันตัวตน", color: "blue" },
  system: { text: "ระบบ", color: "purple" },
  user: { text: "ผู้ใช้งาน", color: "cyan" },
  security: { text: "ความปลอดภัย", color: "magenta" },
};

const LEVEL_MAP: Record<EventLogRecord["level"], { text: string; color: string; icon: React.ReactNode }> = {
  info: { text: "ข้อมูลทั่วไป", color: "processing", icon: <InfoCircleOutlined /> },
  success: { text: "สำเร็จ", color: "success", icon: <CheckCircleOutlined /> },
  warning: { text: "แจ้งเตือน", color: "warning", icon: <AlertOutlined /> },
  error: { text: "ข้อผิดพลาด", color: "error", icon: <CloseCircleOutlined /> },
};

export const AdminEventLogsTab = ({ eventLogs, loading = false, onExportCSV }: AdminEventLogsTabProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedLevel, setSelectedLevel] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  const filteredLogs = useMemo(() => {
    return eventLogs.filter((log) => {
      const matchSearch =
        searchTerm === "" ||
        log.event_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.detail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.operator.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.ip_address.includes(searchTerm);

      const matchCategory = selectedCategory === "all" || log.category === selectedCategory;
      const matchLevel = selectedLevel === "all" || log.level === selectedLevel;

      return matchSearch && matchCategory && matchLevel;
    });
  }, [eventLogs, searchTerm, selectedCategory, selectedLevel]);

  // สรุปสถานะด้านบน
  const statusStats = useMemo(() => {
    return {
      total: eventLogs.length,
      success: eventLogs.filter((l) => l.level === "success").length,
      warning: eventLogs.filter((l) => l.level === "warning").length,
      error: eventLogs.filter((l) => l.level === "error").length,
    };
  }, [eventLogs]);

  // แบ่งหน้าสำหรับ Mobile Feed Cards
  const pagedLogs = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredLogs.slice(start, start + pageSize);
  }, [filteredLogs, currentPage, pageSize]);

  const columns: ColumnsType<EventLogRecord> = [
    {
      title: "รหัสเหตุการณ์",
      dataIndex: "event_id",
      key: "event_id",
      width: 140,
      render: (id: string) => <Text strong code>{id}</Text>,
    },
    {
      title: "เวลาที่เกิดขึ้น",
      dataIndex: "timestamp",
      key: "timestamp",
      width: 170,
      render: (val: string) => (
        <span className="admin-dashboard-text-secondary">
          {new Date(val).toLocaleString("th-TH")}
        </span>
      ),
    },
    {
      title: "ประเภท",
      dataIndex: "category",
      key: "category",
      width: 130,
      render: (cat: EventLogRecord["category"]) => (
        <Tag color={CATEGORY_MAP[cat]?.color || "default"}>
          {CATEGORY_MAP[cat]?.text || cat}
        </Tag>
      ),
    },
    {
      title: "การกระทำ",
      dataIndex: "action",
      key: "action",
      render: (text: string, record: EventLogRecord) => (
        <div>
          <div style={{ fontWeight: 500, color: "#111827" }}>{text}</div>
          <div className="admin-dashboard-text-secondary" style={{ fontSize: 12 }}>
            {record.detail}
          </div>
        </div>
      ),
    },
    {
      title: "ระดับ",
      dataIndex: "level",
      key: "level",
      width: 110,
      render: (lvl: EventLogRecord["level"]) => {
        const item = LEVEL_MAP[lvl] || { text: lvl, color: "default", icon: null };
        return (
          <Tag color={item.color} icon={item.icon}>
            {item.text}
          </Tag>
        );
      },
    },
    {
      title: "ผู้ดำเนินการ",
      dataIndex: "operator",
      key: "operator",
      width: 140,
      render: (op: string) => (
        <Tag icon={<UserOutlined />} className="admin-event-operator-tag">
          {op}
        </Tag>
      ),
    },
    {
      title: "IP Address",
      dataIndex: "ip_address",
      key: "ip_address",
      width: 130,
      render: (ip: string) => <Text type="secondary">{ip}</Text>,
    },
  ];

  return (
    <div className="admin-event-logs-container">
      {/* Global Unified Filter Bar */}
      <AdminFilterBar
        leftContent={
          <>
            <Input
              placeholder="ค้นหาตามรหัส, เหตุการณ์, ผู้ดำเนินการ, IP..."
              prefix={<SearchOutlined style={{ color: "#9ca3af" }} />}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="admin-dashboard-search-input"
              allowClear
              style={{ maxWidth: 280 }}
            />
            <Select
              value={selectedCategory}
              onChange={(val) => {
                setSelectedCategory(val);
                setCurrentPage(1);
              }}
              style={{ width: 140 }}
              options={[
                { value: "all", label: "ทุกหมวดหมู่" },
                { value: "auth", label: "การยืนยันตัวตน" },
                { value: "system", label: "ระบบ" },
                { value: "user", label: "ผู้ใช้งาน" },
                { value: "security", label: "ความปลอดภัย" },
              ]}
            />
            <Select
              value={selectedLevel}
              onChange={(val) => {
                setSelectedLevel(val);
                setCurrentPage(1);
              }}
              style={{ width: 130 }}
              options={[
                { value: "all", label: "ทุกระดับ" },
                { value: "info", label: "ข้อมูลทั่วไป" },
                { value: "success", label: "สำเร็จ" },
                { value: "warning", label: "แจ้งเตือน" },
                { value: "error", label: "ข้อผิดพลาด" },
              ]}
            />
          </>
        }
        rightContent={
          onExportCSV && (
            <Button icon={<DownloadOutlined />} onClick={onExportCSV} size="middle">
              ส่งออก CSV
            </Button>
          )
        }
      />

      <Card variant="borderless" className="admin-dashboard-card" styles={{ body: { padding: 0 } }}>
        {/* Header Tab & Stats */}
        <div className="admin-event-logs-header">
          <div>
            <div className="admin-dashboard-card-title">บันทึกเหตุการณ์ระบบ (Event Logs)</div>
            <div className="admin-dashboard-card-subtitle">
              ติดตามกิจกรรมสำคัญ ตรวจสอบความปลอดภัย และเหตุการณ์ของระบบแบบเรียลไทม์
            </div>
          </div>
        </div>

        {/* Quick Summary Pill Bar */}
        <div className="admin-event-stats-bar">
          <div className="admin-event-stat-chip">
            <span className="admin-event-stat-label">ทั้งหมด</span>
            <span className="admin-event-stat-num">{statusStats.total}</span>
          </div>
          <div className="admin-event-stat-chip admin-event-stat-chip-success">
            <span className="admin-event-stat-label">สำเร็จ</span>
            <span className="admin-event-stat-num">{statusStats.success}</span>
          </div>
          {statusStats.warning > 0 && (
            <div className="admin-event-stat-chip admin-event-stat-chip-warning">
              <span className="admin-event-stat-label">แจ้งเตือน</span>
              <span className="admin-event-stat-num">{statusStats.warning}</span>
            </div>
          )}
          {statusStats.error > 0 && (
            <div className="admin-event-stat-chip admin-event-stat-chip-error">
              <span className="admin-event-stat-label">ข้อผิดพลาด</span>
              <span className="admin-event-stat-num">{statusStats.error}</span>
            </div>
          )}
        </div>

        {/* 1. Desktop & Tablet View: Clean Table */}
        <div className="admin-event-table-desktop">
          <Table
            dataSource={filteredLogs}
            columns={columns}
            rowKey="event_id"
            loading={loading}
            pagination={{ pageSize: 8, showSizeChanger: true }}
            scroll={{ x: 800 }}
          />
        </div>

        {/* 2. Mobile View: Modern Feed Cards */}
        <div className="admin-event-cards-mobile">
          {pagedLogs.length === 0 ? (
            <div className="admin-event-empty-state">ไม่พบรายการบันทึกเหตุการณ์</div>
          ) : (
            pagedLogs.map((item) => {
              const lvl = LEVEL_MAP[item.level] || { text: item.level, color: "default", icon: null };
              const cat = CATEGORY_MAP[item.category] || { text: item.category, color: "default" };

              return (
                <div key={item.event_id} className="admin-event-card-item">
                  <div className="admin-event-card-top">
                    <span className="admin-event-card-id">{item.event_id}</span>
                    <div className="admin-event-card-badges">
                      <Tag color={cat.color}>{cat.text}</Tag>
                      <Tag color={lvl.color} icon={lvl.icon}>{lvl.text}</Tag>
                    </div>
                  </div>

                  <div className="admin-event-card-action">{item.action}</div>
                  <div className="admin-event-card-detail">{item.detail}</div>

                  <div className="admin-event-card-footer">
                    <div className="admin-event-card-footer-item">
                      <ClockCircleOutlined />
                      <span>{new Date(item.timestamp).toLocaleString("th-TH")}</span>
                    </div>
                    <div className="admin-event-card-footer-item">
                      <UserOutlined />
                      <span>{item.operator}</span>
                    </div>
                    <div className="admin-event-card-footer-item">
                      <GlobalOutlined />
                      <span>{item.ip_address}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}

          {filteredLogs.length > pageSize && (
            <div className="admin-event-pagination-mobile">
              <Pagination
                current={currentPage}
                total={filteredLogs.length}
                pageSize={pageSize}
                onChange={(page) => setCurrentPage(page)}
                size="small"
                showSizeChanger={false}
              />
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
