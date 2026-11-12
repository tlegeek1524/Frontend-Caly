/**
 * Image Storage Upload Service
 * 
 * Endpoint: POST /api/upload หรือ POST /upload (ผ่าน backend API)
 * Params: 
 *   - folder: "food"
 *   - file: binary file
 */

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  "https://backendcaly-production.up.railway.app";

export type UploadImageResponse = {
  url?: string;
  imageUrl?: string;
  image_url?: string;
  fileUrl?: string;
  data?: {
    url?: string;
    imageUrl?: string;
    image_url?: string;
    fileUrl?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

export const uploadFoodImage = async (imageFile: File): Promise<string> => {
  const token =
    sessionStorage.getItem("access_token") ||
    sessionStorage.getItem("access_token");

  const formData = new FormData();
  formData.append("folder", "food");
  formData.append("file", imageFile);

  const headers: HeadersInit = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // รองรับทั้ง /api/upload หรือ /upload
  const uploadUrl = `${API_BASE_URL.replace(/\/+$/, "")}/upload`;

  try {
    let response = await fetch(uploadUrl, {
      method: "POST",
      headers,
      body: formData,
    });

    // Fallback เผื่อ backend ไม่ได้ขึ้นต้นด้วย /api
    if (response.status === 404) {
      const fallbackUrl = `${API_BASE_URL.replace(/\/+$/, "")}/upload`;
      response = await fetch(fallbackUrl, {
        method: "POST",
        headers,
        body: formData,
      });
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Upload failed (${response.status}): ${errorText}`);
    }

    const resData: UploadImageResponse = await response.json();

    // ดึง URL ที่ส่งกลับมาจาก backend
    const imageUrl =
      resData?.url ||
      resData?.imageUrl ||
      resData?.image_url ||
      resData?.fileUrl ||
      resData?.data?.url ||
      resData?.data?.imageUrl ||
      resData?.data?.image_url ||
      resData?.data?.fileUrl;

    if (imageUrl) {
      return imageUrl;
    }

    throw new Error("No image URL returned from upload response");
  } catch (error) {
    console.error("Failed to upload image to backend:", error);
    throw error;
  }
};
