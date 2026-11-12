import { useState, useEffect, useCallback, useRef } from "react";
import {
  CloseOutlined,
  RightOutlined,
  BulbOutlined,
  ExpandOutlined
} from "@ant-design/icons";
import { Sparkles } from "lucide-react";
import toast from "react-hot-toast";
import { getStoredUser } from "../../utils/sessionAuth";
import { formatThaiDateRange } from "../../utils/formatDate";
import {
  fetchLatestRecommendation,
  dismissRecommendationById
} from "../../services/recommendation.service";
import type { RecommendationData } from "../../types/recommendation";
import { RecommendationModal } from "../RecommendationModal";
import "./SideMascot.css";

type MascotPosition = "bottom-right" | "bottom-left";

type SideMascotProps = {
  position?: MascotPosition;
  messages?: string[];
  characterName?: string;
  showBubbleInitially?: boolean;
  autoRotateMessages?: boolean;
  rotateIntervalMs?: number;
  onCharacterClick?: () => void;
};

const DEFAULT_MESSAGES: string[] = [
  "ทานอาหารครบ 5 หมู่เพื่อสุขภาพที่ดีในระยะยาว",
  "ดื่มน้ำอย่างเพียงพอเพื่อความสดชื่นตลอดวัน",
  "บันทึกมื้ออาหารเพื่อคำนวณแคลอรี่ที่แม่นยำ",
  "ขยับร่างกายวันละนิดเพื่อสุขภาพที่แข็งแรง",
  "ตั้งเป้าหมายโภชนาการและทำอย่างสม่ำเสมอ"
];

export const MASCOT_STORAGE_KEY_ENABLED = "caly_mascot_enabled";
export const MASCOT_STORAGE_KEY_DISMISSED_DATE = "caly_mascot_dismissed_date";
export const MASCOT_VISIBILITY_EVENT = "caly_mascot_visibility_change";

const JUMP_ANIMATION_DURATION_MS = 500;
const LONG_PRESS_THRESHOLD_MS = 500;

export const getTodayDateString = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const isMascotVisibleToday = (): boolean => {
  try {
    const enabled = sessionStorage.getItem(MASCOT_STORAGE_KEY_ENABLED);
    if (enabled === "false") {
      return false;
    }
    const dismissedDate = sessionStorage.getItem(MASCOT_STORAGE_KEY_DISMISSED_DATE);
    return dismissedDate !== getTodayDateString();
  } catch {
    return true;
  }
};

export const setMascotVisible = (visible: boolean): void => {
  try {
    if (visible) {
      sessionStorage.setItem(MASCOT_STORAGE_KEY_ENABLED, "true");
      sessionStorage.removeItem(MASCOT_STORAGE_KEY_DISMISSED_DATE);
    } else {
      sessionStorage.setItem(MASCOT_STORAGE_KEY_ENABLED, "false");
    }
    window.dispatchEvent(new Event(MASCOT_VISIBILITY_EVENT));
  } catch {
    // Ignore sessionStorage errors
  }
};

