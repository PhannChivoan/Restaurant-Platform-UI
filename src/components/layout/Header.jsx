import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Button,
  Input,
  Badge,
  Avatar,
  Dropdown,
  Space,
  Tooltip,
  Typography,
  Divider,
  List,
} from "antd";
import {
  Bell,
  ChevronDown,
  CreditCard,
  LogOut,
  Search,
  Settings,
  User,
  Menu as MenuIcon,
} from "lucide-react";
import BranchSwitcher from "./BranchSwitcher";
import { palette, fontMono } from "../../constants/theme";
import { findNavItem, NAV_ITEMS } from "../../constants/navigation";
import { request } from "../../utils/request";
import { loadAdminBootstrap } from "../../utils/adminBootstrap";
import { Config } from "../../utils/config";
import { getProfile, setProfile, removeAccessToken } from "../../store/access_token";

const { Text } = Typography;

const API_ORIGIN = Config.BASE_URL.replace(/\/api\/v1\/?$/, "");

const toMediaUrl = (url) => {
  if (!url) return url;
  if (/^(https?:\/\/|blob:|data:)/.test(url)) return url;
  return `${API_ORIGIN}${url.startsWith("/") ? "" : "/"}${url}`;
};

const XButton = ({ onClick }) => (
  <button
    type="button"
    onClick={onClick}
    style={{
      border: "none",
      background: "transparent",
      padding: 0,
      display: "flex",
      alignItems: "center",
      cursor: "pointer",
    }}
  >
    <span style={{ fontSize: 15, color: "#A1A1AA" }}>×</span>
  </button>
);

const getInitials = (name) =>
  name
    ?.split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?";

const roleDisplay = (role) => {
  if (!role) return "User";
  return role.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
};

