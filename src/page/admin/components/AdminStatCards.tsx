import { Card, Row, Col } from "antd";
import {
  UserOutlined,
  CameraOutlined,
  DatabaseOutlined,
  DashboardOutlined
} from "@ant-design/icons";

type AdminStatCardsProps = {
  totalUsers: number;
  activeSessionsCount?: number;
  totalPhotos?: number;
  storageUsage?: string;
  storageMax?: string;
  serverLoad?: string;
  serverLoadMax?: string;
};

export const AdminStatCards = ({
  totalUsers,
  totalPhotos = 1482,
  storageUsage = "18.4",
  storageMax = "50 GB",
  serverLoad = "32%",
  serverLoadMax = "100%"
}: AdminStatCardsProps) => {
  return (
    <Row gutter={[8, 8]} className="admin-dashboard-stats-row">
      <Col xs={12} sm={12} md={6}>
        <Card variant="borderless" className="admin-dashboard-stat-card" styles={{ body: { padding: 0 } }}>
          <div className="admin-stat-compact-card">
            <div className="admin-stat-top">
              <span className="admin-stat-title">ผู้ใช้งาน</span>
              <UserOutlined className="admin-stat-icon admin-stat-icon-users" />
            </div>
            <div className="admin-stat-bottom">
              <span className="admin-stat-val">{totalUsers}</span>
            </div>
          </div>
        </Card>
      </Col>
      <Col xs={12} sm={12} md={6}>
        <Card variant="borderless" className="admin-dashboard-stat-card" styles={{ body: { padding: 0 } }}>
          <div className="admin-stat-compact-card">
            <div className="admin-stat-top">
              <span className="admin-stat-title">รูปภาพสะสม</span>
              <CameraOutlined className="admin-stat-icon admin-stat-icon-photos" />
            </div>
            <div className="admin-stat-bottom">
              <span className="admin-stat-val">{totalPhotos}</span>
            </div>
          </div>
        </Card>
      </Col>
      <Col xs={12} sm={12} md={6}>
        <Card variant="borderless" className="admin-dashboard-stat-card" styles={{ body: { padding: 0 } }}>
          <div className="admin-stat-compact-card">
            <div className="admin-stat-top">
              <span className="admin-stat-title">ข้อมูลในระบบ</span>
              <DatabaseOutlined className="admin-stat-icon admin-stat-icon-storage" />
            </div>
            <div className="admin-stat-bottom">
              <div className="admin-stat-compare">
                <span className="admin-stat-val">{storageUsage}</span>
                <span className="admin-stat-compare-divider">/</span>
                <span className="admin-stat-compare-max">{storageMax}</span>
              </div>
            </div>
          </div>
        </Card>
      </Col>
      <Col xs={12} sm={12} md={6}>
        <Card variant="borderless" className="admin-dashboard-stat-card" styles={{ body: { padding: 0 } }}>
          <div className="admin-stat-compact-card">
            <div className="admin-stat-top">
              <span className="admin-stat-title">เซิร์ฟเวอร์</span>
              <DashboardOutlined className="admin-stat-icon admin-stat-icon-load" />
            </div>
            <div className="admin-stat-bottom">
              <div className="admin-stat-compare">
                <span className="admin-stat-val">{serverLoad}</span>
                <span className="admin-stat-compare-divider">/</span>
                <span className="admin-stat-compare-max">{serverLoadMax}</span>
              </div>
            </div>
          </div>
        </Card>
      </Col>
    </Row>
  );
};
