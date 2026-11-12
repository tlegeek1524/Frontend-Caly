import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { message, DatePicker } from 'antd';
import dayjs from 'dayjs';
import { compareFoodAfterEating } from '../../../services/foodCompare.service';
import BottomNav from '../../../components/BottomNav/BottomNav';
import LoadingOverlay from '../../../components/Loading/LoadingOverlay';
import UserHeader from '../../../components/UserHeader/UserHeader';
import { UnrecognizedFoodModal } from '../../../components/UnrecognizedFoodModal/UnrecognizedFoodModal';
import { 
  createMenuService, 
  getMenusService, 
  createMenuAfterService, 
  getMenusAfterService, 
  calculateDailyNutrition 
} from '../../../services/menu.service';
import { getUserService } from '../../../services/user.service';
import { getCurrentGpsCoordinates, uploadFoodLocationService } from '../../../services/location.service';
import { getStoredUser } from '../../../utils/sessionAuth';
import { compressImage } from '../../../utils/imageCompressor';
import { analyzeFoodImage, isUnrecognizedFood } from '../../../services/aiFoodAnalysis.service';
import { uploadFoodImage } from '../../../services/imageStorage.service';

// Fetch User TDEE
const fetchUserTDEE = async (lineUid) => {
  try {
    const userRes = await getUserService(lineUid);
    if (userRes.success && userRes.data && userRes.data.cal) {
      return parseInt(userRes.data.cal);
    }
    return 2000;
  } catch (error) {
    console.error('Error fetching TDEE:', error);
    return 2000;
  }
};

// Menu API Functions
const fetchFoodRecords = async (lineUid, selectedDate) => {
  try {
    const res = await getMenusService(lineUid, selectedDate);
    if (res.success && res.data) {
      return res.data;
    }
    return [];
  } catch (error) {
    console.error('Error fetching food records:', error);
    return [];
  }
};

const addFoodRecord = async (lineUid, foodData, imageFile, locatRefId = null) => {
  try {
    let imageUrl = "";
    if (imageFile) {
      const compressedFile = await compressImage(imageFile, 1, 1920);
      imageUrl = await uploadFoodImage(compressedFile);
      console.log('Uploaded Image URL/Path:', imageUrl);
    }
    
    const payload = {
      line_uid: lineUid,
      menu: foodData.menu,
      cal: Number(foodData.cal) || 0,
      protein: Number(foodData.protein) || 0,
      carb: Number(foodData.carb) || 0,
      fat: Number(foodData.fat) || 0,
      date: new Date().toISOString(),
      image_url: imageUrl || "",
      runnum: "1",
      mash: foodData.mash || "lunch",
      eat_percent: 100,
      ...(locatRefId ? { locat_ref_id: locatRefId } : {})
    };

    const { success, data, error } = await createMenuService(payload);

    if (!success) {
      console.error('Error from createMenuService:', error);
      throw new Error(error?.message || 'Failed to save record via API');
    }
    
    return {
      fields: {
        ...payload,
        image: imageUrl ? [{ url: imageUrl }] : []
      },
      data
    };
  } catch (error) {
    console.error('Error adding food record:', error);
    return null;
  }
};

// ฟังก์ชันบันทึกข้อมูลหลังกินลง Backend API (POST /api/v1/menus/after)
const addFoodAfterRecord = async (lineUid, foodData, imageFile, originalRunnum, eatPercent, foodMenuId = null) => {
  try {
    let imageUrl = '';
    if (imageFile) {
      const compressedFile = await compressImage(imageFile, 1, 1920);
      imageUrl = await uploadFoodImage(compressedFile);
      console.log('Uploaded After Image URL/Path:', imageUrl);
    }
    
    const payload = {
      food_menu_id: foodMenuId || foodData.food_menu_id || 1,
      line_uid: lineUid,
      cal: Number(foodData.cal) || 0,
      protein: Number(foodData.protein) || 0,
      carb: Number(foodData.carb) || 0,
      fat: Number(foodData.fat) || 0,
      eat_percent: Math.round(eatPercent),
      image_url: imageUrl || '',
      mash: foodData.mash || 'lunch',
      runnum: originalRunnum ? String(originalRunnum) : '1',
      date: new Date().toISOString()
    };

    const { success, data, error } = await createMenuAfterService(payload);

    if (!success) {
      console.error('❌ Error from createMenuAfterService:', error);
      throw new Error(error?.message || 'Failed to save after food record');
    }

    return {
      fields: {
        ...payload,
        image: imageUrl ? [{ url: imageUrl }] : []
      },
      data
    };
  } catch (error) {
    console.error('❌ Error adding food after record:', error);
    return null;
  }
};

