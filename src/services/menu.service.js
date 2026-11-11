/**
 * Service สำหรับจัดการ API รายการอาหาร (Menu)
 */

const API_BASE_URL = '';

/**
 * บันทึกข้อมูลเมนูอาหารใหม่ (POST /api/v1/menu)
 * @param {Object} payload
 * @param {string} payload.line_uid - LINE User ID
 * @param {string} payload.menu - ชื่อเมนูอาหาร
 * @param {number} payload.cal - แคลอรี
 * @param {number} payload.protein - โปรตีน
 * @param {number} payload.carb - คาร์โบไฮเดรต
 * @param {number} payload.fat - ไขมัน
 * @param {string} [payload.date] - วันเวลาแบบ ISO String
 * @param {string} [payload.image_url] - path รูปภาพ
 * @param {string|number} [payload.runnum] - ลำดับ / รหัสอ้างอิง
 * @param {string} [payload.mash] - มื้ออาหาร (เช่น 'breakfast', 'lunch', 'dinner')
 * @param {number} [payload.eat_percent] - เปอร์เซ็นต์การกิน (เช่น 100)
 * @param {string|number} [payload.locat_ref_id] - รหัสอ้างอิงพิกัด location จาก food_location
 * @returns {Promise<{success: boolean, data?: Object, error?: any}>}
 */
export const createMenuService = async (payload) => {
  try {
    const formattedPayload = {
      line_uid: payload.line_uid,
      menu: payload.menu,
      cal: Number(payload.cal) || 0,
      protein: Number(payload.protein) || 0,
      carb: Number(payload.carb) || 0,
      fat: Number(payload.fat) || 0,
      date: payload.date || new Date().toISOString(),
      image_url: payload.image_url || '',
      runnum: payload.runnum ? String(payload.runnum) : '1',
      mash: payload.mash || 'lunch',
      eat_percent: payload.eat_percent !== undefined ? Number(payload.eat_percent) : 100,
      ...(payload.locat_ref_id !== undefined && payload.locat_ref_id !== null && {
        locat_ref_id: String(payload.locat_ref_id)
      })
    };

    console.log('[MenuService] Sending POST /api/v1/menu:', formattedPayload);

    const response = await fetch(`${API_BASE_URL}/api/v1/menu`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formattedPayload)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[MenuService] POST /api/v1/menu error response:', errorData);
      return { success: false, error: errorData };
    }

    const result = await response.json().catch(() => ({}));
    invalidateTodayMenuCache();
    return { success: true, data: result };
  } catch (error) {
    console.error('[MenuService] createMenuService exception:', error);
    return { success: false, error };
  }
};

// In-memory Cache สำหรับข้อมูลวันปัจจุบัน
let todayMenusCache = {
  lineUid: null,
  date: null,
  data: null,
  timestamp: 0
};

let todayMenusAfterCache = {
  lineUid: null,
  date: null,
  data: null,
  timestamp: 0
};

// ฟังก์ชัน helper เพื่อหา YYYY-MM-DD ของวันปัจจุบัน (Local Time)
const getTodayDateString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * ล้าง Cache ข้อมูลวันปัจจุบัน (ใช้เมื่อมีการเพิ่ม/แก้ไขข้อมูล)
 */
export const invalidateTodayMenuCache = () => {
  todayMenusCache = { lineUid: null, date: null, data: null, timestamp: 0 };
  todayMenusAfterCache = { lineUid: null, date: null, data: null, timestamp: 0 };
};

/**
 * ดึงรายการอาหารตาม line_uid และวันที่เลือก (GET /api/v1/menus?line_uid=...)
 * ถ้าเป็นวันปัจจุบันและมี Cache อยู่แล้ว จะดึงจาก Cache ทันทีโดยไม่ยิง API ซ้ำ
 * @param {string} lineUid - LINE User ID
 * @param {string} [selectedDate] - วันที่ในรูปแบบ YYYY-MM-DD (ถ้ามี)
 * @param {boolean} [forceRefresh=false] - บังคับยิง API ใหม่เพื่ออัปเดต Cache
 * @returns {Promise<{success: boolean, data?: Array, error?: any}>}
 */
