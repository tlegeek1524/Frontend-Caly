import { useState, useMemo } from "react";
import {
  Card,
  Row,
  Col,
  Progress,
  Radio,
  DatePicker,
  Segmented,
  Typography,
  Button,
  Tooltip as AntTooltip,
  Space
} from "antd";
import {
  CalendarOutlined,
  LineChartOutlined,
  BarChartOutlined,
  ClockCircleOutlined,
  ReloadOutlined
} from "@ant-design/icons";
import dayjs, { type Dayjs } from "dayjs";
import { AdminFilterBar } from "../components/AdminFilterBar";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from "chart.js";
import { Line, Bar } from "react-chartjs-2";

const { Text } = Typography;
const { RangePicker } = DatePicker;

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

type PresetFilter = "1day" | "7days" | "30days" | "custom";

const HOURLY_LABELS = [
  "00:00", "01:00", "02:00", "03:00", "04:00", "05:00",
  "06:00", "07:00", "08:00", "09:00", "10:00", "11:00",
  "12:00", "13:00", "14:00", "15:00", "16:00", "17:00",
  "18:00", "19:00", "20:00", "21:00", "22:00", "23:00"
];

const HOURLY_UPLOADS = [
  4, 2, 1, 0, 1, 8,
  24, 65, 82, 45, 60, 115,
  138, 92, 54, 48, 70, 128,
  145, 112, 85, 64, 38, 12
];

const HOURLY_ACTIVE_USERS = [
  12, 8, 4, 3, 5, 15,
  42, 98, 130, 85, 96, 175,
  198, 142, 88, 75, 105, 185,
  210, 165, 120, 92, 55, 24
];

