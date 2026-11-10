import React from "react";
import { Result, Button } from "antd";
import { useNavigate } from "react-router-dom";
import "./ErrorPage.css";

export type ErrorType = "403" | "404" | "500";

type ErrorPageProps = {
  type?: ErrorType;
  title?: string;
  subTitle?: string;
};

const ERROR_CONFIG: Record<ErrorType, { title: string; subTitle: string }> = {
  "403": {
    title: "403",
    subTitle: "ขออภัย คุณไม่มีสิทธิ์เข้าถึงหน้านี้ (Forbidden)"
  },
  "404": {
    title: "404",
    subTitle: "ขออภัย ไม่พบหน้าที่คุณต้องการ (Page Not Found)"
  },
  "500": {
    title: "500",
    subTitle: "ขออภัย เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์ (Internal Server Error)"
  }
};

export const ErrorPage: React.FC<ErrorPageProps> = ({ type = "404", title, subTitle }) => {
  const navigate = useNavigate();
  const config = ERROR_CONFIG[type] || ERROR_CONFIG["404"];

  const displayTitle = title || config.title;
  const displaySubTitle = subTitle || config.subTitle;

  return (
    <div className="error-page-wrapper">
      <Result
        status={type}
        title={displayTitle}
        subTitle={displaySubTitle}
        className="error-page-result"
        extra={
          <div className="error-page-actions">
            <Button type="default" onClick={() => navigate(-1)}>
              ย้อนกลับ
            </Button>
            <Button type="primary" onClick={() => navigate("/dashboard")}>
              กลับสู่หน้าหลัก
            </Button>
          </div>
        }
      />
    </div>
  );
};

export default ErrorPage;
