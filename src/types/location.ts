export type FoodLocationPayload = {
  line_uid?: string;
  user_id?: string | number;
  lat: number;
  lng: number;
  latitude: number;
  longitude: number;
  accuracy_m?: number;
  source_type?: string;
};

export type FoodLocationResponse = {
  status?: number;
  success?: boolean;
  message?: string;
  locat_ref_id?: string | number;
  data?: {
    id?: string | number;
    locat_ref_id?: string | number;
    ref_id?: string | number;
    location_id?: string | number;
    [key: string]: unknown;
  } | string | number;
};
