import { theme as antdAlgorithms } from "antd";

// Three admin looks. The choice is kept in the browser and applied on load (see setThemeMode).
export const THEME_MODES = ["light", "dark", "orange"];
const THEME_KEY = "admin_theme";

const readMode = () => {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    return THEME_MODES.includes(saved) ? saved : "light";
  } catch {
    return "light";
  }
};

export const themeMode = readMode();
export const isDark = themeMode === "dark";

// Switching reloads the page: colours are read once at start-up, so every page picks up the new palette.
export const setThemeMode = (mode) => {
  if (!THEME_MODES.includes(mode) || mode === themeMode) return;
  try {
    localStorage.setItem(THEME_KEY, mode);
  } catch {
    return;
  }
  window.location.reload();
};

const light = {
  // Layout
  bg: "#FFFFFF",
  bgHeader: "#FFFFFF",
  bgHeaderGlass: "rgba(255, 255, 255, 0.92)",
  bgSubtle: "#F4F6FA",
  tableHead: "#F7F9FC",
  rowHover: "#F5F8FF",

  // Sidebar
  sidebarBg: "#FFFFFF",
  sidebarText: "#3B4A66",
  sidebarMuted: "#8795AB",
  sidebarHover: "#EAF1FF",
  sidebarActive: "#2563EB",
  sidebarActiveSoft: "#DBEAFE",

  // Surfaces
  fillHover: "#F4F4F5",
  fillActive: "#EAF1FF",

  // Brand
  primary: "#2563EB",
  primaryHover: "#1D4ED8",
  primaryLight: "#DBEAFE",
  primaryDark: "#1E40AF",

  // Borders
  border: "#E7ECF3",
  borderStrong: "#CBD5E1",

  // Text
  ink: "#17233D",
  inkInverse: "#FFFFFF",
  muted: "#8795AB",
  faint: "#A3AEC0",

  // Status
  success: "#16A34A",
  warning: "#F59E0B",
  danger: "#EF4444",
  info: "#3B82F6",
};

const orange = {
  ...light,
  bgSubtle: "#F8F7F5",
  rowHover: "#FFFAF5",
  sidebarHover: "#FFF7ED",
  sidebarActive: "#F97316",
  sidebarActiveSoft: "#FFEDD5",
  fillActive: "#FFF7ED",
  primary: "#F97316",
  primaryHover: "#EA580C",
  primaryLight: "#FFEDD5",
  primaryDark: "#C2410C",
};

const dark = {
  ...light,
  bg: "#172033",
  bgHeader: "#172033",
  bgHeaderGlass: "rgba(23, 32, 51, 0.92)",
  bgSubtle: "#0D1424",
  tableHead: "#1C2740",
  rowHover: "#1D2A45",
  sidebarBg: "#111A2E",
  sidebarText: "#C7D3EA",
  sidebarMuted: "#7F93B8",
  sidebarHover: "#1C2740",
  sidebarActive: "#3B82F6",
  sidebarActiveSoft: "#1C2C4F",
  fillHover: "#1F2A40",
  fillActive: "#1C2C4F",
  primary: "#3B82F6",
  primaryHover: "#60A5FA",
  primaryLight: "#1C2C4F",
  primaryDark: "#93C5FD",
  border: "#26324A",
  borderStrong: "#3A4863",
  ink: "#E8EEF9",
  muted: "#93A3BF",
  faint: "#6B7C9A",
  success: "#22C55E",
};

export const palette = { light, dark, orange }[themeMode];

export const fontSans =
  "'Inter Variable', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
export const fontMono =
  "'Geist Mono', ui-monospace, 'SFMono-Regular', Menlo, Consolas, monospace";

export const accentOrange = "#F97316";

export const antdTheme = {
  algorithm: isDark ? antdAlgorithms.darkAlgorithm : antdAlgorithms.defaultAlgorithm,
  token: {
    colorPrimary: palette.primary,
    colorText: palette.ink,
    colorTextSecondary: palette.muted,
    colorTextTertiary: palette.faint,
    colorBorder: palette.border,
    colorBorderSecondary: palette.border,
    colorBgContainer: palette.bgHeader,
    colorBgElevated: palette.bg,
    colorBgLayout: palette.bgSubtle,
    fontFamily: fontSans,
    borderRadius: 10,
    borderRadiusLG: 12,
    borderRadiusSM: 8,
    controlHeight: 38,
    fontSize: 14,
    colorTextHeading: palette.ink,
    boxShadowSecondary: "0 12px 32px rgba(16, 24, 40, 0.12)",
  },
  components: {
    Menu: {
      itemBg: "transparent",
      itemColor: palette.muted,
      itemHoverColor: palette.ink,
      itemSelectedColor: palette.ink,
      itemSelectedBg: palette.fillActive,
      itemHoverBg: palette.fillHover,
      subMenuItemBg: "transparent",
      itemHeight: 36,
      itemMarginBlock: 2,
      iconSize: 16,
      fontSize: 13.5,
    },
    Button: { controlHeight: 38, fontWeight: 500, primaryShadow: `0 2px 8px ${palette.primary}47` },
    Input: { controlHeight: 38 },
    Select: { controlHeight: 38 },
    Card: { headerFontSize: 15, paddingLG: 20 },
    Table: {
      headerBg: palette.tableHead,
      headerColor: palette.muted,
      headerSplitColor: "transparent",
      rowHoverBg: palette.rowHover,
      borderColor: palette.border,
      cellPaddingBlockSM: 10,
    },
    Modal: { titleFontSize: 17 },
    Tag: { defaultBg: palette.fillHover },
    Badge: { colorError: palette.danger },
  },
};