export const SideMascot = ({
  position = "bottom-right",
  messages = DEFAULT_MESSAGES,
  characterName = "Caly Buddy",
  showBubbleInitially = true,
  autoRotateMessages = true,
  rotateIntervalMs = 8000,
  onCharacterClick
}: SideMascotProps) => {
  const [isVisible, setIsVisible] = useState<boolean>(() => isMascotVisibleToday());
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [isBubbleVisible, setIsBubbleVisible] = useState(showBubbleInitially);
  const [isJumping, setIsJumping] = useState(false);
  const [showDismissBtn, setShowDismissBtn] = useState(false);

  // Latest Recommendation from History
  const [latestRecommendation, setLatestRecommendation] = useState<RecommendationData | null>(null);
  const [showRecommendationModal, setShowRecommendationModal] = useState<boolean>(false);
  const [cardViewMode, setCardViewMode] = useState<"recommendation" | "tip">("recommendation");

  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPressTriggeredRef = useRef(false);

  // Sync visibility with settings / storage
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(isMascotVisibleToday());
    };

    window.addEventListener(MASCOT_VISIBILITY_EVENT, handleVisibilityChange);
    window.addEventListener("storage", handleVisibilityChange);

    return () => {
      window.removeEventListener(MASCOT_VISIBILITY_EVENT, handleVisibilityChange);
      window.removeEventListener("storage", handleVisibilityChange);
    };
  }, []);

  // Fetch latest recommendation from history (GET /recommendation/latest/:line_uid)
  const loadLatestRecommendation = useCallback(async () => {
    const user = getStoredUser();
    const lineUid = String(user?.id || user?.line_uid || user?.userId || "");
    if (!lineUid) return;

    try {
      const latestData = await fetchLatestRecommendation(lineUid);
      if (latestData) {
        setLatestRecommendation(latestData);
        setCardViewMode("recommendation");

        if (!latestData.is_dismissed) {
          setIsVisible(true);
          setIsBubbleVisible(true);
          setShowRecommendationModal(true);
        }
      }
    } catch {
      // Fallback silently to tips
    }
  }, []);

  useEffect(() => {
    loadLatestRecommendation();
  }, [loadLatestRecommendation]);

  // Rotate fallback tips if in tip mode
  useEffect(() => {
    if (!autoRotateMessages || !isBubbleVisible || !isVisible || cardViewMode === "recommendation") {
      return;
    }

    const intervalTimer = setInterval(() => {
      setCurrentMessageIndex((prevIndex) => (prevIndex + 1) % messages.length);
    }, rotateIntervalMs);

    return () => {
      clearInterval(intervalTimer);
    };
  }, [autoRotateMessages, isBubbleVisible, isVisible, cardViewMode, messages.length, rotateIntervalMs]);

  const startLongPress = () => {
    isLongPressTriggeredRef.current = false;
    longPressTimerRef.current = setTimeout(() => {
      isLongPressTriggeredRef.current = true;
      setShowDismissBtn(true);
      if (typeof window !== "undefined" && navigator?.vibrate) {
        navigator.vibrate(40);
      }
    }, LONG_PRESS_THRESHOLD_MS);
  };

  const cancelLongPress = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleCharacterClick = () => {
    if (isLongPressTriggeredRef.current) {
      isLongPressTriggeredRef.current = false;
      return;
    }

    if (showDismissBtn) {
      setShowDismissBtn(false);
      return;
    }

    setIsJumping(true);
    setTimeout(() => {
      setIsJumping(false);
    }, JUMP_ANIMATION_DURATION_MS);

    if (!isBubbleVisible) {
      setIsBubbleVisible(true);
    } else if (latestRecommendation) {
      setCardViewMode((prev) => (prev === "recommendation" ? "tip" : "recommendation"));
    } else {
      setCurrentMessageIndex((prevIndex) => (prevIndex + 1) % messages.length);
    }

    onCharacterClick?.();
  };

  const handleDismissForToday = (event: React.MouseEvent) => {
    event.stopPropagation();
    try {
      sessionStorage.setItem(MASCOT_STORAGE_KEY_DISMISSED_DATE, getTodayDateString());
      window.dispatchEvent(new Event(MASCOT_VISIBILITY_EVENT));
    } catch {
      // Ignore
    }
    setIsVisible(false);
  };

  const handleDismissModal = async (id: number) => {
    try {
      await dismissRecommendationById(id);
    } catch {
      // Ignore
    }

    setShowRecommendationModal(false);
    setIsVisible(true);
    setIsBubbleVisible(true);
    setCardViewMode("recommendation");

    setLatestRecommendation((prev) => (prev ? { ...prev, is_dismissed: true } : prev));

    toast.success("บันทึกคำแนะนำเรียบร้อยแล้ว");
    setIsJumping(true);
    setTimeout(() => {
      setIsJumping(false);
    }, JUMP_ANIMATION_DURATION_MS);
  };

  if (!isVisible) {
    return null;
  }

  const positionClass =
    position === "bottom-left"
      ? "side-mascot--bottom-left"
      : "side-mascot--bottom-right";

  return (
    <>
      <aside
        className={`side-mascot ${positionClass}`}
        aria-label="Caly Mascot Assistant"
      >
        {/* Recommendation Popout Card / Speech Bubble */}
        <div
          className={`side-mascot-bubble ${
            !isBubbleVisible ? "side-mascot-bubble--hidden" : ""
          }`}
        >
          <div className="side-mascot-bubble-tail" />
          <div className="side-mascot-bubble-content">
            {latestRecommendation && cardViewMode === "recommendation" ? (
              <div className="side-mascot-rec-card">
                <div className="side-mascot-rec-header">
                  <span className="side-mascot-rec-tag">
                    <Sparkles size={11} />
                    <span>คำแนะนำรอบ 7 วัน</span>
                  </span>
                  <span className="side-mascot-rec-date">
                    {formatThaiDateRange(
                      latestRecommendation.cycle_start_date,
                      latestRecommendation.cycle_end_date
                    )}
                  </span>
                </div>

                <div className="side-mascot-rec-advice-box">
                  {latestRecommendation.ai_recommendation || latestRecommendation.ai_summary}
                </div>

                <div className="side-mascot-bubble-actions">
                  {!latestRecommendation.is_dismissed && (
                    <button
                      type="button"
                      className="side-mascot-bubble-primary-btn"
                      onClick={() => setShowRecommendationModal(true)}
                      title="เปิดดูสรุปแบบละเอียดและเมนูแนะนำ"
                    >
                      <ExpandOutlined style={{ fontSize: 11 }} />
                      <span>ดูรายละเอียด</span>
                    </button>
                  )}
                  <button
                    type="button"
                    className="side-mascot-bubble-btn"
                    onClick={() => setCardViewMode("tip")}
                    title="ดูเคล็ดลับสุขภาพ"
                  >
                    เคล็ดลับ <RightOutlined style={{ fontSize: 8, marginLeft: 2 }} />
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="side-mascot-bubble-title">
                  <BulbOutlined />
                  <span>{characterName}</span>
                </div>
                <p className="side-mascot-bubble-text">
                  {messages[currentMessageIndex % messages.length]}
                </p>
                <div className="side-mascot-bubble-actions">
                  <button
                    type="button"
                    className="side-mascot-bubble-btn"
                    onClick={() =>
                      setCurrentMessageIndex((prev) => (prev + 1) % messages.length)
                    }
                    title="ข้อความถัดไป"
                  >
                    ถัดไป <RightOutlined style={{ fontSize: 8, marginLeft: 2 }} />
                  </button>
                  {latestRecommendation && (
                    <button
                      type="button"
                      className="side-mascot-bubble-primary-btn"
                      onClick={() => setCardViewMode("recommendation")}
                      title="ดูคำแนะนำล่าสุด"
                    >
                      <Sparkles size={11} />
                      <span>คำแนะนำ AI</span>
                    </button>
                  )}
                </div>
              </>
            )}
          </div>

          <button
            type="button"
            className="side-mascot-bubble-close"
            onClick={() => setIsBubbleVisible(false)}
            aria-label="ปิดกล่องข้อความ"
          >
            <CloseOutlined style={{ fontSize: 10 }} />
          </button>
        </div>

        {/* Mascot Character Wrapper */}
        <div className="side-mascot-wrapper">
          {latestRecommendation && !latestRecommendation.is_dismissed && (
            <span className="side-mascot-badge" title="มีคำแนะนำโภชนาการใหม่">
              AI
            </span>
          )}

          {showDismissBtn && (
            <div className="side-mascot-dismiss-popup">
              <button
                type="button"
                className="side-mascot-dismiss-btn"
                onClick={handleDismissForToday}
                title="ปิดตัวการ์ตูนสำหรับวันนี้"
                aria-label="ปิดตัวการ์ตูนสำหรับวันนี้"
              >
                <CloseOutlined style={{ fontSize: 12 }} />
              </button>
              <span className="side-mascot-dismiss-hint">ปิดวันนี้</span>
            </div>
          )}

          <button
            type="button"
            className={`side-mascot-button ${isJumping ? "side-mascot-button--jumping" : ""}`}
            onClick={handleCharacterClick}
            onMouseDown={startLongPress}
            onMouseUp={cancelLongPress}
            onMouseLeave={cancelLongPress}
            onTouchStart={startLongPress}
            onTouchEnd={cancelLongPress}
            onTouchCancel={cancelLongPress}
            aria-label="คลิกเพื่อสลับคำแนะนำ หรือกดค้างเพื่อซ่อน"
          >
            <svg
              className="side-mascot-svg"
              viewBox="0 0 100 110"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="calyBodyGrad" x1="50" y1="20" x2="50" y2="105" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#4ADE80" />
                  <stop offset="60%" stopColor="#22C55E" />
                  <stop offset="100%" stopColor="#16A34A" />
                </linearGradient>
                <linearGradient id="calyBellyGrad" x1="50" y1="50" x2="50" y2="95" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#FEF08A" />
                  <stop offset="100%" stopColor="#FACC15" />
                </linearGradient>
                <linearGradient id="calyLeafGrad" x1="50" y1="0" x2="50" y2="25" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#86EFAC" />
                  <stop offset="100%" stopColor="#22C55E" />
                </linearGradient>
              </defs>

              <g className="side-mascot-leaf">
                <path
                  d="M50 22 C48 10 32 8 36 2 C44 2 50 14 50 22 Z"
                  fill="url(#calyLeafGrad)"
                />
                <path
                  d="M50 22 C52 8 68 6 64 0 C56 0 50 12 50 22 Z"
                  fill="url(#calyLeafGrad)"
                />
                <circle cx="50" cy="22" r="2.5" fill="#15803D" />
              </g>

              <g className="side-mascot-body-group">
                <path
                  d="M50 24 C30 24 20 40 18 64 C16 88 30 104 50 104 C70 104 84 88 82 64 C80 40 70 24 50 24 Z"
                  fill="url(#calyBodyGrad)"
                />

                <ellipse
                  cx="50"
                  cy="72"
                  rx="20"
                  ry="22"
                  fill="url(#calyBellyGrad)"
                  opacity="0.95"
                />

                <g className="side-mascot-eye">
                  <ellipse cx="38" cy="48" rx="4.5" ry="6" fill="#1E293B" />
                  <circle cx="36.5" cy="46" r="2" fill="#FFFFFF" />
                  <circle cx="39.5" cy="50" r="0.9" fill="#FFFFFF" />

                  <ellipse cx="62" cy="48" rx="4.5" ry="6" fill="#1E293B" />
                  <circle cx="60.5" cy="46" r="2" fill="#FFFFFF" />
                  <circle cx="63.5" cy="50" r="0.9" fill="#FFFFFF" />
                </g>

                <ellipse cx="28" cy="55" rx="5" ry="3.5" fill="#FDA4AF" opacity="0.8" />
                <ellipse cx="72" cy="55" rx="5" ry="3.5" fill="#FDA4AF" opacity="0.8" />

                <path
                  d="M45 54 Q50 60 55 54"
                  stroke="#1E293B"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  fill="none"
                />
                <path
                  d="M47 56 Q50 61 53 56 Z"
                  fill="#F43F5E"
                />

                <path
                  d="M20 62 Q14 70 24 73"
                  stroke="#16A34A"
                  strokeWidth="5"
                  strokeLinecap="round"
                  fill="none"
                />

                <ellipse cx="40" cy="103" rx="7" ry="4" fill="#15803D" />
                <ellipse cx="60" cy="103" rx="7" ry="4" fill="#15803D" />
              </g>

              <g className="side-mascot-waving-hand">
                <path
                  d="M80 62 Q92 52 86 42"
                  stroke="#16A34A"
                  strokeWidth="5.5"
                  strokeLinecap="round"
                  fill="none"
                />
                <circle cx="86" cy="42" r="3.5" fill="#22C55E" />
              </g>
            </svg>
          </button>
        </div>
      </aside>

      <RecommendationModal
        data={latestRecommendation}
        open={showRecommendationModal}
        onDismiss={handleDismissModal}
      />
    </>
  );
};
