import { useState, useMemo, useEffect, useRef } from "react";
import { Card, Row, Col, Button, Tag, Input, Select, Pagination, Spin } from "antd";
import { EnvironmentOutlined, SearchOutlined, ReloadOutlined } from "@ant-design/icons";
import type { GeoLocationRecord, FoodLocationPagination } from "../../../../types/admin";
import { AdminFilterBar } from "../../components/AdminFilterBar";

// Longdo Map Global Typing
declare global {
  interface Window {
    longdo?: any;
  }
}

type AdminGeoTrackerTabProps = {
  locations: GeoLocationRecord[];
  selectedLocation: GeoLocationRecord | null;
  onSelectLocation: (location: GeoLocationRecord) => void;
  isLoading?: boolean;
  pagination?: FoodLocationPagination;
  onPageChange?: (page: number, limit: number) => void;
  onRefresh?: () => void;
};

// API Key จาก .env
const LONGDO_MAP_KEY = (import.meta.env.VITE_LONGDO_MAP_KEY as string) || "";
const REDIS_CACHE_TTL_SECONDS = 60;

// ฟังก์ชันสกัดชื่อจังหวัดจากข้อมูลพิกัดหรือ locationName
const extractProvince = (item: GeoLocationRecord): string => {
  if (item.province) return item.province;
  const locationName = item.locationName || "";
  if (!locationName) return "ไม่ระบุจังหวัด";
  if (locationName.includes("กรุงเทพ") || locationName.includes("กทม")) return "กรุงเทพมหานคร";
  if (locationName.includes("เชียงใหม่")) return "เชียงใหม่";
  if (locationName.includes("ชลบุรี")) return "ชลบุรี";
  if (locationName.includes("นนทบุรี")) return "นนทบุรี";
  if (locationName.includes("ขอนแก่น")) return "ขอนแก่น";
  if (locationName.includes("ภูเก็ต")) return "ภูเก็ต";

  // ดึงคำหลัง "จ." หรือคำว่าจังหวัด
  const match = locationName.match(/(?:จังหวัด|จ\.)\s*([ก-๙]+)/);
  if (match && match[1]) return match[1];

  // หรือแบ่งคำคำสุดท้าย
  const parts = locationName.split(" ");
  return parts[parts.length - 1] || locationName;
};

