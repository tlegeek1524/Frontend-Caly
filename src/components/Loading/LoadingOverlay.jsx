import React from 'react';

/**
 * Transparent Fullscreen Loading Overlay Component
 * @param {Object} props
 * @param {boolean} props.show - สถานะการแสดงผล
 * @param {string} [props.message='กำลังโหลดข้อมูล...'] - ข้อความแสดงใต้ spinner
 * @param {string} [props.description='กรุณารอสักครู่'] - คำอธิบายเพิ่มเติมใต้ข้อความหลัก
 */
export const LoadingOverlay = ({
  show,
  message = 'กำลังโหลดข้อมูล...',
  description = 'กรุณารอสักครู่',
}) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/25 backdrop-blur-sm transition-all duration-300 animate-fadeIn">
      <div className="flex flex-col items-center justify-center p-4 max-w-xs mx-4 text-center transform scale-100 animate-scaleIn">
        {/* Animated Spinner with Modern Gradient */}
        <div className="relative w-14 h-14 mb-3">
          <div className="absolute inset-0 rounded-full border-4 border-emerald-400/20"></div>
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-emerald-400 border-r-emerald-400 animate-spin"></div>
          <div className="absolute inset-2 rounded-full border-4 border-transparent border-b-green-300 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }}></div>
        </div>

        {/* Loading Text */}
        <p className="text-[15px] font-semibold text-white drop-shadow-md tracking-wide">
          {message}
        </p>
        <span className="text-[12px] text-white/80 drop-shadow-sm mt-0.5">
          {description}
        </span>
      </div>
    </div>
  );
};

export default LoadingOverlay;
