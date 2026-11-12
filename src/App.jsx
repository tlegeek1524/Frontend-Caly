import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import SidebarLayout from "./components/Sidebar/SidebarLayout";
import { UserLayout } from "./components/UserLayout";
import { ErrorPage } from "./page/error/ErrorPage";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { RoleProtectedRoute } from "./components/RoleProtectedRoute";
import { ProtectApp } from "./components/ProtectApp";
import { AppProvider } from "./context/AppContext";
import LoadingOverlay from "./components/Loading/LoadingOverlay";
import { Toaster } from "react-hot-toast";
import "./App.css";

const Login = lazy(() => import("./page/auth/login"));
const Signup = lazy(() => import("./page/auth/signup"));
const LineLogin = lazy(() => import("./page/auth/linelogin"));
const LineCallback = lazy(() => import("./page/auth/linecallback"));
const Regispage = lazy(() => import("./page/user/regis/regispage"));
const MainDashboard = lazy(() => import("./page/user/dashboard/maindashboard"));
const FoodMenu = lazy(() => import("./page/user/dashboard/foodmenu"));
const Profile = lazy(() => import("./page/user/profile/profile"));
const Settings = lazy(() => import("./page/user/settings/settings"));
const AdminDashboard = lazy(() => import("./page/admin/index"));

function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <AppProvider>
          <Toaster
            position="top-right"
            reverseOrder={false}
            toastOptions={{
              className: "text-xs font-medium !py-2 !px-3 !rounded-xl !shadow-md !max-w-xs",
              duration: 3500,
              style: {
                fontSize: "12px",
                padding: "8px 12px",
              },
            }}
          />
          <Suspense fallback={<LoadingOverlay show={true} message="กำลังโหลดหน้า..." />}>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LineLogin />} />
              <Route path="/linelogin" element={<LineLogin />} />
              <Route path="/auth/line/callback" element={<LineCallback />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/regis" element={<Regispage />} />

              {/* User Routes (ตรวจสอบการลงทะเบียนผู้ใช้ก่อนเข้าใช้งาน) */}
              <Route element={<ProtectApp />}>
                <Route element={<UserLayout />}>
                  <Route path="/dashboard" element={<MainDashboard />} />
                  <Route path="/foodmenu" element={<FoodMenu />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/settings" element={<Settings />} />
                </Route>
              </Route>

              {/* Protected Admin Routes (อนุญาตเฉพาะ ADMIN, DEV, STAFF) */}
              <Route element={<RoleProtectedRoute allowedRoles={["ADMIN", "DEV", "STAFF"]} />}>
                <Route element={<SidebarLayout />}>
                  <Route path="/admin-dashboard" element={<AdminDashboard />} />
                  <Route path="/admin-dashboard/:tab" element={<AdminDashboard />} />
                </Route>
              </Route>

              {/* Explicit Error Routes */}
              <Route path="/403" element={<ErrorPage type="403" />} />
              <Route path="/404" element={<ErrorPage type="404" />} />
              <Route path="/500" element={<ErrorPage type="500" />} />

              {/* Catch-all 404 Route */}
              <Route path="*" element={<ErrorPage type="404" />} />
            </Routes>
          </Suspense>
        </AppProvider>
      </ErrorBoundary>
    </BrowserRouter>
  );
}

export default App;
