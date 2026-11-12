import { useState, useEffect, useCallback, useRef } from "react";
import { Sparkles, Check } from "lucide-react";
import { fetchCalendarFireStack } from "../../services/recommendation.service";
import type {
  CalendarFireStackResponse,
  CalendarStackDayItem
} from "../../types/recommendation";
import "./CalendarFireStack.css";

type CalendarFireStackProps = {
  lineUid: string;
  selectedDate?: string;
  refreshTrigger?: number | string;
  foodRecordsCount?: number;
  onSelectDate?: (date: string) => void;
};

const DEFAULT_STACK_LIST: CalendarStackDayItem[] = Array.from(
  { length: 7 },
  (_, index) => ({
    day: index + 1,
    date: "",
    status: "pending"
  })
);

export const CalendarFireStack = ({
  lineUid,
  refreshTrigger,
  foodRecordsCount
}: CalendarFireStackProps) => {
  const [data, setData] = useState<CalendarFireStackResponse | null>(null);
  const [isIgniting, setIsIgniting] = useState<boolean>(false);

  const prevStreakRef = useRef<number | null>(null);
  const prevTodayPassedRef = useRef<boolean | null>(null);

  const triggerIgniteAnimation = useCallback(() => {
    setIsIgniting(true);
    const igniteTimer = setTimeout(() => setIsIgniting(false), 2400);
    return () => clearTimeout(igniteTimer);
  }, []);

  const loadData = useCallback(
    async () => {
      if (!lineUid) return;
      try {
        const res = await fetchCalendarFireStack(lineUid);
        if (res) {
          setData(res);
          const currentStreak = res.current_streak ?? 0;

          const now = new Date();
          const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
          const todayItem = res.list?.find((item) => item.date === todayStr);
          const isTodayPassed = todayItem?.status === "pass";

          const isNewStreak =
            prevStreakRef.current !== null && currentStreak > prevStreakRef.current;
          const isNewTodayPass =
            prevTodayPassedRef.current === false && isTodayPassed;

          if (isNewStreak || isNewTodayPass) {
            triggerIgniteAnimation();
          }

          prevStreakRef.current = currentStreak;
          prevTodayPassedRef.current = isTodayPassed;
        }
      } catch {
        // resilient
      }
    },
    [lineUid, triggerIgniteAnimation]
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (refreshTrigger !== undefined && Number(refreshTrigger) > 0) {
      loadData();
      const timer = setTimeout(() => loadData(), 800);
      return () => clearTimeout(timer);
    }
  }, [refreshTrigger, loadData]);

  useEffect(() => {
    if (foodRecordsCount !== undefined && foodRecordsCount > 0) {
      loadData();
    }
  }, [foodRecordsCount, loadData]);

  useEffect(() => {
    const handleUpdate = () => {
      loadData();
      setTimeout(() => loadData(), 800);
    };
    window.addEventListener("food-record-updated", handleUpdate);
    return () => {
      window.removeEventListener("food-record-updated", handleUpdate);
    };
  }, [loadData]);

  const stackList =
    data?.list && data.list.length > 0 ? data.list : DEFAULT_STACK_LIST;
  const requiredStreak = stackList.length;
  const passedCount = stackList.filter((item) => item.status === "pass").length;
  const cycleProgress = Math.min(passedCount, requiredStreak);

  return (
    <div className="calendar-fire-stack">
      <div className="calendar-fire-stack-journey-header">
        <span className="calendar-fire-stack-journey-title">รอบการประเมิน 7 วัน</span>
        <span className="calendar-fire-stack-journey-pill">
          {cycleProgress} / {requiredStreak} วัน
        </span>
      </div>

      <div className="calendar-fire-stack-steps-grid">
        {stackList.map((item) => {
          const dayNum = item.day;
          const isCompleted = item.status === "pass";
          const isGoal = dayNum === requiredStreak;
          const isCurrentStep = cycleProgress === dayNum;
          const isStepIgniting = isIgniting && isCurrentStep;

          let stepClass = "calendar-fire-stack-step-item";
          if (isCompleted) stepClass += " calendar-fire-stack-step-item--done";
          if (isStepIgniting) {
            stepClass += " calendar-fire-stack-step-item--igniting";
          } else if (isCurrentStep && !isCompleted) {
            stepClass += " calendar-fire-stack-step-item--current";
          }
          if (isGoal) stepClass += " calendar-fire-stack-step-item--goal";

          return (
            <div key={`day-${dayNum}`} className={stepClass}>
              <div className="calendar-fire-stack-step-bubble">
                {isGoal ? (
                  <Sparkles
                    size={14}
                    className="calendar-fire-stack-step-goal-icon"
                  />
                ) : isCompleted ? (
                  <Check size={14} strokeWidth={2.8} />
                ) : (
                  <span className="calendar-fire-stack-step-num">{dayNum}</span>
                )}
              </div>
              <span className="calendar-fire-stack-step-label">
                {`วันที่ ${dayNum}`}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
