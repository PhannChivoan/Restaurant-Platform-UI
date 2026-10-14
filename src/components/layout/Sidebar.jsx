import { useMemo, useEffect, useState, createElement } from "react";
import { Layout, Menu, Drawer, Button, Typography, Tooltip, Spin } from "antd";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { NAV_ICONS, FALLBACK_ICON } from "../../constants/navIcons";
import { palette } from "../../constants/theme";
import { useNavigate } from "react-router-dom";
import { loadAdminBootstrap } from "../../utils/adminBootstrap";
import { getAccessToken } from "../../store/access_token";
const logo = "/assets/logo/logo.png";
const { Sider } = Layout;
const { Text } = Typography;

const NAV_CACHE_KEY = "admin_nav_cache_v1";

const readCachedNav = () => {
  try {
    const v = JSON.parse(sessionStorage.getItem(NAV_CACHE_KEY));
    return v?.t === getAccessToken() && Array.isArray(v.items) ? v.items : [];
  } catch {
    return [];
  }
};

const renderIcon = (name, size) => {
  const Icon = name ? (NAV_ICONS[name] ?? FALLBACK_ICON) : null;
  return Icon ? createElement(Icon, { size, strokeWidth: 1.75 }) : null;
};

const sortByOrder = (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0);

const Sidebar = ({
  collapsed,
  setCollapsed,
  activeKey,
  openKeys,
  setOpenKeys,
  onNavigate,
  mobileOpen,
  setMobileOpen,
  onBreakpoint,
  isMobile,
}) => {
  const sidebarCollapsed = isMobile ? false : collapsed;
  const navigate = useNavigate();
  const [navItems, setNavItems] = useState(readCachedNav);
  const [loading, setLoading] = useState(() => readCachedNav().length === 0); // spinner only when nothing is cached

useEffect(() => {
  let alive = true;
  // the menu rarely changes: kept in the request cache (5 min) and in sessionStorage so a reload shows it instantly
  loadAdminBootstrap()
    .then((json) => {
      if (!alive) return;
      if (Array.isArray(json?.navigation)) {
        setNavItems(json.navigation);
        try {
          sessionStorage.setItem(NAV_CACHE_KEY, JSON.stringify({ t: getAccessToken(), items: json.navigation }));
        } catch {
          /* storage unavailable */
        }
      }
    })
    .catch(() => {})
    .finally(() => alive && setLoading(false));
  return () => {
    alive = false;
  };
}, []);
  const pathByKey = useMemo(() => {
    const map = {};
    navItems.forEach((item) => {
      if (item.path) map[item.key] = item.path;
      item.children?.forEach((child) => {
        if (child.path) map[child.key] = child.path;
      });
    });
    return map;
  }, [navItems]);

  const menuItems = useMemo(() => {
    const wrapLabel = (label) =>
      sidebarCollapsed ? (
        <Tooltip placement="right" title={label}>
          <span>{label}</span>
        </Tooltip>
      ) : (
        label
      );

    return navItems
      .filter((item) => item.is_active)
      .sort(sortByOrder)
      .map((item) => {
        const children = (item.children || [])
          .filter((child) => child.is_active)
          .sort(sortByOrder)
          .map((child) => ({
            key: child.key,
            icon: renderIcon(child.icon, 15),
            label: wrapLabel(child.label),
          }));

        const entry = {
          key: item.key,
          icon: renderIcon(item.icon, 16),
          label: wrapLabel(item.label),
        };

        if (item.is_dropdown && children.length > 0) {
          entry.children = children;
        }

        return entry;
      });
  }, [navItems, sidebarCollapsed]);

  const sidebarContent = (
    <>
      <button
        style={{
          height: 35,
          marginTop: 20,
          display: "flex",
          alignItems: "center",
          padding: sidebarCollapsed ? "0 16px" : "0 24px",
          gap: 5,
          flexShrink: 0,
        }}
        onClick={() => navigate("/")}
      >
        <div
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            cursor: "pointer",
          }}
        >
          <img src={logo} alt="logo" style={{ objectFit: "contain" }} />
        </div>
      </button>

      <div
        style={{
          padding: sidebarCollapsed ? "18px 8px" : "20px 14px",
          flex: 1,
          overflowY: "auto",
        }}
      >
        {!sidebarCollapsed && (
          <Text
            style={{
              fontSize: 11,
              fontWeight: 600,
              paddingLeft: 12,
              display: "block",
              marginBottom: 10,
              color: "#64748b",
              textTransform: "uppercase",
              letterSpacing: 1,
            }}
          >
            Workspace
          </Text>
        )}
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: 24 }}>
            <Spin size="small" />
          </div>
        ) : (
          <Menu
            mode="inline"
            selectedKeys={[activeKey]}
            openKeys={openKeys}
            items={menuItems}
            onClick={({ key }) => {
              onNavigate(key, pathByKey[key]);
              setMobileOpen(false);
            }}
            onOpenChange={(keys) => setOpenKeys(keys)}
            className="mono-menu"
            style={{ border: "none", background: "transparent" }}
          />
        )}
      </div>

      <div
        style={{
          padding: 12,
          borderTop: "1px solid rgba(255, 255, 255, 0.12)",
          flexShrink: 0,
        }}
      >
        <Button
          type="text"
          block
          icon={
            sidebarCollapsed ? (
              <PanelLeftOpen size={16} strokeWidth={1.75} />
            ) : (
              <PanelLeftClose size={16} strokeWidth={1.75} />
            )
          }
          onClick={() => setCollapsed(!collapsed)}
          style={{
            height: 36,
            color: palette.inkInverse,
            fontSize: 13,
            borderRadius: 6,
            transition: "background 0.15s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
          }}
        >
          {!sidebarCollapsed && "Collapse sidebar"}
        </Button>
      </div>
    </>
  );

  return (
    <>
      <Sider
        className="desktop-sidebar"
        width={244}
        collapsedWidth={64}
        collapsed={sidebarCollapsed}
        breakpoint="lg"
        trigger={null}
        onBreakpoint={onBreakpoint}
        style={{
          position: "fixed",
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 100,
          background: palette.sidebarBg,
          boxShadow: "1px 0 0 rgba(255,255,255,0.04)",
          borderRight: "none",
        }}
      >
        <div
          style={{ height: "100%", display: "flex", flexDirection: "column" }}
        >
          {sidebarContent}
        </div>
      </Sider>

      <Drawer
        placement="left"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        size={264}
        closeIcon={<span style={{ color: palette.inkInverse }}>×</span>}
        styles={{
          body: { padding: 0, background: palette.sidebarBg },
          header: { display: "none" },
        }}
      >
        <div
          style={{ height: "100%", display: "flex", flexDirection: "column" }}
        >
          {sidebarContent}
        </div>
      </Drawer>

      <style>
        {`
          .mono-menu .ant-menu-item,
          .mono-menu .ant-menu-submenu-title {
            border-radius: 10px !important;
            margin: 2px 0 !important;
            height: 40px !important;
            line-height: 40px !important;
            width: 100% !important;
            box-sizing: border-box !important;
            transition: background 0.18s ease, color 0.18s ease !important;
          }
          .mono-menu .ant-menu-item,
          .mono-menu .ant-menu-submenu-title,
          .mono-menu .ant-menu-item .ant-menu-title-content,
          .mono-menu .ant-menu-submenu-title .ant-menu-title-content {
            color: #cbd5e1 !important;
            font-weight: 450;
          }
          .mono-menu .ant-menu-item .anticon,
          .mono-menu .ant-menu-submenu-title .anticon,
          .mono-menu .ant-menu-submenu-arrow {
            color: #7c8aa0 !important;
          }
          .mono-menu .ant-menu-item .ant-menu-title-content,
          .mono-menu .ant-menu-submenu-title .ant-menu-title-content {
            min-width: 0;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
          .mono-menu .ant-menu-item:hover,
          .mono-menu .ant-menu-submenu-title:hover {
            background: rgba(255, 255, 255, 0.07) !important;
          }
          .mono-menu .ant-menu-item:hover .ant-menu-title-content,
          .mono-menu .ant-menu-submenu-title:hover .ant-menu-title-content {
            color: #ffffff !important;
          }
          /* open group: its children sit on a thin rail */
          .mono-menu .ant-menu-sub.ant-menu-inline {
            background: transparent !important;
            margin: 2px 0 6px 18px;
            padding-left: 6px;
            border-left: 1px solid rgba(255, 255, 255, 0.09);
          }
          .mono-menu .ant-menu-sub .ant-menu-item {
            height: 36px !important;
            line-height: 36px !important;
            padding-left: 14px !important;
            font-size: 13px;
          }
          /* current page: warm tint, orange text, no hard block */
          .mono-menu .ant-menu-item-selected {
            background: rgba(249, 115, 22, 0.16) !important;
            font-weight: 600;
            box-shadow: inset 3px 0 0 ${palette.primary};
          }
          .mono-menu .ant-menu-item-selected .ant-menu-title-content,
          .mono-menu .ant-menu-item-selected .anticon {
            color: #fdba74 !important;
          }
          .mono-menu .ant-menu-item::after {
            display: none !important;
          }
          .mono-menu .ant-menu-submenu-selected > .ant-menu-submenu-title .ant-menu-title-content {
            color: #ffffff !important;
          }
          .ant-menu-inline-collapsed .ant-menu-item {
            padding: 0 !important;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .ant-menu-inline-collapsed .ant-menu-item-selected {
            box-shadow: none;
          }          @media (max-width: 991px) {
            .desktop-sidebar {
              display: none !important;
            }
          }
        `}
      </style>
    </>
  );
};

export default Sidebar;