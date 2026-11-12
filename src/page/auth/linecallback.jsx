import React, { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import LoadingOverlay from '../../components/Loading/LoadingOverlay';
import { getUserService, verifyAdminService } from '../../services/user.service';
import {
  setStoredUser,
  setStoredToken,
  ALLOWED_ADMIN_ROLES
} from '../../utils/sessionAuth';

const LineCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const hasProcessed = useRef(false);

  useEffect(() => {
    const handleCallback = async () => {
      if (hasProcessed.current) return;
      hasProcessed.current = true;

      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const savedState = sessionStorage.getItem('line_login_state');

      if (savedState && state && state !== savedState) {
        console.warn('State parameter does not match, continuing with fallback');
      }

      if (!code) {
        console.error('No authorization code received');
        navigate('/linelogin', { replace: true });
        return;
      }

      try {
        const channelId = import.meta.env.VITE_LINE_CHANNEL_ID;
        const channelSecret = import.meta.env.VITE_LINE_CHANNEL_SECRET;
        const callbackUrl =
          sessionStorage.getItem('line_login_callback_url') ||
          import.meta.env.VITE_LINE_CALLBACK_URL ||
          `${window.location.origin}/auth/line/callback`;

        // แลก code เป็น access token
        const tokenResponse = await fetch('https://api.line.me/oauth2/v2.1/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: callbackUrl,
            client_id: channelId,
            client_secret: channelSecret,
          }),
        });

        const tokenData = await tokenResponse.json();

        if (!tokenResponse.ok) {
          throw new Error(tokenData.error_description || 'Failed to get access token');
        }

        const profileData = {
          userId: '',
          name: '',
          picture: '',
          email: '',
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token
        };

        if (tokenData.id_token) {
          const payload = tokenData.id_token.split('.')[1];
          const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
          const jsonPayload = decodeURIComponent(
            atob(base64)
              .split('')
              .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
              .join('')
          );
          const decodedPayload = JSON.parse(jsonPayload);
          
          profileData.name = decodedPayload.name || '';
          profileData.picture = decodedPayload.picture || '';
          profileData.email = decodedPayload.email || '';
        }

        // ดึงข้อมูล userId จาก LINE Profile API
        const profileResponse = await fetch('https://api.line.me/v2/profile', {
          headers: {
            Authorization: `Bearer ${tokenData.access_token}`,
          },
        });

        const profile = await profileResponse.json();

        if (!profileResponse.ok) {
          throw new Error('Failed to get profile');
        }

        profileData.userId = profile.userId;

        // 1. ตรวจสอบสิทธิ์ผ่าน verifyAdminService และดึงข้อมูลผู้ใช้จาก /api/v1/user/:line_uid
        let verifyAdminData = null;
        let userData = null;

        const [verifyRes, userRes] = await Promise.allSettled([
          verifyAdminService(profileData.userId),
          getUserService(profileData.userId)
        ]);

        if (verifyRes.status === 'fulfilled' && verifyRes.value?.success && verifyRes.value?.data) {
          verifyAdminData = verifyRes.value.data;
        }

        if (userRes.status === 'fulfilled' && userRes.value?.success && userRes.value?.data) {
          userData = userRes.value.data;
        }

        // 2. ประมวลผลค่า is_status และ roles จาก API อย่างแม่นยำ (ไม่โดน spread ทับ)
        const verifyStatus = (verifyAdminData?.is_status || verifyAdminData?.role || '')
          .toString()
          .trim()
          .toUpperCase();
        const dbStatus = (userData?.is_status || userData?.status || userData?.role || '')
          .toString()
          .trim()
          .toUpperCase();

        const finalStatus = ALLOWED_ADMIN_ROLES.includes(verifyStatus)
          ? verifyStatus
          : dbStatus || verifyStatus || 'USER';

        const dbRoles = Array.isArray(userData?.roles)
          ? userData.roles.map((r) => String(r).toLowerCase())
          : [];

        const finalRoles = Array.from(
          new Set([finalStatus.toLowerCase(), ...dbRoles])
        );

        // 3. สร้างอ็อบเจกต์ user โดยให้ค่าที่คำนวณแล้วอยู่ท้ายสุดเพื่อไม่ให้ถูก userData ทับ
        const user = {
          ...(userData || {}),
          id: profileData.userId,
          line_uid: profileData.userId,
          name: profileData.name || userData?.display_name || userData?.name || userData?.full_name || '',
          display_name: userData?.display_name || profileData.name || '',
          picture: profileData.picture || userData?.picture || '',
          email: profileData.email || userData?.email || '',
          is_status: finalStatus,
          roles: finalRoles,
          id_token: tokenData.id_token,
          access_token: profileData.access_token,
          refresh_token: profileData.refresh_token
        };

        setStoredUser(user);
        setStoredToken(profileData.access_token);
        sessionStorage.removeItem('line_login_state');
        sessionStorage.removeItem('line_login_callback_url');

        // 4. Redirect ไปที่หน้า /dashboard อย่างเดียวเมื่อ Login เสร็จ
        navigate('/dashboard', { replace: true });
      } catch (err) {
        console.error('Login error:', err);
        navigate('/linelogin', { replace: true });
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  return <LoadingOverlay show={true} />;
};

export default LineCallback;
