import { Typography } from "antd";
import FoodArt from "./FoodArt";
import { palette } from "../../constants/theme";

const { Title, Paragraph } = Typography;

// Page banner: icon tile, title, description and the food illustration on the right.
const PageHeader = ({ icon: Icon, title, description, extra }) => (
  <div className="page-hero" style={{ position: "relative", minHeight: 120 }}>
    <FoodArt className="page-hero-art" />
    <div className="page-header" style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap", paddingTop: 4 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 18, minWidth: 0 }}>
        {Icon && (
          <div style={{ width: 86, height: 86, borderRadius: 24, display: "grid", placeItems: "center", background: `linear-gradient(145deg, ${palette.bg}, ${palette.primaryLight})`, color: palette.primary, flexShrink: 0, boxShadow: `0 10px 24px ${palette.primary}24` }}>
            <Icon size={38} strokeWidth={1.8} />
          </div>
        )}
        <div style={{ minWidth: 0 }}>
          <Title level={2} style={{ margin: 0, letterSpacing: "-0.02em", fontWeight: 800 }}>{title}</Title>
          {description && <Paragraph style={{ color: palette.muted, margin: "4px 0 0", maxWidth: 640, fontSize: 15 }}>{description}</Paragraph>}
        </div>
      </div>
      {extra && <div>{extra}</div>}
    </div>
  </div>
);

export default PageHeader;
