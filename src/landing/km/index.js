import common from "./common";
import shop from "./shop";
import home from "./home";
import about from "./about";
import extra from "./extra";
import cambodia from "./cambodia";
import install from "./install";

// English text -> Khmer text. Keys are matched after collapsing whitespace.
export const KM_PHRASES = { ...common, ...shop, ...home, ...about, ...extra, ...cambodia, ...install };