const FoodMenu = () => {
  const navigate = useNavigate();

  // ดึงวันที่ปัจจุบันตาม Local Timezone (YYYY-MM-DD)
  const getTodayLocalDate = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [selectedDate, setSelectedDate] = useState(getTodayLocalDate);
  const [displayDate, setDisplayDate] = useState(getTodayLocalDate);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [foodRecords, setFoodRecords] = useState([]);
  const [foodAfterRecords, setFoodAfterRecords] = useState([]);
  const [userTDEE, setUserTDEE] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isViewingDate, setIsViewingDate] = useState(false);
  const [showNoDataModal, setShowNoDataModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showUnrecognizedModal, setShowUnrecognizedModal] = useState(false);
  const [pendingFoodData, setPendingFoodData] = useState(null);
  const [pendingImageFile, setPendingImageFile] = useState(null);
  const [pendingImagePreview, setPendingImagePreview] = useState(null);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [isComparing, setIsComparing] = useState(false);
  const [selectedFoodForCompare, setSelectedFoodForCompare] = useState(null);
  const [showManualPercentModal, setShowManualPercentModal] = useState(false);
  const [manualPercent, setManualPercent] = useState(50);
  const [aiSuggestedPercent, setAiSuggestedPercent] = useState(0);
  const [pendingAfterImage, setPendingAfterImage] = useState(null);
  const containerRef = useRef(null);

  // ดึงข้อมูล user
  const user = React.useMemo(() => {
    return getStoredUser();
  }, []);

  // ถ้าไม่มี user ให้กลับไปหน้า login
  useEffect(() => {
    if (!user) {
      navigate('/linelogin');
    }
  }, [user, navigate]);

  // ดึงรายการอาหารและอาหารหลังกินจาก Backend API เฉพาะวันที่เลือก/วันปัจจุบัน
  useEffect(() => {
    if (!user || !user.id) return;
    
    const loadData = async () => {
      setLoading(true);
      try {
        const [records, afterRes, tdee] = await Promise.all([
          fetchFoodRecords(user.id, displayDate),
          getMenusAfterService(user.id, displayDate),
          fetchUserTDEE(user.id)
        ]);
        setFoodRecords(records);
        if (afterRes.success && afterRes.data) {
          setFoodAfterRecords(afterRes.data);
        }
        if (tdee) {
          setUserTDEE(tdee);
        }
      } catch (error) {
        console.error('❌ Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [user?.id, displayDate]);

  // ฟังก์ชันสำหรับกดปุ่ม "ดู"
  const handleViewDate = async () => {
    if (!user || !user.id) return;
    
    setIsViewingDate(true);
    try {
      const [records, afterRes] = await Promise.all([
        fetchFoodRecords(user.id, selectedDate),
        getMenusAfterService(user.id, selectedDate)
      ]);
      setFoodRecords(records);
      if (afterRes.success && afterRes.data) {
        setFoodAfterRecords(afterRes.data);
      }
      setDisplayDate(selectedDate);
      
      // ถ้าไม่มีข้อมูล แสดง popup
      if (records.length === 0) {
        setShowNoDataModal(true);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsViewingDate(false);
    }
  };

  // Handle swipe gestures
  const handleTouchStart = (e) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (touchStart - touchEnd < -100) {
      navigate('/dashboard');
    }
  };

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('touchstart', handleTouchStart);
      container.addEventListener('touchmove', handleTouchMove);
      container.addEventListener('touchend', handleTouchEnd);

      return () => {
        container.removeEventListener('touchstart', handleTouchStart);
        container.removeEventListener('touchmove', handleTouchMove);
        container.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [touchStart, touchEnd]);

  const handleCompareFood = (item) => {
    // เก็บข้อมูลอาหารที่เลือก
    setSelectedFoodForCompare(item);
    // แสดง modal ให้เลือกถ่ายรูป/อัปโหลด
    setShowCompareModal(true);
  };

  const handleCompareCameraCapture = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    // ใช้ capture="environment" สำหรับกล้องหลัง
    input.setAttribute('capture', 'environment');
    
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (file) {
        setShowCompareModal(false);
        await processCompareImage(file);
      }
    };
    
    input.click();
  };

  const handleCompareGallerySelect = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (file) {
        setShowCompareModal(false);
        await processCompareImage(file);
      }
    };
    
    input.click();
  };

  const processCompareImage = async (afterImageFile) => {
    if (!selectedFoodForCompare) return;
    
    setIsComparing(true);
    
    try {
      const result = await compareFoodAfterEating(selectedFoodForCompare, afterImageFile);

      // เก็บข้อมูลไว้ชั่วคราว
      setAiSuggestedPercent(result.percentEaten);
      setManualPercent(result.percentEaten);
      setPendingAfterImage(afterImageFile);
      
      // ปิด loading modal ก่อน
      setIsComparing(false);
      
      // แสดง modal ให้ผู้ใช้ปรับ % เอง
      setShowManualPercentModal(true);
      toast.success(`วิเคราะห์สำเร็จ! ประเมินว่าทานไป ~${result.percentEaten}%`);
    } catch (error) {
      toast.error(error.message || 'ไม่สามารถเปรียบเทียบรูปภาพได้ กรุณาลองใหม่');
      setIsComparing(false);
      setSelectedFoodForCompare(null);
    }
  };

  const handleOpenCamera = () => {
    setShowCameraModal(true);
  };

  const handleCameraCapture = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    // ใช้ capture="environment" สำหรับกล้องหลัง (ทำงานได้ดีกว่าในทุกอุปกรณ์)
    input.setAttribute('capture', 'environment');
    
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (file) {
        setShowCameraModal(false);
        setIsAnalyzing(true);
        
        try {
          // สร้าง preview URL
          const previewUrl = URL.createObjectURL(file);
          
          console.log('กำลังวิเคราะห์รูปภาพ...');
          const foodData = await analyzeFoodImage(file);
          console.log('✅ ผลการวิเคราะห์:', foodData);
          
          if (isUnrecognizedFood(foodData)) {
            URL.revokeObjectURL(previewUrl);
            setShowUnrecognizedModal(true);
            return;
          }

          // แสดง modal ให้ user ตรวจสอบข้อมูล
          setPendingFoodData(foodData);
          setPendingImageFile(file);
          setPendingImagePreview(previewUrl);
          setShowConfirmModal(true);
        } catch (error) {
          console.error('❌ เกิดข้อผิดพลาด:', error);
          message.error('ไม่สามารถวิเคราะห์รูปภาพได้ กรุณาลองใหม่');
        } finally {
          setIsAnalyzing(false);
        }
      }
    };
    
    input.click();
  };

  const handleGallerySelect = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (file) {
        setShowCameraModal(false);
        setIsAnalyzing(true);
        
        try {
          // สร้าง preview URL
          const previewUrl = URL.createObjectURL(file);
          
          console.log('กำลังวิเคราะห์รูปภาพ...');
          const foodData = await analyzeFoodImage(file);
          console.log('✅ ผลการวิเคราะห์:', foodData);
          
          if (isUnrecognizedFood(foodData)) {
            URL.revokeObjectURL(previewUrl);
            setShowUnrecognizedModal(true);
            return;
          }

          // แสดง modal ให้ user ตรวจสอบข้อมูล
          setPendingFoodData(foodData);
          setPendingImageFile(file);
          setPendingImagePreview(previewUrl);
          setShowConfirmModal(true);
        } catch (error) {
          console.error('❌ เกิดข้อผิดพลาด:', error);
          message.error('ไม่สามารถวิเคราะห์รูปภาพได้ กรุณาลองใหม่');
        } finally {
          setIsAnalyzing(false);
        }
      }
    };
    
    input.click();
  };

  const handleConfirmSave = async () => {
    if (!pendingFoodData || !user?.id) return;
    
    setLoading(true);
    
    try {
      // 1. ตรวจสอบและดึงพิกัด GPS จริงจากอุปกรณ์ก่อน
      const gps = await getCurrentGpsCoordinates({ timeout: 10000 });
      if (!gps.success || !gps.coords) {
        setLoading(false);
        const warnMsg = gps.message || 'กรุณาเปิดสิทธิ์การเข้าถึงตำแหน่ง (Location Permission) ใน Browser/อุปกรณ์ และเปิด GPS เพื่อบันทึกข้อมูลอาหาร';
        toast.error(warnMsg, { duration: 6000, id: 'gps-permission-alert' });
        alert(warnMsg);
        return;
      }

      // 2. ส่งพิกัด GPS เพื่อสร้าง food location
      const uploadRes = await uploadFoodLocationService({
        line_uid: user.id.toString(),
        user_id: user.id.toString(),
        lat: gps.coords.latitude,
        lng: gps.coords.longitude,
        latitude: gps.coords.latitude,
        longitude: gps.coords.longitude,
        accuracy_m: gps.coords.accuracy,
        source_type: 'web'
      });

      if (!uploadRes.success || !uploadRes.locatRefId) {
        setLoading(false);
        const errMsg = uploadRes.error || 'ไม่พบพิกัด GPS ความแม่นยำสูงจากอุปกรณ์ กรุณาเปิดสิทธิ์การเข้าถึงตำแหน่ง';
        toast.error(errMsg, { duration: 6000, id: 'gps-upload-failed' });
        alert(errMsg);
        return;
      }

      const locatRefId = uploadRes.locatRefId;
      console.log('Created food location with locat_ref_id:', locatRefId);

      setShowConfirmModal(false);

      // 3. บันทึกข้อมูลเมนูอาหารพร้อมแนบ locat_ref_id
      const result = await addFoodRecord(user.id, pendingFoodData, pendingImageFile, locatRefId);
      
      if (result) {
        message.success('บันทึกข้อมูลสำเร็จ!');
        // รีโหลดข้อมูล
        const records = await fetchFoodRecords(user.id, displayDate);
        setFoodRecords(records);
        window.dispatchEvent(new CustomEvent("food-record-updated"));
      } else {
        message.error('บันทึกข้อมูลไม่สำเร็จ กรุณาลองใหม่');
      }
    } catch (error) {
      console.error('Error saving:', error);
      message.error('เกิดข้อผิดพลาดในการบันทึก');
    } finally {
      setLoading(false);
      setPendingFoodData(null);
      setPendingImageFile(null);
      if (pendingImagePreview) {
        URL.revokeObjectURL(pendingImagePreview);
        setPendingImagePreview(null);
      }
    }
  };

  const handleCancelSave = () => {
    setShowConfirmModal(false);
    setPendingFoodData(null);
    setPendingImageFile(null);
    // ลบ preview URL เพื่อป้องกัน memory leak
    if (pendingImagePreview) {
      URL.revokeObjectURL(pendingImagePreview);
      setPendingImagePreview(null);
    }
  };

  const handleConfirmManualPercent = async () => {
    if (!selectedFoodForCompare || !pendingAfterImage || !user?.id) return;
    
    setShowManualPercentModal(false);
    setLoading(true);
    
    try {
      // คำนวณสารอาหารตาม % ที่ผู้ใช้เลือก
      const percentDecimal = manualPercent / 100;
      const afterFoodData = {
        menu: selectedFoodForCompare.menu,
        cal: Math.round(selectedFoodForCompare.cal * percentDecimal),
        protein: Math.round(selectedFoodForCompare.protein * percentDecimal),
        carb: Math.round(selectedFoodForCompare.carb * percentDecimal),
        fat: Math.round(selectedFoodForCompare.fat * percentDecimal)
      };
      
      const saveResult = await addFoodAfterRecord(
        user.id,
        afterFoodData,
        pendingAfterImage,
        selectedFoodForCompare.runnum,
        manualPercent,
        selectedFoodForCompare.id
      );
      
      if (saveResult) {
        // รีโหลดข้อมูลทั้งหมดทั้งก่อนกินและหลังกิน เพื่อให้ UI อัปเดตทันที
        const [records, afterRes] = await Promise.all([
          fetchFoodRecords(user.id, displayDate),
          getMenusAfterService(user.id, displayDate)
        ]);
        setFoodRecords(records);
        if (afterRes.success && afterRes.data) {
          setFoodAfterRecords(afterRes.data);
        }
        toast.success('บันทึกข้อมูลหลังกินเรียบร้อยแล้ว!');
      } else {
        throw new Error('ไม่สามารถบันทึกข้อมูลได้');
      }
    } catch (error) {
      console.error('❌ เกิดข้อผิดพลาด:', error);
      toast.error('เกิดข้อผิดพลาดในการบันทึก');
    } finally {
      setLoading(false);
      setSelectedFoodForCompare(null);
      setPendingAfterImage(null);
      setManualPercent(50);
      setAiSuggestedPercent(0);
    }
  };

  const handleCancelManualPercent = () => {
    setShowManualPercentModal(false);
    setSelectedFoodForCompare(null);
    setPendingAfterImage(null);
    setManualPercent(50);
    setAiSuggestedPercent(0);
  };

  // คำนวณสรุปโภชนาการจาก Business Logic Service (คำนวณเฉพาะมื้อที่ทานเสร็จสิ้นแล้ว)
  const { totalCal, totalProtein, totalCarb, totalFat } = calculateDailyNutrition(
    foodRecords,
    foodAfterRecords
  );

  const isCalExceeded = userTDEE && totalCal > userTDEE;

  return (
    <div 
      ref={containerRef}
      className="min-h-screen bg-slate-50 pb-24 text-slate-800"
    >
      {/* Navbar */}
      <UserHeader title="Calories Daily" subtitle="บันทึกและประวัติมื้ออาหาร" />

      <div className="max-w-md mx-auto px-4 py-5 space-y-4 h-auto max-h-none">
        {/* Date Filter */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100/80 shadow-xs">
          <label className="block text-xs font-semibold text-slate-700 mb-2">เลือกวันที่</label>
          <DatePicker
            value={selectedDate ? dayjs(selectedDate) : null}
            disabled={loading}
            allowClear={false}
            format="DD/MM/YYYY"
            className="w-full !rounded-xl !py-2 !bg-slate-50 !border-slate-200"
            onChange={(date) => {
              if (!date) return;
              const newDate = date.format("YYYY-MM-DD");
              setSelectedDate(newDate);
              setDisplayDate(newDate);
              setIsViewingDate(newDate !== getTodayLocalDate());
            }}
          />
        </div>

        {/* Food List */}
        <div>
          <h5 className="text-sm font-bold text-slate-900 mb-3 px-1">
            รายการอาหารวันที่ {new Date(displayDate).toLocaleDateString('th-TH', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </h5>

          {/* Summary - ย้ายขึ้นมาอยู่ใต้หัวข้อรายการอาหาร */}
          <div className="bg-white rounded-2xl p-4 border border-slate-100/80 shadow-xs mb-4">
            <h5 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">สรุปรวมสารอาหาร</h5>
            <div className="grid grid-cols-4 gap-2 divide-x divide-slate-100">
              <div className="text-center">
                <div className={`text-base font-bold transition-colors ${
                  isCalExceeded ? 'text-rose-600' : 'text-slate-900'
                }`}>
                  {totalCal}
                </div>
                <div className={`text-[11px] mt-0.5 ${
                  isCalExceeded ? 'text-rose-500 font-medium' : 'text-slate-400'
                }`}>
                  {isCalExceeded ? 'kcal เกินเป้า' : 'kcal รวม'}
                </div>
              </div>
              <div className="text-center">
                <div className="text-base font-bold text-slate-900">
                  {totalProtein}g
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">โปรตีน</div>
              </div>
              <div className="text-center">
                <div className="text-base font-bold text-slate-900">
                  {totalCarb}g
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">คาร์บ</div>
              </div>
              <div className="text-center">
                <div className="text-base font-bold text-slate-900">
                  {totalFat}g
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">ไขมัน</div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {foodRecords.map((item, index) => {
              const afterData = foodAfterRecords.find(after => 
                Number(after.food_menu_id) === Number(item.id)
              );

              return (
                <div 
                  key={item.id} 
                  className="bg-white rounded-2xl overflow-hidden border border-slate-100/80 shadow-xs" 
                >
                  <div className="px-4 py-3 flex justify-between items-center border-b border-slate-100 gap-2">
                    <span className="text-sm font-bold text-slate-900 truncate flex-1">{item.menu}</span>
                    <span className="text-xs text-slate-400 shrink-0 font-medium">
                      {item.date ? `${new Date(item.date).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.` : '-'}
                    </span>
                  </div>
                <div className="p-4">
                  {/* ข้อมูลก่อนกิน */}
                  <div className={afterData ? "mb-4" : ""}>
                    <div className="text-xs font-semibold text-emerald-700 mb-2">
                      ก่อนกิน
                    </div>
                    <div className="flex gap-3.5 items-center">
                      {item.image ? (
                        <img 
                          src={item.image} 
                          alt={item.menu}
                          className="w-24 h-24 rounded-xl object-cover border border-slate-100 shrink-0"
                        />
                      ) : (
                        <div className="w-24 h-24 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 text-xs shrink-0">
                          ไม่มีรูป
                        </div>
                      )}
                      <div className="flex-1 min-w-0 h-24 flex flex-col justify-between py-0.5">
                        <div className="text-xl font-bold text-slate-900 tabular-nums text-right leading-none">
                          {item.cal} <span className="text-xs font-semibold text-slate-500">kcal</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-xs text-center">
                          <div>
                            <div className="font-bold text-slate-800 tabular-nums">{item.protein}g</div>
                            <div className="text-[11px] text-slate-400">โปรตีน</div>
                          </div>
                          <div>
                            <div className="font-bold text-slate-800 tabular-nums">{item.carb}g</div>
                            <div className="text-[11px] text-slate-400">คาร์บ</div>
                          </div>
                          <div>
                            <div className="font-bold text-slate-800 tabular-nums">{item.fat}g</div>
                            <div className="text-[11px] text-slate-400">ไขมัน</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ข้อมูลหลังกิน (ถ้ามี) */}
                  {afterData && (
                    <div className="mb-3 pt-3.5 border-t border-slate-100">
                      <div className="text-xs font-semibold text-blue-700 mb-2">
                        หลังกิน · ทานไป {afterData.eat_percent ?? afterData.eatPercent}%
                      </div>
                      <div className="flex gap-3.5 items-center">
                        {afterData.image ? (
                          <img 
                            src={afterData.image} 
                            alt={`${item.menu} - หลังกิน`}
                            className="w-24 h-24 rounded-xl object-cover border border-slate-100 shrink-0"
                          />
                        ) : (
                          <div className="w-24 h-24 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 text-xs shrink-0">
                            ไม่มีรูป
                          </div>
                        )}
                        <div className="flex-1 min-w-0 h-24 flex flex-col justify-between py-0.5">
                          <div className="text-xl font-bold text-blue-900 tabular-nums text-right leading-none">
                            {afterData.cal} <span className="text-xs font-semibold text-blue-600/80">kcal</span>
                          </div>
                          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-xs text-center">
                            <div>
                              <div className="font-bold text-slate-800 tabular-nums">{afterData.protein}g</div>
                              <div className="text-[11px] text-slate-400">โปรตีน</div>
                            </div>
                            <div>
                              <div className="font-bold text-slate-800 tabular-nums">{afterData.carb}g</div>
                              <div className="text-[11px] text-slate-400">คาร์บ</div>
                            </div>
                            <div>
                              <div className="font-bold text-slate-800 tabular-nums">{afterData.fat}g</div>
                              <div className="text-[11px] text-slate-400">ไขมัน</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ปุ่มเปรียบเทียบอาหารหลังกิน */}
                  {!afterData && (
                    <div className="pt-2.5 border-t border-slate-100 flex justify-end items-center">
                      <button
                        onClick={() => handleCompareFood(item)}
                        className="text-xs text-emerald-600 font-semibold hover:text-emerald-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>📸 เปรียบเทียบอาหารหลังกิน</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
            })}
          </div>
        </div>

      </div>

      {/* Bottom Navigation */}
      <BottomNav onCameraClick={handleOpenCamera} />

      {/* Camera Modal */}
      {showCameraModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50 animate-fadeIn" onClick={() => setShowCameraModal(false)}>
          <div className="bg-white rounded-t-[20px] w-full max-w-md pb-safe animate-slideUp" onClick={(e) => e.stopPropagation()}>
            <div className="p-4">
              <div className="w-12 h-1 bg-[#e5e5ea] rounded-full mx-auto mb-4"></div>
              <h3 className="text-[20px] font-semibold text-black text-center mb-4">เพิ่มรูปอาหาร</h3>
              
              <div className="space-y-2">
                <button
                  onClick={handleCameraCapture}
                  className="w-full py-4 text-[17px] font-semibold text-black bg-[#f2f2f7] rounded-[12px] hover:bg-[#e5e5ea] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  ถ่ายรูป
                </button>

                <button
                  onClick={handleGallerySelect}
                  className="w-full py-4 text-[17px] font-semibold text-black bg-[#f2f2f7] rounded-[12px] hover:bg-[#e5e5ea] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  เลือกจากแกลเลอรี่
                </button>

                <button
                  onClick={() => setShowCameraModal(false)}
                  className="w-full py-4 text-[17px] font-semibold text-red-500 bg-white rounded-[12px] hover:bg-[#f2f2f7] active:scale-[0.98] transition-all duration-200"
                >
                  ยกเลิก
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Compare Food Modal */}
      {showCompareModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50 animate-fadeIn" onClick={() => setShowCompareModal(false)}>
          <div className="bg-white rounded-t-[20px] w-full max-w-md pb-safe animate-slideUp" onClick={(e) => e.stopPropagation()}>
            <div className="p-4">
              <div className="w-12 h-1 bg-[#e5e5ea] rounded-full mx-auto mb-4"></div>
              <h3 className="text-[20px] font-semibold text-black text-center mb-2">เปรียบเทียบอาหารหลังกิน</h3>
              <p className="text-[13px] text-[#8e8e93] text-center mb-4">
                ถ่ายรูปอาหารที่เหลือในจานเดิม
              </p>
              
              <div className="space-y-2">
                <button
                  onClick={handleCompareCameraCapture}
                  className="w-full py-4 text-[17px] font-semibold text-black bg-[#f2f2f7] rounded-[12px] hover:bg-[#e5e5ea] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  ถ่ายรูป
                </button>

                <button
                  onClick={handleCompareGallerySelect}
                  className="w-full py-4 text-[17px] font-semibold text-black bg-[#f2f2f7] rounded-[12px] hover:bg-[#e5e5ea] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  เลือกจากแกลเลอรี่
                </button>

                <button
                  onClick={() => setShowCompareModal(false)}
                  className="w-full py-4 text-[17px] font-semibold text-red-500 bg-white rounded-[12px] hover:bg-[#f2f2f7] active:scale-[0.98] transition-all duration-200"
                >
                  ยกเลิก
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manual Percent Modal */}
      {showManualPercentModal && selectedFoodForCompare && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fadeIn p-4" onClick={handleCancelManualPercent}>
          <div className="bg-white rounded-[20px] p-6 max-w-sm w-full max-h-[90vh] overflow-y-auto animate-slideUp" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-[20px] font-semibold text-black text-center mb-2">ปรับเปอร์เซ็นต์ที่กิน</h3>
            <p className="text-[13px] text-[#8e8e93] text-center mb-4">
              AI แนะนำ: {aiSuggestedPercent}%
            </p>
            
            {/* Slider */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[15px] text-black font-semibold">กินไป</span>
                <span className="text-[24px] font-bold text-blue-500">{manualPercent}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={manualPercent}
                onChange={(e) => setManualPercent(Number(e.target.value))}
                className="w-full h-2 bg-[#e5e5ea] rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${manualPercent}%, #e5e5ea ${manualPercent}%, #e5e5ea 100%)`
                }}
              />
              <div className="flex justify-between text-[11px] text-[#8e8e93] mt-1">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>

            {/* ข้อมูลอาหารก่อนกิน */}
            <div className="bg-[#f2f2f7] rounded-[12px] p-4 mb-4">
              <div className="text-[13px] font-semibold text-black mb-3">🍽️ {selectedFoodForCompare.menu}</div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[13px] text-[#8e8e93]">แคลอรี่:</span>
                  <div className="text-right">
                    <span className="text-[15px] font-bold text-blue-500">
                      {Math.round(selectedFoodForCompare.cal * manualPercent / 100)}
                    </span>
                    <span className="text-[13px] text-[#8e8e93]"> / {selectedFoodForCompare.cal} kcal</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[13px] text-[#8e8e93]">โปรตีน:</span>
                  <div className="text-right">
                    <span className="text-[15px] font-bold text-blue-500">
                      {Math.round(selectedFoodForCompare.protein * manualPercent / 100)}
                    </span>
                    <span className="text-[13px] text-[#8e8e93]"> / {selectedFoodForCompare.protein}g</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[13px] text-[#8e8e93]">คาร์โบไฮเดรต:</span>
                  <div className="text-right">
                    <span className="text-[15px] font-bold text-blue-500">
                      {Math.round(selectedFoodForCompare.carb * manualPercent / 100)}
                    </span>
                    <span className="text-[13px] text-[#8e8e93]"> / {selectedFoodForCompare.carb}g</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[13px] text-[#8e8e93]">ไขมัน:</span>
                  <div className="text-right">
                    <span className="text-[15px] font-bold text-blue-500">
                      {Math.round(selectedFoodForCompare.fat * manualPercent / 100)}
                    </span>
                    <span className="text-[13px] text-[#8e8e93]"> / {selectedFoodForCompare.fat}g</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ปุ่ม */}
            <div className="flex gap-3">
              <button
                onClick={handleCancelManualPercent}
                className="flex-1 py-3 text-[15px] font-semibold text-[#8e8e93] bg-[#f2f2f7] rounded-[12px] hover:bg-[#e5e5ea] active:scale-[0.98] transition-all duration-200"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleConfirmManualPercent}
                className="flex-1 py-3 text-[15px] font-semibold text-white bg-gradient-to-r from-blue-500 to-blue-600 rounded-[12px] hover:from-blue-600 hover:to-blue-700 active:scale-[0.98] transition-all duration-200"
              >
                บันทึก
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Food Data Modal */}
      {showConfirmModal && pendingFoodData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fadeIn p-4" onClick={handleCancelSave}>
          <div className="bg-white rounded-[20px] p-6 max-w-sm w-full max-h-[90vh] overflow-y-auto animate-slideUp" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-[20px] font-semibold text-black text-center mb-4">ตรวจสอบข้อมูล</h3>
            
            {/* แสดงรูปภาพ */}
            {pendingImagePreview && (
              <div className="mb-4">
                <img 
                  src={pendingImagePreview} 
                  alt="Food preview" 
                  className="w-full h-48 object-cover rounded-[12px]"
                />
              </div>
            )}
            
            <div className="space-y-3 mb-6">
              <div className="flex justify-between items-center">
                <span className="text-[15px] text-[#8e8e93]">เมนู:</span>
                <input
                  type="text"
                  value={pendingFoodData.menu}
                  onChange={(e) => setPendingFoodData({...pendingFoodData, menu: e.target.value})}
                  className="text-[15px] font-semibold text-black text-right bg-[#f2f2f7] px-3 py-1 rounded-lg border-0 focus:bg-[#e5e5ea] focus:outline-none flex-1 ml-2"
                />
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-[15px] text-[#8e8e93]">แคลอรี่:</span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={pendingFoodData.cal}
                    onChange={(e) => setPendingFoodData({...pendingFoodData, cal: Number(e.target.value)})}
                    className="text-[15px] font-semibold text-black text-right bg-[#f2f2f7] px-3 py-1 rounded-lg border-0 focus:bg-[#e5e5ea] focus:outline-none w-24"
                  />
                  <span className="text-[13px] text-[#8e8e93]">kcal</span>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-[15px] text-[#8e8e93]">โปรตีน:</span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={pendingFoodData.protein}
                    onChange={(e) => setPendingFoodData({...pendingFoodData, protein: Number(e.target.value)})}
                    className="text-[15px] font-semibold text-black text-right bg-[#f2f2f7] px-3 py-1 rounded-lg border-0 focus:bg-[#e5e5ea] focus:outline-none w-24"
                  />
                  <span className="text-[13px] text-[#8e8e93]">g</span>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-[15px] text-[#8e8e93]">คาร์บ:</span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={pendingFoodData.carb}
                    onChange={(e) => setPendingFoodData({...pendingFoodData, carb: Number(e.target.value)})}
                    className="text-[15px] font-semibold text-black text-right bg-[#f2f2f7] px-3 py-1 rounded-lg border-0 focus:bg-[#e5e5ea] focus:outline-none w-24"
                  />
                  <span className="text-[13px] text-[#8e8e93]">g</span>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-[15px] text-[#8e8e93]">ไขมัน:</span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={pendingFoodData.fat}
                    onChange={(e) => setPendingFoodData({...pendingFoodData, fat: Number(e.target.value)})}
                    className="text-[15px] font-semibold text-black text-right bg-[#f2f2f7] px-3 py-1 rounded-lg border-0 focus:bg-[#e5e5ea] focus:outline-none w-24"
                  />
                  <span className="text-[13px] text-[#8e8e93]">g</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleCancelSave}
                className="flex-1 py-3 text-[15px] font-semibold text-red-500 bg-[#f2f2f7] rounded-[12px] hover:bg-[#e5e5ea] active:scale-[0.98] transition-all duration-200"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleConfirmSave}
                className="flex-1 py-3 text-[15px] font-semibold text-white bg-gradient-to-r from-green-400 to-emerald-500 rounded-[12px] hover:from-green-500 hover:to-emerald-600 active:scale-[0.98] transition-all duration-200"
              >
                บันทึก
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unrecognized Food Modal Component */}
      <UnrecognizedFoodModal
        open={showUnrecognizedModal}
        onClose={() => setShowUnrecognizedModal(false)}
        onRetry={() => setShowCameraModal(true)}
      />

      {/* Transparent Loading Overlay */}
      <LoadingOverlay
        show={loading || isAnalyzing || isComparing}
        message={
          isComparing
            ? "กำลังเปรียบเทียบรูปภาพ..."
            : isAnalyzing
            ? "กำลังวิเคราะห์รูปภาพ..."
            : "กำลังโหลดข้อมูล..."
        }
        description={
          isComparing
            ? "กำลังเทียบปริมาณอาหารก่อนและหลังกินด้วย AI"
            : isAnalyzing
            ? "กำลังประเมินเมนูและสารอาหารจากรูปภาพ"
            : "กรุณารอสักครู่"
        }
      />
    </div>
  );
};

export default FoodMenu;
