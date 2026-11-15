import React from 'react';
import UserHeader from '../../../../components/UserHeader/UserHeader';
import { APP_CONFIG } from '../../../../config/appConfig';

const NavbarRegis = () => {
  return (
    <UserHeader title={APP_CONFIG.name} subtitle="ข้อมูลสุขภาพและพลังงานของคุณ" />
  );
};

export default NavbarRegis;
