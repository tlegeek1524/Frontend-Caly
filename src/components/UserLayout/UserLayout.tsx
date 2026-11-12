import { Outlet } from "react-router-dom";
import { SideMascot } from "../SideMascot";
import "./UserLayout.css";

type UserLayoutProps = {
  children?: React.ReactNode;
};

export const UserLayout = ({ children }: UserLayoutProps) => {
  return (
    <div className="user-layout">
      {children ?? <Outlet />}
      <SideMascot position="bottom-right" />
    </div>
  );
};
