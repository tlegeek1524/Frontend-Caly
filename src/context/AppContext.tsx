import React, { createContext, useContext, useState, useEffect } from "react";
import { ConfigProvider, theme as antTheme } from "antd";
import thTH from "antd/locale/th_TH";
import enUS from "antd/locale/en_US";

import thJson from "../locales/th.json";
import enJson from "../locales/en.json";

export type ThemeMode = "light" | "dark";
export type Language = "th" | "en";

type AppContextType = {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: string) => string;
};

const translations: Record<Language, any> = {
  th: thJson,
  en: enJson
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    return (sessionStorage.getItem("app_theme") as ThemeMode) || "light";
  });

  const [language, setLanguageState] = useState<Language>(() => {
    return (sessionStorage.getItem("app_lang") as Language) || "th";
  });

  // ใช้เทคนิค disable-transitions ชั่วขณะตอนเปลี่ยนธีมเพื่อป้องกันอาการกะพริบจาก transition ไม่พร้อมกัน
  const applyThemeToDOM = (mode: ThemeMode) => {
    const css = document.createElement("style");
    css.type = "text/css";
    css.appendChild(
      document.createTextNode(
        `* {
          -webkit-transition: none !important;
          -moz-transition: none !important;
          -o-transition: none !important;
          -ms-transition: none !important;
          transition: none !important;
        }`
      )
    );
    document.head.appendChild(css);

    document.documentElement.setAttribute("data-theme", mode);

    // ลบสไตล์ปิด transition ออกหลังจากที่ DOM คำนวณสีเสร็จในเฟรมถัดไป
    window.getComputedStyle(css).opacity;
    setTimeout(() => {
      try {
        document.head.removeChild(css);
      } catch {
        // ignore
      }
    }, 50);
  };

  const setTheme = (mode: ThemeMode) => {
    setThemeState(mode);
    sessionStorage.setItem("app_theme", mode);
    applyThemeToDOM(mode);
  };

  const toggleTheme = () => {
    const nextMode = theme === "light" ? "dark" : "light";
    setTheme(nextMode);
  };

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    sessionStorage.setItem("app_lang", lang);
  };

  const toggleLanguage = () => {
    setLanguage(language === "th" ? "en" : "th");
  };

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, []);

  // ฟังก์ชันช่วยแปลคำศัพท์แบบ dot-notation: t('admin.overview')
  const t = (path: string): string => {
    const keys = path.split(".");
    let current = translations[language];

    for (const key of keys) {
      if (current && typeof current === "object" && key in current) {
        current = current[key];
      } else {
        let fallback = translations.en;
        for (const fKey of keys) {
          if (fallback && typeof fallback === "object" && fKey in fallback) {
            fallback = fallback[fKey];
          } else {
            return path;
          }
        }
        return typeof fallback === "string" ? fallback : path;
      }
    }

    return typeof current === "string" ? current : path;
  };

  const antdLocale = language === "th" ? thTH : enUS;

  return (
    <AppContext.Provider
      value={{
        theme,
        setTheme,
        toggleTheme,
        language,
        setLanguage,
        toggleLanguage,
        t
      }}
    >
      <ConfigProvider
        locale={antdLocale}
        theme={{
          algorithm: theme === "dark" ? antTheme.darkAlgorithm : antTheme.defaultAlgorithm,
          token: {
            fontFamily: '"Kanit", "Sarabun", sans-serif',
            colorPrimary: "#1677ff",
            borderRadius: 8
          }
        }}
      >
        {children}
      </ConfigProvider>
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};