export const AdminOverviewTab = () => {
  const [filterMode, setFilterMode] = useState<PresetFilter>("1day");
  const [customRange, setCustomRange] = useState<[Dayjs, Dayjs]>([
    dayjs().subtract(6, "day"),
    dayjs()
  ]);
  const [metricType, setMetricType] = useState<"uploads" | "activeUsers">("uploads");

  const handleResetToDefault = () => {
    setFilterMode("1day");
    setCustomRange([dayjs().subtract(6, "day"), dayjs()]);
  };

  const chartDataComputed = useMemo(() => {
    if (filterMode === "1day") {
      const data = metricType === "uploads" ? HOURLY_UPLOADS : HOURLY_ACTIVE_USERS;
      const total = data.reduce((sum, v) => sum + v, 0);
      const avg = Math.round(total / data.length);
      const peak = Math.max(...data);
      const peakIndex = data.indexOf(peak);

      return {
        labels: HOURLY_LABELS,
        data,
        label: metricType === "uploads" ? "อัปโหลดอาหาร" : "ผู้ใช้งาน Active",
        unit: metricType === "uploads" ? "รูป" : "คน",
        summary: {
          total,
          avg,
          peak: `${peak} (${HOURLY_LABELS[peakIndex]})`,
          periodText: `24 ชม. ล่าสุด (${dayjs().format("DD/MM/YYYY")})`
        }
      };
    }

    let startDate: Dayjs;
    let endDate: Dayjs;

    if (filterMode === "7days") {
      startDate = dayjs().subtract(6, "day");
      endDate = dayjs();
    } else if (filterMode === "30days") {
      startDate = dayjs().subtract(29, "day");
      endDate = dayjs();
    } else {
      startDate = customRange[0];
      endDate = customRange[1];
    }

    const diffDays = Math.max(1, endDate.diff(startDate, "day") + 1);
    const labels: string[] = [];
    const data: number[] = [];

    for (let i = 0; i < diffDays; i++) {
      const curr = startDate.add(i, "day");
      labels.push(curr.format("DD/MM"));
      const daySeed = (curr.date() * 17 + curr.month() * 31) % 100;
      const baseVal = metricType === "uploads" ? 180 + daySeed * 2 : 120 + daySeed * 1.5;
      data.push(Math.round(baseVal));
    }

    const total = data.reduce((sum, v) => sum + v, 0);
    const avg = Math.round(total / data.length);
    const peak = Math.max(...data);
    const peakIndex = data.indexOf(peak);

    return {
      labels,
      data,
      label: metricType === "uploads" ? "อัปโหลดอาหาร" : "ผู้ใช้งาน Active",
      unit: metricType === "uploads" ? "รูป" : "คน",
      summary: {
        total,
        avg,
        peak: `${peak} (${labels[peakIndex]})`,
        periodText: `${startDate.format("DD/MM")} - ${endDate.format("DD/MM")} (${diffDays} วัน)`
      }
    };
  }, [filterMode, customRange, metricType]);

  const mainChartData = {
    labels: chartDataComputed.labels,
    datasets: [
      {
        label: chartDataComputed.label,
        data: chartDataComputed.data,
        borderColor: "#1677ff",
        backgroundColor: "rgba(22, 119, 255, 0.05)",
        fill: true,
        tension: 0.35,
        pointRadius: chartDataComputed.labels.length > 20 ? 1.5 : 3.5,
        pointHoverRadius: 5,
        borderWidth: 2
      }
    ]
  };

  const mainChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        padding: 8,
        callbacks: {
          label: (context: { parsed: { y: number } }) =>
            ` ${context.parsed.y.toLocaleString()} ${chartDataComputed.unit}`
        }
      }
    },
    scales: {
      y: {
        grid: { color: "rgba(0,0,0,0.04)" },
        ticks: { font: { size: 10 } }
      },
      x: {
        grid: { display: false },
        ticks: {
          font: { size: 9 },
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 7
        }
      }
    }
  };

  // กราฟจำนวนผู้ใช้งานแยกจังหวัด - ใช้โทนสี cohesive นุ่มนวล ไม่ใช่ rainbow
  const provinceUserData = {
    labels: ["กทม.", "เชียงใหม่", "ชลบุรี", "นนทบุรี", "ขอนแก่น", "ภูเก็ต"],
    datasets: [
      {
        label: "จำนวนผู้ใช้งาน (คน)",
        data: [142, 58, 44, 38, 29, 24],
        backgroundColor: [
          "#1677ff",
          "#4096ff",
          "#69b1ff",
          "#91caff",
          "#bae0ff",
          "#d6e4ff"
        ],
        borderRadius: 4
      }
    ]
  };

  const provinceUserOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context: { raw: unknown }) => ` ${context.raw} คน`
        }
      }
    },
    scales: {
      y: {
        grid: { color: "rgba(0,0,0,0.04)" },
        ticks: { font: { size: 10 } }
      },
      x: {
        grid: { display: false },
        ticks: { font: { size: 10 } }
      }
    }
  };

  return (
    <div className="admin-overview-container">
      {/* Global Filter Bar */}
      <AdminFilterBar
        leftContent={
          <>
            <span className="admin-dashboard-filter-label">
              ช่วงเวลา:
            </span>

            {/* แสดง shortcut 1-30 วัน เมื่อไม่ได้เลือกกำหนดเอง */}
            {filterMode !== "custom" ? (
              <div className="admin-overview-radio-scroll">
                <Radio.Group
                  value={filterMode}
                  onChange={(e) => setFilterMode(e.target.value)}
                  buttonStyle="solid"
                >
                  <Radio.Button value="1day">1 วัน</Radio.Button>
                  <Radio.Button value="7days">7 วัน</Radio.Button>
                  <Radio.Button value="30days">30 วัน</Radio.Button>
                  <Radio.Button value="custom">กำหนดเอง</Radio.Button>
                </Radio.Group>
              </div>
            ) : (
              /* เมื่อเลือกกำหนดเอง: ซ่อน shortcut 1-30 แล้วแสดง From-To พร้อมปุ่ม Reset */
              <div className="admin-overview-custom-date-container">
                <RangePicker
                  value={customRange}
                  onChange={(dates) => {
                    if (dates && dates[0] && dates[1]) {
                      setCustomRange([dates[0], dates[1]]);
                    }
                  }}
                  format="DD/MM/YYYY"
                  allowClear={false}
                  inputReadOnly
                  className="admin-overview-date-picker"
                />
                <AntTooltip title="กลับไปโหมดปกติ (1 วัน)">
                  <Button
                    style={{ height: 38 }}
                    icon={<ReloadOutlined />}
                    onClick={handleResetToDefault}
                  >
                    รีเซ็ต
                  </Button>
                </AntTooltip>
              </div>
            )}
          </>
        }
        rightContent={
          <Segmented
            value={metricType}
            onChange={(val) => setMetricType(val as "uploads" | "activeUsers")}
            options={[
              { label: "รูปอาหาร", value: "uploads", icon: <LineChartOutlined /> },
              { label: "ผู้ใช้งาน", value: "activeUsers", icon: <BarChartOutlined /> }
            ]}
          />
        }
      />

      {/* Main Detailed Chart & Province Chart */}
      <Row gutter={[12, 12]}>
        <Col xs={24} lg={15}>
          <Card
            className="admin-overview-chart-card"
            title={
              <div className="admin-overview-chart-header">
                <div>
                  <div className="admin-dashboard-card-title">
                    {metricType === "uploads" ? "สถิติการอัปโหลดรูปภาพอาหาร" : "ปริมาณผู้ใช้งาน Active"}
                  </div>
                  <div className="admin-overview-chart-sub">
                    <CalendarOutlined style={{ marginRight: 4 }} />
                    {chartDataComputed.summary.periodText}
                  </div>
                </div>
                <div className="admin-overview-summary-row">
                  <div className="admin-overview-summary-item">
                    <span className="admin-overview-summary-label">รวม</span>
                    <span className="admin-overview-summary-val admin-overview-summary-val-highlight">
                      {chartDataComputed.summary.total.toLocaleString()}
                    </span>
                  </div>
                  <div className="admin-overview-summary-item">
                    <span className="admin-overview-summary-label">เฉลี่ย</span>
                    <span className="admin-overview-summary-val">
                      {chartDataComputed.summary.avg.toLocaleString()}
                    </span>
                  </div>
                  <div className="admin-overview-summary-item">
                    <span className="admin-overview-summary-label">สูงสุด</span>
                    <span className="admin-overview-summary-val admin-overview-summary-val-highlight">
                      {chartDataComputed.summary.peak}
                    </span>
                  </div>
                </div>
              </div>
            }
            variant="borderless"
          >
            <div className="admin-overview-chart-wrapper">
              <Line data={mainChartData} options={mainChartOptions} />
            </div>
          </Card>
        </Col>

        {/* Chart 2: Province Users */}
        <Col xs={24} lg={9}>
          <Card
            title={
              <div>
                <div className="admin-dashboard-card-title">ผู้ใช้งานในแต่ละจังหวัด</div>
                <div className="admin-overview-chart-sub">
                  การกระจายตัวตามพิกัดหลัก
                </div>
              </div>
            }
            variant="borderless"
            styles={{ body: { padding: "12px 14px 16px" } }}
          >
            <div className="admin-overview-chart-wrapper">
              <Bar data={provinceUserData} options={provinceUserOptions} />
            </div>
          </Card>
        </Col>

        {/* Server Resources Utilization */}
        <Col xs={24}>
          <Card
            title={<div className="admin-dashboard-card-title">การใช้งานทรัพยากรเซิร์ฟเวอร์</div>}
            variant="borderless"
            styles={{ body: { padding: "14px 16px" } }}
          >
            <Row gutter={[12, 12]}>
              <Col xs={24} md={8}>
                <div className="admin-dashboard-resource-row">
                  <span>CPU Load</span>
                  <span className="admin-dashboard-resource-val">28%</span>
                </div>
                <Progress percent={28} strokeColor="#1677ff" size="small" />
              </Col>
              <Col xs={24} md={8}>
                <div className="admin-dashboard-resource-row">
                  <span>Memory (RAM)</span>
                  <span className="admin-dashboard-resource-val">1.8 GB / 4.0 GB</span>
                </div>
                <Progress percent={45} strokeColor="#52c41a" size="small" />
              </Col>
              <Col xs={24} md={8}>
                <div className="admin-dashboard-resource-row">
                  <span>Database Storage</span>
                  <span className="admin-dashboard-resource-val">18.4 GB / 50.0 GB</span>
                </div>
                <Progress percent={36.8} strokeColor="#722ed1" size="small" />
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  );
};
