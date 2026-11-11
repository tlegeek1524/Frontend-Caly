export type PDPATemplate = {
  id: number;
  title: string;
  version: string;
  content_html: string;
  is_active: boolean;
  description: string;
  created_at: string;
  updated_at: string;
};

export type PDPATemplateResponse = {
  status: number;
  total: number;
  data: PDPATemplate[];
};

export type CheckPDPAConsentResponse = {
  status?: number;
  accepted?: boolean;
  is_accepted?: boolean;
  has_accepted?: boolean;
  data?: {
    accepted?: boolean;
    is_accepted?: boolean;
    has_accepted?: boolean;
    version?: string;
  };
};

export type SavePDPAConsentPayload = {
  user_id?: string | number;
  line_uid?: string;
  template_id?: number;
  version?: string;
};
