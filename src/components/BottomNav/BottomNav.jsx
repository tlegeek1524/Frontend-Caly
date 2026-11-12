import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, UtensilsCrossed, Camera, User, Settings } from 'lucide-react';
import './BottomNav.css';

const BottomNav = ({ onCameraClick }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <div className="user-bottom-nav">
      <div className="user-bottom-nav-container">
        <div className="user-bottom-nav-grid">
          {/* หน้าแรก */}
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className={`user-bottom-nav-item ${isActive('/dashboard') ? 'active' : ''}`}
          >
            <Home className="user-bottom-nav-icon" strokeWidth={2} />
            <span className="user-bottom-nav-label">หน้าแรก</span>
          </button>

          {/* รายการอาหาร */}
          <button
            type="button"
            onClick={() => navigate('/foodmenu')}
            className={`user-bottom-nav-item ${isActive('/foodmenu') ? 'active' : ''}`}
          >
            <UtensilsCrossed className="user-bottom-nav-icon" strokeWidth={2} />
            <span className="user-bottom-nav-label">รายการ</span>
          </button>

          {/* กล้อง (ตรงกลาง - ปุ่มใหญ่เด่นพร้อม gradient เขียวดั้งเดิม) */}
          <button
            type="button"
            onClick={onCameraClick}
            className="user-bottom-nav-camera-btn"
            aria-label="ถ่ายรูปอาหาร"
          >
            <Camera className="user-bottom-nav-camera-icon" strokeWidth={2} />
          </button>

          {/* ข้อมูล */}
          <button
            type="button"
            onClick={() => navigate('/profile')}
            className={`user-bottom-nav-item ${isActive('/profile') ? 'active' : ''}`}
          >
            <User className="user-bottom-nav-icon" strokeWidth={2} />
            <span className="user-bottom-nav-label">ข้อมูล</span>
          </button>

          {/* การตั้งค่า */}
          <button
            type="button"
            onClick={() => navigate('/settings')}
            className={`user-bottom-nav-item ${isActive('/settings') ? 'active' : ''}`}
          >
            <Settings className="user-bottom-nav-icon" strokeWidth={2} />
            <span className="user-bottom-nav-label">ตั้งค่า</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default BottomNav;
