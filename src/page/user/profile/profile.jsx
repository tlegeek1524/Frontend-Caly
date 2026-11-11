import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Activity, Target, Flame, Edit3, Inbox } from 'lucide-react';
import BottomNav from '../../../components/BottomNav/BottomNav';
import LoadingOverlay from '../../../components/Loading/LoadingOverlay';
import UserHeader from '../../../components/UserHeader/UserHeader';
import { getUserService } from '../../../services/user.service';
import { getStoredUser } from '../../../utils/sessionAuth';

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedUser = getStoredUser();
    if (storedUser) {
      setUser(storedUser);
    } else {
      navigate('/linelogin');
    }
  }, [navigate]);

  useEffect(() => {
    const loadUserData = async () => {
      if (!user?.id) return;

      try {
        const userRes = await getUserService(user.id);
        if (userRes.success && userRes.data) {
          const record = userRes.data;
          if (record && (record.cal || record.weight || record.gender)) {
            setUserData({
              Gender: record.gender || record.Gender,
              Weight: record.weight || record.Weight,
              Height: record.height || record.Height,
              Age: record.age || record.Age,
              ActivityLevel: record.activity_level || record.activityLevel || record['Activity Level'],
              Goal: record.goal || record.Goal,
              Cal: record.cal || record.Cal
            });
          }
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, [user]);

  const handleOpenCamera = () => {
    console.log('Open camera from profile');
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-24 text-slate-800">
      {/* Navbar */}
      <UserHeader title="ข้อมูลส่วนตัว" subtitle="สัดส่วนและเป้าหมายพลังงาน" />

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-md mx-auto px-4 py-5 space-y-4">
          {/* Profile Card */}
          <div className="bg-white rounded-2xl p-5 border border-slate-100/80 shadow-xs text-center">
            {user.picture ? (
              <img 
                src={user.picture} 
                alt="profile" 
                className="w-20 h-20 rounded-full border-2 border-emerald-500/20 mx-auto mb-3 object-cover"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                <User className="w-10 h-10" />
              </div>
            )}
            <h3 className="text-base font-bold text-slate-900 mb-0.5">{user.name || 'ผู้ใช้งาน'}</h3>
            <p className="text-xs text-slate-400">LINE UID: {user.id}</p>
          </div>

          <LoadingOverlay show={isLoading} message="กำลังโหลดข้อมูล..." />

          {userData ? (
            <>
              {/* Personal Info */}
              <div className="bg-white rounded-2xl overflow-hidden border border-slate-100/80 shadow-xs">
                <div className="px-4 py-2.5 bg-slate-50/50 border-b border-slate-100 flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">ข้อมูลกายภาพ</span>
                </div>
                <div className="divide-y divide-slate-100/80 text-sm">
                  <div className="px-4 py-3 flex justify-between items-center">
                    <span className="text-slate-500">เพศ</span>
                    <span className="text-slate-900 font-medium">
                      {userData.Gender === 'male' ? 'ชาย' : userData.Gender === 'female' ? 'หญิง' : '-'}
                    </span>
                  </div>
                  <div className="px-4 py-3 flex justify-between items-center">
                    <span className="text-slate-500">น้ำหนัก</span>
                    <span className="text-slate-900 font-medium">{userData.Weight || '-'} กก.</span>
                  </div>
                  <div className="px-4 py-3 flex justify-between items-center">
                    <span className="text-slate-500">ส่วนสูง</span>
                    <span className="text-slate-900 font-medium">{userData.Height || '-'} ซม.</span>
                  </div>
                  <div className="px-4 py-3 flex justify-between items-center">
                    <span className="text-slate-500">อายุ</span>
                    <span className="text-slate-900 font-medium">{userData.Age || '-'} ปี</span>
                  </div>
                </div>
              </div>

              {/* Activity & Goal */}
              <div className="bg-white rounded-2xl overflow-hidden border border-slate-100/80 shadow-xs">
                <div className="px-4 py-2.5 bg-slate-50/50 border-b border-slate-100 flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">กิจกรรมและเป้าหมาย</span>
                </div>
                <div className="divide-y divide-slate-100/80 text-sm">
                  <div className="px-4 py-3 flex justify-between items-center">
                    <span className="text-slate-500">กิจกรรม</span>
                    <span className="text-slate-900 font-medium text-right max-w-[200px] truncate">
                      {userData.ActivityLevel === 'sedentary' ? 'นั่งทำงานอยู่กับที่' :
                       userData.ActivityLevel === 'light' ? 'ออกกำลังกายเบาๆ' :
                       userData.ActivityLevel === 'moderate' ? 'ออกกำลังกายปานกลาง' :
                       userData.ActivityLevel === 'active' ? 'ออกกำลังกายหนัก' :
                       userData.ActivityLevel === 'veryActive' ? 'ออกกำลังกายหนักมาก' : '-'}
                    </span>
                  </div>
                  <div className="px-4 py-3 flex justify-between items-center">
                    <span className="text-slate-500">เป้าหมาย</span>
                    <span className="text-slate-900 font-medium">
                      {userData.Goal === 'lose' ? 'ลดน้ำหนัก' :
                       userData.Goal === 'maintain' ? 'รักษาน้ำหนัก' :
                       userData.Goal === 'gain' ? 'เพิ่มน้ำหนัก' : '-'}
                    </span>
                  </div>
                </div>
              </div>

              {/* TDEE Hero Block */}
              <div className="bg-emerald-900 text-white rounded-2xl p-5 border border-emerald-800/50 shadow-xs relative overflow-hidden">
                <div className="relative z-10">
                  <div className="flex items-center gap-1.5 text-emerald-300 text-xs font-medium mb-1">
                    <Flame className="w-4 h-4 text-emerald-400" />
                    <span>พลังงานที่ร่างกายต้องการต่อวัน (TDEE)</span>
                  </div>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-3xl font-extrabold tracking-tight">
                      {userData.Cal ? parseInt(userData.Cal).toLocaleString() : '-'}
                    </span>
                    <span className="text-sm font-normal text-emerald-200">kcal / วัน</span>
                  </div>
                </div>
              </div>

              {/* Edit Button */}
              <button
                onClick={() => navigate('/regis')}
                className="w-full bg-white rounded-xl py-3 border border-slate-200 hover:bg-slate-50 active:bg-slate-100 transition-colors flex items-center justify-center gap-2 text-sm font-semibold text-slate-700 shadow-xs"
              >
                <Edit3 className="w-4 h-4 text-slate-500" />
                <span>แก้ไขข้อมูลส่วนตัว</span>
              </button>
            </>
          ) : !isLoading && (
            <div className="bg-white rounded-2xl p-6 border border-slate-100 text-center shadow-xs">
              <Inbox className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-900 mb-1">ยังไม่มีข้อมูลกายภาพ</p>
              <p className="text-xs text-slate-400 mb-4">กรุณากรอกข้อมูลส่วนตัวเพื่อคำนวณพลังงานที่เหมาะสม</p>
              <button
                onClick={() => navigate('/regis')}
                className="px-5 py-2.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 rounded-xl transition-all shadow-xs"
              >
                คำนวณ TDEE ตอนนี้
              </button>
            </div>
          )}
        </div>
      </div>

      <BottomNav onCameraClick={handleOpenCamera} />
    </div>
  );
};

export default Profile;
