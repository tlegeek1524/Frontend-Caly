import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Doughnut } from "react-chartjs-2";
import toast from "react-hot-toast";
import { message, DatePicker } from "antd";
import dayjs from "dayjs";
import BottomNav from "../../../components/BottomNav/BottomNav";
import LoadingOverlay from "../../../components/Loading/LoadingOverlay";
import UserHeader from "../../../components/UserHeader/UserHeader";
import { PDPAConsentModal } from "../../../components/PDPA/PDPAConsentModal";
import { UnrecognizedFoodModal } from "../../../components/UnrecognizedFoodModal/UnrecognizedFoodModal";
import { CalendarFireStack } from "../../../components/CalendarFireStack";
import { 
  createMenuService, 
  getMenusService, 
  getMenusAfterService, 
  calculateDailyNutrition 
} from "../../../services/menu.service";
import { getUserService } from "../../../services/user.service";
import { getCurrentGpsCoordinates, uploadFoodLocationService } from "../../../services/location.service";
import { getStoredUser } from "../../../utils/sessionAuth";
import { compressImage } from "../../../utils/imageCompressor";
import { analyzeFoodImage, isUnrecognizedFood } from "../../../services/aiFoodAnalysis.service";
import { uploadFoodImage } from "../../../services/imageStorage.service";

ChartJS.register(ArcElement, Tooltip, Legend);

// User Functions
const fetchUserTDEE = async (lineUid) => {
  try {
    const userRes = await getUserService(lineUid);
    if (userRes.success && userRes.data && userRes.data.cal) {
      return parseInt(userRes.data.cal);
    }
    return 2000;
  } catch (error) {
    console.error("Error fetching TDEE:", error);
    return 2000;
  }
};

const fetchFoodRecords = async (lineUid, selectedDate) => {
  try {
    const res = await getMenusService(lineUid, selectedDate);
    if (res.success && res.data) {
      return res.data;
    }
    return [];
  } catch (error) {
    console.error("Error fetching food records:", error);
    return [];
  }
};

const addFoodRecord = async (lineUid, foodData, imageFile, locatRefId = null) => {
  try {
    let imageUrl = "";
    if (imageFile) {
      console.log(
        "ขนาดรูปต้นฉบับ:",
        (imageFile.size / 1024 / 1024).toFixed(2),
        "MB",
      );

      const compressedFile = await compressImage(imageFile, 1, 1920);
      console.log(
        "ขนาดรูปหลัง compress:",
        (compressedFile.size / 1024 / 1024).toFixed(2),
        "MB",
      );

      imageUrl = await uploadFoodImage(compressedFile);
      console.log("Uploaded Image URL/Path:", imageUrl);
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
      console.error("Error from createMenuService:", error);
      throw new Error(error?.message || "Failed to save record via API");
    }

    return {
      fields: {
        ...payload,
        image: imageUrl ? [{ url: imageUrl }] : []
      },
      data
    };
  } catch (error) {
    console.error("Error adding food record:", error);
    return null;
  }
};

