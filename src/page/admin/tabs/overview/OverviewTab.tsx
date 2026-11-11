import { useState, useEffect } from "react";
import type { RailwayCompareData, DashboardCountResponse } from "../../../../types/admin";
import {
  fetchRailwayCompareService,
  fetchDashboardCountService
} from "../../../../services/adminService";
import { AdminStatCards } from "../../components/AdminStatCards";
import { OverviewTabUI } from "./OverviewTabUI";

type OverviewTabProps = {
  isMobile?: boolean;
};

export const OverviewTab = ({ isMobile = false }: OverviewTabProps) => {
  const [railwayCompare, setRailwayCompare] = useState<RailwayCompareData | null>(null);
  const [dashboardCounts, setDashboardCounts] = useState<DashboardCountResponse | null>(null);

  const loadRailwayCompare = async (): Promise<number | undefined> => {
    const res = await fetchRailwayCompareService();
    if (res.success && res.data) {
      setRailwayCompare(res.data);
    }
    return res.serverTimeMs;
  };

  const loadDashboardCounts = async () => {
    const res = await fetchDashboardCountService();
    if (res.success && res.data) {
      setDashboardCounts(res.data);
    }
  };

  useEffect(() => {
    let isMounted = true;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    const FIVE_MINUTES_MS = 5 * 60 * 1000;

    const syncByServerTime = async () => {
      const [serverTimeMs] = await Promise.all([
        loadRailwayCompare(),
        loadDashboardCounts()
      ]);

      if (!isMounted) return;

      const delayMs = serverTimeMs
        ? FIVE_MINUTES_MS - (serverTimeMs % FIVE_MINUTES_MS)
        : FIVE_MINUTES_MS;

      timeoutId = setTimeout(syncByServerTime, Math.max(1000, delayMs));
    };

    syncByServerTime();

    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  return (
    <>
      <AdminStatCards
        totalUsers={dashboardCounts?.User?.count ?? 0}
        totalPhotos={dashboardCounts?.Image_food?.count ?? 0}
        storageUsage={railwayCompare?.databaseStorage?.used ?? "-"}
        storageMax={railwayCompare?.databaseStorage?.max ?? "-"}
        serverLoad={
          railwayCompare?.cpuUsage?.usagePercent !== undefined
            ? `${railwayCompare.cpuUsage.usagePercent}%`
            : "-"
        }
        serverLoadMax={railwayCompare?.cpuUsage ? "100%" : "-"}
      />
      <OverviewTabUI railwayCompare={railwayCompare} />
    </>
  );
};
