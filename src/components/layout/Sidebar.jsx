import { useMemo, useEffect, useState, createElement } from "react";
import { Layout, Menu, Drawer, Button, Typography, Tooltip, Spin } from "antd";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { NAV_ICONS, FALLBACK_ICON } from "../../constants/navIcons";
import { palette } from "../../constants/theme";
import { useNavigate } from "react-router-dom";
import { loadAdminBootstrap } from "../../utils/adminBootstrap";
import { getAccessToken } from "../../store/access_token";
import { getProfile } from "../../store/access_token";
import { platformLogo } from "../../utils/platformSettings";
// the uploaded platform logo from /admin/settings wins over the bundled file
const logo = platformLogo() || "/assets/logo/logo.png";
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
    const visit = (items) =>
      (items || []).forEach((item) => {
        if (item.path) map[item.key] = item.path;
        visit(item.children);
      });
    visit(navItems);
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

    // a menu entry and, when it is a group, the entries inside it (groups can sit inside groups)
    const build = (item, depth) => {
      const entry = {
        key: item.key,
        icon: renderIcon(item.icon, depth === 0 ? 16 : 15),
        label: wrapLabel(item.label),
      };
      const children = (item.children || [])
        .filter((child) => child.is_active)
        .sort(sortByOrder)
        .map((child) => build(child, depth + 1));

      if (item.is_dropdown && children.length > 0) entry.children = children;
      return entry;
    };

    return navItems
      .filter((item) => item.is_active)
      .sort(sortByOrder)
      .map((item) => build(item, 0));
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
              color: palette.sidebarMuted,
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

      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: sidebarCollapsed ? "12px 0" : "12px 18px", justifyContent: sidebarCollapsed ? "center" : "flex-start", borderTop: `1px solid ${palette.border}`, flexShrink: 0 }}>
        <div style={{ width: 36, height: 36, borderRadius: "50%", background: palette.primary, color: "#fff", display: "grid", placeItems: "center", fontWeight: 700, flexShrink: 0 }}>{(getProfile()?.name || "A")[0].toUpperCase()}</div>
        {!sidebarCollapsed && (
          <div style={{ minWidth: 0 }}>
            <div style={{ color: palette.ink, fontWeight: 600, fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{getProfile()?.name || "Admin"}</div>
            <div style={{ color: palette.muted, fontSize: 11, textTransform: "capitalize" }}>{(getProfile()?.role || "administrator").replace(/_/g, " ")}</div>
          </div>
        )}
      </div>

      <div
        style={{
          padding: 12,
          borderTop: `1px solid ${palette.border}`,
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
            color: palette.sidebarText,
            fontSize: 13,
            borderRadius: 6,
            transition: "background 0.15s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = palette.sidebarHover;
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
          boxShadow: `1px 0 0 ${palette.border}, 4px 0 24px rgba(15, 23, 42, 0.05)`,
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
        closeIcon={<span style={{ color: palette.ink }}>×</span>}
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
            color: ${palette.sidebarText} !important;
            font-weight: 450;
          }
          .mono-menu .ant-menu-item .anticon,
          .mono-menu .ant-menu-submenu-title .anticon,
          .mono-menu .ant-menu-submenu-arrow {
            color: ${palette.sidebarMuted} !important;
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
            background: ${palette.sidebarHover} !important;
          }
          .mono-menu .ant-menu-item:hover .ant-menu-title-content,
          .mono-menu .ant-menu-submenu-title:hover .ant-menu-title-content {
            color: ${palette.primary} !important;
          }
          /* open group: its children sit on a thin rail */
          .mono-menu .ant-menu-sub.ant-menu-inline {
            background: transparent !important;
            margin: 2px 0 6px 18px;
            padding-left: 6px;
            border-left: 1px solid ${palette.border};
          }
          /* items and group titles inside a group share one size and one left padding; each level of nesting
             steps in through the rail (margin + padding above), so a child always sits further in than its parent */
          .mono-menu .ant-menu-sub .ant-menu-item,
          .mono-menu .ant-menu-sub .ant-menu-submenu-title {
            height: 36px !important;
            line-height: 36px !important;
            padding-left: 14px !important;
            padding-right: 12px !important;
            font-size: 13px;
          }
          .mono-menu .ant-menu-sub .ant-menu-sub.ant-menu-inline {
            margin-left: 14px;
          }
          .mono-menu .ant-menu-sub .ant-menu-sub .ant-menu-item {
            font-size: 12.5px;
          }
          /* current page: blue pill, white text (stays the same on hover) */
          .mono-menu .ant-menu-item.ant-menu-item-selected,
          .mono-menu .ant-menu-item.ant-menu-item-selected:hover,
          .mono-menu .ant-menu-item.ant-menu-item-selected:active {
            background: ${palette.primary} !important;
            font-weight: 600;
            box-shadow: 0 6px 16px ${palette.primary}4D;
          }
          .mono-menu .ant-menu-item.ant-menu-item-selected,
          .mono-menu .ant-menu-item.ant-menu-item-selected svg,
          .mono-menu .ant-menu-item.ant-menu-item-selected .ant-menu-title-content,
          .mono-menu .ant-menu-item.ant-menu-item-selected:hover .ant-menu-title-content {
            color: #ffffff !important;
          }
          .mono-menu .ant-menu-submenu-selected > .ant-menu-submenu-title,
          .mono-menu .ant-menu-submenu-selected > .ant-menu-submenu-title .ant-menu-submenu-arrow,
          .mono-menu .ant-menu-submenu-selected > .ant-menu-submenu-title .ant-menu-title-content {
            color: ${palette.primary} !important;
            font-weight: 600;
          }
          .mono-menu .ant-menu-item::after {
            display: none !important;
          }
          .mono-menu .ant-menu-submenu-selected > .ant-menu-submenu-title .ant-menu-title-content {
            color: ${palette.primary} !important;
            font-weight: 600;
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