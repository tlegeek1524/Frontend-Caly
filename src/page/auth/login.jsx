import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, Lock, Loader2, Eye, EyeOff } from "lucide-react";
import { Snackbar, Alert } from "@mui/material";
import { fetchWithAuth } from "../../utils/api";

const Login = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "error" });

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') return;
    setSnackbar({ ...snackbar, open: false });
  };

  const handleBypassLogin = () => {
    const mockUser = {
      id: "mock-admin-1",
      accountno: "ADM001",
      username: "admin",
      full_name: "Admin Caly",
      email: "admin@caly.com",
      roles: ["admin", "dev"],
      lineUid: "mock-line-uid",
      displayName: "Admin Caly"
    };

    sessionStorage.setItem("access_token", "mock-access-token");
    sessionStorage.setItem("user", JSON.stringify(mockUser));
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    navigate("/admin-dashboard");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetchWithAuth("/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });

      if (!response) return;

      const result = await response.json();

      if (response.ok && (result.status === 200 || result.status === "200")) {
        sessionStorage.setItem("access_token", result.data.access_token);
        sessionStorage.setItem("user", JSON.stringify(result.data.user));
        localStorage.removeItem("access_token");
        localStorage.removeItem("user");
        setSnackbar({ open: true, message: "เข้าสู่ระบบสำเร็จ", severity: "success" });
        setTimeout(() => navigate("/dashboard"), 1000);
      } else {
        setSnackbar({ open: true, message: result.message || "ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง", severity: "error" });
      }
    } catch (err) {
      setSnackbar({ open: true, message: "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้", severity: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#f0f4f0] p-4 sm:p-6 font-['Knit']">
      <div className="w-full max-w-[320px] sm:max-w-[360px] animate-fadeIn">
        
        {/* Simple Branding */}
        <div className="flex flex-col items-center mb-6 sm:mb-8">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-600 flex items-center justify-center text-white font-bold text-xl sm:text-2xl mb-3 sm:mb-4">
            C
          </div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-800 tracking-tight">เข้าสู่ระบบ</h1>
          <p className="text-slate-500 text-[11px] sm:text-xs mt-1 text-center px-2">กรุณากรอกข้อมูลเพื่อเข้าใช้งานระบบ</p>
        </div>

        <div className="bg-white border-2 border-slate-200 p-5 sm:p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            <div className="space-y-1.5">
              <label className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-0.5">
                ชื่อผู้ใช้งาน
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-2.5 sm:pl-3 flex items-center pointer-events-none text-slate-300">
                  <User className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-300 focus:bg-white focus:border-emerald-500 transition-all outline-none text-[13px] sm:text-sm rounded-none"
                  placeholder="Username"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-0.5">
                รหัสผ่าน
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-2.5 sm:pl-3 flex items-center pointer-events-none text-slate-300">
                  <Lock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-9 sm:pl-10 pr-10 sm:pr-12 py-2 sm:py-2.5 bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-300 focus:bg-white focus:border-emerald-500 transition-all outline-none text-[13px] sm:text-sm rounded-none"
                  placeholder="Password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-2.5 sm:pr-3 flex items-center text-slate-300 hover:text-emerald-600 transition-colors focus:outline-none appearance-none bg-transparent border-none outline-none shadow-none"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center py-2.5 sm:py-3 text-[11px] sm:text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-all disabled:opacity-70 mt-3 sm:mt-4 rounded-none uppercase tracking-widest"
            >
              {isLoading ? (
                <Loader2 className="animate-spin h-3.5 w-3.5 sm:h-4 sm:w-4" />
              ) : (
                "เข้าสู่ระบบ"
              )}
            </button>

            <button
              type="button"
              onClick={handleBypassLogin}
              className="w-full flex justify-center items-center py-2.5 sm:py-3 text-[11px] sm:text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 transition-all rounded-none uppercase tracking-widest mt-2"
            >
              Bypass Login (เข้า Admin Dashboard ทันที)
            </button>
          </form>

        </div>
      </div>

      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={4000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%', borderRadius: 0, fontWeight: 'bold' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default Login;