const Header = ({
  activeKey,
  query,
  setQuery,
  notifOpen,
  setNotifOpen,
  onMobileMenuClick,
}) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [notif, setNotif] = useState({ unread: 0, data: [] }); // live feed from the server (role-aware)
  const [now, setNow] = useState(() => Date.now()); // keeps "5m ago" labels current

  useEffect(() => {
    let alive = true;
    const apply = (res) => {
      if (!alive) return;
      setNow(Date.now());
      if (Array.isArray(res?.data)) setNotif(res);
    };
    const load = () => request("admin/notifications", "GET").then(apply);
    // first paint: the shared bootstrap answer (also carries the profile and the menu); then poll every 30 s
    loadAdminBootstrap().then((b) => apply(b?.notifications));
    const poll = setInterval(load, 30000);
    return () => {
      alive = false;
      clearInterval(poll);
    };
  }, []);

  const ago = (iso) => {
    const s = Math.max(0, (now - new Date(iso).getTime()) / 1000);
    if (s < 60) return "just now";
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    return `${Math.floor(s / 86400)}d ago`;
  };

  const handleNotifOpen = (open) => {
    setNotifOpen(open);
    if (open && notif.unread > 0) {
      request("admin/notifications/read", "POST", {}, { keepCache: true });
      setNotif((n) => ({ ...n, unread: 0 }));
    }
  };

  useEffect(() => {
    const cached = getProfile();
    if (cached) setUser(cached);

    loadAdminBootstrap()
      .then((b) => {
        const res = b?.user;
        if (res?.id) {
          setUser(res);
          setProfile(res);
        }
      })
      .catch(() => {});
  }, []);


  const userMenuItems = [
    {
      key: "profile",
      icon: <User size={16} strokeWidth={1.75} />,
      label: "Profile",
    },
    {
      key: "billing",
      icon: <CreditCard size={16} strokeWidth={1.75} />,
      label: "Billing",
    },
    {
      key: "settings",
      icon: <Settings size={16} strokeWidth={1.75} />,
      label: "Settings",
    },
    { type: "divider" },
    {
      key: "logout",
      danger: true,
      icon: <LogOut size={16} strokeWidth={1.75} />,
      label: "Log out",
    },
  ];

  const handleUserMenu = ({ key }) => {
    if (key === "profile") navigate("/profile");
    if (key === "billing") navigate("/billing");
    if (key === "settings") navigate("/settings");
    if (key === "logout") {
      removeAccessToken();
      localStorage.removeItem("profile");
      navigate("/login");
    }
  };

  const searchEnabled = [
    "orders",
    "pending-orders",
    "completed-orders",
    "all-customers",
  ].includes(activeKey);

  const getPageTitle = () => {
    const item = findNavItem(NAV_ITEMS, activeKey);
    return item?.label || "Overview";
  };

  const userName = user?.name || "User";
  const userRole = roleDisplay(user?.role);
  const userAvatar = user?.avatar_url || user?.avatar;

  return (
    <div
      style={{
        height: 64,
        padding: "0 24px",
        background: "rgba(255, 255, 255, 0.86)",
        backdropFilter: "saturate(180%) blur(12px)",
        WebkitBackdropFilter: "saturate(180%) blur(12px)",
        borderBottom: `1px solid ${palette.border}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}
    >
      <Space size={12}>
        <Button
          type="text"
          icon={<MenuIcon size={18} strokeWidth={1.75} />}
          onClick={onMobileMenuClick}
          className="mobile-menu-button"
          style={{ display: "none" }}
        />
        <div
          className="header-title"
          style={{ fontSize: 17, fontWeight: 650, letterSpacing: "-0.02em", color: palette.ink }}
        >
          {getPageTitle()}
        </div>
      </Space>

      <Space className="header-actions" size={8}>
        <BranchSwitcher />
        <Input
          prefix={<Search size={15} strokeWidth={1.75} color={palette.faint} />}
          suffix={query ? <XButton onClick={() => setQuery("")} /> : null}
          placeholder={
            searchEnabled ? `Search ${getPageTitle().toLowerCase()}` : "Search"
          }
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={!searchEnabled}
          style={{
            width: 240,
            background: palette.bgSubtle,
            border: "1px solid transparent",
            fontSize: 13,
            borderRadius: 10,
          }}
          className="header-search"
        />

        <Dropdown
          open={notifOpen}
          onOpenChange={handleNotifOpen}
          trigger={["click"]}
          popupRender={() => (
            <div
              style={{
                width: 340,
                background: palette.bgHeader,
                borderRadius: 10,
                boxShadow:
                  "0 4px 12px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
                border: `1px solid ${palette.border}`,
                overflow: "hidden",
              }}
            >
              <div style={{ padding: "14px 16px" }}>
                <Text
                  style={{ fontSize: 17, fontWeight: 650, letterSpacing: "-0.02em", color: palette.ink }}
                >
                  Notifications
                </Text>
                <div
                  style={{ marginTop: 2, fontSize: 12, color: palette.muted }}
                >
                  {notif.unread > 0 ? `${notif.unread} new` : "You are all caught up"}
                </div>
              </div>
              <Divider style={{ margin: 0, borderColor: palette.border }} />
              <List
                dataSource={notif.data}
                locale={{ emptyText: "No notifications yet" }}
                style={{ maxHeight: 360, overflowY: "auto" }}
                renderItem={(item) => (
                  <List.Item
                    onClick={() => {
                      setNotifOpen(false);
                      if (item.path) navigate(item.path);
                    }}
                    style={{
                      padding: "12px 16px",
                      borderBottom: `1px solid ${palette.border}`,
                      cursor: "pointer",
                      background: item.unread ? "#FFF7ED" : undefined,
                    }}
                  >
                    <List.Item.Meta
                      avatar={
                        <div
                          style={{
                            width: 30,
                            height: 30,
                            borderRadius: 7,
                            border: `1px solid ${palette.border}`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Bell
                            size={14}
                            strokeWidth={1.75}
                            color={palette.muted}
                          />
                        </div>
                      }
                      title={
                        <span
                          style={{
                            fontSize: 13,
                            fontWeight: 500,
                            color: palette.ink,
                          }}
                        >
                          {item.title}
                        </span>
                      }
                      description={
                        <div>
                          <div style={{ fontSize: 12, color: palette.muted }}>{item.body}</div>
                          <div style={{ fontSize: 11, marginTop: 3, color: palette.faint, fontFamily: fontMono }}>{ago(item.at)}</div>
                        </div>
                      }                    />
                  </List.Item>
                )}
              />
              <Button
                type="text"
                block
                onClick={() => setNotifOpen(false)}
                style={{
                  height: 40,
                  color: palette.ink,
                  fontSize: 13,
                  fontWeight: 500,
                }}
              >
                Close
              </Button>
            </div>
          )}
        >
          <Tooltip title="Notifications">
            <Badge count={notif.unread} size="small" offset={[-2, 2]} color={palette.ink}>
              <Button
                type="text"
                shape="circle"
                icon={<Bell size={17} strokeWidth={1.75} />}
                style={{ width: 36, height: 36 }}
              />
            </Badge>
          </Tooltip>
        </Dropdown>

        <Dropdown
          menu={{ items: userMenuItems, onClick: handleUserMenu }}
          trigger={["click"]}
        >
          <Button type="text" style={{ height: 46, padding: "4px 10px", borderRadius: 12 }}>
            <Space size={8}>
              {userAvatar ? (
                <Avatar
                  size={30}
                  src={toMediaUrl(userAvatar)}
                  style={{ flexShrink: 0 }}
                />
              ) : (
                <Avatar
                  size={30}
                  style={{
                    background: palette.primary,
                    color: palette.inkInverse,
                    fontFamily: fontMono,
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  {getInitials(userName)}
                </Avatar>
              )}
              <div className="user-info" style={{ textAlign: "left" }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    lineHeight: 1.2,
                    color: palette.ink,
                  }}
                >
                  {userName}
                </div>
                <div
                  style={{ fontSize: 11, color: palette.faint, marginTop: 1 }}
                >
                  {userRole}
                </div>
              </div>
              <ChevronDown size={14} strokeWidth={1.75} color={palette.faint} />
            </Space>
          </Button>
        </Dropdown>
      </Space>

      <style>
        {`
          .mobile-menu-button { display: none !important; }
          @media (max-width: 992px) {
            .mobile-menu-button { display: inline-flex !important; }
          }
          @media (max-width: 768px) {
            .header-search, .header-branch-load { display: none !important; }
            .header-branch { width: 150px !important; }
          }
          @media (max-width: 420px) {
            .header-title { max-width: 130px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
            .header-actions { gap: 2px !important; }
          }
          @media (max-width: 576px) {
            .user-info { display: none !important; }
            .header-actions .ant-btn { padding-left: 4px; padding-right: 4px; }
          }
        `}
      </style>
    </div>
  );
};

export default Header;
