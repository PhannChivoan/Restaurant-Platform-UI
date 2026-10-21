import { startTransition, useState, useEffect } from "react";
import { Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Layout, ConfigProvider } from "antd";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { palette, antdTheme, fontSans } from "../../constants/theme";
import {
  getActiveKeyFromPath,
  getOpenKeysForActive,
  findNavItem,
  NAV_ITEMS,
} from "../../constants/navigation";
import { getAccessToken } from "../../store/access_token";
import { useBranchId } from "../../utils/branchStore";
import useAccessWindow from "../../hooks/useAccessWindow";
import AccessWindowBlock from "../ui/AccessWindowBlock";
import PermissionEnforcer from "./PermissionEnforcer";
import { setPermissionState } from "../../utils/permissionsStore";
import { ShieldOff } from "lucide-react";
import { loadAdminBootstrap, resetAdminBootstrap } from "../../utils/adminBootstrap";

const { Content } = Layout;

// keys of every module the signed-in role may open (parents are skipped: they have no page)
const collectAllowed = (items) => {
  const keys = new Set();
  const paths = [];
  (items || []).forEach((item) => {
    if (item.path) {
      keys.add(item.key);
      paths.push(item.path);
    }
    (item.children || []).forEach((child) => {
      if (child.path) {
        keys.add(child.key);
        paths.push(child.path);
      }
    });
  });
  return { keys, paths };
};

const NoModuleAccess = ({ home }) => (
  <div style={{ textAlign: "center", padding: "80px 16px" }}>
    <h2 style={{ fontSize: 22, marginBottom: 8 }}>403 - No access</h2>
    <p style={{ color: palette.faint, marginBottom: 16 }}>
      Your role does not have access to this module.
    </p>
    <a href={`/admin${home}`}>Go to an available page</a>
  </div>
);

const NoViewAccess = () => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "80px 16px" }}>
    <ShieldOff size={48} strokeWidth={1.5} color={palette.faint} />
    <h2 style={{ fontSize: 20, margin: "16px 0 6px" }}>You do not have authority to view this page</h2>
    <p style={{ color: palette.faint, margin: 0 }}>
      Your role can see this module, but its View permission is turned off. Ask an administrator to enable it.
    </p>
  </div>
);

const RootLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(
    () => window.matchMedia("(max-width: 991px)").matches,
  );
  const [query, setQuery] = useState("");
  const [notifOpen, setNotifOpen] = useState(false);
  const branchId = useBranchId();
  const { status: accessWindow, isBlocked, refresh: recheckAccess } = useAccessWindow();

  const activeKey = getActiveKeyFromPath(location.pathname);
  const [perms, setPerms] = useState(null); // "<page>.<action>" permissions of the role
  const [allowed, setAllowed] = useState(null); // null until the role's menu is known

  useEffect(() => {
    if (!getAccessToken()) return undefined;
    let alive = true;
    // re-read the role's modules on every page change, so a module switched off in
    // Permission Policies is refused at once instead of after the cache expires
    resetAdminBootstrap();
    loadAdminBootstrap()
      .then((json) => {
        if (alive && Array.isArray(json?.navigation)) {
          setAllowed(collectAllowed(json.navigation));
          if (Array.isArray(json.permissions)) setPerms(json.permissions);
        }
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [branchId, location.pathname]);

  // share the permissions with <Can> / usePermissions anywhere in the admin
  useEffect(() => {
    setPermissionState(perms, activeKey);
  }, [perms, activeKey]);

  const [openKeys, setOpenKeys] = useState(getOpenKeysForActive(activeKey));

  useEffect(() => {
    startTransition(() => {
      setOpenKeys(getOpenKeysForActive(activeKey));
    });
  }, [activeKey]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 991px)");
    const handleViewportChange = (event) => setIsMobile(event.matches);

    mediaQuery.addEventListener("change", handleViewportChange);
    return () => mediaQuery.removeEventListener("change", handleViewportChange);
  }, []);

  const handleNavigate = (key) => {
    const item = findNavItem(NAV_ITEMS, key);
    if (item?.path) {
      navigate(item.path);
      setQuery("");
    }
  };

  const accessToken = getAccessToken();

  if (!accessToken) {
    return <Navigate to="/login" replace />;
  }

  return (
    <ConfigProvider theme={antdTheme}>
      <Layout
        className="admin-shell"
        style={{
          minHeight: "100vh",
          background: palette.bgSubtle,
          fontFamily: fontSans,
        }}
      >
        <Sidebar
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          activeKey={activeKey}
          openKeys={openKeys}
          setOpenKeys={setOpenKeys}
          onNavigate={handleNavigate}
          mobileOpen={mobileOpen}
          setMobileOpen={setMobileOpen}
          onBreakpoint={(broken) => {
            setIsMobile(broken);
            if (broken) setMobileOpen(false);
          }}
          isMobile={isMobile}
        />

        <Layout
          style={{
            marginLeft: isMobile ? 0 : collapsed ? 64 : 244,
            transition: "margin-left 0.2s ease",
            minHeight: "100vh",
            background: palette.bgSubtle,
            minWidth: 0,
          }}
        >
          <Header
            activeKey={activeKey}
            query={query}
            setQuery={setQuery}
            notifOpen={notifOpen}
            setNotifOpen={setNotifOpen}
            onMobileMenuClick={() => setMobileOpen(true)}
          />

          <Content
            style={{
              padding: isMobile ? "16px" : "28px 32px",
              background: palette.bgSubtle,
              minHeight: "calc(100vh - 64px)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              className="admin-page"
              style={{
                flex: 1,
              }}
            >
              <PermissionEnforcer perms={perms} pageKey={activeKey} />
              {/* the API refuses operational calls outside the role's window */}
              {allowed === null ? null : activeKey !== "overview" && !allowed.keys.has(activeKey) ? (
                <NoModuleAccess home={allowed.paths[0] || "/login"} />
              ) : perms && !perms.includes("*") && activeKey !== "overview" && !perms.includes(`${activeKey}.view`) ? (
                <NoViewAccess />
              ) : isBlocked ? (
                <AccessWindowBlock status={accessWindow} onRetry={recheckAccess} />
              ) : (
                <Outlet key={branchId || "all"} />
              )}
            </div>
          </Content>
        </Layout>
      </Layout>
    </ConfigProvider>
  );
};

export default RootLayout;
