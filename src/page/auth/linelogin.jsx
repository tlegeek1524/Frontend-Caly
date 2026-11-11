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
    <div 
      className="min-h-screen bg-[#f2f2f7] flex items-center justify-center px-3 sm:px-4 font-['Knit']"
    >
      <div className="w-full max-w-sm sm:max-w-md">
        <div className="bg-white rounded-[16px] sm:rounded-[20px] p-6 sm:p-8 shadow-sm">
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-[24px] sm:text-[28px] font-bold text-black mb-2">Calories Daily</h1>
            <p className="text-[14px] sm:text-[15px] text-[#8e8e93]">เข้าสู่ระบบเพื่อเริ่มต้นใช้งาน</p>
          </div>

          <button
            onClick={handleLineLogin}
            className="w-full py-3 sm:py-4 bg-[#06C755] text-white text-[15px] sm:text-[17px] font-semibold rounded-[10px] sm:rounded-[12px] hover:bg-[#05b34c] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2.5 sm:gap-3"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
            </svg>
            เข้าสู่ระบบด้วย LINE
          </button>
        </div>
      </div>
    </div>
  );
};

export default LineLogin;
