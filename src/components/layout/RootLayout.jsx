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

const { Content } = Layout;

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

  const activeKey = getActiveKeyFromPath(location.pathname);
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
              padding: isMobile ? "16px" : "24px",
              background: palette.bgSubtle,
              minHeight: "calc(100vh - 60px)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                flex: 1,
              }}
            >
              <Outlet key={branchId || "all"} />
            </div>
          </Content>
        </Layout>
      </Layout>
    </ConfigProvider>
  );
};

export default RootLayout;
