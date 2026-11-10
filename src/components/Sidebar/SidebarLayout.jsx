import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  ThemeProvider,
  createTheme,
  CssBaseline,
} from "@mui/material";
import { Outlet } from "react-router-dom";
import LoadingOverlay from "../Loading/LoadingOverlay";
import Sidebar from "./Sidebar";
import { useApp } from "../../context/AppContext";

const SidebarLayout = () => {
  const { theme } = useApp();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const muiTheme = useMemo(() => {
    const isDark = theme === "dark";
    return createTheme({
      typography: {
        fontFamily: '"Knit", "Sarabun", sans-serif',
      },
      palette: {
        mode: isDark ? "dark" : "light",
        primary: {
          main: "#3b82f6",
        },
        background: {
          default: isDark ? "#0f172a" : "#f8fafc",
          paper: isDark ? "#1e293b" : "#ffffff",
        },
        text: {
          primary: isDark ? "#f8fafc" : "#0f172a",
          secondary: isDark ? "#94a3b8" : "#64748b",
        },
      },
    });
  }, [theme]);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error("Parse user error:", e);
      }
    }
    setIsLoading(false);
  }, []);

  const handleMenuClose = () => {
    setIsMenuOpen(false);
  };

  if (isLoading) {
    return <LoadingOverlay show={true} message="กำลังเตรียมข้อมูลระบบ..." />;
  }

  return (
    <ThemeProvider theme={muiTheme}>
      <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh", bgcolor: "background.default" }}>
        <CssBaseline />

        {/* Main Content Container without Navbar */}
        <Box sx={{ position: "relative", flexGrow: 1, display: "flex" }}>
          {/* Sidebar Component */}
          <Sidebar isOpen={isMenuOpen} onClose={handleMenuClose} />

          {/* Dynamic Content */}
          <Box
            component="main"
            sx={{
              flexGrow: 1,
              minWidth: 0,
              p: 0, 
              bgcolor: "background.default",
              minHeight: "100vh",
            }}
          >
            <Outlet context={{ user }} />
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default SidebarLayout;
