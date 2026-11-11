import type { FoodLocationPayload, FoodLocationResponse } from "../types/location";
import { getStoredToken } from "../utils/sessionAuth";

const API_BASE_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

export type GpsResult = {
  success: boolean;
  coords?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  };
  errorType?: "unsupported" | "denied" | "unavailable" | "timeout" | "unknown";
  message?: string;
};

/**
 * รับพิกัดปัจจุบันจาก Geolocation ของอุปกรณ์
 */
export const getCurrentGpsCoordinates = async (options?: PositionOptions): Promise<GpsResult> => {
  if (!navigator.geolocation) {
    return {
      success: false,
      errorType: "unsupported",
      message: "เบราว์เซอร์ของคุณไม่รองรับการระบุตำแหน่ง (Geolocation)"
    };
  }

  const tryGetPosition = (enableHighAccuracy: boolean, timeout: number, maxAge: number): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy,
        timeout,
        maximumAge: maxAge
      });
    });
  };

  try {
    // ลองดึงพิกัด high accuracy ก่อน
    const pos = await tryGetPosition(true, options?.timeout ?? 15000, 60000);
    console.log("[LocationService] Got coordinates (high accuracy):", pos.coords.latitude, pos.coords.longitude, "accuracy:", pos.coords.accuracy);
    return {
      success: true,
      coords: {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy: pos.coords.accuracy
      }
    };
  } catch (err: unknown) {
    const error = err as GeolocationPositionError;
    console.warn("[LocationService] First attempt failed:", error.code, error.message);

    if (error.code === error.PERMISSION_DENIED) {
      return {
        success: false,
        errorType: "denied",
        message: "กรุณาเปิดสิทธิ์ Location ใน Browser และ System Settings ของ Mac (Privacy & Security -> Location Services)"
      };
    }

    // Fallback: ดึงพิกัดแบบ standard โดยอนุญาต cache ล่าสุด 5 นาที
    try {
      const fallbackPos = await tryGetPosition(false, 15000, 300000);
      console.log("[LocationService] Got coordinates (fallback):", fallbackPos.coords.latitude, fallbackPos.coords.longitude);
      return {
        success: true,
        coords: {
          latitude: fallbackPos.coords.latitude,
          longitude: fallbackPos.coords.longitude,
          accuracy: fallbackPos.coords.accuracy
        }
      };
    } catch (secondErr: unknown) {
      const secondError = secondErr as GeolocationPositionError;
      console.error("[LocationService] All attempts failed:", secondError.code, secondError.message);

      let errorType: GpsResult["errorType"] = "unknown";
      let message = "ไม่สามารถระบุพิกัดตำแหน่งได้ กรุณาตรวจสอบการเปิด Location Services ใน System Settings ของ Mac";

      if (secondError.code === secondError.PERMISSION_DENIED) {
        errorType = "denied";
        message = "กรุณาเปิดสิทธิ์ Location ใน Browser และ System Settings ของ Mac (Privacy & Security -> Location Services)";
      } else if (secondError.code === secondError.POSITION_UNAVAILABLE) {
        errorType = "unavailable";
        message = "ไม่พบสัญญาณพิกัด กรุณาตรวจสอบว่า Mac เชื่อมต่อ Wi-Fi และเปิด Location Services";
      } else if (secondError.code === secondError.TIMEOUT) {
        errorType = "timeout";
        message = "หมดเวลาการค้นหาพิกัด กรุณาลองใหม่อีกครั้ง";
      }

      return {
        success: false,
        errorType,
        message
      };
    }
  }
};

export type UploadLocationResult = {
  success: boolean;
  locatRefId: string | null;
  error?: string;
};

/**
 * เรียก POST /api/upload-location เพื่อสร้าง location record ใน table food_location
 * และคืนค่า locat_ref_id กลับมา
 */
export const uploadFoodLocationService = async (payload: FoodLocationPayload): Promise<UploadLocationResult> => {
  try {
    const token = getStoredToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      accept: "application/json"
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const latitude = Number(payload.latitude ?? payload.lat);
    const longitude = Number(payload.longitude ?? payload.lng);
    const accuracy = payload.accuracy_m !== undefined ? Number(payload.accuracy_m) : undefined;
    const lineUid = payload.line_uid?.toString() || payload.user_id?.toString() || "";

    // Backend reads coordinates from query string / x-* headers only (not from body)
    const query = new URLSearchParams({
      lat: String(latitude),
      lng: String(longitude),
      latitude: String(latitude),
      longitude: String(longitude),
      line_uid: lineUid,
      ...(accuracy !== undefined && { accuracy_m: String(accuracy) })
    });

    headers["x-latitude"] = String(latitude);
    headers["x-longitude"] = String(longitude);
    headers["x-line-uid"] = lineUid;
    if (accuracy !== undefined) {
      headers["x-accuracy-m"] = String(accuracy);
    }

    const response = await fetch(`${API_BASE_URL}/api/upload-location?${query.toString()}`, {
      method: "POST",
      headers
    });

    if (!response.ok) {
      const errRes = await response.json().catch(() => ({}));
      const errMsg = errRes?.message || `บันทึกพิกัดไม่สำเร็จ (${response.status})`;
      console.warn(`[LocationService] uploadFoodLocationService failed:`, errRes);
      return { success: false, locatRefId: null, error: errMsg };
    }

    const res: FoodLocationResponse = await response.json();
    console.log("[LocationService] POST /api/upload-location response:", res);

    let locatRefId: string | null = null;
    if (res.locat_ref_id !== undefined && res.locat_ref_id !== null) {
      locatRefId = String(res.locat_ref_id);
    } else if (res.data) {
      if (typeof res.data === "object") {
        const idVal = res.data.locat_ref_id ?? res.data.ref_id ?? res.data.id ?? res.data.location_id;
        if (idVal !== undefined && idVal !== null) {
          locatRefId = String(idVal);
        }
      } else {
        locatRefId = String(res.data);
      }
    }

    return {
      success: true,
      locatRefId
    };
  } catch (error) {
    console.error("[LocationService] uploadFoodLocationService error:", error);
    return {
      success: false,
      locatRefId: null,
      error: error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการเชื่อมต่อเพื่อบันทึกพิกัด"
    };
  }
};
