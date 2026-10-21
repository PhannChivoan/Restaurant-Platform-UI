import { useSyncExternalStore } from "react";

import "./i18n.css";

/*
 * English / Khmer for the storefront. Only the key customer journey is translated
 * (navigation, orders, tracking, reviews, scheduling); anything missing falls back to English.
 */
export const LANGS = [
  ["en", "EN"],
  ["km", "ខ្មែរ"],
];

const KM = {
  "nav.home": "ទំព័រដើម",
  "nav.order": "កម្មង់អាហារ",
  "nav.services": "សេវាកម្ម",
  "nav.about": "អំពីយើង",
  "nav.contact": "ទំនាក់ទំនង",
  "nav.orders": "ការកម្មង់",
  "nav.more": "ផ្សេងៗ",
  "nav.partner": "សហការជាមួយយើង",
  "orders.title": "ការកម្មង់របស់ខ្ញុំ",
  "orders.active": "កំពុងដំណើរការ",
  "orders.past": "ការកម្មង់ចាស់",
  "orders.favourites": "ចំណូលចិត្ត",
  "orders.none": "មិនទាន់មានការកម្មង់",
  "orders.noFavourites": "មិនទាន់មានហាងចំណូលចិត្ត",
  "orders.orderFood": "កម្មង់អាហារ",
  "orders.again": "កម្មង់ម្ដងទៀត",
  "orders.track": "តាមដានការកម្មង់",
  "orders.details": "មើលលម្អិត",
  "track.eta": "ម៉ោងមកដល់ប៉ាន់ស្មាន",
  "track.inAbout": "ក្នុងរយៈពេលប្រហែល",
  "track.min": "នាទី",
  "track.refunded": "បានសងប្រាក់វិញ",
  "track.details": "ព័ត៌មានលម្អិតនៃការកម្មង់",
  "track.total": "សរុប",
  "review.title": "តើការកម្មង់របស់អ្នកយ៉ាងដូចម្តេច?",
  "review.yours": "ការវាយតម្លៃរបស់អ្នក",
  "review.send": "ផ្ញើការវាយតម្លៃ",
  "review.placeholder": "ប្រាប់អ្នកផ្សេងអំពីអាហារ និងការដឹកជញ្ជូន (មិនបង្ខំ)",
  "review.restaurant": "ការវាយតម្លៃរបស់អតិថិជន",
  "review.none": "មិនទាន់មានការវាយតម្លៃ",
  "lang.label": "ភាសា",
};

const listeners = new Set();
let lang = "en";
try {
  lang = localStorage.getItem("lang") === "km" ? "km" : "en";
} catch {
  /* storage unavailable */
}
if (typeof document !== "undefined") document.documentElement.lang = lang;

export const setLang = (next) => {
  lang = next === "km" ? "km" : "en";
  try {
    localStorage.setItem("lang", lang);
  } catch {
    /* storage unavailable */
  }
  if (typeof document !== "undefined") document.documentElement.lang = lang;
  listeners.forEach((fn) => fn());
};

const subscribe = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

export const getLang = () => lang;
export const subscribeLang = subscribe;

/** const { t, lang } = useI18n();  t("nav.home", "Home") -> "ទំព័រដើម" in Khmer, "Home" in English */
export const useI18n = () => {
  const current = useSyncExternalStore(subscribe, () => lang);
  const t = (key, english) => (current === "km" ? KM[key] ?? english ?? key : english ?? key);

  return { t, lang: current, setLang };
};
