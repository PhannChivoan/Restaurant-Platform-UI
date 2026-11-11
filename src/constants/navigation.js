export const NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard", path: "/", icon: "LayoutDashboard" },
  {
    key: "my-deliveries-group",
    label: "My Deliveries",
    icon: "Bike",
    children: [
      { key: "my-deliveries", label: "To deliver", path: "/driver", icon: "Route" },
      { key: "my-deliveries-available", label: "Available orders", path: "/driver/available", icon: "Radar" },
      { key: "my-deliveries-completed", label: "Completed", path: "/driver/completed", icon: "CheckCircle2" },
    ],
  },
  {
    key: "operations",
    label: "Operations",
    icon: "Workflow",
    children: [
      {
        key: "orders",
        label: "Orders & Kitchen",
        path: "/orders",
        icon: "ShoppingBag",
      },
      {
        key: "pending-orders",
        label: "Kitchen Queue",
        path: "/orders/pending",
        icon: "ChefHat",
      },
      {
        key: "kitchen-workflow",
        label: "Kitchen Workflow",
        path: "/kitchen",
        icon: "ClipboardList",
      },
      {
        key: "completed-orders",
        label: "Completed Orders",
        path: "/orders/completed",
        icon: "CheckCircle2",
      },
      {
        key: "dispatch",
        label: "Rider Dispatch",
        path: "/dispatch",
        icon: "Bike",
      },
      {
        key: "delivery-tracking",
        label: "Live Deliveries",
        path: "/dispatch/tracking",
        icon: "MapPinned",
      },
      {
        key: "rider-earnings",
        label: "Rider Earnings",
        path: "/dispatch/earnings",
        icon: "WalletCards",
      },
    ],
  },
  {
    key: "partners",
    label: "Partners",
    icon: "Store",
    children: [
      {
        key: "restaurants",
        label: "Restaurants & Branches",
        path: "/restaurants",
        icon: "Store",
      },
      {
        key: "branches",
        label: "Branch Operations",
        path: "/restaurants/branches",
        icon: "Building2",
      },
      {
        key: "menu",
        label: "Menu & Items",
        path: "/products",
        icon: "UtensilsCrossed",
      },
      {
        key: "menu-categories",
        label: "Menu Categories",
        path: "/products/categories",
        icon: "Tags",
      },
      {
        key: "menu-modifiers",
        label: "Modifier Groups",
        path: "/products/modifiers",
        icon: "ListPlus",
      },
      {
        key: "delivery-zones",
        label: "Delivery Zones",
        path: "/delivery-zones",
        icon: "Map",
      },
    ],
  },
  {
    key: "customers",
    label: "Customers",
    icon: "Users",
    children: [
      {
        key: "all-customers",
        label: "All Customers",
        path: "/customers",
        icon: "UserRound",
      },
      {
        key: "customer-addresses",
        label: "Delivery Addresses",
        path: "/customers/addresses",
        icon: "MapPinHouse",
      },
      {
        key: "customer-history",
        label: "Order History",
        path: "/customers/history",
        icon: "ReceiptText",
      },
    ],
  },
  {
    key: "growth",
    label: "Growth",
    icon: "Sparkles",
    children: [
      {
        key: "promotions",
        label: "Promotions",
        path: "/promotions",
        icon: "BadgePercent",
      },
      {
        key: "loyalty",
        label: "Loyalty Rules",
        path: "/promotions/loyalty",
        icon: "Gift",
      },
      {
        key: "redemptions",
        label: "Redemptions",
        path: "/promotions/redemptions",
        icon: "TicketCheck",
      },
    ],
  },
  {
    key: "insights",
    label: "Insights",
    icon: "ChartNoAxesCombined",
    children: [
      {
        key: "analytics",
        label: "Operations Analytics",
        path: "/analytics/operations",
        icon: "BarChart3",
      },
      {
        key: "revenue",
        label: "Revenue Reports",
        path: "/analytics/revenue",
        icon: "Banknote",
      },
      {
        key: "delivery-performance",
        label: "Delivery Performance",
        path: "/analytics/delivery",
        icon: "TimerReset",
      },
      {
        key: "activity-log",
        label: "Activity Log",
        path: "/activity-log",
        icon: "History",
      },
    ],
  },
{
      key: "administration",
      label: "Administration",
      icon: "Settings2",
      children: [
        {
          key: "roles-permissions",
          label: "Roles & Permissions",
          path: "/settings/users",
          icon: "UserCog",
        },
        {
          key: "permissions",
          label: "Permission Policies",
          path: "/settings/permissions",
          icon: "ShieldCheck",
        },
        {
          key: "access-windows",
          label: "Access Time Windows",
          path: "/settings/access-windows",
          icon: "Clock4",
        },
        {
          key: "restaurant-categories",
          label: "Restaurant Categories",
          path: "/settings/categories",
          icon: "Tags",
        },
        {
          key: "general-settings",
          label: "Platform Settings",
          path: "/settings",
          icon: "Settings",
        },
      ],
    },
  {
    key: "landing-page",
    label: "Landing Page",
    icon: "PanelsTopLeft",
    children: [
      {
        key: "landing-home",
        label: "Home",
        icon: "House",
        children: [
          { key: "landing-home-perks", label: "Hero highlights", path: "/landing/home-perks", icon: "Zap" },
          { key: "landing-home-stats", label: "Platform numbers", path: "/landing/home-stats", icon: "BarChart3" },
          { key: "landing-home-categories", label: "Food categories", path: "/landing/home-categories", icon: "Utensils" },
          { key: "landing-home-services", label: "What we bring", path: "/landing/home-services", icon: "Gift" },
          { key: "landing-home-story", label: "Story highlights", path: "/landing/home-story", icon: "BookOpen" },
          { key: "landing-home-help", label: "Help & partner cards", path: "/landing/home-help", icon: "LifeBuoy" },
        ],
      },
      {
        key: "landing-services",
        label: "Services",
        icon: "Briefcase",
        children: [
          { key: "landing-services-tools", label: "Tool cards", path: "/landing/services-tools", icon: "Wrench" },
          { key: "landing-services-points", label: "Highlight chips", path: "/landing/services-points", icon: "ListChecks" },
          { key: "landing-services-features", label: "Feature cards", path: "/landing/services-features", icon: "Sparkles" },
        ],
      },
      {
        key: "landing-about",
        label: "About us",
        icon: "Info",
        children: [
          { key: "landing-about-numbers", label: "Numbers", path: "/landing/about-numbers", icon: "Hash" },
          { key: "landing-about-pillars", label: "Pillars", path: "/landing/about-pillars", icon: "Landmark" },
          { key: "landing-about-timeline", label: "Timeline", path: "/landing/about-timeline", icon: "Milestone" },
          { key: "landing-about-impact", label: "Impact numbers", path: "/landing/about-impact", icon: "Leaf" },
        ],
      },
      { key: "landing-content", label: "Texts & Images", path: "/landing/texts", icon: "Type" },
    ],
  },
];

