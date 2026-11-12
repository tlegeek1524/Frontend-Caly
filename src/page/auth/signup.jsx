import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, Lock, Mail, Phone, Loader2 } from "lucide-react";
import { Snackbar, Alert } from "@mui/material";
import { fetchWithAuth } from "../../utils/api";

const Signup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    full_name: "",
    username: "",
    email: "",
    phonenumber: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "error" });

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') return;
    setSnackbar({ ...snackbar, open: false });
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetchWithAuth("/users/create-new-user", {
        method: "POST",
        body: JSON.stringify(formData),
      });

      if (!response) return;

      const result = await response.json();

      if (response.ok) {
        setSnackbar({ open: true, message: "สร้างบัญชีสำเร็จ กรุณาเข้าสู่ระบบ", severity: "success" });
        setTimeout(() => navigate("/login"), 1500);
      } else {
        setSnackbar({ open: true, message: result.message || "ไม่สามารถสร้างบัญชีได้", severity: "error" });
      }
    } catch (err) {
      setSnackbar({ open: true, message: "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้", severity: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#f0f4f0] p-6 py-12 font-['Kanit']">
      <div className="w-full max-w-[400px] animate-fadeIn">
        
        {/* Simple Branding */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-emerald-600 flex items-center justify-center text-white font-bold text-2xl mb-4">
            C
          </div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">สมัครสมาชิก</h1>
          <p className="text-slate-500 text-xs mt-1">กรุณากรอกข้อมูลส่วนตัวเพื่อสร้างบัญชี</p>
        </div>

        <div className="bg-white border-2 border-slate-200 p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-0.5">
                ชื่อ-นามสกุล
              </label>
              <input
                type="text"
                name="full_name"
                required
                value={formData.full_name}
                onChange={handleChange}
                className="block w-full px-3 py-2.5 bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-300 focus:bg-white focus:border-emerald-500 transition-all outline-none text-sm rounded-none"
                placeholder="Full Name"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-0.5">
                  ชื่อผู้ใช้งาน
                </label>
                <input
                  type="text"
                  name="username"
                  required
                  value={formData.username}
                  onChange={handleChange}
                  className="block w-full px-3 py-2.5 bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-300 focus:bg-white focus:border-emerald-500 transition-all outline-none text-sm rounded-none"
                  placeholder="Username"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-0.5">
                  เบอร์โทรศัพท์
                </label>
                <input
                  type="tel"
                  name="phonenumber"
                  required
                  value={formData.phonenumber}
                  onChange={handleChange}
                  className="block w-full px-3 py-2.5 bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-300 focus:bg-white focus:border-emerald-500 transition-all outline-none text-sm rounded-none"
                  placeholder="Phone"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-0.5">
                อีเมล
              </label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="block w-full px-3 py-2.5 bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-300 focus:bg-white focus:border-emerald-500 transition-all outline-none text-sm rounded-none"
                placeholder="Email Address"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-0.5">
                รหัสผ่าน
              </label>
              <input
                type="password"
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="block w-full px-3 py-2.5 bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-300 focus:bg-white focus:border-emerald-500 transition-all outline-none text-sm rounded-none"
                placeholder="Password"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center py-3 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-all disabled:opacity-70 mt-6 rounded-none uppercase tracking-widest"
            >
              {isLoading ? (
                <Loader2 className="animate-spin h-4 w-4" />
              ) : (
                "สมัครสมาชิก"
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">
              มีบัญชีอยู่แล้ว? <span onClick={() => navigate("/login")} className="text-emerald-600 cursor-pointer hover:underline ml-1">เข้าสู่ระบบ</span>
            </p>
          </div>
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

export default Signup;
