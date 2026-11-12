import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { getStoredUser, isAdminAuthorized } from '../../utils/sessionAuth';

export const UserHeader = ({ title = 'Calories Daily', subtitle }) => {
  const navigate = useNavigate();
  const user = getStoredUser();
  const canAccessAdmin = isAdminAuthorized(user);

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-100">
      <div className="max-w-md mx-auto px-5 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
          )}
        </div>
        {canAccessAdmin && (
          <button
            type="button"
            onClick={() => navigate('/admin-dashboard')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-medium hover:bg-slate-800 transition-colors"
            title="ไปหน้า Admin Dashboard"
          >
            <ShieldCheck size={14} />
            <span>Admin</span>
          </button>
        )}
      </div>
    </header>
  );
};

export default UserHeader;