export const GeoLocationTabUI = ({
  locations,
  selectedLocation,
  onSelectLocation,
  isLoading = false,
  pagination,
  onPageChange,
  onRefresh
}: AdminGeoTrackerTabProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProvince, setSelectedProvince] = useState<string>("all");
  const [isMapReady, setIsMapReady] = useState(false);
  const [mapLoadError, setMapLoadError] = useState(false);
  const [countdown, setCountdown] = useState<number>(REDIS_CACHE_TTL_SECONDS);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const onRefreshRef = useRef(onRefresh);

  useEffect(() => {
    onRefreshRef.current = onRefresh;
  }, [onRefresh]);

  // นับเวลาถอยหลัง 60 วินาที (1 นาที) เพื่อดึงข้อมูลใหม่และอัปเดต Redis Cache
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (onRefreshRef.current) {
            onRefreshRef.current();
          }
          return REDIS_CACHE_TTL_SECONDS;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleManualRefresh = () => {
    setCountdown(REDIS_CACHE_TTL_SECONDS);
    if (onRefresh) {
      onRefresh();
    }
  };

  // รายการจังหวัดทั้งหมดที่มีข้อมูลจริง (ดึงอัตโนมัติจากข้อมูล locations)
  const availableProvinces = useMemo(() => {
    const provinceSet = new Set<string>();
    locations.forEach((item) => {
      const province = extractProvince(item);
      if (province) provinceSet.add(province);
    });
    return Array.from(provinceSet);
  }, [locations]);

  // จัดเรียงข้อมูลจาก "ใหม่ที่สุด" ไป "เก่าที่สุด" (timestamp desc)
  const sortedLocations = useMemo(() => {
    return [...locations].sort((a, b) => {
      const timeA = new Date(a.timestamp).getTime();
      const timeB = new Date(b.timestamp).getTime();
      return timeB - timeA;
    });
  }, [locations]);

  // กรองตามคำค้นหาและจังหวัด
  const filteredLocations = useMemo(() => {
    return sortedLocations.filter((item) => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        searchQuery === "" ||
        item.foodName.toLowerCase().includes(q) ||
        item.locationName.toLowerCase().includes(q) ||
        (item.locatRefId && item.locatRefId.toLowerCase().includes(q));

      const itemProvince = extractProvince(item);
      const matchProvince = selectedProvince === "all" || itemProvince === selectedProvince;

      return matchSearch && matchProvince;
    });
  }, [sortedLocations, searchQuery, selectedProvince]);

  // โฟกัสจุดที่เลือก หรือจุดภาพถ่ายอาหารที่ "ใหม่ที่สุด" (อันดับแรกของรายการ)
  const activeCenterLocation = selectedLocation || filteredLocations[0] || sortedLocations[0];
  const currentCenter = activeCenterLocation
    ? { lat: activeCenterLocation.latitude, lng: activeCenterLocation.longitude }
    : { lat: 13.7563, lng: 100.5018 };

  // 1. ดักจับ Error จาก Longdo Map API script
  useEffect(() => {
    const handleGlobalError = (event: ErrorEvent) => {
      if (
        event.message?.includes("Longdo Map") ||
        event.filename?.includes("api.longdo.com")
      ) {
        setMapLoadError(true);
      }
    };

    window.addEventListener("error", handleGlobalError);
    return () => window.removeEventListener("error", handleGlobalError);
  }, []);

  // 2. โหลดสคริปต์ Longdo Map API
  useEffect(() => {
    if (!LONGDO_MAP_KEY) {
      setMapLoadError(true);
      return;
    }

    let checkInterval: ReturnType<typeof setInterval>;

    const onScriptLoaded = () => {
      checkInterval = setInterval(() => {
        if (window.longdo && window.longdo.Map) {
          clearInterval(checkInterval);
          setIsMapReady(true);
        }
      }, 100);
    };

    if (window.longdo && window.longdo.Map) {
      setIsMapReady(true);
      return;
    }

    const existingScript = document.getElementById("longdo-map-script") as HTMLScriptElement | null;
    if (existingScript) {
      onScriptLoaded();
      return;
    }

    const script = document.createElement("script");
    script.id = "longdo-map-script";
    script.src = `https://api.longdo.com/map/?key=${LONGDO_MAP_KEY}`;
    script.async = true;
    script.onload = onScriptLoaded;
    script.onerror = () => {
      setMapLoadError(true);
    };

    document.head.appendChild(script);

    return () => {
      if (checkInterval) clearInterval(checkInterval);
    };
  }, []);

  // 3. สร้าง instance แผนที่ Longdo Map และปิด UI/Feature ควบคุมทั้งหมด
  useEffect(() => {
    if (!isMapReady || !mapContainerRef.current || mapInstanceRef.current || !window.longdo?.Map) {
      return;
    }

    try {
      mapContainerRef.current.innerHTML = "";

      const map = new window.longdo.Map({
        placeholder: mapContainerRef.current,
        language: "th"
      });

      // โฟกัสเริ่มต้นที่พิกัดภาพถ่ายที่ใหม่ที่สุด
      map.location({ lon: currentCenter.lng, lat: currentCenter.lat }, false);
      map.zoom(15, false);

      // ปิด UI Controls ทั้งหมด และปิด Crosshair กึ่งกลาง
      try {
        if (map.Ui) {
          if (map.Ui.Toolbar) map.Ui.Toolbar.visible(false);
          if (map.Ui.LayerSelector) map.Ui.LayerSelector.visible(false);
          if (map.Ui.Zoom) map.Ui.Zoom.visible(false);
          if (map.Ui.Geolocation) map.Ui.Geolocation.visible(false);
          if (map.Ui.Scale) map.Ui.Scale.visible(false);
          if (map.Ui.DPad) map.Ui.DPad.visible(false);
          if (map.Ui.Crosshair) map.Ui.Crosshair.visible(false);
        }
      } catch {
        // ignore
      }

      mapInstanceRef.current = map;

      setTimeout(() => {
        try {
          if (map.resize) map.resize();
        } catch {
          // ignore
        }
      }, 300);
    } catch {
      setMapLoadError(true);
    }
  }, [isMapReady]);

  // 4. อัปเดต Markers บนแผนที่
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !window.longdo?.Marker) return;

    try {
      markersRef.current.forEach((m) => {
        try {
          map.Overlays.remove(m);
        } catch {
          // ignore
        }
      });
      markersRef.current = [];

      filteredLocations.forEach((item) => {
        const isSelected = activeCenterLocation?.id === item.id;
        const marker = new window.longdo.Marker(
          { lon: item.longitude, lat: item.latitude },
          {
            title: item.foodName,
            detail: `<div style="font-family:sans-serif;padding:4px;"><b>${item.foodName}</b><br/>${item.calories} kcal<br/><span style="color:#64748b;font-size:12px;">${item.locationName}</span></div>`,
            weight: isSelected ? window.longdo.OverlayWeight.Top : undefined
          }
        );

        map.Overlays.add(marker);
        markersRef.current.push(marker);
      });
    } catch {
      // ignore
    }
  }, [filteredLocations, activeCenterLocation, isMapReady]);

  // 5. เลื่อนแผนที่ไปโฟกัสตำแหน่งที่เลือกหรือจุดใหม่ล่าสุด
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !activeCenterLocation) return;

    try {
      map.location({ lon: activeCenterLocation.longitude, lat: activeCenterLocation.latitude }, true);
      map.zoom(15, true);
    } catch {
      // ignore
    }
  }, [activeCenterLocation]);

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedProvince("all");
  };

  return (
    <div className="admin-geo-container">
      {/* Global Filter Bar */}
      <AdminFilterBar
        leftContent={
          <>
            <Input
              prefix={<SearchOutlined style={{ color: "#9ca3af" }} />}
              placeholder="ค้นหาชื่ออาหาร หรือสถานที่..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="admin-dashboard-search-input"
              allowClear
              style={{ maxWidth: 280 }}
            />
            {/* ตัวเลือกกรองตามจังหวัดที่มีข้อมูล */}
            <Select
              value={selectedProvince}
              onChange={setSelectedProvince}
              style={{ width: 160 }}
              options={[
                { value: "all", label: "ทุกจังหวัดที่มีข้อมูล" },
                ...availableProvinces.map((prov) => ({
                  value: prov,
                  label: prov
                }))
              ]}
            />
            {(searchQuery || selectedProvince !== "all") && (
              <Button icon={<ReloadOutlined />} onClick={handleResetFilters}>
                รีเซ็ต
              </Button>
            )}
          </>
        }
        rightContent={
          <span className="admin-dashboard-filter-label" style={{ color: "#64748b", fontWeight: 500 }}>
            พบ <strong style={{ color: "#1677ff", margin: "0 4px" }}>{pagination?.total ?? filteredLocations.length}</strong> พิกัด
          </span>
        }
      />

      <Row gutter={[12, 12]}>
        {/* 1. Longdo Map Container / Fallback */}
        <Col xs={24} lg={15}>
          <Card
            title={
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                <span className="admin-dashboard-card-title">แผนที่</span>
                <Tag color="cyan" style={{ margin: 0, fontWeight: 500 }}>
                  Longdo Map
                </Tag>
              </div>
            }
            variant="borderless"
            styles={{ body: { padding: 12 } }}
          >
            <div className="admin-dashboard-map-frame" style={{ position: "relative", minHeight: 380 }}>
              {mapLoadError ? (
                <iframe
                  title="Geo Location Map"
                  width="100%"
                  height="100%"
                  style={{ border: 0, width: "100%", height: "100%", minHeight: 380 }}
                  scrolling="no"
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${currentCenter.lng - 0.04}%2C${currentCenter.lat - 0.025}%2C${currentCenter.lng + 0.04}%2C${currentCenter.lat + 0.025}&layer=mapnik`}
                />
              ) : (
                <div
                  ref={mapContainerRef}
                  style={{ width: "100%", height: "100%", minHeight: 380 }}
                />
              )}

              {/* ข้อความขณะกำลังโหลด */}
              {!isMapReady && !mapLoadError && (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    backgroundColor: "#f8fafc",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    zIndex: 2
                  }}
                >
                  <EnvironmentOutlined style={{ fontSize: 28, color: "#1677ff" }} />
                  <span style={{ fontSize: 13, color: "#64748b" }}>กำลังโหลดแผนที่...</span>
                </div>
              )}
            </div>

            <div className="admin-dashboard-map-footer">
              <span className="admin-dashboard-map-coords">
                โฟกัสล่าสุด: Lat {currentCenter.lat.toFixed(4)}, Long {currentCenter.lng.toFixed(4)}
                {activeCenterLocation && ` (${activeCenterLocation.foodName})`}
              </span>
              <Button
                type="link"
                size="small"
                href={`https://map.longdo.com/?lat=${currentCenter.lat}&long=${currentCenter.lng}&zoom=15`}
                target="_blank"
                className="admin-dashboard-map-btn"
              >
                เปิดใน Longdo Map
              </Button>
            </div>
          </Card>
        </Col>

        {/* 2. รายการการ์ดภาพถ่ายอาหารและพิกัดล่าสุด (เรียงจากใหม่ที่สุดไปเก่าที่สุด) */}
        <Col xs={24} lg={9}>
          <Card
            title={
              <div className="admin-geo-panel-header">
                <span className="admin-dashboard-card-title">ภาพถ่ายอาหารและพิกัดล่าสุด</span>
                <div className="admin-geo-countdown-badge">
                  <span>รีเฟช {countdown}s</span>
                  <button
                    type="button"
                    onClick={handleManualRefresh}
                    className="admin-geo-countdown-btn"
                    aria-label="รีเฟรชข้อมูลทันที"
                  >
                    <ReloadOutlined spin={isLoading} style={{ fontSize: 11 }} />
                  </button>
                </div>
              </div>
            }
            variant="borderless"
            className="admin-dashboard-photo-panel"
            styles={{ body: { padding: "10px" } }}
          >
            <Spin spinning={isLoading}>
              <div className="admin-dashboard-photo-scroll">
                {filteredLocations.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "40px 16px", color: "#94a3b8" }}>
                    {isLoading ? "กำลังโหลดข้อมูล..." : "ไม่พบข้อมูลพิกัดภาพถ่ายในจังหวัดที่เลือก"}
                  </div>
                ) : (
                  filteredLocations.map((item, index) => {
                    const isSelected = activeCenterLocation?.id === item.id;
                    return (
                      <div
                        key={item.id}
                        onClick={() => onSelectLocation(item)}
                        className={`admin-dashboard-photo-card ${isSelected ? "selected" : ""}`}
                      >
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.foodName}
                            className="admin-dashboard-photo-img"
                          />
                        ) : (
                          <div
                            className="admin-dashboard-photo-img"
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              backgroundColor: "#f1f5f9",
                              color: "#94a3b8"
                            }}
                          >
                            <EnvironmentOutlined style={{ fontSize: 20 }} />
                          </div>
                        )}
                        <div className="admin-dashboard-photo-info">
                          <div className="admin-dashboard-photo-header">
                            <div style={{ display: "flex", alignItems: "center", gap: 6, overflow: "hidden" }}>
                              <span className="admin-dashboard-photo-name" title={item.foodName}>
                                {item.foodName}
                              </span>
                              {index === 0 && (!pagination || pagination.page === 1) && (
                                <Tag color="processing" style={{ fontSize: 10, lineHeight: "16px", padding: "0 4px", margin: 0 }}>
                                  ล่าสุด
                                </Tag>
                              )}
                            </div>
                            <Tag color="orange" className="admin-dashboard-photo-cal">
                              {item.calories} kcal
                            </Tag>
                          </div>
                          <div className="admin-dashboard-photo-location" title={item.locationName}>
                            <EnvironmentOutlined style={{ marginRight: 3, flexShrink: 0 }} />
                            <span>{item.locationName}</span>
                          </div>
                          <div className="admin-dashboard-photo-footer">
                            <span className="admin-dashboard-photo-time">
                              {new Date(item.timestamp).toLocaleString("th-TH", {
                                day: "2-digit",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit"
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </Spin>

            {pagination && onPageChange && pagination.total > 0 && (
              <div style={{ display: "flex", justifyContent: "center", marginTop: 10, paddingTop: 8, borderTop: "1px solid var(--border-subtle)" }}>
                <Pagination
                  current={pagination.page}
                  pageSize={pagination.limit}
                  total={pagination.total}
                  onChange={(page, pageSize) => onPageChange(page, pageSize)}
                  size="small"
                  showSizeChanger
                  pageSizeOptions={["5", "10", "20", "50"]}
                />
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};
