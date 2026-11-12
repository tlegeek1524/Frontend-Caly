import { useState } from "react";
import { Sparkles, Lightbulb, Utensils, CheckCircle2 } from "lucide-react";
import type { RecommendationData } from "../../types/recommendation";
import { formatThaiDateRange } from "../../utils/formatDate";
import "./RecommendationModal.css";

type RecommendationModalProps = {
  data: RecommendationData | null;
  open: boolean;
  onDismiss: (id: number) => Promise<void> | void;
};

export const RecommendationModal = ({
  data,
  open,
  onDismiss
}: RecommendationModalProps) => {
  const [submitting, setSubmitting] = useState(false);

  if (!open || !data) {
    return null;
  }

  const handleDismissClick = async () => {
    try {
      setSubmitting(true);
      await onDismiss(data.id);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="recommendation-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="recommendation-modal-title"
    >
      <div
        className="recommendation-modal-container"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="recommendation-modal-header">
          <div className="recommendation-modal-icon-badge" aria-hidden="true">
            <Sparkles size={18} />
          </div>
          <div className="recommendation-modal-header-text">
            <h2 id="recommendation-modal-title" className="recommendation-modal-title">
              คำแนะนำโภชนาการรอบ 7 วัน
            </h2>
            <p className="recommendation-modal-subtitle">
              รอบวันที่ {formatThaiDateRange(data.cycle_start_date, data.cycle_end_date)}
            </p>
          </div>
        </div>

        {/* Body Content */}
        <div className="recommendation-modal-body">
          {/* Quick Stats Bar */}
          <div className="recommendation-modal-stats-bar">
            <div className="recommendation-modal-stat-card">
              <div className="recommendation-modal-stat-label">บันทึกอาหาร</div>
              <div className="recommendation-modal-stat-value">{data.logged_days} / 7 วัน</div>
            </div>
            <div className="recommendation-modal-stat-card">
              <div className="recommendation-modal-stat-label">แคลอรี่เฉลี่ยต่อวัน</div>
              <div className="recommendation-modal-stat-value">
                {data.avg_calories_per_day.toLocaleString()} kcal
              </div>
            </div>
          </div>

          {/* AI Summary Card */}
          <div className="recommendation-modal-card">
            <h3 className="recommendation-modal-card-heading">
              <div className="recommendation-modal-card-icon">
                <CheckCircle2 size={15} />
              </div>
              <span>สรุปภาพรวมจากระบบ</span>
            </h3>
            <p className="recommendation-modal-card-text">{data.ai_summary}</p>
          </div>

          {/* AI Recommendation Card */}
          <div className="recommendation-modal-card recommendation-modal-card--highlight">
            <h3 className="recommendation-modal-card-heading">
              <div className="recommendation-modal-card-icon">
                <Lightbulb size={15} />
              </div>
              <span>คำแนะนำในการปรับโภชนาการ</span>
            </h3>
            <p className="recommendation-modal-card-text">{data.ai_recommendation}</p>
          </div>

          {/* Suggested Menus */}
          {data.ai_suggested_menus && data.ai_suggested_menus.length > 0 && (
            <div className="recommendation-modal-card">
              <h3 className="recommendation-modal-card-heading">
                <div className="recommendation-modal-card-icon">
                  <Utensils size={15} />
                </div>
                <span>เมนูแนะนำสำหรับคุณ</span>
              </h3>
              <div className="recommendation-modal-menu-list">
                {data.ai_suggested_menus.map((menu, index) => (
                  <div
                    key={`${menu.menu_name}-${index}`}
                    className="recommendation-modal-menu-item"
                  >
                    <div className="recommendation-modal-menu-header">
                      <span className="recommendation-modal-menu-tag">
                        {menu.meal_type}
                      </span>
                      <span className="recommendation-modal-menu-cal">
                        {menu.estimated_calories} kcal
                      </span>
                    </div>
                    <h4 className="recommendation-modal-menu-title">{menu.menu_name}</h4>
                    <div className="recommendation-modal-macro-bar">
                      <span className="recommendation-modal-macro-pill">
                        P: {menu.protein}g
                      </span>
                      <span className="recommendation-modal-macro-pill">
                        C: {menu.carb}g
                      </span>
                      <span className="recommendation-modal-macro-pill">
                        F: {menu.fat}g
                      </span>
                    </div>
                    {menu.reason && (
                      <p className="recommendation-modal-menu-reason">
                        &ldquo;{menu.reason}&rdquo;
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Action */}
        <div className="recommendation-modal-footer">
          <button
            type="button"
            className="recommendation-modal-submit-btn"
            onClick={handleDismissClick}
            disabled={submitting}
          >
            {submitting ? "กำลังบันทึก..." : "รับทราบและปิดคำแนะนำ"}
          </button>
        </div>
      </div>
    </div>
  );
};
