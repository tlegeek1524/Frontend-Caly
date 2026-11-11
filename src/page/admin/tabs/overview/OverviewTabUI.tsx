import { useState, useMemo, useEffect } from "react";
import {
  Card,
  Row,
  Col,
  Progress,
  Radio,
  DatePicker,
  Segmented,
  Button,
  Skeleton,
  Divider,
  Select,
  Tooltip as AntTooltip
} from "antd";
import {
  CalendarOutlined,
  LineChartOutlined,
  BarChartOutlined,
  ReloadOutlined
} from "@ant-design/icons";
import dayjs, { type Dayjs } from "dayjs";
import { AdminFilterBar } from "../../components/AdminFilterBar";
import type { RailwayCompareData, RequestsTimelineResponse, ProvinceStatisticItem } from "../../../../types/admin";
import { fetchRequestsTimelineService, fetchProvinceStatisticsService } from "../../../../services/adminService";
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

const HOURLY_ACTIVE_USERS = [
  12, 8, 4, 3, 5, 15,
  42, 98, 130, 85, 96, 175,
  198, 142, 88, 75, 105, 185,
  210, 165, 120, 92, 55, 24
];

type AdminOverviewTabProps = {
  railwayCompare?: RailwayCompareData | null;
};

export const OverviewTabUI = ({ railwayCompare }: AdminOverviewTabProps) => {
  const [filterMode, setFilterMode] = useState<PresetFilter>("1day");
  const [customRange, setCustomRange] = useState<[Dayjs, Dayjs]>([
    dayjs().subtract(6, "day"),
    dayjs()
  ]);
  const [metricType, setMetricType] = useState<"uploads" | "activeUsers">("uploads");
  const [timelineData, setTimelineData] = useState<RequestsTimelineResponse | null>(null);
  const [loadingTimeline, setLoadingTimeline] = useState(false);
  const [provinceStats, setProvinceStats] = useState<ProvinceStatisticItem[]>([]);
  const [loadingProvinceStats, setLoadingProvinceStats] = useState(false);
  const [selectedProvinceFilter, setSelectedProvinceFilter] = useState<string>("all");
  const [availableProvincesList, setAvailableProvincesList] = useState<string[]>([]);

  useEffect(() => {
    let isMounted = true;
    const loadTimeline = async (isBackground = false) => {
      if (!isBackground) {
        setLoadingTimeline(true);
      }
      try {
        if (filterMode === "1day") {
          const res = await fetchRequestsTimelineService({
            date: dayjs().format("YYYY-MM-DD"),
            interval: "1h",
            fillEmpty: true,
            path: "/api/v1/menu",
            method: "POST",
            timezone: "Asia/Bangkok"
          });
          if (isMounted && res.success && res.data) {
            setTimelineData(res.data);
          }
          return;
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

        const res = await fetchRequestsTimelineService({
          from: startDate.format("YYYY-MM-DD"),
          to: endDate.format("YYYY-MM-DD"),
          interval: "1d",
          fillEmpty: true,
          path: "/api/v1/menu",
          method: "POST",
          timezone: "Asia/Bangkok"
        });
        if (isMounted && res.success && res.data) {
          setTimelineData(res.data);
        }
      } finally {
        if (isMounted && !isBackground) {
          setLoadingTimeline(false);
        }
      }
    };

    loadTimeline(false);
    const timer = setInterval(() => loadTimeline(true), 5 * 60 * 1000);
    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, [filterMode, customRange]);

  // โหลดสถิติจำนวนแต่ละจังหวัดจาก GET /api/food-locations/provinces
  useEffect(() => {
    let isMounted = true;
    const loadProvinces = async () => {
      setLoadingProvinceStats(true);
      try {
        const res = await fetchProvinceStatisticsService({
          province: selectedProvinceFilter !== "all" ? selectedProvinceFilter : undefined
        });

        if (isMounted && res.success) {
          setProvinceStats(res.data);
          // อัปเดตรายชื่อจังหวัดสำหรับตัวเลือก filter ถ้ายังไม่มี
          if (selectedProvinceFilter === "all" && res.data.length > 0) {
            const list = res.data.map((item) => item.province).filter(Boolean);
            setAvailableProvincesList(Array.from(new Set(list)));
          }
        }
      } finally {
        if (isMounted) {
          setLoadingProvinceStats(false);
        }
      }
    };

    loadProvinces();
    return () => {
      isMounted = false;
    };
  }, [selectedProvinceFilter]);

  const handleResetToDefault = () => {
    setFilterMode("1day");
    setCustomRange([dayjs().subtract(6, "day"), dayjs()]);
  };

  const chartDataComputed = useMemo(() => {
    if (filterMode === "1day") {
      if (metricType === "uploads") {
        const hourlyCounts = new Array(24).fill(0);
        const series = timelineData?.timeSeries || [];

        series.forEach((slot) => {
          const menuPost = slot.endpoints?.find(
            (ep) => ep.method === "POST" && ep.endpoint === "/api/v1/menu"
          );
          if (menuPost) {
            const hourIdx = slot.label
              ? parseInt(slot.label.split(":")[0], 10)
              : dayjs(slot.timeBucket).hour();
            if (!Number.isNaN(hourIdx) && hourIdx >= 0 && hourIdx < 24) {
              hourlyCounts[hourIdx] += menuPost.totalRequests || 0;
            }
          }
        });

        const summaryPost = timelineData?.endpointsSummary?.find(
          (ep) => ep.method === "POST" && ep.endpoint === "/api/v1/menu"
        );

        const seriesSum = hourlyCounts.reduce((sum, v) => sum + v, 0);
        const total = summaryPost ? summaryPost.totalRequests : seriesSum;
        const avg = Number((total / HOURLY_LABELS.length).toFixed(1));
        const peak = Math.max(...hourlyCounts);
        const peakIndex = hourlyCounts.indexOf(peak);

        return {
          labels: HOURLY_LABELS,
          data: hourlyCounts,
          label: "อัปโหลดอาหาร (POST /api/v1/menu)",
          unit: "รูป",
          endpointStat: summaryPost || null,
          summary: {
            total,
            avg,
            peak: peak > 0 ? `${peak} (${HOURLY_LABELS[peakIndex]})` : "0",
            periodText: `วันนี้ (${dayjs().format("DD/MM/YYYY")})`
          }
        };
      }

      const data = HOURLY_ACTIVE_USERS;
      const total = data.reduce((sum, v) => sum + v, 0);
      const avg = Math.round(total / data.length);
      const peak = Math.max(...data);
      const peakIndex = data.indexOf(peak);

      return {
        labels: HOURLY_LABELS,
        data,
        label: "ผู้ใช้งาน Active",
        unit: "คน",
        endpointStat: null,
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

    if (metricType === "uploads") {
      const dateCountMap = new Map<string, number>();
      const series = timelineData?.timeSeries || [];

      series.forEach((slot) => {
        const menuPost = slot.endpoints?.find(
          (ep) => ep.method === "POST" && ep.endpoint === "/api/v1/menu"
        );
        if (menuPost) {
          const dateKey =
            slot.label && /^\d{4}-\d{2}-\d{2}$/.test(slot.label)
              ? slot.label
              : dayjs(slot.timeBucket).format("YYYY-MM-DD");
          dateCountMap.set(dateKey, (dateCountMap.get(dateKey) || 0) + (menuPost.totalRequests || 0));
        }
      });

      for (let i = 0; i < diffDays; i++) {
        const curr = startDate.add(i, "day");
        labels.push(curr.format("DD/MM"));
        const dateKey = curr.format("YYYY-MM-DD");
        data.push(dateCountMap.get(dateKey) || 0);
      }

      const summaryPost = timelineData?.endpointsSummary?.find(
        (ep) => ep.method === "POST" && ep.endpoint === "/api/v1/menu"
      );

      const seriesSum = data.reduce((sum, v) => sum + v, 0);
      const total = summaryPost ? summaryPost.totalRequests : seriesSum;
      const avg = Number((total / data.length).toFixed(1));
      const peak = Math.max(...data);
      const peakIndex = data.indexOf(peak);

      return {
        labels,
        data,
        label: "อัปโหลดอาหาร (POST /api/v1/menu)",
        unit: "รูป",
        endpointStat: summaryPost || null,
        summary: {
          total,
          avg,
          peak: peak > 0 ? `${peak} (${labels[peakIndex]})` : "0",
          periodText: `${startDate.format("DD/MM")} - ${endDate.format("DD/MM")} (${diffDays} วัน)`
        }
      };
    }

    for (let i = 0; i < diffDays; i++) {
      const curr = startDate.add(i, "day");
      labels.push(curr.format("DD/MM"));
      const daySeed = (curr.date() * 17 + curr.month() * 31) % 100;
      const baseVal = 120 + daySeed * 1.5;
      data.push(Math.round(baseVal));
    }

    const total = data.reduce((sum, v) => sum + v, 0);
    const avg = Math.round(total / data.length);
    const peak = Math.max(...data);
    const peakIndex = data.indexOf(peak);

    return {
      labels,
      data,
      label: "ผู้ใช้งาน Active",
      unit: "คน",
      endpointStat: null,
      summary: {
        total,
        avg,
        peak: `${peak} (${labels[peakIndex]})`,
        periodText: `${startDate.format("DD/MM")} - ${endDate.format("DD/MM")} (${diffDays} วัน)`
      }
    };
  }, [filterMode, customRange, metricType, timelineData]);

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

  // กราฟสถิติจำนวนแต่ละจังหวัดจาก API (GET /api/food-locations/provinces)
  const provinceChartData = useMemo(() => {
    if (provinceStats.length === 0) {
      return {
        labels: [],
        datasets: [
          {
            label: "จำนวนรายการ",
            data: [],
            backgroundColor: ["#1677ff"],
            borderRadius: 4
          }
        ]
      };
    }

    const labels = provinceStats.map((item) => item.province || "ไม่ระบุ");
    const counts = provinceStats.map((item) => item.count ?? item.location_count ?? 0);

    const baseColors = [
      "#1677ff",
      "#4096ff",
      "#69b1ff",
      "#91caff",
      "#bae0ff",
      "#d6e4ff"
    ];
    const backgroundColors = labels.map((_, idx) => baseColors[idx % baseColors.length]);

    return {
      labels,
      datasets: [
        {
          label: "จำนวนรายการ",
          data: counts,
          backgroundColor: backgroundColors,
          borderRadius: 4
        }
      ]
    };
  }, [provinceStats]);

  const provinceUserOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context: { raw: unknown }) => ` ${context.raw} รายการ`
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
        <Col xs={24} lg={12}>
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
                  {loadingTimeline && metricType === "uploads" ? (
                    <Skeleton.Input active size="small" style={{ width: 140, height: 20 }} />
                  ) : (
                    <>
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
                    </>
                  )}
                </div>
              </div>
            }
            variant="borderless"
          >
            <div className="admin-overview-chart-wrapper">
              {loadingTimeline && metricType === "uploads" ? (
                <div className="admin-overview-chart-skeleton">
                  <Skeleton.Node active style={{ width: "100%", height: "100%" }}>
                    <div />
                  </Skeleton.Node>
                </div>
              ) : (
                <Line data={mainChartData} options={mainChartOptions} />
              )}
            </div>
          </Card>
        </Col>

        {/* Chart 2: Province Users */}
        <Col xs={24} lg={12}>
          <Card
            className="admin-overview-chart-card"
            title={
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", flexWrap: "wrap", gap: 8 }}>
                <div>
                  <div className="admin-dashboard-card-title">ผู้ใช้งานในแต่ละจังหวัด</div>
                  <div className="admin-overview-chart-sub">
                    การกระจายตัวตามพิกัดหลัก
                  </div>
                </div>
                <Select
                  value={selectedProvinceFilter}
                  onChange={setSelectedProvinceFilter}
                  size="small"
                  style={{ minWidth: 130 }}
                  options={[
                    { value: "all", label: "ทุกจังหวัด" },
                    ...availableProvincesList.map((prov) => ({
                      value: prov,
                      label: prov
                    }))
                  ]}
                />
              </div>
            }
            variant="borderless"
            styles={{ body: { padding: "12px 14px 16px" } }}
          >
            <div className="admin-overview-chart-wrapper">
              {loadingProvinceStats ? (
                <div className="admin-overview-chart-skeleton">
                  <Skeleton.Node active style={{ width: "100%", height: "100%" }}>
                    <div />
                  </Skeleton.Node>
                </div>
              ) : provinceStats.length === 0 ? (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#94a3b8" }}>
                  ไม่พบข้อมูลสถิติจังหวัด
                </div>
              ) : (
                <Bar data={provinceChartData} options={provinceUserOptions} />
              )}
            </div>
          </Card>
        </Col>

        {/* Server Resources Utilization & Railway Limits */}
        <Col xs={24}>
          <Card
            title={
              <div className="admin-dashboard-card-title">
                การใช้งานทรัพยากรเซิร์ฟเวอร์
              </div>
            }
            variant="borderless"
            styles={{ body: { padding: "14px 16px" } }}
          >
            <Row gutter={[24, 16]} className="admin-dashboard-resources-container">
              <Col xs={24} md={8} className="admin-dashboard-resource-col">
                <div className="admin-dashboard-resource-row">
                  <span>CPU Usage</span>
                  <span className="admin-dashboard-resource-val">
                    {railwayCompare?.cpuUsage
                      ? `${railwayCompare.cpuUsage.used} / ${railwayCompare.cpuUsage.max}`
                      : "-"}
                  </span>
                </div>
                <Progress
                  percent={railwayCompare?.cpuUsage?.usagePercent ?? 0}
                  strokeColor="#1677ff"
                  size="small"
                  format={(p) => `${p ?? 0}%`}
                />
              </Col>
              <Divider type="vertical" className="admin-dashboard-resource-divider" />
              <Col xs={24} md={8} className="admin-dashboard-resource-col">
                <div className="admin-dashboard-resource-row">
                  <span>Memory (RAM)</span>
                  <span className="admin-dashboard-resource-val">
                    {railwayCompare?.memoryRam
                      ? `${railwayCompare.memoryRam.used} / ${railwayCompare.memoryRam.max}`
                      : "-"}
                  </span>
                </div>
                <Progress
                  percent={railwayCompare?.memoryRam?.usagePercent ?? 0}
                  strokeColor="#52c41a"
                  size="small"
                  format={(p) => `${p ?? 0}%`}
                />
              </Col>
              <Divider type="vertical" className="admin-dashboard-resource-divider" />
              <Col xs={24} md={8} className="admin-dashboard-resource-col">
                <div className="admin-dashboard-resource-row">
                  <span>Storage / Disk</span>
                  <span className="admin-dashboard-resource-val">
                    {railwayCompare?.storageDisk
                      ? `${railwayCompare.storageDisk.used} / ${railwayCompare.storageDisk.max}`
                      : "-"}
                  </span>
                </div>
                <Progress
                  percent={railwayCompare?.storageDisk?.usagePercent ?? 0}
                  strokeColor="#722ed1"
                  size="small"
                  format={(p) => `${p ?? 0}%`}
                />
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

