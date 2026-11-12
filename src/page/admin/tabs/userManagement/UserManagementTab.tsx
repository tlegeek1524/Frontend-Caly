import { useState, useEffect } from "react";
import { Form, message } from "antd";
import type { AdminUser, BanUserPayload, RoleDropdownItem, UserRole } from "../../../../types/admin";
import {
  fetchAllUsersService,
  fetchRoleDropdownService,
  updateRoleService,
  banUserService
} from "../../../../services/adminService";
import { AdminBanUserModal } from "../../components/AdminModals";
import { UserManagementTabUI } from "./UserManagementTabUI";

export const UserManagementTab = () => {
  const [allUsers, setAllUsers] = useState<AdminUser[]>([]);
  const [roleDropdownOptions, setRoleDropdownOptions] = useState<RoleDropdownItem[]>([]);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [tempRoles, setTempRoles] = useState<Record<string, UserRole>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [banForm] = Form.useForm<BanUserPayload>();

  const loadUsersList = async () => {
    setIsLoading(true);
    try {
      const [users, roles] = await Promise.all([
        fetchAllUsersService(),
        fetchRoleDropdownService()
      ]);
      setAllUsers(users);
      setRoleDropdownOptions(roles);

      const initialTempRoles: Record<string, UserRole> = {};
      users.forEach((usr) => {
        const userRole = (
          usr.is_status ||
          (Array.isArray(usr.roles) ? usr.roles[0] : usr.roles) ||
          "USER"
        ).toUpperCase();
        initialTempRoles[usr.accountno] = userRole;
      });
      setTempRoles(initialTempRoles);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsersList();
  }, []);

  const handleChangeRole = (accountno: string, newRole: UserRole) => {
    setTempRoles((prev) => ({
      ...prev,
      [accountno]: newRole
    }));
  };

  const handleSaveRoles = async () => {
    setIsProcessing(true);
    const changedUsers: { accountno: string; line_uid?: string; roles: UserRole[]; is_status: string }[] = [];
    allUsers.forEach((usr) => {
      const originalRole = (
        usr.is_status ||
        (Array.isArray(usr.roles) ? usr.roles[0] : usr.roles) ||
        "USER"
      ).toUpperCase();
      const currentRole = (tempRoles[usr.accountno] || originalRole).toUpperCase();
      if (originalRole !== currentRole) {
        changedUsers.push({
          accountno: usr.accountno,
          line_uid: usr.line_uid || usr.accountno,
          roles: [currentRole],
          is_status: currentRole
        });
      }
    });

    if (changedUsers.length === 0) {
      message.info("ไม่มีการเปลี่ยนแปลงสิทธิ์");
      setIsProcessing(false);
      return;
    }

    let successCount = 0;
    for (const item of changedUsers) {
      const ok = await updateRoleService(item);
      if (ok) successCount++;
    }

    if (successCount > 0) {
      message.success(`บันทึกสิทธิ์ผู้ใช้สำเร็จ ${successCount} รายการ`);
      loadUsersList();
    } else {
      message.error("บันทึกสิทธิ์ผู้ใช้งานล้มเหลว");
    }
    setIsProcessing(false);
  };

  const handleBanUserSubmit = async (values: BanUserPayload) => {
    setIsProcessing(true);
    const result = await banUserService(values);
    if (result.success) {
      message.success(result.message);
      setBanDialogOpen(false);
      banForm.resetFields();
      setAllUsers((prev) =>
        prev.map((u) => (u.accountno === values.accountno ? { ...u, is_banned: true } : u))
      );
    } else {
      message.error(result.message);
    }
    setIsProcessing(false);
  };

  const handleToggleLockUser = (accountno: string, currentlyBanned: boolean) => {
    if (currentlyBanned) {
      setAllUsers((prev) =>
        prev.map((u) => (u.accountno === accountno ? { ...u, is_banned: false } : u))
      );
      message.success("ปลดล็อคผู้ใช้งานเรียบร้อยแล้ว");
    } else {
      banForm.setFieldsValue({ accountno });
      setBanDialogOpen(true);
    }
  };

  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
    const filename = `caly_export_users_${new Date().toISOString().slice(0, 10)}.csv`;

    csvContent += "LINE UID,Account No,Name,Gender,Age,Weight(kg),Height(cm),Activity,Goal,TDEE(cal),Status,Created At\n";
    allUsers.forEach((u) => {
      csvContent += `"${u.line_uid || u.accountno || ""}","${u.accountno || ""}","${u.display_name || u.full_name || u.username || "-"}","${u.gender || "-"}","${u.age ?? "-"}","${u.weight ?? "-"}","${u.height ?? "-"}","${u.activity_level || "-"}","${u.goal || "-"}","${u.cal ?? "-"}","${u.is_status || (Array.isArray(u.roles) ? u.roles.join(";") : u.roles) || "USER"}","${u.created_at || "-"}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    message.success(`ส่งออกไฟล์ ${filename} เรียบร้อยแล้ว`);
  };

  const filteredUsers = allUsers.filter((usr) => {
    if (!userSearchQuery) return true;
    const query = userSearchQuery.toLowerCase();
    const fullName = (usr.full_name || usr.display_name || "").toLowerCase();
    const username = (usr.username || "").toLowerCase();
    const email = (usr.email || "").toLowerCase();
    const accountno = (usr.accountno || "").toLowerCase();
    const lineUid = (usr.line_uid || "").toLowerCase();
    const status = (usr.is_status || "").toLowerCase();
    const goal = (usr.goal || "").toLowerCase();
    return (
      fullName.includes(query) ||
      username.includes(query) ||
      email.includes(query) ||
      accountno.includes(query) ||
      lineUid.includes(query) ||
      status.includes(query) ||
      goal.includes(query)
    );
  });

  return (
    <>
      <UserManagementTabUI
        users={filteredUsers}
        roleOptions={roleDropdownOptions}
        isLoading={isLoading}
        isSaving={isProcessing}
        searchQuery={userSearchQuery}
        onSearchChange={setUserSearchQuery}
        tempRoles={tempRoles}
        onChangeRole={handleChangeRole}
        onSaveRoles={handleSaveRoles}
        onOpenBanDialog={(accountno) => {
          banForm.setFieldsValue({ accountno });
          setBanDialogOpen(true);
        }}
        onToggleLockUser={handleToggleLockUser}
        onExportCSV={handleExportCSV}
      />

      <AdminBanUserModal
        open={banDialogOpen}
        form={banForm}
        isProcessing={isProcessing}
        onCancel={() => {
          setBanDialogOpen(false);
          banForm.resetFields();
        }}
        onSubmit={handleBanUserSubmit}
      />
    </>
  );
};
