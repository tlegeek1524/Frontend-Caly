import type { PDPATemplate, PDPATemplateResponse, CheckPDPAConsentResponse, SavePDPAConsentPayload } from "../types/pdpa";
import { getStoredToken } from "../utils/sessionAuth";

const API_BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:6700").replace(/\/$/, "");

export const FALLBACK_PDPA_TEMPLATE: PDPATemplate = {
  id: 2,
  title: "นโยบายความเป็นส่วนตัว (Privacy Policy) สำหรับผู้ใช้งาน Caly",
  version: "1.0.0",
  content_html: "<div class=\"pdpa-content\"><h2>นโยบายความเป็นส่วนตัว</h2><p>ข้อความข้อตกลงและนโยบายความเป็นส่วนตัวในการจัดเก็บและประมวลผลข้อมูลส่วนบุคคลของผู้ใช้งาน Caly...</p></div>",
  is_active: true,
  description: "เวอร์ชันเริ่มต้น บันทึกการยินยอมข้อมูลส่วนบุคคล",
  created_at: "2026-11-11T03:26:21.399Z",
  updated_at: "2026-11-11T03:26:21.399Z"
};

const getAuthHeaders = (): Record<string, string> => {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    accept: "application/json"
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
};

export const fetchActivePDPATemplate = async (): Promise<PDPATemplate | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/pdpa/templates/active`, {
      method: "GET",
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      console.warn(`[PDPAService] Failed to fetch active PDPA template (${response.status}), using fallback`);
      return FALLBACK_PDPA_TEMPLATE;
    }

    const resData: PDPATemplateResponse = await response.json();
    if (resData?.data && Array.isArray(resData.data) && resData.data.length > 0) {
      return resData.data[0];
    }
    return FALLBACK_PDPA_TEMPLATE;
  } catch (error) {
    console.error("[PDPAService] Error fetching active PDPA template:", error);
    return FALLBACK_PDPA_TEMPLATE;
  }
};

/**
 * GET : /api/pdpa-consent/check
 * ตรวจสอบว่า user accept หรือยัง ณ version ที่เปิดอยู่
 */
export const checkPDPAConsentService = async (params?: { user_id?: string | number; version?: string }): Promise<boolean> => {
  try {
    const query = new URLSearchParams();
    if (params?.user_id) query.append("user_id", String(params.user_id));
    if (params?.version) query.append("version", params.version);

    const queryString = query.toString();
    const url = `${API_BASE_URL}/api/pdpa-consent/check${queryString ? `?${queryString}` : ""}`;

    const response = await fetch(url, {
      method: "GET",
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      return false;
    }

    const resData: CheckPDPAConsentResponse = await response.json();
    
    if (typeof resData.accepted === "boolean") return resData.accepted;
    if (typeof resData.is_accepted === "boolean") return resData.is_accepted;
    if (typeof resData.has_accepted === "boolean") return resData.has_accepted;
    if (typeof resData.data?.accepted === "boolean") return resData.data.accepted;
    if (typeof resData.data?.is_accepted === "boolean") return resData.data.is_accepted;
    if (typeof resData.data?.has_accepted === "boolean") return resData.data.has_accepted;

    return false;
  } catch (error) {
    console.error("[PDPAService] checkPDPAConsentService error:", error);
    return false;
  }
};

/**
 * POST : /api/pdpa-consent
 * บันทึก user accept
 */
export const savePDPAConsentService = async (payload: SavePDPAConsentPayload): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/pdpa-consent`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      console.warn(`[PDPAService] savePDPAConsentService responded with status ${response.status}`);
      return false;
    }

    return true;
  } catch (error) {
    console.error("[PDPAService] savePDPAConsentService error:", error);
    return false;
  }
};
