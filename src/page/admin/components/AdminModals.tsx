import { Modal, Space, Row, Col, Button, Form, Input, DatePicker } from "antd";
import type { FormInstance } from "antd";
import type { AuditLogRecord, BanUserPayload } from "../../../types/admin";

type AdminLogDetailModalProps = {
  log: AuditLogRecord | null;
  onClose: () => void;
};

export const AdminLogDetailModal = ({ log, onClose }: AdminLogDetailModalProps) => {
  return (
    <Modal
      title="รายละเอียดบันทึกกิจกรรม"
      open={Boolean(log)}
      onCancel={onClose}
      footer={[
        <Button key="close" onClick={onClose}>
          ปิด
        </Button>
      ]}
    >
      {log && (
        <Space direction="vertical" style={{ width: "100%" }} size={12}>
          <div className="admin-dashboard-modal-section">
            <div className="admin-dashboard-modal-label">ผู้ดำเนินการ</div>
            <div style={{ fontWeight: 600 }}>
              {log.user_detail?.full_name || "System"} (@{log.decoded_sessions?.username || "guest"})
            </div>
          </div>
          <Row gutter={12}>
            <Col span={12}>
              <div className="admin-dashboard-modal-section">
                <div className="admin-dashboard-modal-label">IP Address</div>
                <div className="admin-dashboard-modal-val">{log.ip_address || "—"}</div>
              </div>
            </Col>
            <Col span={12}>
              <div className="admin-dashboard-modal-section">
                <div className="admin-dashboard-modal-label">Session ID</div>
                <div className="admin-dashboard-modal-val" style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
                  {log.session_id || "—"}
                </div>
              </div>
            </Col>
          </Row>
          <div className="admin-dashboard-modal-section">
            <div className="admin-dashboard-modal-label" style={{ marginBottom: 2 }}>User Agent</div>
            <div className="admin-dashboard-modal-val-wrap">
              {log.user_agent || "—"}
            </div>
          </div>
        </Space>
      )}
    </Modal>
  );
};

type AdminBanUserModalProps = {
  open: boolean;
  form: FormInstance<BanUserPayload>;
  isProcessing: boolean;
  onCancel: () => void;
  onSubmit: (values: BanUserPayload) => void;
};

export const AdminBanUserModal = ({
  open,
  form,
  isProcessing,
  onCancel,
  onSubmit
}: AdminBanUserModalProps) => {
  return (
    <Modal
      title="ระงับการใช้งานบัญชี"
      open={open}
      onCancel={onCancel}
      onOk={() => form.submit()}
      confirmLoading={isProcessing}
      okText="ยืนยันการระงับ"
      cancelText="ยกเลิก"
      okButtonProps={{ danger: true }}
    >
      <Form form={form} layout="vertical" onFinish={onSubmit}>
        <Form.Item
          name="accountno"
          label="หมายเลขบัญชี"
          rules={[{ required: true, message: "กรุณาระบุหมายเลขบัญชี" }]}
        >
          <Input placeholder="เช่น CALY001" />
        </Form.Item>
        <Form.Item name="ban_reason" label="สาเหตุการระงับ">
          <Input.TextArea rows={2} placeholder="ระบุเหตุผลในการระงับบัญชี" />
        </Form.Item>
        <Form.Item name="ban_end_date" label="สิ้นสุดวันที่ (ไม่บังคับ)">
          <DatePicker style={{ width: "100%" }} inputReadOnly placeholder="เลือกวันที่สิ้นสุด" />
        </Form.Item>
      </Form>
    </Modal>
  );
};