const MainDashboard = () => {
  const navigate = useNavigate();

  // ดึงข้อมูล user จาก sessionStorage (จาก LINE Login)
  const user = React.useMemo(() => {
    return getStoredUser();
  }, []);

  // ดึงวันที่ปัจจุบันตาม Local Timezone (YYYY-MM-DD)
  const getTodayLocalDate = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const [selectedDate, setSelectedDate] = useState(getTodayLocalDate);
  const [displayDate, setDisplayDate] = useState(getTodayLocalDate);
  const [streakRefreshKey, setStreakRefreshKey] = useState(0);
  const [animatedPercentage, setAnimatedPercentage] = useState(0);
  const [animatedCal, setAnimatedCal] = useState(0);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [userTDEE, setUserTDEE] = useState(null);
  const [foodRecords, setFoodRecords] = useState([]);
  const [foodAfterRecords, setFoodAfterRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isViewingDate, setIsViewingDate] = useState(false);
  const [showNoDataModal, setShowNoDataModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showUnrecognizedModal, setShowUnrecognizedModal] = useState(false);
  const [pendingFoodData, setPendingFoodData] = useState(null);
  const [pendingImageFile, setPendingImageFile] = useState(null);
  const [pendingImagePreview, setPendingImagePreview] = useState(null);
  const [showLiveCamera, setShowLiveCamera] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const videoRef = React.useRef(null);
  const canvasRef = React.useRef(null);

  // ถ้าไม่มี user ให้กลับไปหน้า login
  useEffect(() => {
    if (!user) {
      navigate("/linelogin");
    }
  }, [user, navigate]);

  // ดึงข้อมูล TDEE และรายการอาหารจาก GET /api/v1/menus?line_uid=... และอาหารหลังกิน เฉพาะวันปัจจุบัน
  useEffect(() => {
    if (!user || !user.id) return;

    const loadData = async () => {
      setInitialLoading(true);
      try {
        // ดึง TDEE
        const tdee = await fetchUserTDEE(user.id);
        setUserTDEE(tdee);

        // ดึงรายการอาหารก่อนกิน และรายการหลังกิน เฉพาะวันที่เลือก/วันปัจจุบัน
        const [records, afterRes] = await Promise.all([
          fetchFoodRecords(user.id, displayDate),
          getMenusAfterService(user.id, displayDate)
        ]);
        setFoodRecords(records);
        if (afterRes.success && afterRes.data) {
          setFoodAfterRecords(afterRes.data);
        }
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setInitialLoading(false);
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
      console.error("Error loading data:", error);
    } finally {
      setIsViewingDate(false);
    }
  };

  const mockUser = {
    name: user?.name || "ผู้ใช้งาน",
    profilePic: user?.picture || "https://via.placeholder.com/60",
    tdee: userTDEE || 0,
  };

  // คำนวณสรุปโภชนาการจาก Business Logic Service (คำนวณเฉพาะมื้อที่ทานเสร็จสิ้นแล้ว)
  const { totalCal, totalProtein, totalCarb, totalFat } = calculateDailyNutrition(
    foodRecords,
    foodAfterRecords
  );

  // คำนวณแคลอรี่จากโภชนาการ (สำหรับแสดงในกราฟ)
  const proteinCal = totalProtein * 4;
  const carbCal = totalCarb * 4;
  const fatCal = totalFat * 9;
  const totalNutritionCal = proteinCal + carbCal + fatCal;

  // แคลอรี่ที่เหลือจาก TDEE
  const remainingTDEE = Math.max(0, mockUser.tdee - totalNutritionCal);

  // Chart.js data
  const chartData = {
    labels: ["โปรตีน", "คาร์บ", "ไขมัน", "เหลือ"],
    datasets: [
      {
        data: [proteinCal, carbCal, fatCal, remainingTDEE],
        backgroundColor: [
          "rgba(59, 130, 246, 0.8)", // blue - โปรตีน
          "rgba(249, 115, 22, 0.8)", // orange - คาร์บ
          "rgba(239, 68, 68, 0.8)", // red - ไขมัน
          "rgba(229, 229, 234, 0.5)", // gray - เหลือ
        ],
        borderColor: [
          "rgb(59, 130, 246)",
          "rgb(249, 115, 22)",
          "rgb(239, 68, 68)",
          "rgb(229, 229, 234)",
        ],
        borderWidth: 2,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        padding: 12,
        titleFont: {
          size: 14,
          family:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        },
        bodyFont: {
          size: 13,
          family:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        },
        callbacks: {
          label: function (context) {
            const label = context.label || "";
            const value = context.parsed || 0;
            return `${label}: ${Math.round(value)} kcal`;
          },
        },
      },
    },
    cutout: "70%",
  };

  // คำนวณเปอร์เซ็นต์
  const caloriePercentage = (totalCal / mockUser.tdee) * 100;
  const remainingCalories = mockUser.tdee - totalCal;

  // Animation effect
  useEffect(() => {
    const duration = 1500; // 1.5 seconds
    const steps = 60;
    const stepDuration = duration / steps;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;

      // Easing function (ease-out)
      const easeOut = 1 - Math.pow(1 - progress, 3);

      setAnimatedPercentage(caloriePercentage * easeOut);
      setAnimatedCal(Math.round(totalCal * easeOut));

      if (currentStep >= steps) {
        clearInterval(timer);
        setAnimatedPercentage(caloriePercentage);
        setAnimatedCal(totalCal);
      }
    }, stepDuration);

    return () => clearInterval(timer);
  }, [totalCal, caloriePercentage]);

  const handleOpenCamera = () => {
    setShowCameraModal(true);
  };

  const handleCameraCapture = async () => {
    setShowCameraModal(false);
    setShowLiveCamera(true);
    
    try {
      // ขออนุญาตและเปิดกล้อง
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment', // ใช้กล้องหลัง
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        } 
      });
      
      setCameraStream(stream);
      
      // รอให้ video element พร้อม
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      }, 100);
    } catch (error) {
      console.error("ไม่สามารถเข้าถึงกล้องได้:", error);
      alert("ไม่สามารถเปิดกล้องได้ กรุณาอนุญาตการใช้งานกล้องในการตั้งค่าเบราว์เซอร์");
      setShowLiveCamera(false);
    }
  };

  const handleTakePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // ตั้งค่าขนาด canvas ให้เท่ากับ video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // วาดภาพจาก video ลงบน canvas
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // แปลง canvas เป็น blob
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      
      // ปิดกล้อง
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        setCameraStream(null);
      }
      setShowLiveCamera(false);
      setIsAnalyzing(true);
      
      try {
        // สร้าง File object จาก blob
        const file = new File([blob], `food_${Date.now()}.jpg`, { type: 'image/jpeg' });
        const previewUrl = URL.createObjectURL(blob);

        console.log("กำลังวิเคราะห์รูปภาพ...");
        const foodData = await analyzeFoodImage(file);
        console.log("✅ ผลการวิเคราะห์:", foodData);

        if (isUnrecognizedFood(foodData)) {
          URL.revokeObjectURL(previewUrl);
          setShowUnrecognizedModal(true);
          return;
        }

        setPendingFoodData(foodData);
        setPendingImageFile(file);
        setPendingImagePreview(previewUrl);
        setShowConfirmModal(true);
      } catch (error) {
        console.error("❌ เกิดข้อผิดพลาด:", error);
        message.error("ไม่สามารถวิเคราะห์รูปภาพได้ กรุณาลองใหม่");
      } finally {
        setIsAnalyzing(false);
      }
    }, 'image/jpeg', 0.9);
  };

  const handleCloseLiveCamera = () => {
    // ปิดกล้อง
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setShowLiveCamera(false);
  };

  const handleGallerySelect = async () => {
    setShowCameraModal(false);
    
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.multiple = false;

    input.onchange = async (e) => {
      const file = e.target.files?.[0];
      if (file) {
        setIsAnalyzing(true);

        try {
          const previewUrl = URL.createObjectURL(file);

          console.log("กำลังวิเคราะห์รูปภาพ...");
          const foodData = await analyzeFoodImage(file);
          console.log("✅ ผลการวิเคราะห์:", foodData);

          if (isUnrecognizedFood(foodData)) {
            URL.revokeObjectURL(previewUrl);
            setShowUnrecognizedModal(true);
            return;
          }

          setPendingFoodData(foodData);
          setPendingImageFile(file);
          setPendingImagePreview(previewUrl);
          setShowConfirmModal(true);
        } catch (error) {
          console.error("❌ เกิดข้อผิดพลาด:", error);
          message.error("ไม่สามารถวิเคราะห์รูปภาพได้ กรุณาลองใหม่");
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
        const warnMsg = gps.message || "กรุณาเปิดสิทธิ์การเข้าถึงตำแหน่ง (Location Permission) ใน Browser/อุปกรณ์ และเปิด GPS เพื่อบันทึกข้อมูลอาหาร";
        toast.error(warnMsg, { duration: 6000, id: "gps-permission-alert" });
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
        source_type: "web"
      });

      if (!uploadRes.success || !uploadRes.locatRefId) {
        setLoading(false);
        const errMsg = uploadRes.error || "ไม่พบพิกัด GPS ความแม่นยำสูงจากอุปกรณ์ กรุณาเปิดสิทธิ์การเข้าถึงตำแหน่ง";
        toast.error(errMsg, { duration: 6000, id: "gps-upload-failed" });
        alert(errMsg);
        return;
      }

      const locatRefId = uploadRes.locatRefId;
      console.log("Created food location with locat_ref_id:", locatRefId);

      setShowConfirmModal(false);

      // 3. บันทึกข้อมูลเมนูอาหารพร้อมแนบ locat_ref_id
      const result = await addFoodRecord(
        user.id,
        pendingFoodData,
        pendingImageFile,
        locatRefId
      );

      if (result) {
        message.success("บันทึกข้อมูลสำเร็จ!");

        // รีโหลดข้อมูล
        const records = await fetchFoodRecords(user.id, displayDate);
        setFoodRecords(records);
        setStreakRefreshKey((k) => k + 1);
        window.dispatchEvent(new CustomEvent("food-record-updated"));
      } else {
        message.error("บันทึกข้อมูลไม่สำเร็จ กรุณาลองใหม่");
      }
    } catch (error) {
      console.error("Error saving:", error);
      message.error("เกิดข้อผิดพลาดในการบันทึก");
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
    document.body.style.overflow = 'unset';
  };

  // ล็อคการเลื่อนหน้าเมื่อ popup เปิด
  useEffect(() => {
    if (showConfirmModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showConfirmModal]);

  // ปิดกล้องอัตโนมัติเมื่อออกจากหน้าเพื่อป้องกัน memory leak
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [cameraStream]);

  const getProgressColor = () => {
    if (caloriePercentage < 70) return "bg-emerald-500";
    if (caloriePercentage < 100) return "bg-emerald-600";
    if (caloriePercentage < 115) return "bg-amber-500";
    return "bg-rose-500";
  };

  const getProgressBadgeColor = () => {
    if (caloriePercentage < 70) return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (caloriePercentage < 100) return "bg-emerald-100 text-emerald-800 border-emerald-300";
    if (caloriePercentage < 115) return "bg-amber-50 text-amber-700 border-amber-200";
    return "bg-rose-50 text-rose-700 border-rose-200";
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24 text-slate-800">
      {/* Navbar */}
      <UserHeader title="Calories Daily" subtitle="ภาพรวมโภชนาการประจำวัน" />

      {/* PDPA Consent Modal */}
      <PDPAConsentModal userId={user?.id} />

      <div className="max-w-md mx-auto px-4 py-5 space-y-4 h-auto max-h-none">
        {/* Profile Card */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100/80 shadow-xs flex items-center gap-3.5">
          <img
            src={mockUser.profilePic}
            alt="profile"
            className="w-12 h-12 rounded-full border border-slate-100 object-cover"
          />
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              {mockUser.name}
            </h3>
            <p className="text-xs text-slate-500">
              เป้าหมาย: <span className="font-semibold text-slate-700">{userTDEE ? userTDEE.toLocaleString() : "-"}</span> kcal/วัน
            </p>
          </div>
        </div>

        {/* Calorie Progress */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100/80 shadow-xs">
          <div className="flex justify-between items-center mb-3">
            <h5 className="text-sm font-semibold text-slate-900">
              พลังงานวันนี้
            </h5>
            <span
              className={`${getProgressBadgeColor()} border text-xs font-semibold px-2.5 py-0.5 rounded-full transition-all duration-300`}
            >
              {Math.round(animatedPercentage)}%
            </span>
          </div>

          <div className="relative h-4 bg-slate-100 rounded-full overflow-hidden mb-4">
            <div
              className={`absolute inset-y-0 left-0 ${getProgressColor()} rounded-full transition-all duration-300 ease-out`}
              style={{ width: `${Math.min(animatedPercentage, 100)}%` }}
            />
          </div>

          <div className="grid grid-cols-3 gap-2 text-center divide-x divide-slate-100">
            <div>
              <div className="text-lg font-bold text-slate-900 transition-all duration-300">
                {animatedCal.toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">บริโภคแล้ว</div>
            </div>
            <div>
              <div className="text-lg font-bold text-slate-700">
                {userTDEE ? userTDEE.toLocaleString() : "-"}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">เป้าหมาย</div>
            </div>
            <div>
              <div
                className={`text-lg font-bold transition-all duration-300 ${remainingCalories >= 0 ? "text-emerald-600" : "text-rose-500"}`}
              >
                {userTDEE
                  ? remainingCalories >= 0
                    ? (mockUser.tdee - animatedCal).toLocaleString()
                    : `+${Math.abs(mockUser.tdee - animatedCal).toLocaleString()}`
                  : "-"}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                {remainingCalories >= 0 ? "คงเหลือ" : "เกินเป้า"}
              </div>
            </div>
          </div>
        </div>

        {/* Nutrition Summary with Chart */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100/80 shadow-xs">
          <div className="text-center mb-4">
            <p className="text-xs font-semibold text-slate-400">สัดส่วนสารอาหาร</p>
          </div>

          <div className="flex items-center justify-center mb-5 relative">
            <div className="w-44 h-44">
              <Doughnut data={chartData} options={chartOptions} />
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <div className="text-2xl font-black text-slate-900 tracking-tight">{Math.round(totalCal)}</div>
              <div className="text-[11px] text-slate-400">/ {userTDEE || '-'} kcal</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100/80 flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0"></div>
              <div className="min-w-0">
                <div className="text-xs text-slate-500">โปรตีน ({proteinCal} kcal)</div>
                <div className="text-sm font-bold text-slate-900">{totalProtein}g</div>
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100/80 flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0"></div>
              <div className="min-w-0">
                <div className="text-xs text-slate-500">คาร์บ ({carbCal} kcal)</div>
                <div className="text-sm font-bold text-slate-900">{totalCarb}g</div>
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100/80 flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0"></div>
              <div className="min-w-0">
                <div className="text-xs text-slate-500">ไขมัน ({fatCal} kcal)</div>
                <div className="text-sm font-bold text-slate-900">{totalFat}g</div>
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100/80 flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 rounded-full bg-slate-300 shrink-0"></div>
              <div className="min-w-0">
                <div className="text-xs text-slate-500">คงเหลือ (kcal)</div>
                <div className="text-sm font-bold text-slate-900">{Math.round(remainingTDEE)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Calendar Fire Streak */}
        {user?.id && (
          <CalendarFireStack
            lineUid={String(user.id)}
            selectedDate={displayDate}
            refreshTrigger={streakRefreshKey}
            foodRecordsCount={foodRecords.length}
            onSelectDate={(date) => {
              setSelectedDate(date);
              setDisplayDate(date);
              setIsViewingDate(date !== getTodayLocalDate());
            }}
          />
        )}

        {/* Date Filter */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100/80 shadow-xs">
          <label className="block text-xs font-semibold text-slate-700 mb-2">
            เลือกวันที่
          </label>
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
      </div>

      {/* Bottom Navigation */}
      <BottomNav onCameraClick={handleOpenCamera} />

      {/* Live Camera Modal */}
      {showLiveCamera && (
        <div className="fixed inset-0 bg-black z-[100] flex flex-col">
          {/* Video Preview */}
          <div className="flex-1 relative overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            
            {/* Canvas สำหรับจับภาพ (ซ่อนไว้) */}
            <canvas ref={canvasRef} className="hidden" />
            
            {/* Overlay Grid */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="w-full h-full border-2 border-white/30 m-4" style={{ 
                boxShadow: '0 0 0 9999px rgba(0,0,0,0.3)' 
              }} />
            </div>
          </div>

          {/* Controls */}
          <div className="bg-black/90 backdrop-blur-md p-6 pb-8 flex items-center justify-between">
            {/* ปุ่มปิด */}
            <button
              onClick={handleCloseLiveCamera}
              className="w-14 h-14 rounded-full bg-white/20 hover:bg-white/30 active:scale-95 transition-all flex items-center justify-center"
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* ปุ่มถ่ายรูป */}
            <button
              onClick={handleTakePhoto}
              className="w-20 h-20 rounded-full bg-white hover:bg-gray-100 active:scale-95 transition-all flex items-center justify-center shadow-lg border-4 border-white/50"
            >
              <div className="w-16 h-16 rounded-full bg-white border-2 border-gray-300" />
            </button>

            {/* ปุ่มสลับกล้อง (placeholder) */}
            <button
              onClick={() => {
                // TODO: สลับกล้องหน้า-หลัง
              }}
              className="w-14 h-14 rounded-full bg-white/20 hover:bg-white/30 active:scale-95 transition-all flex items-center justify-center"
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Camera Modal */}
      {showCameraModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-end justify-center z-50 animate-fadeIn"
          onClick={() => setShowCameraModal(false)}
        >
          <div
            className="bg-white rounded-t-[20px] w-full max-w-md pb-safe animate-slideUp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4">
              <div className="w-12 h-1 bg-[#e5e5ea] rounded-full mx-auto mb-4"></div>
              <h3 className="text-[20px] font-semibold text-black text-center mb-2">
                เพิ่มรูปอาหาร
              </h3>
              <p className="text-[13px] text-[#8e8e93] text-center mb-4">
                เลือกวิธีการเพิ่มรูปภาพอาหาร
              </p>

              <div className="space-y-2">
                <button
                  onClick={handleCameraCapture}
                  className="w-full py-4 text-[17px] font-semibold text-black bg-[#f2f2f7] rounded-[12px] hover:bg-[#e5e5ea] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  ถ่ายรูป
                </button>

                <button
                  onClick={handleGallerySelect}
                  className="w-full py-4 text-[17px] font-semibold text-black bg-[#f2f2f7] rounded-[12px] hover:bg-[#e5e5ea] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
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

              {/* คำแนะนำ */}
              <div className="mt-4 p-2.5 bg-blue-50 border border-blue-200 rounded-[12px] grid gap-1 text-[12px] text-blue-800 leading-relaxed">
                <div className="font-bold">หมายเหตุ</div>
                <p>
                  หากเครื่องใดไม่สามารถอนุญาตการใช้งานกล้องได้ แก้ไขด้วยการถ่ายรูปด้วยแอปกล้องก่อน แล้วนำรูปมาอัปโหลดจาก "เลือกรูปจากแกลเลอรี่" แทนครับ
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* No Data Modal */}
      {showNoDataModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fadeIn"
          onClick={() => setShowNoDataModal(false)}
        >
          <div
            className="bg-white rounded-[20px] p-6 max-w-xs mx-4 animate-slideUp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col items-center gap-3">
              <svg
                className="w-16 h-16 text-[#8e8e93]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                />
              </svg>
              <p className="text-[17px] font-semibold text-black text-center">
                ไม่มีข้อมูล
              </p>
              <p className="text-[13px] text-[#8e8e93] text-center">
                ไม่พบรายการอาหารในวันที่เลือก
              </p>
              <button
                onClick={() => setShowNoDataModal(false)}
                className="w-full mt-2 py-2.5 text-xs font-semibold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 active:scale-[0.98] transition-all shadow-xs"
              >
                ตกลง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Food Data Modal */}
      {showConfirmModal && pendingFoodData && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fadeIn p-4 overflow-y-auto"
          onClick={handleCancelSave}
        >
          <div
            className="bg-white rounded-[20px] max-w-sm w-full shadow-2xl animate-slideUp my-auto max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header - Fixed */}
            <div className="px-5 pt-4 pb-2 flex-shrink-0 text-center">
              <h3 className="text-[18px] font-semibold text-slate-900">
                ตรวจสอบข้อมูลอาหาร
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                ตรวจสอบและแก้ไขค่าที่วิเคราะห์ได้ก่อนบันทึก
              </p>
            </div>

            {/* Content - Scrollable */}
            <div className="px-5 overflow-y-auto flex-1">
              {/* แสดงรูปภาพ */}
              {pendingImagePreview && (
                <div className="mb-3">
                  <img
                    src={pendingImagePreview}
                    alt="Food preview"
                    className="w-full h-32 object-cover rounded-[12px]"
                  />
                </div>
              )}

              <div className="space-y-2.5 mb-3">
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-slate-500">ชื่อเมนูอาหาร</span>
                  <textarea
                    value={pendingFoodData.menu}
                    onChange={(e) =>
                      setPendingFoodData({
                        ...pendingFoodData,
                        menu: e.target.value,
                      })
                    }
                    className="text-sm font-semibold text-slate-900 bg-slate-100/80 px-3 py-1.5 rounded-lg border-0 focus:bg-slate-100 focus:outline-none w-full resize-none"
                    rows="1"
                  />
                </div>

                {/* แคลอรี่ */}
                <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                  <span className="text-sm font-medium text-slate-600">พลังงานทั้งหมด</span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      value={pendingFoodData.cal}
                      onChange={(e) =>
                        setPendingFoodData({
                          ...pendingFoodData,
                          cal: Number(e.target.value),
                        })
                      }
                      className="text-base font-bold text-slate-900 text-right tabular-nums bg-slate-100/80 px-3 py-1.5 rounded-lg border-0 focus:bg-slate-100 focus:outline-none w-24"
                    />
                    <span className="text-xs font-medium text-slate-400">kcal</span>
                  </div>
                </div>

                {/* สารอาหาร 3 ช่อง */}
                <div className="grid grid-cols-3 gap-3 pt-2 border-t border-slate-100">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-slate-500 text-center">โปรตีน (g)</span>
                    <input
                      type="number"
                      value={pendingFoodData.protein}
                      onChange={(e) =>
                        setPendingFoodData({
                          ...pendingFoodData,
                          protein: Number(e.target.value),
                        })
                      }
                      className="text-sm font-bold text-slate-900 text-center tabular-nums bg-slate-100/80 px-2 py-1.5 rounded-lg border-0 focus:bg-slate-100 focus:outline-none w-full"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-slate-500 text-center">คาร์บ (g)</span>
                    <input
                      type="number"
                      value={pendingFoodData.carb}
                      onChange={(e) =>
                        setPendingFoodData({
                          ...pendingFoodData,
                          carb: Number(e.target.value),
                        })
                      }
                      className="text-sm font-bold text-slate-900 text-center tabular-nums bg-slate-100/80 px-2 py-1.5 rounded-lg border-0 focus:bg-slate-100 focus:outline-none w-full"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-slate-500 text-center">ไขมัน (g)</span>
                    <input
                      type="number"
                      value={pendingFoodData.fat}
                      onChange={(e) =>
                        setPendingFoodData({
                          ...pendingFoodData,
                          fat: Number(e.target.value),
                        })
                      }
                      className="text-sm font-bold text-slate-900 text-center tabular-nums bg-slate-100/80 px-2 py-1.5 rounded-lg border-0 focus:bg-slate-100 focus:outline-none w-full"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Actions - Fixed */}
            <div className="px-6 pb-6 flex gap-2.5 flex-shrink-0 border-t border-slate-100 pt-4">
              <button
                onClick={handleCancelSave}
                className="flex-1 py-2.5 text-xs font-semibold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 active:scale-[0.98] transition-all"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleConfirmSave}
                className="flex-1 py-2.5 text-xs font-semibold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 active:scale-[0.98] transition-all shadow-xs"
              >
                บันทึกอาหาร
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
        show={loading || initialLoading || isAnalyzing}
        message={isAnalyzing ? "กำลังวิเคราะห์รูปภาพ..." : "กำลังโหลดข้อมูล..."}
      />
    </div>
  );
};

export default MainDashboard;
