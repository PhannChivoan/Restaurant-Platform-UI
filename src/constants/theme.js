export const palette = {
  // Layout
  bg: "#FFFFFF",
  bgHeader: "#FFFFFF",
  bgSubtle: "#F5F6F8",

  // Sidebar
  sidebarBg: "#0F172A",
  sidebarText: "#F8FAFC",
  sidebarMuted: "#94A3B8",
  sidebarHover: "#1E293B",
  sidebarActive: "#F97316",
  sidebarActiveSoft: "#431407",

  // Surfaces
  fillHover: "#F4F4F5",
  fillActive: "#FFF7ED",

  // Brand
  primary: "#F97316",
  primaryHover: "#EA580C",
  primaryLight: "#FFEDD5",
  primaryDark: "#C2410C",

  // Borders
  border: "#E9ECF1",
  borderStrong: "#CBD5E1",

  // Text
  ink: "#0F172A",
  inkInverse: "#FFFFFF",
  muted: "#64748B",
  faint: "#94A3B8",

  // Status
  success: "#16A34A",
  warning: "#D97706",
  danger: "#DC2626",
  info: "#2563EB",
};

export const fontSans =
  "'Geist Sans', 'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
export const fontMono =
  "'Geist Mono', ui-monospace, 'SFMono-Regular', Menlo, Consolas, monospace";

export const antdTheme = {
  token: {
    colorPrimary: palette.primary,
    colorText: palette.ink,
    colorTextSecondary: palette.muted,
    colorTextTertiary: palette.faint,
    colorBorder: palette.border,
    colorBorderSecondary: palette.border,
    colorBgContainer: palette.bgHeader,
    colorBgLayout: palette.bgSubtle,
    fontFamily: fontSans,
    borderRadius: 10,
    borderRadiusLG: 14,
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
    Button: { controlHeight: 38, fontWeight: 500, primaryShadow: "0 2px 8px rgba(249, 115, 22, 0.28)" },
    Input: { controlHeight: 38 },
    Select: { controlHeight: 38 },
    Card: { headerFontSize: 15, paddingLG: 20 },
    Table: {
      headerBg: "#F8FAFC",
      headerColor: palette.muted,
      headerSplitColor: "transparent",
      rowHoverBg: "#FAFAFB",
      borderColor: "#EEF0F4",
      cellPaddingBlockSM: 10,
    },
    Modal: { titleFontSize: 17 },
    Tag: { defaultBg: "#F5F6F8" },
    Badge: { colorError: palette.danger },
  },
};
