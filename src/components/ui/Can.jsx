import { usePermissions } from "../../utils/permissionsStore";

/** Renders its children only when the role may `action` ("view" | "create" | "update" | "delete") on this page. */
const Can = ({ action, page, children, fallback = null }) => {
  const { can } = usePermissions();

  return can(action, page) ? children : fallback;
};

export default Can;
