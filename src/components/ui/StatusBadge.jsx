import { palette } from "../../constants/theme";

// One place that maps a status word to a colour, so every table and card shows it the same way.
const TONES = {
  success: ["active", "approved", "delivered", "completed", "paid", "online", "open", "enabled", "success", "yes", "live", "available"],
  warning: ["pending", "waiting", "preparing", "scheduled", "draft", "late", "review"],
  danger: ["rejected", "cancelled", "canceled", "failed", "blocked", "expired", "refunded", "error", "no"],
  info: ["processing", "accepted", "ready", "dispatched", "on the way", "assigned", "in progress", "busy"],
  neutral: ["inactive", "offline", "closed", "disabled", "archived", "none"],
};
const COLORS = {
  success: palette.success,
  warning: palette.warning,
  danger: palette.danger,
  info: palette.info,
  neutral: "#64748B",
};

const toneOf = (status) => {
  const key = String(status ?? "").trim().toLowerCase();
  return Object.keys(TONES).find((t) => TONES[t].includes(key)) || "neutral";
};

const StatusBadge = ({ status, tone, children }) => {
  const color = COLORS[tone || toneOf(status)];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "3px 10px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 600,
        lineHeight: "18px",
        color,
        background: `${color}1A`,
        whiteSpace: "nowrap",
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: color }} />
      {children ?? status}
    </span>
  );
};

export default StatusBadge;
