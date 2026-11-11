import { DotsRing } from "./dots-ring";
import { palette } from "../../constants/theme";

// The admin's one loading indicator: the dots ring in the theme colour, with an optional label.
// It is the same ring the tables already use while they reload, so every loading state matches.
export const Spinner = ({ size = 36 }) => (
  <DotsRing role="status" aria-label="Loading" style={{ width: size, height: size, color: palette.primary }} />
);

const Loader = ({ label = "Loading…", size = 40, minHeight = 240 }) => (
  <div className="app-loader" style={{ minHeight }}>
    <Spinner size={size} />
    {label && <span className="app-loader-label">{label}</span>}
  </div>
);

export default Loader;
