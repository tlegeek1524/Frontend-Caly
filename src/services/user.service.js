/**
 * Service สำหรับจัดการการคำนวณและ API ของ User / TDEE
 */

/**
 * คำนวณ BMR (Basal Metabolic Rate) ด้วยสูตร Mifflin-St Jeor
 * @param {Object} params
 * @param {string} params.gender - 'male' | 'female'
 * @param {number|string} params.weight - น้ำหนัก (kg)
 * @param {number|string} params.height - ส่วนสูง (cm)
 * @param {number|string} params.age - อายุ (ปี)
 * @returns {number} ค่า BMR (ปัดเศษ)
 */
export const calculateBMR = ({ gender, weight, height, age }) => {
  const w = parseFloat(weight) || 0;
  const h = parseFloat(height) || 0;
  const a = parseFloat(age) || 0;
  
  if (!w || !h || !a) return 0;
  
  const bmr = 10 * w + 6.25 * h - 5 * a + (gender === 'male' ? 5 : -161);
  return Math.round(bmr);
};

/**
 * คำนวณ TDEE (Total Daily Energy Expenditure) ตามระดับกิจกรรมและเป้าหมาย
 * @param {Object} params
 * @param {number} params.bmr - ค่า BMR
 * @param {string} params.activityLevel - ระดับกิจกรรม
 * @param {string} params.goal - เป้าหมาย ('lose' | 'maintain' | 'gain')
 * @returns {number} ค่า TDEE (ปัดเศษ)
 */
export const calculateTDEEValue = ({ bmr, activityLevel, goal }) => {
  let multiplier = 1.2;
  
  switch (activityLevel) {
    case 'sedentary':
      multiplier = 1.2;
      break;
    case 'light':
      multiplier = 1.375;
      break;
    case 'moderate':
      multiplier = 1.55;
      break;
    case 'active':
      multiplier = 1.725;
      break;
    case 'very_active':
      multiplier = 1.9;
      break;
    default:
      multiplier = 1.2;
  }
  
  let tdee = bmr * multiplier;
  
  // ปรับตามเป้าหมาย (ลด/เพิ่ม 500 kcal)
  if (goal === 'lose' || goal === 'lose_weight') {
    tdee -= 500;
  } else if (goal === 'gain' || goal === 'gain_weight') {
    tdee += 500;
  }
  
  return Math.round(tdee);
};

const API_BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

/**
 * ดึงข้อมูลผู้ใช้จาก Backend API
 * @param {string} lineUid 
 * @returns {Promise<{success: boolean, data?: Object, error?: any}>}
 */
export const getUserService = async (lineUid) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/user/${lineUid}`);
    if (!response.ok) {
      return { success: false, status: response.status };
    }
    const result = await response.json();
    return { success: true, data: result.data || result };
  } catch (error) {
    console.error('[UserService] getUserService error:', error);
    return { success: false, error };
  }
};

/**
 * สร้างข้อมูลผู้ใช้ใหม่ (POST /api/v1/user)
 * @param {Object} payload 
 * @returns {Promise<{success: boolean, data?: Object, error?: any}>}
 */
export const createUserService = async (payload) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { success: false, error: errorData };
    }
    
    const result = await response.json().catch(() => ({}));
    return { success: true, data: result };
  } catch (error) {
    console.error('[UserService] createUserService error:', error);
    return { success: false, error };
  }
};

/**
 * อัปเดตข้อมูลผู้ใช้เดิม (PATCH /api/v1/user/:line_uid)
 * @param {string} lineUid 
 * @param {Object} payload 
 * @returns {Promise<{success: boolean, data?: Object, error?: any}>}
 */
export const updateUserService = async (lineUid, payload) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/user/${lineUid}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { success: false, error: errorData };
    }
    
    const result = await response.json().catch(() => ({}));
    return { success: true, data: result };
  } catch (error) {
    console.error('[UserService] updateUserService error:', error);
    return { success: false, error };
  }
};

/**
 * ตรวจสอบสถานะผู้ดูแลระบบผ่าน GET /verifyadmin?id_token=<line_uid>
 * @param {Object|string} params - { line_uid, id_token } หรือ line_uid string
 * @returns {Promise<{success: boolean, data?: { line_uid?: string, is_status?: string }, status?: string, message?: string, error?: any}>}
 */
export const verifyAdminService = async (params) => {
  try {
    const lineUid =
      typeof params === 'string'
        ? params
        : params?.line_uid || params?.id_token || '';

    if (!lineUid) {
      return { success: false };
    }

    const response = await fetch(
      `${API_BASE_URL}/verifyadmin?id_token=${encodeURIComponent(lineUid)}`,
      {
        method: 'GET',
        headers: {
          accept: '*/*',
        },
      }
    );

    if (response.ok) {
      const result = await response.json();
      return {
        success: result.status === 'success' || result.success === true || Boolean(result),
        data: result.data || result,
        message: result.message,
        status: result.status,
      };
    }

    return { success: false, status: response.status };
  } catch (error) {
    console.error('[UserService] verifyAdminService error:', error);
    return { success: false, error };
  }
};

