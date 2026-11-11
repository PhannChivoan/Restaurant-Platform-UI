import { Inbox } from "lucide-react";
import { palette } from "../../constants/theme";

const EmptyState = ({ icon: Icon = Inbox, title = "Nothing here yet", description, action, compact = false }) => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: compact ? "24px 16px" : "56px 16px" }}>
    <div style={{ width: 72, height: 72, borderRadius: 24, display: "grid", placeItems: "center", background: palette.primaryLight, color: palette.primary, marginBottom: 16 }}>
      <Icon size={32} strokeWidth={1.6} />
    </div>
    <div style={{ fontSize: 16, fontWeight: 700, color: palette.ink }}>{title}</div>
    {description && <div style={{ fontSize: 13.5, color: palette.muted, marginTop: 6, maxWidth: 360 }}>{description}</div>}
    {action && <div style={{ marginTop: 16 }}>{action}</div>}
  </div>
);

export default EmptyState;
