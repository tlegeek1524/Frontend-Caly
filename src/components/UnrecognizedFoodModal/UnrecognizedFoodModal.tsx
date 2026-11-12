import { Modal, Button } from "antd";
import { ExclamationCircleFilled } from "@ant-design/icons";
import "./UnrecognizedFoodModal.css";

type UnrecognizedFoodModalProps = {
  open: boolean;
  onClose: () => void;
  onRetry?: () => void;
};

export const UnrecognizedFoodModal = ({
  open,
  onClose,
  onRetry,
}: UnrecognizedFoodModalProps) => {
  const handleRetry = () => {
    onClose();
    onRetry?.();
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      centered
      width={400}
      title={
        <div className="unrecognized-modal-title">
          <ExclamationCircleFilled style={{ color: "#faad14", fontSize: 20 }} />
          <span>ไม่สามารถระบุอาหารได้</span>
        </div>
      }
      footer={[
        <Button key="cancel" onClick={onClose}>
          ปิด
        </Button>,
        <Button key="retry" type="primary" onClick={handleRetry}>
          ถ่ายใหม่อีกครั้ง
        </Button>,
      ]}
    >
      <p className="unrecognized-modal-text">
        รูปภาพอาจไม่ชัดเจน แสงน้อยเกินไป หรือไม่ใช่รูปอาหาร กรุณาลองถ่ายภาพใหม่อีกครั้ง
      </p>
    </Modal>
  );
};
