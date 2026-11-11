import { Card, Typography } from "antd";
import { palette, isDark } from "../../constants/theme";

const { Text } = Typography;

// KPI card: tinted icon tile, label, big value, helper line and a soft decorative wave.
const StatCard = ({ icon: Icon, label, value, suffix, description, descriptionColor, color = palette.primary, iconBackground }) => {
  const gid = `sw-${String(label).replace(/\W/g, "")}`;
  // a caller that knows what the note means passes its colour; otherwise a leading number or "+" reads as growth
  const up = !descriptionColor && typeof description === "string" && /^[+↑]|^\d/.test(description.trim());
  const noteColor = descriptionColor || (up ? palette.success : palette.muted);
  return (
    <Card
      variant="outlined"
      className="stat-card"
      styles={{ body: { padding: 18, position: "relative", overflow: "hidden" } }}
      style={{ height: "100%", background: `linear-gradient(135deg, ${palette.bg} 55%, ${color}${isDark ? "26" : "12"} 100%)` }}
    >
      <svg aria-hidden viewBox="0 0 200 70" preserveAspectRatio="none" style={{ position: "absolute", right: 0, bottom: 0, width: "62%", height: "62%" }}>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.28" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d="M0 62 C30 50 45 58 70 42 S110 40 135 28 S175 24 200 8 L200 70 L0 70 Z" fill={`url(#${gid})`} />
        <path d="M0 62 C30 50 45 58 70 42 S110 40 135 28 S175 24 200 8" fill="none" stroke={color} strokeOpacity="0.55" strokeWidth="2" />
      </svg>
      <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 14 }}>
        {Icon && (
          <div style={{ width: 66, height: 66, borderRadius: "50%", display: "grid", placeItems: "center", flexShrink: 0, color, background: iconBackground || `${color}1F`, boxShadow: `inset 0 0 0 6px ${color}10` }}>
            <Icon size={30} strokeWidth={1.8} />
          </div>
        )}
        <div style={{ minWidth: 0 }}>
          <Text style={{ fontSize: 14, display: "block", color: palette.ink, fontWeight: 500 }}>{label}</Text>
          <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.15, color: palette.ink }}>
            {value}
            {suffix ? <span style={{ fontSize: 13, fontWeight: 500, color: palette.muted }}> {suffix}</span> : null}
          </div>
          {description && (
            <Text style={{ fontSize: 12, display: "block", marginTop: 2, color: noteColor, fontWeight: 500 }}>
              {up ? "↑ " : ""}{description}
            </Text>
          )}
        </div>
      </div>
    </Card>
  );
};

export default StatCard;
