import { useState, useEffect, useRef, useMemo } from "react";
import { fetchFoodLocationsService } from "../../../../services/adminService";
import type { GeoLocationRecord, FoodLocationPagination } from "../../../../types/admin";
import { GeoLocationTabUI } from "./GeoLocationTabUI";

const REDIS_CACHE_TTL_SECONDS = 60;

export const GeoLocationTab = () => {
  const [locations, setLocations] = useState<GeoLocationRecord[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<GeoLocationRecord | null>(null);
  const [pagination, setPagination] = useState<FoodLocationPagination>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
    hasNext: false,
    hasPrevious: false
  });
  const [isLoading, setIsLoading] = useState(false);

  const loadGeoLocations = async (page = pagination.page, limit = pagination.limit) => {
    setIsLoading(true);
    try {
      const res = await fetchFoodLocationsService(page, limit);
      if (res.success) {
        setLocations(res.data);
        setPagination(res.pagination);
        if (res.data.length > 0) {
          setSelectedLocation((prev) => {
            if (prev && res.data.some((item) => item.id === prev.id)) {
              return prev;
            }
            return res.data[0];
          });
        } else {
          setSelectedLocation(null);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadGeoLocations(1, 10);
  }, []);

  return (
    <GeoLocationTabUI
      locations={locations}
      selectedLocation={selectedLocation}
      onSelectLocation={setSelectedLocation}
      isLoading={isLoading}
      pagination={pagination}
      onPageChange={(page, limit) => loadGeoLocations(page, limit)}
      onRefresh={() => loadGeoLocations(pagination.page, pagination.limit)}
    />
  );
};
