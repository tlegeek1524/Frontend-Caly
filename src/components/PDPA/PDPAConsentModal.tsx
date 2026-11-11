import { useState, useEffect } from "react";
import type { PDPATemplate } from "../../types/pdpa";
import {
  fetchActivePDPATemplate,
  checkPDPAConsentService,
  savePDPAConsentService
} from "../../services/pdpa.service";
import "./PDPAConsentModal.css";

type PDPAConsentModalProps = {
  isOpen?: boolean;
  userId?: string | number;
  onClose?: () => void;
  onConsentAccepted?: (template: PDPATemplate) => void;
};

export const PDPAConsentModal = ({
  isOpen: externalIsOpen,
  userId,
  onClose,
  onConsentAccepted
}: PDPAConsentModalProps) => {
  const [template, setTemplate] = useState<PDPATemplate | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [internalOpen, setInternalOpen] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    const verifyConsent = async () => {
      setLoading(true);
      const activeTemplate = await fetchActivePDPATemplate();
      if (!isMounted) return;

      if (activeTemplate) {
        setTemplate(activeTemplate);

        const isAcceptedServer = await checkPDPAConsentService({
          user_id: userId,
          version: activeTemplate.version
        });

        if (!isMounted) return;

        const localKey = `pdpa_consent_v_${activeTemplate.version}`;
        const isAcceptedLocal = localStorage.getItem(localKey) === "true";

        if (!isAcceptedServer && !isAcceptedLocal) {
          setInternalOpen(true);
        }
      }
      setLoading(false);
    };

    verifyConsent();

    return () => {
      isMounted = false;
    };
  }, [userId]);

  const isVisible = externalIsOpen !== undefined ? externalIsOpen : internalOpen;

  useEffect(() => {
    if (isVisible) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isVisible]);

  if (!isVisible || loading || !template) {
    return null;
  }

  const handleClose = () => {
    setInternalOpen(false);
    if (onClose) {
      onClose();
    }
  };

  const handleAccept = async () => {
    if (submitting) return;
    setSubmitting(true);

    try {
      await savePDPAConsentService({
        user_id: userId,
        template_id: template.id,
        version: template.version
      });

      const localKey = `pdpa_consent_v_${template.version}`;
      localStorage.setItem(localKey, "true");
      localStorage.setItem("gps_consent", "true");

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            console.log("PDPA GPS permission granted:", position.coords);
          },
          (error) => {
            console.warn("PDPA GPS permission declined or unavailable:", error.message);
          },
          { enableHighAccuracy: true, timeout: 8000 }
        );
      }

      setInternalOpen(false);

      if (onConsentAccepted) {
        onConsentAccepted(template);
      }
      if (onClose) {
        onClose();
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="pdpa-modal-overlay">
      <div className="pdpa-modal-dialog">
        <div className="pdpa-modal-header">
          <div className="pdpa-modal-header-left">
            <h3 className="pdpa-modal-title">{template.title}</h3>
            <span className="pdpa-modal-version">v{template.version}</span>
          </div>
        </div>

        <div className="pdpa-modal-body">
          {template.description && (
            <p className="pdpa-modal-desc">{template.description}</p>
          )}
          <div
            className="pdpa-modal-content-box"
            dangerouslySetInnerHTML={{ __html: template.content_html }}
          />
        </div>

        <div className="pdpa-modal-footer">
          <button
            type="button"
            onClick={handleClose}
            className="pdpa-modal-btn-cancel"
            disabled={submitting}
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={handleAccept}
            className="pdpa-modal-btn-accept"
            disabled={submitting}
          >
            {submitting ? "กำลังบันทึก..." : "ยินยอม"}
          </button>
        </div>
      </div>
    </div>
  );
};
