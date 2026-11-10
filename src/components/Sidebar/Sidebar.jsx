import React, { useState } from "react";
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Paper,
  Divider,
} from "@mui/material";
import {
  Dashboard as DashboardIcon,
  Person as PersonIcon,
  Settings as SettingsIcon,
  ExpandLess,
  ExpandMore,
  LocalHospital as LocalHospitalIcon,
  Assignment as AssignmentIcon,
} from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router-dom";

const Sidebar = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [openHealthcare, setOpenHealthcare] = useState(false);

  const handleClickHealthcare = () => {
    setOpenHealthcare(!openHealthcare);
  };

  const menuItems = [
    { text: "Dashboard", icon: <DashboardIcon />, path: "/dashboard" },
    { text: "Profile", icon: <PersonIcon />, path: "/profile" },
    { text: "Settings", icon: <SettingsIcon />, path: "/settings" },
  ];

  const activeStyle = {
    bgcolor: "rgba(59, 130, 246, 0.1)",
    color: "primary.main",
    "& .MuiListItemIcon-root": {
      color: "primary.main",
    },
    "&:hover": {
      bgcolor: "rgba(59, 130, 246, 0.15)",
    },
  };

  const listItemSx = {
    borderRadius: "0 8px 8px 0",
    mr: 1,
    mb: 0.5,
    "&.Mui-selected": activeStyle,
    "&.Mui-selected:hover": activeStyle,
  };

  return (
    <Box
      sx={{
        position: "fixed",
        top: { xs: 56, sm: 64 },
        left: 0,
        width: 260,
        zIndex: (theme) => theme.zIndex.drawer + 1,
        pointerEvents: isOpen ? "auto" : "none",
      }}
    >
      <Collapse in={isOpen} timeout="auto" unmountOnExit>
        <Paper
          elevation={4}
          sx={{
            bgcolor: "white",
            borderRadius: "0 0 8px 0",
            borderRight: "1px solid #e2e8f0",
            borderBottom: "1px solid #e2e8f0",
            maxHeight: "calc(100vh - 64px)",
            overflowY: "auto",
            py: 1,
          }}
        >
          <List component="nav">
            {menuItems.map((item) => (
              <ListItem key={item.text} disablePadding>
                <ListItemButton
                  selected={location.pathname === item.path}
                  onClick={() => {
                    navigate(item.path);
                    onClose();
                  }}
                  sx={listItemSx}
                >
                  <ListItemIcon
                    sx={{
                      color:
                        location.pathname === item.path
                          ? "primary.main"
                          : "inherit",
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItemButton>
              </ListItem>
            ))}

            <Divider variant="middle" sx={{ my: 1 }} />

            <ListItem disablePadding sx={{ display: "block" }}>
              <ListItemButton
                onClick={handleClickHealthcare}
                sx={listItemSx}
                selected={location.pathname.startsWith("/healthcare")}
              >
                <ListItemIcon
                  sx={{
                    color: location.pathname.startsWith("/healthcare")
                      ? "primary.main"
                      : "inherit",
                  }}
                >
                  <LocalHospitalIcon />
                </ListItemIcon>
                <ListItemText primary="Healthcare" />
                {openHealthcare ? <ExpandLess /> : <ExpandMore />}
              </ListItemButton>

              <Collapse in={openHealthcare} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  <ListItemButton
                    sx={{ ...listItemSx, pl: 4 }}
                    onClick={() => {
                      navigate("/healthcare/patients");
                      onClose();
                    }}
                    selected={location.pathname === "/healthcare/patients"}
                  >
                    <ListItemIcon
                      sx={{
                        color:
                          location.pathname === "/healthcare/patients"
                            ? "primary.main"
                            : "inherit",
                        minWidth: 40,
                      }}
                    >
                      <AssignmentIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary="Patients" />
                  </ListItemButton>
                </List>
              </Collapse>
            </ListItem>
          </List>
        </Paper>
      </Collapse>
    </Box>
  );
};

export default Sidebar;
