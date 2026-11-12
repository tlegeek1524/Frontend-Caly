import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LoadingOverlay from '../../components/Loading/LoadingOverlay';
import {
  getStoredUser,
  verifyAdminStatusFromApi
} from '../../utils/sessionAuth';

const LineLogin = () => {
  const navigate = useNavigate();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Auto-login: หากมี session อยู่แล้ว ให้ซิงก์สิทธิ์ล่าสุดจาก API แล้วส่งไปที่ /dashboard
  useEffect(() => {
    let isMounted = true;

    const checkExistingSession = async () => {
      try {
        const storedUser = getStoredUser();
        const uid = storedUser?.id || storedUser?.line_uid || storedUser?.userId || storedUser?.accountno;

        if (storedUser && uid) {
          await verifyAdminStatusFromApi();
          if (!isMounted) return;

          navigate('/dashboard', { replace: true });
          return;
        }
      } catch (e) {
        console.error('Error checking user session:', e);
      } finally {
        if (isMounted) {
          setIsCheckingAuth(false);
        }
      }
    };

    checkExistingSession();

    return () => {
      isMounted = false;
    };
  }, [navigate]);
  
  const handleLineLogin = () => {
    const channelId = import.meta.env.VITE_LINE_CHANNEL_ID;
    const origin = window.location.origin;
    const callbackUrl = import.meta.env.VITE_LINE_CALLBACK_URL || `${origin}/auth/line/callback`;
    const state = Math.random().toString(36).substring(7);
    
    sessionStorage.setItem('line_login_state', state);
    sessionStorage.setItem('line_login_callback_url', callbackUrl);
    
    const lineAuthUrl = `https://access.line.me/oauth2/v2.1/authorize?response_type=code&client_id=${channelId}&redirect_uri=${encodeURIComponent(callbackUrl)}&state=${state}&scope=profile%20openid%20email`;
    
    window.location.href = lineAuthUrl;
  };

  if (isCheckingAuth) {
    return <LoadingOverlay show={true} message="กำลังตรวจสอบการเข้าสู่ระบบ..." />;
  }

  return (
    <div className="h-[100dvh] w-full bg-[#f8fafc] flex flex-col justify-between p-5 sm:p-8 lg:p-12 overflow-hidden select-none relative font-['Kanit']">
      {/* Background Real Food Image with Light Ambient Overlay */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <img
          src="https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=2000&q=80"
          alt="Fresh healthy nutrition"
          className="w-full h-full object-cover object-center opacity-25 lg:opacity-35 scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-white via-white/80 to-white/90 lg:bg-gradient-to-r lg:from-white lg:via-white/85 lg:to-transparent" />
      </div>

      {/* Top Header */}
      <header className="w-full flex items-center justify-between max-w-6xl mx-auto shrink-0 z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.4} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900">CALY</span>
        </div>
      </header>

      {/* Main Section */}
      <main className="w-full max-w-6xl mx-auto flex-1 flex flex-col lg:flex-row items-center justify-center lg:justify-between gap-8 lg:gap-16 my-auto min-h-0 z-10">
        {/* Left Column (Desktop Hero) */}
        <div className="hidden lg:block flex-1 space-y-6 max-w-lg">
          <h1 className="text-4xl lg:text-5xl xl:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
            ทานอาหารอย่างมั่นใจ <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600">
              แค่ถ่ายภาพก็รู้แคลอรี่
            </span>
          </h1>

          <p className="text-base text-slate-600 leading-relaxed">
            สัมผัสประสบการณ์นับสารอาหารยุคใหม่ ให้ AI ช่วยวิเคราะห์โปรตีน คาร์โบไฮเดรต และไขมัน พร้อมคำนวณตามค่า TDEE ส่วนบุคคลของคุณทันที
          </p>
        </div>

        {/* Center / Right Login Card */}
        <div className="w-full max-w-sm sm:max-w-md shrink-0">
          <div className="bg-white/90 backdrop-blur-2xl border border-white/80 rounded-[28px] p-7 sm:p-9 shadow-2xl shadow-slate-300/50 flex flex-col gap-6 text-center relative overflow-hidden">
            {/* Subtle glow accent */}
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-emerald-400/15 rounded-full blur-3xl pointer-events-none" />

            {/* Mobile Header Branding */}
            <div className="space-y-2">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-xl shadow-emerald-500/25 mb-3">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.4} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Calories Daily
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                เข้าสู่ระบบด้วย LINE เพื่อเริ่มต้นวิเคราะห์โภชนาการของคุณ
              </p>
            </div>

            {/* LINE Login Button */}
            <button
              onClick={handleLineLogin}
              className="w-full py-4 px-6 bg-[#06C755] hover:bg-[#05b34c] active:scale-[0.98] text-white text-base sm:text-[17px] font-semibold rounded-2xl transition-all duration-200 flex items-center justify-center gap-3 shadow-lg shadow-emerald-600/25 cursor-pointer"
            >
              <svg className="w-6 h-6 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
              </svg>
              <span>เข้าสู่ระบบด้วย LINE</span>
            </button>

            {/* Terms note */}
            <p className="text-[11px] text-slate-400 text-center leading-relaxed">
              การเข้าสู่ระบบถือว่าคุณยอมรับข้อกำหนดการใช้งานและนโยบายคุ้มครองข้อมูลส่วนบุคคล (PDPA)
            </p>
          </div>
        </div>
      </main>

      {/* Bottom Footer */}
      <footer className="w-full text-center text-xs text-slate-400 max-w-6xl mx-auto shrink-0 z-10">
        © {new Date().getFullYear()} CALY. All rights reserved.
      </footer>
    </div>
  );
};

export default LineLogin;
