// Icon-circle colors for the restaurant categories (the admin picks one of these names).
// Whole class names are written out so the Tailwind scanner finds them.
export const CATEGORY_COLORS = {
  orange: ["bg-orange-100", "text-orange-700"],
  rose: ["bg-rose-100", "text-rose-600"],
  amber: ["bg-amber-100", "text-amber-700"],
  red: ["bg-red-100", "text-red-700"],
  yellow: ["bg-yellow-100", "text-yellow-700"],
  teal: ["bg-teal-100", "text-teal-700"],
  stone: ["bg-stone-200", "text-stone-800"],
  green: ["bg-green-100", "text-green-800"],
  emerald: ["bg-emerald-100", "text-emerald-700"],
  blue: ["bg-blue-100", "text-blue-700"],
  purple: ["bg-purple-100", "text-purple-700"],
  pink: ["bg-pink-100", "text-pink-700"],
};

export const categoryClasses = (color) => CATEGORY_COLORS[color] ?? CATEGORY_COLORS.orange;