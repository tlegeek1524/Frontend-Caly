import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./page/auth/login";
import Signup from "./page/auth/signup";
import LineLogin from "./page/auth/linelogin";
import LineCallback from "./page/auth/linecallback";
import Regispage from "./page/user/regis/regispage";
import MainDashboard from "./page/user/dashboard/maindashboard";
import FoodMenu from "./page/user/dashboard/foodmenu";
import Profile from "./page/user/profile/profile";
import Settings from "./page/user/settings/settings";
import SidebarLayout from "./components/Sidebar/SidebarLayout";
import AdminDashboard from "./page/admin/index";
import { ErrorPage } from "./page/error/ErrorPage";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { RoleProtectedRoute } from "./components/RoleProtectedRoute";
import { AppProvider } from "./context/AppContext";
import { Toaster } from "react-hot-toast";
import "./App.css";

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
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LineLogin />} />
            <Route path="/linelogin" element={<LineLogin />} />
            <Route path="/auth/line/callback" element={<LineCallback />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/regis" element={<Regispage />} />

            {/* User Routes */}
            <Route path="/dashboard" element={<MainDashboard />} />
            <Route path="/foodmenu" element={<FoodMenu />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/settings" element={<Settings />} />

            {/* Protected Admin Routes (รองรับ 403 Forbidden เมื่อไม่มีสิทธิ์) */}
            <Route element={<RoleProtectedRoute allowedRoles={["admin", "dev"]} />}>
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
        </AppProvider>
      </ErrorBoundary>
    </BrowserRouter>
  );
}

export default App;
