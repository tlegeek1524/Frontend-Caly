import type {
  ActiveRecommendationResponse,
  LatestRecommendationResponse,
  DismissRecommendationResponse,
  CycleStatusResponse,
  GenerateRecommendationResponse,
  RecommendationData,
  CalendarFireStackResponse
} from "../types/recommendation";

const API_BASE_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

export const fetchLatestRecommendation = async (
  lineUid: string
): Promise<RecommendationData | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/recommendation/latest/${encodeURIComponent(lineUid)}`, {
      method: "GET",
      headers: {
        Accept: "application/json"
      }
    });

    if (!response.ok) {
      return null;
    }

    const raw = await response.json();
    const rec = (raw?.data ?? raw) as RecommendationData;
    if (rec && (rec.id || rec.ai_summary || rec.ai_advice)) {
      return rec;
    }
    return null;
  } catch (error) {
    return null;
  }
};

export const fetchActiveRecommendation = async (
  lineUid: string
): Promise<ActiveRecommendationResponse | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/recommendation/active/${encodeURIComponent(lineUid)}`, {
      method: "GET",
      headers: {
        Accept: "application/json"
      }
    });

    if (!response.ok) {
      return null;
    }

    const result = (await response.json()) as ActiveRecommendationResponse;
    return result;
  } catch (error) {
    return null;
  }
};

export const dismissRecommendationById = async (
  recommendationId: number
): Promise<DismissRecommendationResponse | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/recommendation/dismiss/${recommendationId}`, {
      method: "PATCH",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) {
      return null;
    }

    const result = (await response.json()) as DismissRecommendationResponse;
    return result;
  } catch (error) {
    return null;
  }
};

export const fetchCycleStatus = async (
  lineUid: string
): Promise<CycleStatusResponse | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/recommendation/cycle-status/${encodeURIComponent(lineUid)}`, {
      method: "GET",
      headers: {
        Accept: "application/json"
      }
    });

    if (!response.ok) {
      return null;
    }

    const raw = await response.json();
    const result = (raw?.data ?? raw) as CycleStatusResponse;
    return result;
  } catch (error) {
    return null;
  }
};

export const generateRecommendation = async (
  lineUid: string
): Promise<GenerateRecommendationResponse | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/recommendation/generate/${encodeURIComponent(lineUid)}`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        created_by: "user_manual"
      })
    });

    const result = (await response.json()) as GenerateRecommendationResponse;
    return result;
  } catch (error) {
    return null;
  }
};

export const fetchCalendarFireStack = async (
  lineUid: string
): Promise<CalendarFireStackResponse | null> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/recommendation/calendar/${encodeURIComponent(lineUid)}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json"
        }
      }
    );

    if (!response.ok) {
      return null;
    }

    const raw = await response.json();
    const result = (raw?.data ?? raw) as CalendarFireStackResponse;
    return result;
  } catch (error) {
    return null;
  }
};