export const findNavItem = (items, key) => {
  for (const item of items) {
    if (item.key === key) return item;

    if (item.children) {
      const child = findNavItem(item.children, key);
      if (child) return child;
    }
  }

  return undefined;
};
export const getActiveKeyFromPath = (pathname) => {
  const normalizedPath = pathname.replace(/\/$/, "") || "/";
  let matchedKey = "overview";
  let matchedPathLength = -1;

  const visit = (items) => {
    items.forEach((item) => {
      if (item.path) {
        const itemPath = item.path.replace(/\/$/, "") || "/";
        if (
          (itemPath === "/"
            ? normalizedPath === "/"
            : normalizedPath.startsWith(itemPath)) &&
          itemPath.length > matchedPathLength
        ) {
          matchedKey = item.key;
          matchedPathLength = itemPath.length;
        }
      }

      if (item.children) visit(item.children);
    });
  };

  visit(NAV_ITEMS);
  return matchedKey;
};
// the groups to keep open for a page, from the outermost one in (Landing Page, then Home)
export const getOpenKeysForActive = (activeKey) => {
  const walk = (items, trail) => {
    for (const item of items) {
      if (item.key === activeKey) return trail;
      if (item.children) {
        const found = walk(item.children, [...trail, item.key]);
        if (found) return found;
      }
    }
    return null;
  };

  return walk(NAV_ITEMS, []) || [];
};

// the labels of the groups a page sits in, outermost first (for the breadcrumb)
export const getParentLabels = (activeKey) =>
  getOpenKeysForActive(activeKey).map((key) => findNavItem(NAV_ITEMS, key)?.label).filter(Boolean);
