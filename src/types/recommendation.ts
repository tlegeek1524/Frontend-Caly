export type SuggestedMenu = {
  meal_type: string;
  menu_name: string;
  estimated_calories: number;
  protein: number;
  carb: number;
  fat: number;
  reason: string;
};

export type RecommendationData = {
  id: number;
  line_uid: string;
  cycle_start_date: string;
  cycle_end_date: string;
  logged_days: number;
  total_calories: number;
  avg_calories_per_day: number;
  ai_summary: string;
  ai_recommendation: string;
  ai_suggested_menus: SuggestedMenu[];
  is_dismissed: boolean;
  created_by?: string;
  dismissed_at?: string;
};

export type ActiveRecommendationResponse = {
  status: string;
  has_active: boolean;
  data: RecommendationData | null;
};

export type LatestRecommendationResponse = {
  status: string;
  data: RecommendationData | null;
};

export type DismissRecommendationResponse = {
  status: string;
  message: string;
  data: {
    id: number;
    is_dismissed: boolean;
    dismissed_at: string;
  };
};

export type CycleStatusResponse = {
  line_uid: string;
  is_streak_completed: boolean;
  current_streak: number;
  required_streak: number;
  missing_days: number;
  streak_start_date: string;
  streak_end_date: string;
  streak_dates: string[];
  total_meals: number;
  total_calories: number;
  avg_calories_per_day: number;
  has_ai_recommendation: boolean;
  alert_message?: string;
};

export type GenerateRecommendationResponse = {
  statusCode?: number;
  status?: string;
  error?: string;
  message?: string;
  data?: unknown;
};

export type CalendarStackDayItem = {
  day: number;
  date: string;
  status: "pass" | "pending" | string;
};

export type CalendarFireStackResponse = {
  line_uid: string;
  has_active_stack: boolean;
  start_date?: string;
  end_date?: string;
  current_streak: number;
  list: CalendarStackDayItem[];
};
