import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, ChevronRight, User, Bot } from 'lucide-react';
import { Switch } from 'antd';
import toast from 'react-hot-toast';
import BottomNav from '../../../components/BottomNav/BottomNav';
import UserHeader from '../../../components/UserHeader/UserHeader';
import { getStoredUser, clearStoredAuth } from '../../../utils/sessionAuth';
import {
  isMascotVisibleToday,
  setMascotVisible,
  MASCOT_VISIBILITY_EVENT
} from '../../../components/SideMascot';

const Settings = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [mascotVisible, setMascotVisibleState] = useState(isMascotVisibleToday());

  useEffect(() => {
    const handleSync = () => {
      setMascotVisibleState(isMascotVisibleToday());
    };
    window.addEventListener(MASCOT_VISIBILITY_EVENT, handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener(MASCOT_VISIBILITY_EVENT, handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  const handleToggleMascot = (checked) => {
    setMascotVisible(checked);
    setMascotVisibleState(checked);
    if (checked) {
      toast.success('นำ Caly Buddy กลับมาแสดงแล้ว');
    } else {
      toast('ปิดการแสดง Caly Buddy แล้ว');
    }
  };

  useEffect(() => {
    const storedUser = getStoredUser();
    if (storedUser) {
      setUser(storedUser);
    } else {
      navigate('/linelogin');
    }
  }, [navigate]);

  const confirmLogout = () => {
    clearStoredAuth();
    sessionStorage.clear();
    navigate('/linelogin', { replace: true });
  };

  const handleOpenCamera = () => {
    console.log('Open camera from settings');
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50 pb-24 text-slate-800">
      {/* Header */}
      <UserHeader title="ตั้งค่า" subtitle="จัดการบัญชีและการตั้งค่าแอป" />

      <main className="max-w-md mx-auto px-4 py-5 space-y-4 h-auto max-h-none">
        {/* Profile Card Preview */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100/80 shadow-xs flex items-center gap-3.5">
          {user.picture ? (
            <img
              src={user.picture}
              alt="Profile"
              className="w-12 h-12 rounded-full object-cover border border-slate-100"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
              <User className="w-6 h-6" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-slate-900 truncate">
              {user.name || 'ผู้ใช้งาน'}
            </h3>
          </div>
        </div>

        {/* Account Section */}
        <div className="bg-white rounded-2xl overflow-hidden border border-slate-100/80 shadow-xs">
          <div className="px-4 py-2.5 bg-slate-50/50 border-b border-slate-100">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              ข้อมูลส่วนตัว
            </span>
          </div>
          <button 
            onClick={() => navigate('/regis')}
            className="w-full px-4 py-3.5 grid grid-cols-[auto_1fr_auto] items-center gap-3 text-left hover:bg-slate-50 active:bg-slate-100 transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <span className="text-sm font-medium text-slate-800 truncate">แก้ไขข้อมูลส่วนตัว / คำนวณ TDEE</span>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        {/* Mascot Assistant Section */}
        <div className="bg-white rounded-2xl overflow-hidden border border-slate-100/80 shadow-xs">
          <div className="px-4 py-2.5 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              ผู้ช่วยตัวการ์ตูน (Caly Buddy)
            </span>
          </div>
          <div className="px-4 py-3.5 grid grid-cols-[auto_1fr_auto] items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-800">แสดง Caly Buddy ข้างจอ</p>
              <p className="text-xs text-slate-400">
                {mascotVisible
                  ? 'กำลังแสดงคำแนะนำและทักทาย'
                  : 'ปิดอยู่ (เปิดเพื่อนำกลับมาแสดงทันที)'}
              </p>
            </div>
            <Switch
              checked={mascotVisible}
              onChange={handleToggleMascot}
              className={mascotVisible ? '!bg-emerald-500' : ''}
            />
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={() => setShowLogoutModal(true)}
          className="w-full bg-white rounded-2xl p-3.5 border border-rose-100/70 shadow-xs hover:bg-rose-50/40 active:bg-rose-50 transition-colors flex items-center justify-center gap-2 group"
        >
          <LogOut className="w-4 h-4 text-rose-500 group-hover:translate-x-0.5 transition-transform" />
          <span className="text-sm font-semibold text-rose-600">ออกจากระบบ</span>
        </button>

        {/* Version */}
        <div className="text-center pt-4">
          <p className="text-xs text-slate-400">Calories Daily v2.4</p>
        </div>
      </main>

      {/* Logout Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn">
          <div 
            className="w-full max-w-xs bg-white rounded-2xl shadow-xl p-5 text-center border border-slate-100 animate-slideUp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-3">
              <LogOut className="w-5 h-5" />
            </div>

            <h3 className="text-base font-bold text-slate-900 mb-1">
              ยืนยันการออกจากระบบ?
            </h3>
            <p className="text-xs text-slate-500 mb-5 leading-relaxed">
              คุณจะต้องเข้าสู่ระบบใหม่อีกครั้งเพื่อเข้าถึงบันทึกอาหารของคุณ
            </p>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setShowLogoutModal(false)}
                className="w-full py-2.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 active:scale-95 rounded-xl transition-all"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={confirmLogout}
                className="w-full py-2.5 text-xs font-semibold text-white bg-rose-500 hover:bg-rose-600 active:scale-95 rounded-xl shadow-xs transition-all"
              >
                ออกจากระบบ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <BottomNav onCameraClick={handleOpenCamera} />
    </div>
  );
};

export default Settings;