export const getMenusService = async (lineUid, selectedDate = null, forceRefresh = false) => {
  try {
    if (!lineUid) {
      return { success: false, error: 'line_uid is required', data: [] };
    }

    const todayStr = getTodayDateString();
    const isToday = !selectedDate || selectedDate === todayStr;

    // ถ้าเป็นวันปัจจุบัน และมี Cache อยู่แล้ว และไม่ได้สั่ง forceRefresh -> คืนค่าจาก Cache ทันที
    if (isToday && !forceRefresh && todayMenusCache.data && todayMenusCache.lineUid === lineUid && todayMenusCache.date === todayStr) {
      console.log('[MenuService] Returning today menus from memory cache (No API call)');
      return { success: true, data: todayMenusCache.data, fromCache: true };
    }

    const response = await fetch(`${API_BASE_URL}/api/v1/menus?line_uid=${encodeURIComponent(lineUid)}`, {
      method: 'GET',
      headers: {
        'Accept': '*/*'
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[MenuService] GET /api/v1/menus error response:', errorData);
      return { success: false, error: errorData, data: [] };
    }

    const resJson = await response.json().catch(() => ({}));
    const rawList = Array.isArray(resJson) ? resJson : (resJson.data || []);

    // Format & Map data ให้ตรงกับโครงสร้างที่ Frontend ใช้งาน
    const formattedRecords = rawList
      .map((item) => {
        const itemDate = item.date || item.created_at || '2000-01-01T00:00:00.000Z';
        return {
          id: item.id,
          runnum: item.runnum || null,
          line_uid: item.line_uid,
          menu: item.menu || 'ไม่ระบุเมนู',
          cal: Number(item.cal) || 0,
          protein: Number(item.protein ?? item.protine) || 0,
          carb: Number(item.carb) || 0,
          fat: Number(item.fat) || 0,
          date: itemDate,
          mash: item.mash || 'lunch',
          eat_percent: item.eat_percent !== undefined ? Number(item.eat_percent) : 100,
          image: item.image_url || item.image || null,
          image_url: item.image_url || item.image || null,
          created_at: item.created_at
        };
      })
      .filter((record) => {
        if (!selectedDate) return true;
        try {
          const recordDateTime = new Date(record.date);
          // แปลงเป็น YYYY-MM-DD ตาม Local Timezone ของเครื่องผู้ใช้งาน
          const year = recordDateTime.getFullYear();
          const month = String(recordDateTime.getMonth() + 1).padStart(2, '0');
          const day = String(recordDateTime.getDate()).padStart(2, '0');
          const localDateStr = `${year}-${month}-${day}`;
          
          return localDateStr === selectedDate;
        } catch {
          return true;
        }
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    // บันทึกลง Cache เฉพาะถ้าเป็นการดึงของวันปัจจุบัน
    if (isToday) {
      todayMenusCache = {
        lineUid,
        date: todayStr,
        data: formattedRecords,
        timestamp: Date.now()
      };
    }

    return { success: true, data: formattedRecords };
  } catch (error) {
    console.error('[MenuService] getMenusService exception:', error);
    return { success: false, error, data: [] };
  }
};

/**
 * บันทึกข้อมูลอาหารหลังกิน (POST /api/v1/menus/after)
 * @param {Object} payload
 * @param {number} payload.food_menu_id - ID ของรายการอาหารหลัก (FK)
 * @param {string} payload.line_uid - LINE User ID
 * @param {number} payload.cal - แคลอรีที่กินจริง
 * @param {number} payload.protein - โปรตีนที่กินจริง
 * @param {number} payload.carb - คาร์โบไฮเดรตที่กินจริง
 * @param {number} payload.fat - ไขมันที่กินจริง
 * @param {number} [payload.eat_percent] - เปอร์เซ็นต์การกิน (เช่น 100, 80)
 * @param {string} [payload.image_url] - URL รูปภาพหลังกิน
 * @param {string} [payload.mash] - มื้ออาหาร
 * @param {string} [payload.runnum] - รหัสอ้างอิง/ลำดับ
 * @param {string} [payload.date] - วันเวลาแบบ ISO String
 * @returns {Promise<{success: boolean, data?: Object, error?: any}>}
 */
export const createMenuAfterService = async (payload) => {
  try {
    const formattedPayload = {
      food_menu_id: Number(payload.food_menu_id),
      line_uid: payload.line_uid,
      cal: Number(payload.cal) || 0,
      protein: Number(payload.protein) || 0,
      carb: Number(payload.carb) || 0,
      fat: Number(payload.fat) || 0,
      eat_percent: payload.eat_percent !== undefined ? Number(payload.eat_percent) : 100,
      image_url: payload.image_url || '',
      mash: payload.mash || 'lunch',
      runnum: payload.runnum ? String(payload.runnum) : '1',
      date: payload.date || new Date().toISOString()
    };

    console.log('[MenuService] Sending POST /api/v1/menus/after:', formattedPayload);

    const response = await fetch(`${API_BASE_URL}/api/v1/menus/after`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formattedPayload)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[MenuService] POST /api/v1/menus/after error response:', errorData);
      return { success: false, error: errorData };
    }

    const result = await response.json().catch(() => ({}));
    invalidateTodayMenuCache();
    return { success: true, data: result };
  } catch (error) {
    console.error('[MenuService] createMenuAfterService exception:', error);
    return { success: false, error };
  }
};

/**
 * ดึงข้อมูลรายการอาหารหลังกิน (GET /api/v1/menu/after?line_uid=...)
 * ถ้าเป็นวันปัจจุบันและมี Cache อยู่แล้ว จะดึงจาก Cache ทันทีโดยไม่ยิง API ซ้ำ
 * @param {string} lineUid - LINE User ID
 * @param {string} [selectedDate] - วันที่ในรูปแบบ YYYY-MM-DD (ถ้ามี เพื่อกรองเฉพาะวันนั้น)
 * @param {boolean} [forceRefresh=false] - บังคับยิง API ใหม่เพื่ออัปเดต Cache
 * @returns {Promise<{success: boolean, data?: Array, error?: any}>}
 */
export const getMenusAfterService = async (lineUid, selectedDate = null, forceRefresh = false) => {
  try {
    if (!lineUid) {
      return { success: false, error: 'line_uid is required', data: [] };
    }

    const todayStr = getTodayDateString();
    const isToday = !selectedDate || selectedDate === todayStr;

    // ถ้าเป็นวันปัจจุบัน และมี Cache อยู่แล้ว และไม่ได้สั่ง forceRefresh -> คืนค่าจาก Cache ทันที
    if (isToday && !forceRefresh && todayMenusAfterCache.data && todayMenusAfterCache.lineUid === lineUid && todayMenusAfterCache.date === todayStr) {
      console.log('[MenuService] Returning today menus_after from memory cache (No API call)');
      return { success: true, data: todayMenusAfterCache.data, fromCache: true };
    }

    const response = await fetch(`${API_BASE_URL}/api/v1/menu/after?line_uid=${encodeURIComponent(lineUid)}`, {
      method: 'GET',
      headers: {
        'Accept': '*/*'
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[MenuService] GET /api/v1/menu/after error response:', errorData);
      return { success: false, error: errorData, data: [] };
    }

    const resJson = await response.json().catch(() => ({}));
    const rawList = Array.isArray(resJson) ? resJson : (resJson.data || []);

    const formattedList = rawList
      .map((item) => ({
        id: item.id,
        food_menu_id: item.food_menu_id,
        line_uid: item.line_uid,
        cal: Number(item.cal) || 0,
        protein: Number(item.protein ?? item.protine) || 0,
        carb: Number(item.carb) || 0,
        fat: Number(item.fat) || 0,
        eat_percent: item.eat_percent !== undefined ? Number(item.eat_percent) : 100,
        eatPercent: item.eat_percent !== undefined ? Number(item.eat_percent) : 100,
        image: item.image_url || item.image || null,
        image_url: item.image_url || item.image || null,
        mash: item.mash || 'lunch',
        runnum: item.runnum || null,
        date: item.date || item.created_at,
        created_at: item.created_at
      }))
      .filter((record) => {
        if (!selectedDate) return true;
        try {
          const recordDateTime = new Date(record.date);
          const year = recordDateTime.getFullYear();
          const month = String(recordDateTime.getMonth() + 1).padStart(2, '0');
          const day = String(recordDateTime.getDate()).padStart(2, '0');
          const localDateStr = `${year}-${month}-${day}`;
          return localDateStr === selectedDate;
        } catch {
          return true;
        }
      });

    // บันทึกลง Cache เฉพาะถ้าเป็นการดึงของวันปัจจุบัน
    if (isToday) {
      todayMenusAfterCache = {
        lineUid,
        date: todayStr,
        data: formattedList,
        timestamp: Date.now()
      };
    }

    return { success: true, data: formattedList };
  } catch (error) {
    console.error('[MenuService] getMenusAfterService exception:', error);
    return { success: false, error, data: [] };
  }
};

/**
 * Business Logic สำหรับคำนวณสรุปพลังงานและสารอาหารประจำวัน
 * 1. เมื่อถ่ายรูปก่อนกิน (foodRecords) จะนำค่าแคลอรี่และสารอาหารเต็มจำนวนมาคิดทันที
 * 2. เมื่อมีการเปรียบเทียบภาพหลังกิน (foodAfterRecords) จะนำค่าที่คำนวณได้จริงหลังกินมาปรับแทนที่
 * @param {Array} foodRecords - รายการอาหารก่อนกิน (food_menu)
 * @param {Array} foodAfterRecords - รายการอาหารหลังกิน (food_menu_after)
 * @returns {{ totalCal: number, totalProtein: number, totalCarb: number, totalFat: number }}
 */
export const calculateDailyNutrition = (foodRecords = [], foodAfterRecords = []) => {
  let totalCal = 0;
  let totalProtein = 0;
  let totalCarb = 0;
  let totalFat = 0;

  if (!Array.isArray(foodRecords)) {
    return { totalCal, totalProtein, totalCarb, totalFat };
  }

  const safeAfterList = Array.isArray(foodAfterRecords) ? foodAfterRecords : [];

  foodRecords.forEach((record) => {
    // 1. ค่าเริ่มต้นเต็มจำนวนจากภาพอาหารก่อนกิน
    let itemCal = Number(record.cal) || 0;
    let itemProtein = Number(record.protein) || 0;
    let itemCarb = Number(record.carb) || 0;
    let itemFat = Number(record.fat) || 0;

    // 2. ตรวจสอบว่ามีการบันทึกภาพเปรียบเทียบหลังกินแล้วหรือไม่
    const afterData = safeAfterList.find(
      (after) => Number(after.food_menu_id) === Number(record.id)
    );

    if (afterData) {
      // หากมีการเปรียบเทียบหลังกินแล้ว ให้ใช้ค่าหลังกินที่หักลบส่วนที่ทานเหลือแล้ว
      if (afterData.cal !== undefined && afterData.cal !== null) {
        itemCal = Number(afterData.cal) || 0;
        itemProtein = Number(afterData.protein) || 0;
        itemCarb = Number(afterData.carb) || 0;
        itemFat = Number(afterData.fat) || 0;
      } else if (afterData.eat_percent !== undefined && afterData.eat_percent !== null) {
        const percentRatio = Number(afterData.eat_percent) / 100;
        itemCal = itemCal * percentRatio;
        itemProtein = itemProtein * percentRatio;
        itemCarb = itemCarb * percentRatio;
        itemFat = itemFat * percentRatio;
      }
    }

    // 3. รวมผลรวมแคลอรี่และสารอาหาร
    totalCal += itemCal;
    totalProtein += itemProtein;
    totalCarb += itemCarb;
    totalFat += itemFat;
  });

  return {
    totalCal: Math.round(totalCal),
    totalProtein: Math.round(totalProtein),
    totalCarb: Math.round(totalCarb),
    totalFat: Math.round(totalFat),
  };
};




